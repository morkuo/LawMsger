require('dotenv').config();
const Redis = require('ioredis');

const { CACHE_HOST, CACHE_PORT, CACHE_USER, CACHE_PASSWORD } = process.env;

const pubClient = new Redis({
  port: CACHE_PORT,
  host: CACHE_HOST,
  username: CACHE_USER,
  password: CACHE_PASSWORD,
});

const subClient = pubClient.duplicate();

pubClient.ready = false;

pubClient.on('ready', () => {
  pubClient.ready = true;
  console.log('Redis is ready');
});

pubClient.on('error', () => {
  pubClient.ready = false;
  console.log('Error in Redis');
});

pubClient.on('end', () => {
  pubClient.ready = false;
  console.log('Redis is disconnected');
});

module.exports = { pubClient, subClient };
