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
app.set('trust proxy', true); 
const port = process.env.PORT || 3000;

// Environment Validation
const REQUIRED_VARS = ['FIREBASE_SERVICE_ACCOUNT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
REQUIRED_VARS.forEach(v => {
    if (!process.env[v]) console.error(`[CRITICAL] Missing Required Environment Variable: ${v}`);
});
if (!process.env.GOOGLE_AI_KEY) console.warn(`[WARNING] Missing GOOGLE_AI_KEY. AI Coaching endpoints will return 500.`);
if (!process.env.DATABASE_URL) console.warn(`[WARNING] Missing DATABASE_URL. Legacy PostgreSQL Auth will be unavailable.`);

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
    res.send(`<!DOCTYPE html>
<html>
<head>
    <title>PathGen API Server</title>
    <link rel="icon" type="image/png" href="/favicon.png">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #e1e1e1; background: #0f172a; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
        .container { padding: 2rem; border-radius: 12px; background: #1e293b; border: 1px solid #334155; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        a { color: #38bdf8; text-decoration: none; font-weight: 500; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <img src="/favicon.png" width="64" height="64" alt="Pathgen Logo" style="margin-bottom: 1rem;">
        <h1>PathGen API Server <small style="font-size: 0.5em; opacity: 0.7;">v1.2.6</small></h1>
        <p>Developed by <a href="https://x.com/WrenchDevelops" target="_blank">Wrench Develops</a></p>
        <p style="opacity: 0.8;">This is a high-performance backend. Visit <a href="https://platform.pathgen.dev">platform.pathgen.dev</a> for documentation.</p>
    </div>
</body>
</html>`);
});

app.get(['/favicon.ico', '/favicon.png'], (req, res) => {
    res.sendFile(path.resolve('Pathgen Platform.png'));
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
// Pro-tier endpoints (Replay Enrichment & AI)
app.use('/v1/ai', rateLimitMiddleware(2000, 60), aiRoutes);
app.use('/v1/replay/enhanced', rateLimitMiddleware(2000, 60), enhancedReplayRoutes);

// Paid endpoints (Replay & Session) require credit check and strict rate limiting
// POST /v1/replay/download-and-parse  25 credits
// POST /v1/replay/match-info           5 credits
// POST /v1/session/auto-analyze       75 credits
app.use('/v1/replay', rateLimitMiddleware(10, 60), replayRoutes);
app.use('/v1/session', rateLimitMiddleware(10, 60), sessionRoutes);

// Free / Low-tier endpoints
app.use('/v1/auth', rateLimitMiddleware(10, 60), authRoutes);
app.use('/v1/account', rateLimitMiddleware(60, 60), accountRoutes);
app.use('/v1/billing', rateLimitMiddleware(10, 60), billingRoutes);
app.use('/v1/game', rateLimitMiddleware(60, 60), gameRoutes);
app.use('/v1/spec', rateLimitMiddleware(2000, 60), specRoutes); // OpenAPI JSON
app.use('/v1/webhooks', rateLimitMiddleware(2000, 60), webhookRoutes); // Developer Push Notifs
app.use('/v1/epic', epicOAuthRoutes); // Epic Account Integration

// Assets (Redirect to Cloudflare R2 for performance)
app.use('/tiles', (req, res) => {
    const path = req.path;
    res.redirect(301, `https://assets.pathgen.dev/tiles${path}`);
});

// 404 Handler (JSON for everything except documentation/main site)
app.use((req, res) => {
    const isAsset = req.path.endsWith('.js') || req.path.endsWith('.css') || req.path.endsWith('.png');
    
    res.status(404).json({
        error: true,
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found.`,
        hint: isAsset ? "This is an API server. Assets should be loaded from your frontend or platform domain." : "Check the OpenAPI spec at /v1/spec for valid routes."
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
