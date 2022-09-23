const es = require('../utils/es');

async function getAllUser(organizationId) {
  const {
    hits: { hits: result },
  } = await es[organizationId].search({
    index: 'user',
    body: {
      size: process.env.ES_SEARCH_LIMIT,
      query: {
        match_all: {},
      },
    },
  });
  return result;
}

async function getStarredUser(organizationId, userId) {
  const {
    hits: { hits: resultStar },
  } = await es[organizationId].search({
    index: 'star',
    body: {
      size: process.env.ES_SEARCH_LIMIT,
      query: {
        term: {
          user_id: userId,
        },
      },
    },
  });
  return resultStar;
}

async function getStarredUserData(organizationId, starredUserIds) {
  const {
    hits: { hits: resultStarDetail },
  } = await es[organizationId].search({
    index: 'user',
    body: {
      size: process.env.ES_SEARCH_LIMIT,
      query: {
        terms: {
          _id: starredUserIds,
        },
      },
    },
  });
  return resultStarDetail;
}

module.exports = {
  getAllUser,
  getStarredUser,
  getStarredUserData,
};
