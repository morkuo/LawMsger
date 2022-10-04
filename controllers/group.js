const es = require('../utils/es');
const {
  getGroupByName,
  getGroupCountByName,
  getParticipatedGroups,
  getUnreadGroupMessage,
} = require('../models/group');
require('dotenv').config;

const createGroup = async (req, res) => {
  const { name } = req.body;

  //check whether the name has been used
  const resultCount = await getGroupCountByName(req.userdata.organizationId, name);

  if (resultCount) return res.status(409).json({ error: 'group exists' });

  const result = await es[req.userdata.organizationId].index({
    index: 'group',
    document: {
      host: req.userdata.id,
      name,
      participants: [req.userdata.id],
    },
  });

  res.status(201).json({
    data: 'created',
    group: {
      id: result._id,
    },
  });
};

const getGroup = async (req, res) => {
  const userId = req.userdata.id;

  const result = await getParticipatedGroups(req.userdata.organizationId, userId);

  const groupIds = result.map(group => ({ term: { group_id: group._id } }));

  const unreadMessages = await getUnreadGroupMessage(req.userdata.organizationId, userId, groupIds);

  let unreadMessagesCount = {};
  unreadMessages.forEach(msg => {
    if (!(msg._source.group_id in unreadMessagesCount))
      unreadMessagesCount[msg._source.group_id] = 1;
    else unreadMessagesCount[msg._source.group_id]++;
  });

  const groups = result
    .map(group => ({
      id: group._id,
      host: group._source.host,
      name: group._source.name,
      participants: group._source.participants,
      unread: unreadMessagesCount[group._id] || 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  res.json(groups);
};

const getGroupParticipants = async (req, res) => {
  const { groupName } = req.query;

  const {
    hits: {
      hits: [result],
    },
  } = await es[req.userdata.organizationId].search({
    index: 'group',
    body: {
      size: process.env.ES_SEARCH_LIMIT,
      query: {
        term: { 'name.keyword': groupName },
      },
    },
  });

  const usersQuery = result._source.participants.map(userId => ({ term: { _id: userId } }));

  const {
    hits: { hits: resultUsers },
  } = await es[req.userdata.organizationId].search({
    index: 'user',
    body: {
      size: process.env.ES_SEARCH_LIMIT,
      query: {
        bool: {
          should: usersQuery,
        },
      },
    },
  });

  const users = resultUsers.map(user => ({
    name: user._source.name,
    email: user._source.email,
    picture: user._source.picture,
  }));

  res.json(users);
};

const updateParticipants = async (req, res) => {
  const { groupName, userIds, updateType } = req.body;

  const result = await getGroupByName(req.userdata.organizationId, groupName);

  //check whether the group exist
  if (!result) return res.status(400).json({ error: 'group not found' });

  //check whether the request is send from host of the group
  if (result._source.host !== req.userdata.id) {
    return res.status(403).json({ error: 'forbidden' });
  }

  //check whether userIds include host Id
  if (userIds.includes(result._source.host)) {
    return res.status(400).json({ error: 'users should not include host user' });
  }

  //check whether userIds exist
  const {
    hits: { hits: resultUser },
  } = await es[req.userdata.organizationId].search({
    index: 'user',
    body: {
      size: process.env.ES_SEARCH_LIMIT,
      query: {
        match_all: {},
      },
    },
  });

  const usersExisting = resultUser.map(user => user._id);

  for (const userId of userIds) {
    if (!usersExisting.includes(userId)) return res.status(400).json({ error: 'wrong user ids' });
  }

  if (!updateType) {
    const resultUpdate = await es[req.userdata.organizationId].updateByQuery({
      index: 'group',
      script: {
        source: `for(int i=0; i<ctx._source.participants.length; i++){
          if(params.userIds.contains(ctx._source.participants[i])){
            ctx._source.participants.remove(i)
          }
        }`,
        lang: 'painless',
        params: {
          userIds,
        },
      },
      query: {
        term: { 'name.keyword': groupName },
      },
    });

    if (!resultUpdate.updated) return res.status(500).json({ error: 'server error' });

    return res.json({
      data: 'deleted',
      group: {
        id: result._id,
      },
    });
  }

  //append user id to the group participants
  const resultUpdate = await es[req.userdata.organizationId].updateByQuery({
    index: 'group',
    script: {
      source: `for(int i=0; i<params.userIds.length; i++){
        if(!ctx._source.participants.contains(params.userIds[i])){
          ctx._source.participants.add(params.userIds[i])
        }
      }`,
      lang: 'painless',
      params: {
        userIds,
      },
    },
    query: {
      term: { 'name.keyword': groupName },
    },
  });

  if (!resultUpdate.updated) return res.status(500).json({ error: 'server error' });

  res.json({
    data: 'updated',
    group: {
      id: result._id,
    },
  });
};

const leaveGroup = async (req, res) => {
  const { groupName } = req.body;

  const userId = req.userdata.id;

  const result = await getGroupByName(req.userdata.organizationId, groupName);

  //check whether the group exist
  if (!result) return res.status(400).json({ error: 'group not found' });

  //if current user is the host, delete the group
  if (result._source.host === userId) {
    const resultUpdate = await es[req.userdata.organizationId].deleteByQuery({
      index: 'group',
      body: {
        query: {
          term: { _id: result._id },
        },
      },
    });

    if (!resultUpdate.deleted) return res.status(500).json({ error: 'server error' });

    return res.json({ data: 'deleted' });
  }

  const resultUpdate = await es[req.userdata.organizationId].updateByQuery({
    index: 'group',
    script: {
      source: `for(int i=0; i<ctx._source.participants.length; i++){
          if(params.userId == ctx._source.participants[i]){
            ctx._source.participants.remove(i)
          }
        }`,
      lang: 'painless',
      params: {
        userId,
      },
    },
    query: {
      term: { 'name.keyword': groupName },
    },
  });

  if (!resultUpdate.updated) return res.status(500).json({ error: 'server error' });

  res.json({ data: 'updated' });
};

module.exports = { createGroup, getGroup, getGroupParticipants, updateParticipants, leaveGroup };
