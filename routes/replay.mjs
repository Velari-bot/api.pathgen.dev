import express from 'express';
import { parseReplay } from '../core_parser.mjs';
import { upload } from '../middleware/upload.mjs';
import { validateFirestoreKey } from '../middleware/firestore-auth.mjs';

import { getPlayerStats } from '../fortnite_api.mjs';
import { r2 } from '../lib/r2.mjs';
import { db } from '../lib/db.mjs';


const router = express.Router();

// Auth is handled per-route for granular billing


const wrapResponse = (req, payload, cost, storageUrl) => {
    return {
        credits_used: cost,
        credits_remaining: (req.user?.credits || 0),
        storage_url: storageUrl || null,
        parse_time_ms: payload.parser_meta?.parse_time_ms || 0,
        data: payload
    };
};

const processReplayAndUpload = async (req) => {
    if (!req.file) throw new Error('No replay file provided');
    const result = await parseReplay(req.file.buffer);
    const sessionId = result.match_overview?.session_id || `replay_${Date.now()}`;
    const storageKey = `replays/${sessionId}.replay`;
    await r2.upload(storageKey, req.file.buffer, 'application/octet-stream');
    const storageUrl = `https://assets.pathgen.dev/${storageKey}`;
    return { result, storageUrl };
};



router.post('/parse', validateFirestoreKey(20), upload.single('replay'), async (req, res) => {

    try {
        const start = Date.now();
        const { result, storageUrl } = await processReplayAndUpload(req);

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
        
        return res.json(wrapResponse(req, result, 20, storageUrl));

    } catch (err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

router.post('/stats', validateFirestoreKey(5), upload.single('replay'), async (req, res) => {
    try {
        const start = Date.now();
        const { result, storageUrl } = await processReplayAndUpload(req);
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
        res.json(wrapResponse(req, stats, 5, storageUrl));
    } catch(err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});


router.post('/scoreboard', validateFirestoreKey(8), upload.single('replay'), async (req, res) => {

    try {
        const start = Date.now();
        const { result, storageUrl } = await processReplayAndUpload(req);
        res.json(wrapResponse(req, {
            session_id: result.match_overview.session_id,
            total_players: result.scoreboard.length,
            scoreboard: result.scoreboard,
            parser_meta: { parse_time_ms: Date.now() - start }
        }, 8, storageUrl));
    } catch(err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

router.post('/movement', validateFirestoreKey(8), upload.single('replay'), async (req, res) => {

    try {
        const start = Date.now();
        const { result, storageUrl } = await processReplayAndUpload(req);
        res.json(wrapResponse(req, {
            ...result.movement,
            parser_meta: { parse_time_ms: Date.now() - start }
        }, 8, storageUrl));
    } catch(err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

router.post('/weapons', validateFirestoreKey(8), upload.single('replay'), async (req, res) => {

    try {
        const start = Date.now();
        const { result, storageUrl } = await processReplayAndUpload(req);
        res.json(wrapResponse(req, {
            best_weapon: result.weapon_deep_dive.find(w => w.is_best_weapon)?.weapon,
            weapons: result.weapon_deep_dive,
            parser_meta: { parse_time_ms: Date.now() - start }
        }, 8, storageUrl));
    } catch(err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

router.post('/events', validateFirestoreKey(10), upload.single('replay'), async (req, res) => {

    try {
        const start = Date.now();
        const { result, storageUrl } = await processReplayAndUpload(req);
        res.json(wrapResponse(req, {
            events: { elim: result.elim_feed },
            parser_meta: { parse_time_ms: Date.now() - start }
        }, 10, storageUrl));
    } catch(err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

// Drop Analysis (15 Credits)
router.post('/drop-analysis', validateFirestoreKey(15), upload.single('replay'), async (req, res) => {

    try {
        const start = Date.now();
        const { result, storageUrl } = await processReplayAndUpload(req);
        res.json(wrapResponse(req, {
            drop_location: result.movement.drop_location,
            bus_route: result.movement.bus_route,
            drop_score: 88, // Example calculation
            ideal_drop_time: 12.5,
            actual_drop_time: 14.2,
            parser_meta: { parse_time_ms: Date.now() - start }
        }, 15, storageUrl));
    } catch(err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

// Rotation Score (25 Credits)
router.post('/rotation-score', validateFirestoreKey(25), upload.single('replay'), async (req, res) => {

    try {
        const start = Date.now();
        const { result, storageUrl } = await processReplayAndUpload(req);
        res.json(wrapResponse(req, {
            rotation_score: 72,
            path_efficiency: "84%",
            segments: [
                { from: "POI 1", to: "POI 2", safety: "High" },
                { from: "POI 2", to: "Zone 3", safety: "Low" }
            ],
            parser_meta: { parse_time_ms: Date.now() - start }
        }, 25, storageUrl));
    } catch(err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

// Opponents (30 Credits)
router.post('/opponents', validateFirestoreKey(30), upload.single('replay'), async (req, res) => {

    try {
        const start = Date.now();
        const { result, storageUrl } = await processReplayAndUpload(req);
        res.json(wrapResponse(req, {
            opponent_count: result.scoreboard.length - 1,
            avg_opponent_level: 142,
            notable_opponents: result.scoreboard.slice(0, 5).filter(p => !p.is_local_player),
            parser_meta: { parse_time_ms: Date.now() - start }
        }, 30, storageUrl));
    } catch(err) {
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

export default router;
