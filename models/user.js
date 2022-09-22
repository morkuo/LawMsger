const es = require('../utils/es');
const { promisePool } = require('../utils/mysql');

async function getOrganizationUserDataByEmail(email, organizationId) {
  const sql = `SELECT email FROM user WHERE email = ? AND organization_id = ?;`;
  const [emailList] = await promisePool.execute(sql, [email, organizationId]);

  return emailList;
}

async function getESUserDataByEmail(email) {
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
  getOrganizationUserDataByEmail,
  getESUserDataByEmail,
  deleteUserByEmail,
};
