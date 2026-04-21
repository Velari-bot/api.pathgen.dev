import express from 'express';
import { upload } from '../middleware/upload.mjs';
import { validateSubscription } from '../middleware/subscription-auth.mjs';
import { parseReplay } from '../core_parser.mjs';
import { analyzeMatch } from '../lib/vertex.mjs';

const router = express.Router();

/**
 * COMMERCIAL SUBSCRIPTION ROUTES
 * These routes don't charge "credits". They check the user's plan.
 */

// 1. FREE PLAN
router.post('/free', validateSubscription('FREE'), upload.single('file'), async (req, res) => {
    try {
        const result = await parseReplay(req.file.buffer);
        res.json({
            status: "success",
            plan: "Free",
            usage: `${req.user.usage}/${req.user.limit}`,
            data: {
                match: result.match_overview,
                kills: result.combat_summary?.eliminations?.players
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. MID PLAN (Mid-tier features)
router.post('/mid', validateSubscription('MID'), upload.single('file'), async (req, res) => {
    try {
        const result = await parseReplay(req.file.buffer);
        res.json({
            status: "success",
            plan: "Mid-Tier",
            usage: `${req.user.usage}/${req.user.limit}`,
            data: {
                match: result.match_overview,
                combat: result.combat_summary,
                weapons: result.weapon_deep_dive
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. PRO PLAN (Elite features)
router.post('/pro', validateSubscription('PRO'), upload.single('file'), async (req, res) => {
    try {
        const result = await parseReplay(req.file.buffer);
        
        // AI Analysis is included in the Pro Subscription
        const aiCoaching = await analyzeMatch(result);

        res.json({
            status: "success",
            plan: "Pro Elite",
            usage: `${req.user.usage}/${req.user.limit}`,
            data: {
                ...result,
                ai_coaching: aiCoaching
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
