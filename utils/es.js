'use strict';
require('dotenv').config();

const HOST =
  process.env.ENVIRONMENT === 'production' ? process.env.EC2_HOST : process.env.LOCAL_HOST;

const username = process.env.USERNAME;

const password =
  process.env.ENVIRONMENT === 'production' ? process.env.EC2_PASSWORD : process.env.LOCAL_PASSWORD;

const { Client } = require('@elastic/elasticsearch');
const client = new Client({
  node: `https://${HOST}:9200`,
  auth: {
    username,
    password,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = client;
