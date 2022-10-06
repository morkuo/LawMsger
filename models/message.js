const es = require('../utils/es');

const messageSize = 15;

async function suggestions(organizationId, input, index) {
  const {
    suggest: {
      suggestions: [result],
    },
  } = await es[organizationId].search({
    index: index || 'words',
    body: {
      suggest: {
        suggestions: {
          prefix: `${input}`,
          completion: {
            field: 'suggest',
          },
        },
      },
    },
  });

  //words suggestion
  if (!index) {
    return result.options.map(option => option.text);
  }

  //clauses suggestion
  const suggestions = result.options.map(option => ({
    title: option._source.suggest.input.replace(option._source.number, ''),
    number: option._source.number,
    body: option._source.body,
  }));

  return suggestions;
}

async function matchedClauses(organizationId, input) {
  const now = new Date();
  const origin = now.toISOString();

  const {
    hits: { hits: result },
  } = await es[organizationId].search({
    index: 'matchedclauses',
    body: {
      size: 5,
      query: {
        function_score: {
          query: {
            match: {
              body: `${input}`,
            },
          },
          functions: [
            {
              exp: {
                last_searched: {
                  origin,
                  offset: '7d',
                  scale: '25d',
                  decay: 0.2,
                },
              },
            },
          ],
          boost_mode: 'multiply',
        },
      },
    },
  });

  // clauses suggestion
  const matchclauses = result.map(option => ({
    title: option._source.title,
    number: option._source.number,
    body: option._source.body.replace(`${option._source.title}${option._source.number}：`, ''),
  }));

  return matchclauses;
}

async function getPrivateMessagesByUserId(organizationId, userId, contactUserId) {
  const {
    hits: { hits: result },
  } = await es[organizationId].search({
    index: 'message',
    size: messageSize,
    sort: {
      'created_at': 'desc',
    },
    query: {
      bool: {
        should: [
          {
            bool: {
              filter: [{ term: { sender_id: userId } }, { term: { receiver_id: contactUserId } }],
            },
          },
          {
            bool: {
              filter: [{ term: { sender_id: contactUserId } }, { term: { receiver_id: userId } }],
            },
          },
        ],
      },
    },
  });
  return result;
}

async function getPrivateMessagesByUserIdMore(organizationId, userId, contactUserId, baselineTime) {
  const {
    hits: { hits: result },
  } = await es[organizationId].search({
    index: 'message',
    size: 20,
    sort: {
      'created_at': 'desc',
    },
    query: {
      bool: {
        should: [
          {
            bool: {
              filter: [
                { term: { sender_id: userId } },
                { term: { receiver_id: contactUserId } },
                {
                  range: {
                    created_at: {
                      lt: baselineTime,
                    },
                  },
                },
              ],
            },
          },
          {
            bool: {
              filter: [
                { term: { sender_id: contactUserId } },
                { term: { receiver_id: userId } },
                {
                  range: {
                    created_at: {
                      lt: baselineTime,
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });
  return result;
}

async function getGroupMessagesByGroupId(organizationId, groupId) {
  const {
    hits: { hits: result },
  } = await es[organizationId].search({
    index: 'groupmessage',
    size: messageSize,
    sort: {
      'created_at': 'desc',
    },
    query: {
      term: { group_id: groupId },
    },
  });
  return result;
}

async function getGroupMessagesByGroupIdMore(organizationId, groupId, baselineTime) {
  const {
    hits: { hits: result },
  } = await es[organizationId].search({
    index: 'groupmessage',
    size: messageSize,
    sort: {
      'created_at': 'desc',
    },
    query: {
      bool: {
        filter: [
          { term: { group_id: groupId } },
          {
            range: {
              created_at: {
                lt: baselineTime,
              },
            },
          },
        ],
      },
    },
  });
  return result;
}

async function updatePrivateMessagesIsRead(organizationId, userId, contactUserId) {
  const result = await es[organizationId].updateByQuery({
    index: 'message',
    script: {
      source: `ctx._source.isRead = true`,
      lang: 'painless',
    },
    query: {
      bool: {
        filter: [
          { term: { sender_id: contactUserId } },
          { term: { receiver_id: userId } },
          { term: { isRead: false } },
        ],
      },
    },
  });
  return result;
}

async function updateGroupMessagesIsRead(organizationId, userId, groupId) {
  const result = await es[organizationId].updateByQuery({
    index: 'groupmessage',
    script: {
      source: `if(!ctx._source.isRead.contains(params.user_id)){ctx._source.isRead.add(params.user_id)}`,
      lang: 'painless',
      params: {
        user_id: userId,
      },
    },
    query: {
      bool: {
        filter: { term: { group_id: groupId } },
        must_not: { term: { isRead: userId } },
      },
    },
  });

  return result;
}

async function getUnreadMessages(organizationId, userId, senderIds) {
  const unreadMessagesQueryBody = senderIds.reduce((querybody, senderId) => {
    querybody.push({ index: 'message' }),
      querybody.push({
        query: {
          bool: {
            filter: [
              { term: { sender_id: senderId } },
              { term: { receiver_id: userId } },
              { term: { isRead: false } },
            ],
          },
        },
      });

    return querybody;
  }, []);

  const { responses: result } = await es[organizationId].msearch({
    body: unreadMessagesQueryBody,
  });

  return result;
}

async function createMessage(
  organizationId,
  senderId,
  senderName,
  receiverId,
  receiverName,
  message,
  files,
  isRead
) {
  const result = await es[organizationId].index({
    index: 'message',
    document: {
      sender_id: senderId,
      sender_name: senderName,
      receiver_id: receiverId,
      receiver_name: receiverName,
      message,
      files,
      isRead,
    },
  });

  return result;
}

module.exports = {
  suggestions,
  matchedClauses,
  getPrivateMessagesByUserId,
  getPrivateMessagesByUserIdMore,
  getGroupMessagesByGroupId,
  getGroupMessagesByGroupIdMore,
  updatePrivateMessagesIsRead,
  updateGroupMessagesIsRead,
  getUnreadMessages,
  createMessage,
};
