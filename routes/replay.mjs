import express from 'express';
import { parseReplay } from '../core_parser.mjs';
import { upload } from '../middleware/upload.mjs';
import { validateFirestoreKey } from '../middleware/firestore-auth.mjs';

import { getPlayerStats } from '../fortnite_api.mjs';
import { r2 } from '../lib/r2.mjs';
import { db } from '../lib/db.mjs';
import { getAccessTokenForUser } from '../lib/epic_token_manager.mjs';
import { getRankedData, getCrownWins } from '../lib/epic_data.mjs';
import { mirrorObjectUrls } from '../lib/image_mirror.mjs';


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

        // --- PHASE 2: EPIC DATA INJECTION ---
        // Fetch private Epic profile data if the user has connected their account
        const epicToken = await getAccessTokenForUser(req.user.email);
        if (epicToken && result.epic_data?.account_id) {
            try {
                const [ranked, crowns] = await Promise.all([
                    getRankedData(result.epic_data.account_id, epicToken),
                    getCrownWins(result.epic_data.account_id, epicToken)
                ]);
                result.epic_data.ranked = ranked;
                result.epic_data.crown_wins = crowns?.crown_wins || 0;
            } catch (err) {
                console.warn('[Phase2] Data enrichment failed:', err.message);
            }
        }
        
        // Final Mirroring for R2 storage
        const finalResult = await mirrorObjectUrls(result);
        
        return res.json(wrapResponse(req, finalResult, 20, storageUrl));

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
        
        const track = result.movement.player_track || [];
        const stormPhases = result.storm || [];
        
        if (track.length === 0 || stormPhases.length === 0) {
            return res.json(wrapResponse(req, {
                session_id: result.match_overview.session_id,
                rotation_score: 0,
                grade: "D",
                summary: "Insufficient data to calculate rotation."
            }, 25, storageUrl));
        }

        const perPhase = [];
        let totalScore = 0;
        let timeOutsideMs = 0;

        for (const phase of stormPhases) {
            // Find closest track point to phase.timestamp_ms
            const pt = track.reduce((prev, curr) => 
                Math.abs(curr.timestamp_ms - phase.timestamp_ms) < Math.abs(prev.timestamp_ms - phase.timestamp_ms) ? curr : prev
            );

            const dx = pt.x - phase.center_x;
            const dy = pt.y - phase.center_y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const inside = dist < phase.radius_cm;
            const centerPct = Math.max(0, 1 - (dist / phase.radius_cm));

            let phaseScore = 0;
            let timing = "outside";

            if (inside) {
                if (centerPct > 0.5) { phaseScore = 100; timing = "deep_zone"; }
                else if (centerPct > 0.25) { phaseScore = 80; timing = "safe"; }
                else { phaseScore = 60; timing = "edge"; }
            } else {
                if (dist < phase.radius_cm * 1.1) { phaseScore = 30; timing = "late"; }
                else { phaseScore = 0; timing = "outside"; }
            }

            totalScore += phaseScore;
            perPhase.push({
                phase: phase.phase,
                position_at_close: { x: pt.x, y: pt.y },
                distance_to_center_cm: Math.round(dist),
                was_inside_zone: inside,
                rotation_timing: timing
            });
        }

        // Calculate time outside zone
        for (let i = 1; i < track.length; i++) {
            const pt = track[i];
            const prev = track[i-1];
            // Find active storm phase at this moment
            const activePhase = [...stormPhases].reverse().find(p => pt.timestamp_ms >= p.timestamp_ms) || stormPhases[0];
            
            const dist = Math.sqrt((pt.x - activePhase.center_x)**2 + (pt.y - activePhase.center_y)**2);
            if (dist > activePhase.radius_cm) {
                timeOutsideMs += (pt.timestamp_ms - prev.timestamp_ms);
            }
        }

        const avgScore = Math.round(totalScore / stormPhases.length);
        let grade = "D";
        let summary = "Poor rotation — frequently caught outside zone.";

        if (avgScore >= 90) { grade = "S"; summary = "Perfect rotation — consistently deep in zone all match."; }
        else if (avgScore >= 75) { grade = "A"; summary = "Strong rotation — stayed inside zone with minimal exposure."; }
        else if (avgScore >= 60) { grade = "B"; summary = "Decent rotation — caught outside zone a few times."; }
        else if (avgScore >= 45) { grade = "C"; summary = "Rotation needs work — spending too much time in storm."; }

        res.json(wrapResponse(req, {
            session_id: result.match_overview.session_id,
            rotation_score: avgScore,
            grade,
            time_outside_zone_ms: timeOutsideMs,
            time_outside_zone_formatted: `${Math.floor(timeOutsideMs/60000)}m ${Math.floor((timeOutsideMs%60000)/1000)}s`,
            zone_entries: perPhase.filter(p => p.was_inside_zone).length,
            per_phase: perPhase,
            summary,
            parser_meta: { parse_time_ms: Date.now() - start }
        }, 25, storageUrl));

    } catch(err) {
        console.error(err);
        res.status(500).json({ error: true, code: 'ROTATION_CALC_FAILED', message: err.message });
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
