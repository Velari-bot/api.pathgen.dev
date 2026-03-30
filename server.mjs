import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import helmet from 'helmet';
import { loggerMiddleware } from './middleware/logger.mjs';
import { validateFirestoreKey } from './middleware/firestore-auth.mjs';
import { rateLimitMiddleware } from './middleware/ratelimit.mjs';
import { cloudflareOnly } from './middleware/cloudflare.mjs';

// Routes
import epicOAuthRoutes from './routes/epic_oauth.mjs';
import aiRoutes from './routes/ai.mjs';
import enhancedReplayRoutes from './routes/replay_enhanced.mjs';
import { initAESKey } from './lib/aes.mjs';
import metricsRoutes from './routes/metrics.mjs';
import logsRoutes from './routes/logs.mjs';
import authRoutes from './routes/auth.mjs';
import accountRoutes from './routes/account.mjs';
import billingRoutes from './routes/billing.mjs';
import replayRoutes from './routes/replay.mjs';
import sessionRoutes from './routes/session.mjs';
import gameRoutes from './routes/game.mjs';
import specRoutes from './routes/spec.mjs';
import webhookRoutes from './routes/webhooks.mjs';
import healthRoutes from './routes/health.mjs';

const app = express();
app.set('trust proxy', true); // Trust Cloudflare headers
const port = process.env.PORT || 3000;

// Global Security & Logging
app.use(helmet()); 
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware); // Custom logger
app.use(morgan('dev')); // Console logger

// Origin Protection
app.use(cloudflareOnly); // Only allow Cloudflare IPs
app.use(rateLimitMiddleware(100, 60)); // Global "burst" protection: 100 req/min

// 1. Health & Infrastructure (Public)
app.use('/health', healthRoutes); // System Status & Self-Healing
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
// Paid endpoints (Replay & Session) require credit check and strict rate limiting
app.use('/v1/replay', rateLimitMiddleware(10, 60), replayRoutes);
app.use('/v1/replay/enhanced', rateLimitMiddleware(10, 60), enhancedReplayRoutes);
app.use('/v1/session', rateLimitMiddleware(10, 60), sessionRoutes);
app.use('/v1/ai', rateLimitMiddleware(5, 60), aiRoutes);

// Free / Low-tier endpoints
app.use('/v1/auth', authRoutes);
app.use('/v1/account', accountRoutes);
app.use('/v1/billing', rateLimitMiddleware(5, 60), billingRoutes);
app.use('/v1/game', rateLimitMiddleware(60, 60), gameRoutes);
app.use('/v1/spec', specRoutes); // OpenAPI JSON
app.use('/v1/webhooks', webhookRoutes); // Developer Push Notifs
app.use('/v1/epic', epicOAuthRoutes); // Epic Account Integration
app.use('/v1', gameRoutes); // Root alias for compatibility (e.g., /v1/map, /v1/lookup)

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

// Error handler with Smart Diagnostics
app.use((err, req, res, next) => {
    let code = 'INTERNAL_ERROR';
    let status = err.status || 500;

    if (err.code === 'LIMIT_FILE_SIZE') code = 'FILE_TOO_LARGE';
    if (err.message?.includes('version')) code = 'PARSER_VERSION_MISMATCH';
    if (err.message?.includes('credential')) code = 'CLOUD_AUTH_ERROR';
    if (err.message?.includes('Balance')) { code = 'INSUFFICIENT_CREDITS'; status = 402; }
    
    res.status(status).json({
        error: true,
        code: code,
        message: err.message || 'An unexpected error occurred'
    });
});

// Pre-warm AES key cache
await initAESKey();

app.listen(port, () => {
    console.log(`PathGen API Server running on port ${port}`);
});
