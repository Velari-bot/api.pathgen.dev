import express from 'express';
import { 
  generateCoach, 
  generateSessionCoach, 
  generateWeaponCoach, 
  generateDropRecommendation, 
  generateOpponentScout 
} from '../lib/vertex.mjs';
import { parseReplay } from '../core_parser.mjs';
import { upload } from '../middleware/upload.mjs';
import { validateFirestoreKey } from '../middleware/firestore-auth.mjs';
import { getPlayerStats } from '../fortnite_api.mjs';

const router = express.Router();

/**
 * POST /v1/ai/coach
 * 30 Credits
 */
router.post('/coach', validateFirestoreKey(30), upload.single('replay'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No replay file provided' });
  try {
    const matchData = await parseReplay(req.file.buffer);
    const aiData = await generateCoach(matchData);
    
    res.json({
      credits_used: 30,
      credits_remaining: req.user.credits || 0,
      data: {
        match_summary: {
          result: matchData.match_overview.result,
          placement: matchData.match_overview.placement,
          kills: matchData.combat_summary.eliminations.players
        },
        ai_analysis: aiData,
        model: 'gemini-2.0-flash-001',
        generated_at: new Date().toISOString()
      }
    });
  } catch(e) {
    res.status(500).json({ error: true, code: 'AI_GENERATION_FAILED', message: e.message });
  }
});

/**
 * POST /v1/ai/session-coach
 * 50 Credits
 */
router.post('/session-coach', validateFirestoreKey(50), upload.array('replays', 6), async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No replay files provided' });
  try {
    const matches = await Promise.all(req.files.map(f => parseReplay(f.buffer)));
    const aiData = await generateSessionCoach(matches);
    
    res.json({
      credits_used: 50,
      credits_remaining: req.user.credits || 0,
      data: {
        matches_analyzed: matches.length,
        ai_analysis: aiData,
        model: 'gemini-2.0-flash-001'
      }
    });
  } catch(e) {
    res.status(500).json({ error: true, code: 'AI_GENERATION_FAILED', message: e.message });
  }
});

/**
 * POST /v1/ai/weapon-coach
 * 20 Credits
 */
router.post('/weapon-coach', validateFirestoreKey(20), upload.single('replay'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No replay file provided' });
    try {
        const matchData = await parseReplay(req.file.buffer);
        const aiData = await generateWeaponCoach(matchData);
        res.json({
            credits_used: 20,
            credits_remaining: req.user.credits || 0,
            data: aiData
        });
    } catch(e) {
        res.status(500).json({ error: true, message: e.message });
    }
});

/**
 * POST /v1/ai/drop-recommendation
 * 20 Credits
 */
router.post('/drop-recommendation', validateFirestoreKey(20), upload.single('replay'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No replay file provided' });
    try {
        const matchData = await parseReplay(req.file.buffer);
        const aiData = await generateDropRecommendation(matchData);
        res.json({
            credits_used: 20,
            credits_remaining: req.user.credits || 0,
            data: aiData
        });
    } catch(e) {
        res.status(500).json({ error: true, message: e.message });
    }
});

/**
 * POST /v1/ai/opponent-scout
 * 25 Credits
 */
router.post('/opponent-scout', validateFirestoreKey(25), async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name parameter' });
    try {
        const stats = await getPlayerStats(name);
        if (!stats) return res.status(404).json({ error: 'Player stats not found' });
        const aiData = await generateOpponentScout(name, stats);
        res.json({
            credits_used: 25,
            credits_remaining: req.user.credits || 0,
            data: aiData
        });
    } catch(e) {
        res.status(500).json({ error: true, message: e.message });
    }
});

export default router;
