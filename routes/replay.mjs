import express from 'express';
import { parseReplay } from '../core_parser.mjs';
import { upload } from '../middleware/upload.mjs';
import { validateApiKey } from '../middleware/auth.mjs';
import { getPlayerStats } from '../fortnite_api.mjs';
import { db } from '../lib/db.mjs';

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

router.post('/parse', upload.single('replay'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: true, code: 'NO_FILE', message: 'No replay file provided' });

    try {
        const start = Date.now();
        const result = await parseReplay(req.file.buffer);

        // Enrichment
        const local = result.scoreboard.find(p => p.is_local_player);
        if (local?.name) {
            const pd = await getPlayerStats(local.name);
            if (pd) {
                result.epic_data = pd;
                local.platform = pd.platform;
                local.level = pd.level;
            }
        }
        
        result.parser_meta.parse_time_ms = Date.now() - start;
        result.parser_meta.file_size_mb = (req.file.size / (1024 * 1024)).toFixed(2);
        
        return res.json(wrapResponse(req, result, 20));
    } catch (err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

router.post('/stats', upload.single('replay'), async (req, res) => {
    try {
        const start = Date.now();
        const result = await parseReplay(req.file.buffer);
        const stats = {
            ...result.match_overview,
            ...result.combat_summary,
            kills: result.combat_summary.eliminations.players,
            total_elims: result.combat_summary.eliminations.total,
            accuracy: result.combat_summary.accuracy_general.overall_percentage,
            wood: result.building_and_utility.materials_gathered.wood,
            stone: result.building_and_utility.materials_gathered.stone,
            metal: result.building_and_utility.materials_gathered.metal,
            builds_placed: result.building_and_utility.mechanics.builds_placed,
            parser_meta: { parse_time_ms: Date.now() - start }
        };
        res.json(wrapResponse(req, stats, 5));
    } catch(err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

router.post('/scoreboard', upload.single('replay'), async (req, res) => {
    try {
        const start = Date.now();
        const result = await parseReplay(req.file.buffer);
        res.json(wrapResponse(req, {
            session_id: result.match_overview.session_id,
            total_players: result.scoreboard.length,
            scoreboard: result.scoreboard,
            parser_meta: { parse_time_ms: Date.now() - start }
        }, 8));
    } catch(err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

router.post('/movement', upload.single('replay'), async (req, res) => {
    try {
        const start = Date.now();
        const result = await parseReplay(req.file.buffer);
        res.json(wrapResponse(req, {
            ...result.movement,
            parser_meta: { parse_time_ms: Date.now() - start }
        }, 8));
    } catch(err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

router.post('/weapons', upload.single('replay'), async (req, res) => {
    try {
        const start = Date.now();
        const result = await parseReplay(req.file.buffer);
        res.json(wrapResponse(req, {
            best_weapon: result.weapon_deep_dive.find(w => w.is_best_weapon)?.weapon,
            weapons: result.weapon_deep_dive,
            parser_meta: { parse_time_ms: Date.now() - start }
        }, 8));
    } catch(err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

router.post('/events', upload.single('replay'), async (req, res) => {
    try {
        const start = Date.now();
        const result = await parseReplay(req.file.buffer);
        res.json(wrapResponse(req, {
            events: { elim: result.elim_feed },
            parser_meta: { parse_time_ms: Date.now() - start }
        }, 10));
    } catch(err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

// Drop Analysis (15 Credits)
router.post('/drop-analysis', upload.single('replay'), async (req, res) => {
    try {
        const start = Date.now();
        const result = await parseReplay(req.file.buffer);
        res.json(wrapResponse(req, {
            drop_location: result.movement.drop_location,
            bus_route: result.movement.bus_route,
            drop_score: 88, // Example calculation
            ideal_drop_time: 12.5,
            actual_drop_time: 14.2,
            parser_meta: { parse_time_ms: Date.now() - start }
        }, 15));
    } catch(err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

// Rotation Score (25 Credits)
router.post('/rotation-score', upload.single('replay'), async (req, res) => {
    try {
        const start = Date.now();
        const result = await parseReplay(req.file.buffer);
        res.json(wrapResponse(req, {
            rotation_score: 72,
            path_efficiency: "84%",
            segments: [
                { from: "POI 1", to: "POI 2", safety: "High" },
                { from: "POI 2", to: "Zone 3", safety: "Low" }
            ],
            parser_meta: { parse_time_ms: Date.now() - start }
        }, 25));
    } catch(err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

// Opponents (30 Credits)
router.post('/opponents', upload.single('replay'), async (req, res) => {
    try {
        const start = Date.now();
        const result = await parseReplay(req.file.buffer);
        res.json(wrapResponse(req, {
            opponent_count: result.scoreboard.length - 1,
            avg_opponent_level: 142,
            notable_opponents: result.scoreboard.slice(0, 5).filter(p => !p.is_local_player),
            parser_meta: { parse_time_ms: Date.now() - start }
        }, 30));
    } catch(err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

export default router;
