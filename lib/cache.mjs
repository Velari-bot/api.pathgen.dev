import Redis from 'ioredis';

let isRedisConnected = false;
let redis;
try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 1000
  });
  redis.on('connect', () => { isRedisConnected = true; console.log('Redis connected'); });
  redis.on('error', (err) => { isRedisConnected = false; console.log('Redis error:', err.message); });
} catch (e) {
  console.log('Redis not available:', e.message);
}

export const cache = {
  get: async (key) => {
    if (!redis || !isRedisConnected) return null;
    return Promise.race([
      redis.get(key),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Cache timeout')), 2000))
    ]).catch(() => null);
  },
  set: async (key, val, ex = 3600) => {
    if (!redis || !isRedisConnected) return null;
    return Promise.race([
      redis.set(key, val, 'EX', ex),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Cache timeout')), 2000))
    ]).catch(() => null);
  },
  del: async (key) => {
    if (!redis || !isRedisConnected) return null;
    return Promise.race([
      redis.del(key),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Cache timeout')), 2000))
    ]).catch(() => null);
  },
  redis // expose raw redis client
};
