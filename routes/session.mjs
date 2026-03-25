import express from 'express';
import { parseReplay } from '../core_parser.mjs';
import { upload } from '../middleware/upload.mjs';
import { r2 } from '../lib/r2.mjs';

import { validateFirestoreKey } from '../middleware/firestore-auth.mjs';


const router = express.Router();

// Auth handled per route


const wrapResponse = (req, payload, cost, storageUrl) => {
    return {
        credits_used: cost,
        credits_remaining: (req.user?.credits || 0),
        storage_url: storageUrl || null,
        parse_time_ms: payload.parser_meta?.parse_time_ms || 0,
        data: payload
    };
};

router.post('/analyze', validateFirestoreKey(50), upload.single('session'), async (req, res) => {

    if (!req.file) return res.status(400).json({ error: 'No session file' });

    try {
        const start = Date.now();
        const result = await parseReplay(req.file.buffer);
        
        const sessionId = "sess_" + Math.random().toString(36).substr(2, 9);
        const storageKey = `sessions/${sessionId}.replay`;
        await r2.upload(storageKey, req.file.buffer, 'application/octet-stream');
        const storageUrl = `https://assets.pathgen.dev/${storageKey}`;

        const payload = {
            session_id: sessionId,
            summary: {
                matches_processed: 1,
                total_elims: result.combat_summary.eliminations.total,
                average_placement: result.match_overview.placement
            },
            parser_meta: { parse_time_ms: Date.now() - start }
        };

        res.json(wrapResponse(req, payload, 50, storageUrl));
    } catch(err) {
        console.error('Session analysis failed:', err);
        res.status(500).json({ error: 'Session analysis failed' });
    }
});

export default router;
