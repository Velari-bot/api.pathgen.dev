import express from 'express';
import client from 'prom-client';

const router = express.Router();

const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestCounter);

router.get('/', async (req, res) => {
    try {
        // Support JSON if requested via query or Accept header (for API Explorer)
        if (req.query.format === 'json' || req.headers.accept?.includes('application/json')) {
            const metrics = await register.getMetricsAsJSON();
            return res.json({ status: 200, metrics });
        }

        res.set('Content-Type', register.contentType);
        const metrics = await register.metrics();
        res.end(metrics);
    } catch (err) {
        console.error('[Metrics Error]', err.message);
        res.status(500).json({ error: 'Failed to generate metrics', message: err.message });
    }
});

export default router;
