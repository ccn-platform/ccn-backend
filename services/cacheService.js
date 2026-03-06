const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL);

module.exports = {
  async get(key) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key, value, ttl = 60) {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  },

  async del(key) {
    await redis.del(key);
  }
};
