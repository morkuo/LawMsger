'use strict';

const { checkConnection: checkMySQLConnection, promisePool } = require('./mysql');
require('dotenv').config();

const HOST =
  process.env.ENVIRONMENT === 'production' ? process.env.EC2_HOST : process.env.LOCAL_HOST;

const username = process.env.USERNAME;

const password =
  process.env.ENVIRONMENT === 'production' ? process.env.EC2_PASSWORD : process.env.LOCAL_PASSWORD;

const clients = {};

esConnect();

async function esConnect() {
  const connection = await checkMySQLConnection();

  if (!connection) return console.log('MySQL connection failed. ES connection failed.');

  const sql = `SELECT id, location FROM organization;`;
  const [organizations] = await promisePool.execute(sql);

  for (let organization of organizations) {
    const { Client } = require('@elastic/elasticsearch');
    const client = new Client({
      node: `https://${organization.location}:9200`,
      auth: {
        username,
        password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    clients[organization.id] = client;
  }
}

module.exports = clients;
