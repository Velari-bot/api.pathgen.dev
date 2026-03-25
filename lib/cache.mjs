import Redis from 'ioredis';

let redis;
try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true,
    maxRetriesPerRequest: 1
  });
  redis.on('error', (err) => console.log('Redis error:', err.message));
} catch (e) {
  console.log('Redis not available:', e.message);
}

export const cache = {
  get: async (key) => redis ? redis.get(key) : null,
  set: async (key, val, ex = 3600) => redis ? redis.set(key, val, 'EX', ex) : null,
  del: async (key) => redis ? redis.del(key) : null,
  redis // expose raw redis client
};
