import express from 'express';
import { db } from '../lib/db.mjs';

const router = express.Router();

// Mock middleware for admin token (already in server.mjs)
// router.use(isAdmin);

router.get('/requests', async (req, res) => {
    const { page = 1, limit = 50, from, to, endpoint, status, key_id } = req.query;
    const offset = (page - 1) * limit;

    try {
        // Real logic would use parameterized query with filters.
        res.json({
            total: 15420,
            page: parseInt(page),
            limit: parseInt(limit),
            requests: [
                {
                    id: "req_abc123",
                    timestamp: new Date().toISOString(),
                    endpoint: "POST /v1/replay/parse",
                    key_id: "rs_35402b9d",
                    ip: "1.2.3.4",
                    status: 200,
                    duration_ms: 842,
                    credits_used: 20,
                    file_size_mb: 15.2
                }
            ]
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch request logs' });
    }
});

router.get('/errors', async (req, res) => {
    res.json({
        errors: [
            {
                id: "err_xyz789",
                timestamp: new Date().toISOString(),
                endpoint: "POST /v1/replay/parse",
                error_code: "PARSE_FAILED",
                message: "Decompression failed at chunk 34",
                key_id: "rs_35402b9d",
                stack: "...",
                file_size_mb: 18.4
            }
        ]
    });
});

router.get('/parses', async (req, res) => {
    res.json({
        parses: [
            {
                id: "parse_001",
                timestamp: new Date().toISOString(),
                file_version: 7,
                file_size_mb: 15.2,
                timing: {
                    header_ms: 2,
                    decrypt_ms: 180,
                    decompress_ms: 340,
                    stats_ms: 45,
                    positions_ms: 220,
                    names_ms: 30,
                    weapons_ms: 25
                },
                total_ms: 842,
                result: "Victory Royale",
                placement: 1,
                confidence: "confirmed"
            }
        ]
    });
});

router.get('/credits', async (req, res) => {
    res.json({
        transactions: [
            {
                id: "txn_001",
                timestamp: new Date().toISOString(),
                type: "deduction",
                amount: 20,
                endpoint: "POST /v1/replay/parse",
                key_id: "rs_35402b9d",
                balance_after: 9410
            }
        ]
    });
});

// Real-time SSE Stream
let clients = [];
router.get('/live', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);

    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientId);
    });
});

// Helper for other routes to push to live log
export const pushLiveLog = (data) => {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach(c => c.res.write(payload));
};

export default router;
