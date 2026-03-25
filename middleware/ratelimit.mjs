import { cache } from '../lib/cache.mjs';

export const rateLimitMiddleware = async (req, res, next) => {
    const key = `ratelimit:${req.user?.id || req.ip}`;
    const limit = 30; // 30 req/min limit per key
    const windowSeconds = 60;

    if (!cache.redis || cache.redis.status !== 'ready') {
        // Fallback or skip limiting if redis is down
        return next();
    }

    try {
        const count = await cache.redis.incr(key);
        if (count === 1) {
            await cache.redis.expire(key, windowSeconds);
        }

        if (count > limit) {
            return res.status(429).json({
                error: true,
                code: 'RATE_LIMITED',
                message: 'Too many requests. Limit: 30/min'
            });
        }

        res.set('X-RateLimit-Limit', limit);
        res.set('X-RateLimit-Remaining', limit - count);
        next();
    } catch (err) {
        // Log skip
        next();
    }
};
