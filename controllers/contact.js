const es = require('../utils/es');
require('dotenv').config;

const getAllContacts = async (req, res) => {
  const {
    hits: { hits: result },
  } = await es.search({
    index: 'user',
    body: {
      query: {
        match_all: {},
      },
    },
  });

  const users = result
    .filter(user => user._id !== req.userdata.id)
    .map(user => ({
      id: user._id,
      name: user._source.name,
      email: user._source.email,
      picture: user._source.picture,
      socket_id: user._source.socket_id,
    }));

  res.json(users);
};

const getStarContacts = async (req, res) => {
  const {
    hits: { hits: resultStar },
  } = await es.search({
    index: 'star',
    body: {
      query: {
        term: {
          user_id: req.userdata.id,
        },
      },
    },
  });

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

  const starDetails = resultStarDetail.map(star => ({
    id: star._id,
    name: star._source.name,
    email: star._source.email,
    picture: star._source.picture,
    socket_id: star._source.socket_id,
  }));

  res.json(starDetails);
};

module.exports = { getAllContacts, getStarContacts };
