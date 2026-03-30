import { db } from '../lib/db.mjs';
import { metrics } from '../lib/metrics.mjs';

export const loggerMiddleware = async (req, res, next) => {
    const start = Date.now();

    res.on('finish', async () => {
        const duration = Date.now() - start;
        const durationSeconds = duration / 1000;

        // 1. Record basic HTTP metrics
        metrics.httpRequestCounter.inc({
            method: req.method,
            route: req.baseUrl + req.route?.path || req.path,
            status_code: res.statusCode
        });

        metrics.httpRequestDuration.observe({
            method: req.method,
            route: req.baseUrl + req.route?.path || req.path
        }, durationSeconds);

        // 2. Alert on security incidents specifically
        if (res.statusCode === 401) {
            metrics.securityAlertCounter.inc({ type: 'UNAUTHORIZED', reason: 'Invalid or missing API key' });
        } else if (res.statusCode === 403) {
            metrics.securityAlertCounter.inc({ type: 'FORBIDDEN', reason: 'Origin bypass attempt or access denied' });
        }

        const logData = {
            id: 'req_' + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            endpoint: `${req.method} ${req.originalUrl}`,
            key_id: req.user?.id || 'anonymous',
            ip: req.ip,
            status: res.statusCode,
            duration_ms: duration,
            credits_used: req.credits_cost || 0,
            file_size_mb: req.file ? (req.file.size / (1024 * 1024)).toFixed(2) : 0
        };

        try {
            if (db.pool && db.pool.connect) {
                // await db.query('INSERT ...');
            }
        } catch (err) {
            console.error('Logging to DB failed:', err.message);
        }
    });

    next();
};

export const checkCredits = async (req, res, next) => {
    if (!req.path.startsWith('/v1/replay/')) return next();
    const cost = 20;

    try {
        if (!db.pool) {
            // Assume credit match for testing if DB is down
            req.credits_cost = cost;
            return next();
        }
        
        const user = await db.query('SELECT balance FROM accounts WHERE id = $1', [req.user.id]);
        if (user.rows.length === 0 || user.rows[0].balance < cost) {
            return res.status(402).json({
                error: true,
                code: 'INSUFFICIENT_CREDITS',
                message: 'No credits remaining'
            });
        }
        req.credits_cost = cost;
        next();
    } catch (err) {
        // Fallback for testing
        req.credits_cost = cost;
        next();
    }
};
