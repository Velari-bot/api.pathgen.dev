import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
console.log(`[INIT] Starting PathGen API... 环境: ${process.env.NODE_ENV}, SkipAuth: ${process.env.SKIP_AUTH}`);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
import tierRoutes from './routes/tiers.mjs';
import commercialRoutes from './routes/commercial.mjs';

// Automations
import { startDailyDigest } from './lib/daily_digest.mjs';
import { startWeeklyCoaching } from './lib/weekly_coaching.mjs';

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
if (process.env.NODE_ENV !== 'development') {
    app.use(helmet()); 
} else {
    console.log('[Security] Helmet disabled for local development');
}

app.use(cors({
    origin: ['http://localhost:3000', /pathgen\.dev$/],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));
app.use(express.json());
app.use(loggerMiddleware); // Custom logger
app.use(morgan('dev')); // Console logger

// 1. Health & Infrastructure (Public)
app.use('/health', healthRoutes); // System Status & Self-Healing
app.use('/metrics', metricsRoutes);

// Origin Protection
app.use(cloudflareOnly); // Only allow Cloudflare IPs
app.use(rateLimitMiddleware(100, 60)); // Global "burst" protection: 100 req/min

app.get('/', validateFirestoreKey(0), (req, res) => {
    res.type('text/plain');
    res.send('PathGen API Server v1.2.6\n\nThis is not for regular use. Head to https://platform.pathgen.dev instead.');
});

app.get(['/favicon.ico', '/favicon.png'], (req, res) => {
    res.type('image/png');
    res.sendFile(path.join(__dirname, 'Pathgen Platform.png'));
});

app.get('/debug', validateFirestoreKey(0, { requireAdmin: true }), (req, res) => {
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
app.use('/v1/tier', rateLimitMiddleware(10, 60), tierRoutes);
app.use('/v1/commercial', rateLimitMiddleware(60, 60), commercialRoutes);
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
// Start Automations
await initAESKey();
startDailyDigest();
startWeeklyCoaching();

app.listen(port, () => {
    console.log(`PathGen API Server running on port ${port}`);
});
