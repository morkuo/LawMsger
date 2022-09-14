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
  const {
    hits: { hits: result },
  } = await es.search({
    index: 'group',
    body: {
      query: {
        term: {
          participants: req.userdata.id,
        },
      },
    },
  });

  //   console.log(result);

  //   const unreadMessagesQueryBody = users.reduce((querybody, user) => {
  //     querybody.push({ index: 'message' }),
  //       querybody.push({
  //         query: {
  //           bool: {
  //             filter: [
  //               { term: { sender_id: user._id } },
  //               { term: { receiver_id: req.userdata.id } },
  //               { term: { isRead: false } },
  //             ],
  //           },
  //         },
  //       });

  //     return querybody;
  //   }, []);

  //   const { responses } = await es.msearch({
  //     body: unreadMessagesQueryBody,
  //   });

  //   const unreadMessagesCount = responses.map(response => response.hits.total.value);

  let i = 0;
  const groups = result.map(group => ({
    id: group._id,
    host: group._source.host,
    name: group._source.name,
    participants: group._source.participants,
    // unread: unreadMessagesCount[i++],
  }));

  res.json(groups);
};

const updateParticipants = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(400).json({ error: errors.array() });
  }

  const { groupName, userIds } = req.body;

  //check whether the request is send from host of the group
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

  if (result._source.host !== req.userdata.id) return res.status(403).json({ error: 'forbidden' });

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

module.exports = { createGroup, getGroup, updateParticipants };
