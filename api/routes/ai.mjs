import express from 'express';
import { upload } from '../middleware/upload.mjs';
import { validateFirestoreKey } from '../middleware/firestore-auth.mjs';
import { parseReplay } from '../core_parser.mjs';
import { 
  analyzeMatch, 
  coachMatch, 
  coachSession, 
  coachWeapons, 
  recommendDrop, 
  scoutOpponent, 
  reviewRotation 
} from '../lib/vertex.mjs';

const router = express.Router();

// Helper: Parse and Charge
const processAIRequest = async (req, res, cost, aiFunction) => {
    if (!req.file && !req.files) return res.status(400).json({ error: 'No replay file provided' });
    
    try {
        let stats;
        if (req.file) {
            const result = await parseReplay(req.file.buffer);
            stats = await aiFunction(result);
        } else if (req.files) {
            const results = await Promise.all(req.files.map(f => parseReplay(f.buffer)));
            stats = await aiFunction(results);
        }

        if (!stats) throw new Error('AI analysis failed');

        res.json({
            status: 200,
            credits_used: cost,
            credits_remaining: (req.user?.credits || 0),
            data: stats
        });
    } catch (err) {
        console.error(`[AI Route Error]: ${err.message}`);
        res.status(500).json({ status: 500, error: 'AI Processing Error', message: err.message });
    }
};

/**
 * AI Endpoints
 */

router.post('/analyze', validateFirestoreKey(15, { requireBeta: true }), upload.single('file'), async (req, res) => {
    await processAIRequest(req, res, 15, analyzeMatch);
});

router.post('/coach', validateFirestoreKey(30, { requireBeta: true }), upload.single('file'), async (req, res) => {
    await processAIRequest(req, res, 30, coachMatch);
});

router.post('/session-coach', validateFirestoreKey(50, { requireBeta: true }), upload.array('files', 6), async (req, res) => {
    await processAIRequest(req, res, 50, coachSession);
});

router.post('/weapon-coach', validateFirestoreKey(20, { requireBeta: true }), upload.single('file'), async (req, res) => {
    await processAIRequest(req, res, 20, async (data) => {
        return coachWeapons(data.weapon_deep_dive || []);
    });
});

router.post('/drop-recommend', validateFirestoreKey(20, { requireBeta: true }), upload.single('file'), async (req, res) => {
    await processAIRequest(req, res, 20, async (data) => {
        // Mocking historical drops for now or pulling from player profile
        return recommendDrop(data.match_overview?.performance_metrics, []);
    });
});

router.post('/opponent-scout', validateFirestoreKey(25, { requireBeta: true }), async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing opponent name' });
    try {
        const scout = await scoutOpponent(name, []); // Fetch history from Osirion later
        res.json({ status: 200, credits_used: 25, data: scout });
    } catch (err) {
        res.status(500).json({ error: 'Scouting failed' });
    }
});

router.post('/rotation-review', validateFirestoreKey(15, { requireBeta: true }), upload.single('file'), async (req, res) => {
    await processAIRequest(req, res, 15, async (data) => {
        return reviewRotation(data.rotation_score || {});
    });
});

export default router;
