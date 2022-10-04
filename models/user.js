const es = require('../utils/es');
const { promisePool } = require('../utils/mysql');
require('dotenv').config();

const { ES_SEARCH_LIMIT } = process.env;

async function getOrganizationUserDataByEmail(email, organizationId) {
  const sql = `SELECT email FROM user WHERE email = ? AND organization_id = ?;`;
  const [emailList] = await promisePool.execute(sql, [email, organizationId]);

  return emailList;
}

async function getESUserDataByEmail(organizationId, email) {
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

async function getAllUser(organizationId) {
  const {
    hits: { hits: result },
  } = await es[organizationId].search({
    index: 'user',
    body: {
      size: ES_SEARCH_LIMIT,
      query: {
        match_all: {},
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
  getAllUser,
  getOrganizationUserDataByEmail,
  deleteOrganizationUserData,
  getESUserDataByEmail,
  deleteUserByEmail,
};
