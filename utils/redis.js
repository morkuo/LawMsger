require('dotenv').config();
const Redis = require('ioredis');

const { REDIS_ADAPTER_HOST, REDIS_ADAPTER_PORT, REDIS_ADAPTER_USER, REDIS_ADAPTER_PASSWORD } =
  process.env;

const pubClient = new Redis({
  host: REDIS_ADAPTER_HOST,
  port: REDIS_ADAPTER_PORT,
  username: REDIS_ADAPTER_USER,
  password: REDIS_ADAPTER_PASSWORD,
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
