const Redis = require("ioredis");

let redis = null;

// jaribu kuconnect Redis kama REDIS_URL ipo
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      reconnectOnError: () => false
    });

    redis.on("connect", () => {
      console.log("✅ Redis connected");
    });

    redis.on("error", (err) => {
      console.log("⚠ Redis error, fallback to no-cache:", err.message);
    });

  } catch (err) {
    console.log("⚠ Redis disabled:", err.message);
    redis = null;
  }
} else {
  console.log("⚠ Redis not configured (running without cache)");
}

module.exports = {

  async get(key) {
    if (!redis) return null;

    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async set(key, value, ttl = 60) {
    if (!redis) return;

    try {
      await redis.set(key, JSON.stringify(value), "EX", ttl);
    } catch {}
  },

  async del(key) {
    if (!redis) return;

    try {
      await redis.del(key);
    } catch {}
  }
};
