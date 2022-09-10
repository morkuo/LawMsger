const es = require('../utils/es');

async function getUserDataByEmail(email) {
  const {
    hits: {
      hits: [result],
    },
  } = await es.search({
    index: 'user',
    body: {
      query: {
        term: {
          'email.keyword': email,
        },
      },
    },
  });
  return result;
}

async function deleteUserByEmail(index, email) {
  const result = await es.deleteByQuery({
    index,
    body: {
      query: {
        term: { 'email.keyword': email },
      },
    },
  });
  return result;
}

module.exports = {
  getUserDataByEmail,
  deleteUserByEmail,
};
