const es = require('../utils/es');
require('dotenv').config;

const getAllContacts = async (req, res) => {
  const {
    hits: { hits: result },
  } = await es.search({
    index: 'user',
    body: {
      size: process.env.ES_SEARCH_LIMIT,
      query: {
        match_all: {},
      },
    },
  });

  const users = result.filter(user => user._id !== req.userdata.id);

  const unreadMessagesQueryBody = users.reduce((querybody, user) => {
    querybody.push({ index: 'message' }),
      querybody.push({
        query: {
          bool: {
            filter: [
              { term: { sender_id: user._id } },
              { term: { receiver_id: req.userdata.id } },
              { term: { isRead: false } },
            ],
          },
        },
      });

    return querybody;
  }, []);

  const { responses } = await es.msearch({
    body: unreadMessagesQueryBody,
  });

  const unreadMessagesCount = responses.map(response => response.hits.total.value);

  // console.log('Hashtable on controller:', global.hashTable);

  let i = 0;
  const contacts = users.map(user => ({
    id: user._id,
    name: user._source.name,
    email: user._source.email,
    picture: user._source.picture,
    socket_id: global.hashTable[user._id],
    unread: unreadMessagesCount[i++],
  }));

  res.json(contacts);
};

const getStarContacts = async (req, res) => {
  const {
    hits: { hits: resultStar },
  } = await es.search({
    index: 'star',
    body: {
      size: process.env.ES_SEARCH_LIMIT,
      query: {
        term: {
          user_id: req.userdata.id,
        },
      },
    },
  });

  if (resultStar.length === 0) return res.json(resultStar);

  const stars = resultStar.map(star => star._source.contact_user_id);

  const {
    hits: { hits: resultStarDetail },
  } = await es.search({
    index: 'user',
    body: {
      query: {
        terms: {
          _id: stars,
        },
      },
    },
  });

  if (stars.length === 0) return res.json(stars);

  const unreadMessagesQueryBody = stars.reduce((querybody, userId) => {
    querybody.push({ index: 'message' }),
      querybody.push({
        query: {
          bool: {
            filter: [
              { term: { sender_id: userId } },
              { term: { receiver_id: req.userdata.id } },
              { term: { isRead: false } },
            ],
          },
        },
      });

    return querybody;
  }, []);

  const { responses } = await es.msearch({
    body: unreadMessagesQueryBody,
  });

  const unreadMessagesCount = responses.map(response => response.hits.total.value);

  let i = 0;
  const starDetails = resultStarDetail.map(star => ({
    id: star._id,
    name: star._source.name,
    email: star._source.email,
    picture: star._source.picture,
    socket_id: global.hashTable[star._id],
    unread: unreadMessagesCount[i++],
  }));

  res.json(starDetails);
};

module.exports = { getAllContacts, getStarContacts };
