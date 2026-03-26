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
  get: async (key) => (redis && isRedisConnected) ? redis.get(key) : null,
  set: async (key, val, ex = 3600) => (redis && isRedisConnected) ? redis.set(key, val, 'EX', ex) : null,
  del: async (key) => (redis && isRedisConnected) ? redis.del(key) : null,
  redis // expose raw redis client
};
