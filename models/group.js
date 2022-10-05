const es = require('../utils/es');

async function createGroupInES(organizationId, name, userId) {
  const result = await es[organizationId].index({
    index: 'group',
    document: {
      host: userId,
      name,
      participants: [userId],
    },
  });
  return result;
}

async function getGroupById(organizationId, groupId) {
  const {
    hits: {
      hits: [result],
    },
  } = await es[organizationId].search({
    index: 'group',
    sort: {
      'created_at': 'desc',
    },
    query: {
      term: { _id: groupId },
    },
  });
  return result;
}

async function getGroupByName(organizationId, groupName) {
  const {
    hits: {
      hits: [result],
    },
  } = await es[organizationId].search({
    index: 'group',
    body: {
      query: {
        term: { 'name.keyword': groupName },
      },
    },
  });

  return result;
}

async function getGroupCountByName(organizationId, groupName) {
  const {
    hits: {
      total: { value: result },
    },
  } = await es[organizationId].search({
    index: 'group',
    body: {
      query: {
        term: { 'name.keyword': groupName },
      },
    },
  });

  return result;
}

async function getParticipatedGroups(organizationId, userId) {
  const {
    hits: { hits: result },
  } = await es[organizationId].search({
    index: 'group',
    body: {
      size: process.env.ES_SEARCH_LIMIT,
      query: {
        term: {
          participants: userId,
        },
      },
    },
  });
  return result;
}

async function getUnreadGroupMessage(organizationId, userId, groupIds) {
  const {
    hits: { hits: unreadMessages },
  } = await es[organizationId].search({
    size: process.env.ES_SEARCH_LIMIT,
    query: {
      bool: {
        should: groupIds,
        must_not: { term: { isRead: userId } },
      },
    },
  });
  return unreadMessages;
}

async function deleteGroupById(organizationId, groupId) {
  const result = await es[organizationId].deleteByQuery({
    index: 'group',
    body: {
      query: {
        term: { _id: groupId },
      },
    },
  });
  return result;
}

async function updateParticipants(organizationId, groupName, newParticipants) {
  const result = await es[organizationId].updateByQuery({
    index: 'group',
    script: {
      source: 'ctx._source.participants = params.newParticipants',
      lang: 'painless',
      params: {
        newParticipants,
      },
    },
    query: {
      term: { 'name.keyword': groupName },
    },
  });
  return result;
}

module.exports = {
  createGroupInES,
  getGroupById,
  getGroupByName,
  getGroupCountByName,
  getParticipatedGroups,
  getUnreadGroupMessage,
  deleteGroupById,
  updateParticipants,
};
