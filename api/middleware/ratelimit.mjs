import { cache } from '../lib/cache.mjs';

export const rateLimitMiddleware = (limit = 30, windowSeconds = 60) => {
    return async (req, res, next) => {
        // Use user ID if authenticated, fallback to IP for public requests
        const identifier = req.user?.email || req.user?.id || req.ip;
        const key = `ratelimit:${identifier}`;

        if (!cache.redis || cache.redis.status !== 'ready') {
            return next(); // Fail open if Redis is down
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
                    message: `Too many requests. Limit: ${limit}/${windowSeconds}s`
                });
            }

            res.set('X-RateLimit-Limit', limit);
            res.set('X-RateLimit-Remaining', Math.max(0, limit - count));
            next();
        } catch (err) {
            next();
        }
    };
};
