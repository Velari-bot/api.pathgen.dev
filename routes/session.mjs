import express from 'express';
import { parseReplay } from '../core_parser.mjs';
import { upload } from '../middleware/upload.mjs';

import { validateApiKey } from '../middleware/auth.mjs';

const router = express.Router();

router.use(validateApiKey);

const wrapResponse = (req, payload, cost) => {
    return {
        credits_used: cost,
        credits_remaining: (req.user?.credits || 0),
        parse_time_ms: payload.parser_meta?.parse_time_ms || 0,
        data: payload
    };
};

router.post('/analyze', upload.single('session'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No session file' });

    try {
        const start = Date.now();
        const result = await parseReplay(req.file.buffer);
        
        const payload = {
            session_id: "sess_" + Math.random().toString(36).substr(2, 9),
            summary: {
                matches_processed: 1,
                total_elims: result.combat_summary.eliminations.total,
                average_placement: result.match_overview.placement
            },
            parser_meta: { parse_time_ms: Date.now() - start }
        };

        res.json(wrapResponse(req, payload, 50));
    } catch(err) {
        res.status(500).json({ error: 'Session analysis failed' });
    }
});

export default router;
