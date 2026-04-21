import express from 'express';
import { upload } from '../middleware/upload.mjs';
import { validateFirestoreKey } from '../middleware/firestore-auth.mjs';
import { parseReplay } from '../core_parser.mjs';
import { analyzeMatch } from '../lib/vertex.mjs'; // Assuming this exists or should exist for Pro
import { r2 } from '../lib/r2.mjs';

const router = express.Router();

/**
 * TIERED REPLAY PARSERS
 */

// 1. FREE / BUDGET PARSER (1 Credit)
// Returns just the essentials. Fast and cheap.
router.post('/free', validateFirestoreKey(1), upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No replay file provided' });
    
    try {
        const result = await parseReplay(req.file.buffer);
        
        const budgetData = {
            match_overview: result.match_overview,
            summary: {
                kills: result.combat_summary?.eliminations?.players || 0,
                placement: result.match_overview?.placement || 0,
                match_date: result.match_overview?.match_date
            },
            status: "success",
            tier: "free"
        };

        res.json({
            credits_used: 1,
            credits_remaining: req.user?.credits || 0,
            data: budgetData
        });
    } catch (err) {
        res.status(500).json({ error: 'Free parse failed', message: err.message });
    }
});

// 2. MID-TIER PARSER (15 Credits)
// Returns full gameplay stats, including weapons and builds.
router.post('/mid', validateFirestoreKey(15), upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No replay file provided' });
    
    try {
        const result = await parseReplay(req.file.buffer);
        
        const midData = {
            match_overview: result.match_overview,
            combat: result.combat_summary,
            weapons: result.weapon_deep_dive,
            building: result.building_and_utility,
            tier: "mid"
        };

        res.json({
            credits_used: 15,
            credits_remaining: req.user?.credits || 0,
            data: midData
        });
    } catch (err) {
        res.status(500).json({ error: 'Mid-tier parse failed', message: err.message });
    }
});

// 3. PRO PARSER (50 Credits)
// The Commercial Grade Parser. 
// Includes AI Coaching, Heatmaps, and full event feeds.
router.post('/pro', validateFirestoreKey(50), upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No replay file provided' });
    
    try {
        const start = Date.now();
        const result = await parseReplay(req.file.buffer);
        
        // --- PRO EXCLUSIVES ---
        
        // 1. Heatmap Generation
        const gridSize = 64;
        const grid = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
        (result.movement?.player_track || []).forEach(p => {
            const x = Math.floor(((p.x + 131072) / 262144) * gridSize);
            const y = Math.floor(((p.y + 131072) / 262144) * gridSize);
            if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) grid[y][x]++;
        });

        // 2. AI Analytics (Call vertex/AI model)
        let aiCoaching = "AI analysis processing...";
        try {
            aiCoaching = await analyzeMatch(result);
        } catch (aiErr) {
            console.warn("AI Coaching failed, falling back to heuristic summary");
            aiCoaching = "Heuristic: Focus on better zone rotations.";
        }

        const proData = {
            ...result, // Full raw data
            analytics: {
                ai_coach: aiCoaching,
                heatmap: { grid, gridSize },
                rotation_grade: result.match_overview?.placement < 10 ? "A" : "C",
                parse_time_ms: Date.now() - start
            },
            tier: "pro"
        };

        res.json({
            credits_used: 50,
            credits_remaining: req.user?.credits || 0,
            data: proData
        });
    } catch (err) {
        res.status(500).json({ error: 'Pro parse failed', message: err.message });
    }
});

export default router;
