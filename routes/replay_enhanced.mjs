import express from 'express';
import { upload } from '../middleware/upload.mjs';
import { validateFirestoreKey } from '../middleware/firestore-auth.mjs';
import { parseReplay } from '../core_parser.mjs';

const router = express.Router();

/**
 * Enhanced Replay Utilities
 */

router.post('/heatmap', validateFirestoreKey(15, { requireBeta: true }), upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No replay file provided' });
    try {
        const result = await parseReplay(req.file.buffer);
        const positions = result.all_tracks || [];
        
        // Generate a 64x64 density grid for the Fortnite map coordinates (-131072 to 131072)
        const gridSize = 64;
        const grid = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
        
        positions.forEach(p => {
            const x = Math.floor(((p.x + 131072) / 262144) * gridSize);
            const y = Math.floor(((p.y + 131072) / 262144) * gridSize);
            if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
                grid[y][x]++;
            }
        });

        res.json({
            status: 200,
            credits_used: 15,
            data: { grid, gridSize, world_min: -131072, world_max: 131072 }
        });
    } catch(err) {
        res.status(500).json({ error: 'Heatmap generation failed' });
    }
});

router.post('/timeline', validateFirestoreKey(10, { requireBeta: true }), upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No replay file provided' });
    try {
        const result = await parseReplay(req.file.buffer);
        
        // Merge kills, storm phases, and movements into a single feed
        const timeline = [];
        
        // Storm
        (result.match_overview?.storm_phases || []).forEach(s => {
            timeline.push({ type: 'storm', time: s.start_time, event: `Storm Phase ${s.phase_index} started` });
        });
        
        // Kills
        (result.combat_summary?.eliminations?.detailed || []).forEach(k => {
            timeline.push({ type: 'kill', time: k.timestamp, event: `Eliminated ${k.victim_name} with ${k.weapon}` });
        });
        
        // Sort by time
        timeline.sort((a, b) => a.time - b.time);

        res.json({ status: 200, credits_used: 10, data: timeline });
    } catch(err) {
        res.status(500).json({ error: 'Timeline generation failed' });
    }
});

router.post('/compare', validateFirestoreKey(25, { requireBeta: true }), upload.array('files', 2), async (req, res) => {
    if (!req.files || req.files.length < 2) return res.status(400).json({ error: 'Please provide TWO replay files' });
    try {
        const [r1, r2] = await Promise.all(req.files.map(f => parseReplay(f.buffer)));
        
        const comparison = {
            player_1: { name: r1.match_overview?.player_name, kills: r1.combat_summary?.eliminations?.players, placement: r1.match_overview?.placement },
            player_2: { name: r2.match_overview?.player_name, kills: r2.combat_summary?.eliminations?.players, placement: r2.match_overview?.placement },
            diff: {
                kills: (r1.combat_summary?.eliminations?.players || 0) - (r2.combat_summary?.eliminations?.players || 0),
                placement: (r1.match_overview?.placement || 0) - (r2.match_overview?.placement || 0)
            }
        };

        res.json({ status: 200, credits_used: 25, data: comparison });
    } catch(err) {
        res.status(500).json({ error: 'Comparison failed' });
    }
});

router.post('/clutch-moments', validateFirestoreKey(20, { requireBeta: true }), upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No replay file provided' });
    try {
        const result = await parseReplay(req.file.buffer);
        
        // Simple logic: Kill at < 50 HP or Kill against high level player
        const clutch = (result.combat_summary?.eliminations?.detailed || []).filter(k => k.player_hp < 50);

        res.json({
            status: 200,
            credits_used: 20,
            data: { moments_count: clutch.length, moments: clutch }
        });
    } catch (err) {
        res.status(500).json({ error: 'Clutch detection failed' });
    }
});

export default router;
