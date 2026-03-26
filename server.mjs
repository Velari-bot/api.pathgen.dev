import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

// Middleware
import { loggerMiddleware } from './middleware/logger.mjs';
import { validateFirestoreKey } from './middleware/firestore-auth.mjs';

import { rateLimitMiddleware } from './middleware/ratelimit.mjs';

// Routes
import healthRoutes from './routes/health.mjs';
import metricsRoutes from './routes/metrics.mjs';
import logsRoutes from './routes/logs.mjs';
import authRoutes from './routes/auth.mjs';
import accountRoutes from './routes/account.mjs';
import billingRoutes from './routes/billing.mjs';
import replayRoutes from './routes/replay.mjs';
import sessionRoutes from './routes/session.mjs';
import gameRoutes from './routes/game.mjs';

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS and basic logging
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware); // Custom logger to DB
app.use(morgan('dev')); // Console logger

// 1. Health & Infrastructure (Public)
app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);

app.get('/', (req, res) => {
    res.type('text/plain');
    res.send("PathGen API Server. This is for developer integrations only. If you're looking for the platform, visit https://platform.pathgen.dev");
});

app.get('/debug', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send("User-agent: *\nAllow: /");
});

// 2. Logging & Observability (Admin Only)
app.use('/logs', logsRoutes);

// 3. API Version 1
// Paid endpoints (Replay & Session) require credit check and rate limiting
app.use('/v1/replay', rateLimitMiddleware, replayRoutes);
app.use('/v1/session', rateLimitMiddleware, sessionRoutes);


// Free / Low-tier endpoints
app.use('/v1/auth', authRoutes);
app.use('/v1/account', accountRoutes);
app.use('/v1/billing', billingRoutes);
app.use('/v1/game', gameRoutes);

// Assets (Redirect to Cloudflare R2 for performance)
app.use('/tiles', (req, res) => {
    const path = req.path;
    res.redirect(301, `https://assets.pathgen.dev/tiles${path}`);
});

// 404 Handler (JSON for everything except documentation/main site)
app.use((req, res) => {
    res.status(404).json({
        error: true,
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found. Check the documentation for valid routes.`
    });
});

// Error handler
app.use((err, req, res, next) => {
    // console.error(err);
    const code = err.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : (err.code || 'UNKNOWN_ERROR');
    res.status(err.status || 400).json({
        error: true,
        code: code,
        message: err.message || 'Internal server error'
    });
});

app.listen(port, () => {
    console.log(`PathGen API Server running on port ${port}`);
});
