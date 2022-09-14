const { validationResult } = require('express-validator');
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

module.exports = { createGroup, getGroup };
