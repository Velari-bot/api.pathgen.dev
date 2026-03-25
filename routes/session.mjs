import express from 'express';
import { parseReplay } from '../core_parser.mjs';
import { upload } from '../middleware/upload.mjs';

const router = express.Router();

router.post('/analyze', upload.single('session'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No session file' });

    try {
        const result = await parseReplay(req.file.buffer);
        // Deep analysis logic for full sessions
        res.json({
            session_id: "sess_" + Math.random().toString(36).substr(2, 9),
            summary: {
                matches_processed: 1,
                total_elims: result.combat_summary.eliminations.total,
                average_placement: result.match_overview.placement
            }
        });
    } catch(err) {
        res.status(500).json({ error: 'Session analysis failed' });
    }
});

export default router;
