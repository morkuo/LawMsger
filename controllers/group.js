const e = require('cors');
const { validationResult, check } = require('express-validator');
const es = require('../utils/es');
require('dotenv').config;

const createGroup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(400).json({ error: errors.array() });
  }

  const { name } = req.body;

  //check whether the name has been used
  const {
    hits: {
      total: { value: resultCount },
    },
  } = await es.search({
    index: 'group',
    body: {
      query: {
        term: { 'name.keyword': name },
      },
    },
  });

  if (resultCount) return res.status(409).json({ error: 'group exists' });

  const result = await es.index({
    index: 'group',
    document: {
      host: req.userdata.id,
      name,
      participants: [req.userdata.id],
    },
  });

  res.status(201).json({ data: 'created' });
};

const getGroup = async (req, res) => {
  const userId = req.userdata.id;

  const {
    hits: { hits: result },
  } = await es.search({
    index: 'group',
    body: {
      query: {
        term: {
          participants: userId,
        },
      },
    },
  });

  const groupIds = result.map(group => ({ term: { group_id: group._id } }));

  const {
    hits: { hits: unreadMessages },
  } = await es.search({
    query: {
      bool: {
        should: groupIds,
        must_not: { term: { isRead: userId } },
      },
    },
  });

  let unreadMessagesCount = {};
  unreadMessages.forEach(msg => {
    if (!(msg._source.group_id in unreadMessagesCount))
      unreadMessagesCount[msg._source.group_id] = 1;
    else unreadMessagesCount[msg._source.group_id]++;
  });

  const groups = result.map(group => ({
    id: group._id,
    host: group._source.host,
    name: group._source.name,
    participants: group._source.participants,
    unread: unreadMessagesCount[group._id] || 0,
  }));

  res.json(groups);
};

const getGroupParticipants = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(400).json({ error: errors.array() });
  }

  const { groupName } = req.query;

  const {
    hits: {
      hits: [result],
    },
  } = await es.search({
    index: 'group',
    body: {
      query: {
        term: { 'name.keyword': groupName },
      },
    },
  });

  const usersQuery = result._source.participants.map(userId => ({ term: { _id: userId } }));

  const {
    hits: { hits: resultUsers },
  } = await es.search({
    index: 'user',
    body: {
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(400).json({ error: errors.array() });
  }

  const { groupName, userIds, updateType } = req.body;

  const {
    hits: {
      hits: [result],
    },
  } = await es.search({
    index: 'group',
    body: {
      query: {
        term: { 'name.keyword': groupName },
      },
    },
  });

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
  } = await es.search({
    index: 'user',
    body: {
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
    const resultUpdate = await es.updateByQuery({
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

    return res.json({ data: 'deleted' });
  }

  //append user id to the group participants
  const resultUpdate = await es.updateByQuery({
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

  res.json({ data: 'updated' });
};

const leaveGroup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(400).json({ error: errors.array() });
  }

  const { groupName } = req.body;

  const userId = req.userdata.id;

  const {
    hits: {
      hits: [result],
    },
  } = await es.search({
    index: 'group',
    body: {
      query: {
        term: { 'name.keyword': groupName },
      },
    },
  });

  //check whether the group exist
  if (!result) return res.status(400).json({ error: 'group not found' });

  //if current user is the host, delete the group
  if (result._source.host === userId) {
    const resultUpdate = await es.deleteByQuery({
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

  const resultUpdate = await es.updateByQuery({
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
