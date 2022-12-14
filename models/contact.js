const es = require('../utils/es');

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

async function getOneStarredUserFromSpecificUser(organizationId, userId, starredUserId) {
  const {
    hits: { hits: result },
  } = await es[organizationId].search({
    index: 'star',
    body: {
      query: {
        bool: {
          filter: [{ term: { user_id: userId } }, { term: { contact_user_id: starredUserId } }],
        },
      },
    },
  });
  return result;
}

async function deleteStarredUserFromAllUser(organizationId, starredUserId) {
  const result = await es[organizationId].deleteByQuery({
    index: 'star',
    body: {
      query: {
        term: { 'contact_user_id': starredUserId },
      },
    },
  });
  return result;
}

async function deleteStarredUserFromSpecificUser(organizationId, userId, starredUserId) {
  const result = await es[organizationId].deleteByQuery({
    index: 'star',
    body: {
      query: {
        bool: {
          filter: [{ term: { user_id: userId } }, { term: { contact_user_id: starredUserId } }],
        },
      },
    },
  });
  return result;
}

async function createStarredUser(organizationId, userId, starredUserId) {
  const result = await es[organizationId].index({
    index: 'star',
    document: {
      user_id: userId,
      contact_user_id: starredUserId,
    },
  });
  return result;
}

module.exports = {
  createStarredUser,
  getStarredUser,
  getStarredUserData,
  getOneStarredUserFromSpecificUser,
  deleteStarredUserFromAllUser,
  deleteStarredUserFromSpecificUser,
};
