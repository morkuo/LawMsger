const es = require('../utils/es');
const { promisePool } = require('../utils/mysql');

async function getOrganizationUserDataByEmail(email, organizationId) {
  const sql = `SELECT email FROM user WHERE email = ? AND organization_id = ?;`;
  const [emailList] = await promisePool.execute(sql, [email, organizationId]);

  return emailList;
}

async function getESUserDataByEmail(email, organizationId) {
  const {
    hits: {
      hits: [result],
    },
  } = await es[organizationId].search({
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

async function deleteOrganizationUserData(organizationId, email) {
  const sql = `DELETE FROM user WHERE email = ? AND organization_id = ?;`;
  const [result] = await promisePool.execute(sql, [email, organizationId]);

  return result;
}

async function deleteUserByEmail(organizationId, index, email) {
  const result = await es[organizationId].deleteByQuery({
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
  deleteOrganizationUserData,
  getESUserDataByEmail,
  deleteUserByEmail,
};
