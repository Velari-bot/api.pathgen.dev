import express from 'express';
import { metrics } from '../lib/metrics.mjs';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // Support JSON if requested via query or Accept header (for API Explorer)
        if (req.query.format === 'json' || req.headers.accept?.includes('application/json')) {
            const result = await metrics.register.getMetricsAsJSON();
            return res.json({ status: 200, metrics: result });
        }

        res.set('Content-Type', metrics.register.contentType);
        const result = await metrics.register.metrics();
        res.end(result);
    } catch (err) {
        console.error('[Metrics Error]', err.message);
        res.status(500).json({ error: 'Failed to generate metrics', message: err.message });
    }
});

export default router;
