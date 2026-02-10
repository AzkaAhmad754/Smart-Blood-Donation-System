const { createClient } = require('redis');

let redisClient = null;
let pubClient = null;
let subClient = null;

const createRedisClient = async () => {
  const client = createClient({ url: process.env.REDIS_URL });
  client.on('error', (err) => console.error('Redis Client Error:', err));
  client.on('connect', () => console.log('Redis connected'));
  await client.connect();
  return client;
};

const initRedis = async () => {
  redisClient = await createRedisClient();
  pubClient = await createRedisClient();
  subClient = await createRedisClient();
  return { redisClient, pubClient, subClient };
};

const getRedis = () => redisClient;
const getPub = () => pubClient;
const getSub = () => subClient;

module.exports = { initRedis, getRedis, getPub, getSub };
