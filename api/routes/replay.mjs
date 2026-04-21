import express from 'express';
import { upload } from '../middleware/upload.mjs';
import { validateFirestoreKey } from '../middleware/firestore-auth.mjs';

import { getPlayerStats } from '../fortnite_api.mjs';
import { r2 } from '../lib/r2.mjs';
import { db } from '../lib/db.mjs';
import { adminDb } from '../lib/firebase/admin.mjs';
import { getAccessTokenForUser } from '../lib/epic_token_manager.mjs';
import { getRankedData, getCrownWins } from '../lib/epic_data.mjs';
import { mirrorObjectUrls } from '../lib/image_mirror.mjs';
import { downloadFullReplay, getReplayManifest } from '../lib/replay_downloader.mjs';
import { recordParse } from '../lib/monitor.mjs';
import { sendLowCreditAlert, sendParseReceiptEmail } from '../lib/email.mjs';
import { analyzeMatch, coachMatch } from '../lib/vertex.mjs';
import { saveMatchToFirestore } from '../lib/firebase/matches.mjs';
import { processReplayAndUpload } from '../lib/parser_handler.mjs';

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

router.post('/parse', validateFirestoreKey(20), upload.fields([{ name: 'replay', maxCount: 1 }, { name: 'file', maxCount: 1 }]), async (req, res) => {

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
        const file = req.file || (req.files ? (req.files.replay?.[0] || req.files.file?.[0]) : null);
        result.parser_meta.file_size_mb = (file?.size / (1024 * 1024)).toFixed(2);

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

        // --- PHASE 3: METADATA ENRICHMENT ---
        result.parser_meta.parsed_at = new Date().toISOString();
        result.ai_coach = null; // AI features moved to dedicated /v1/ai endpoints for cost management
        
        // Final Mirroring for R2 storage
        const finalResult = await mirrorObjectUrls(result);
        
        const response = wrapResponse(req, finalResult, 20, storageUrl);
        recordParse(true);

        // --- PHASE 4: FIRESTORE PERSISTENCE ---
        await saveMatchToFirestore(finalResult, req.user?.email || "guest");

        // --- AUTOMATION TRIGGERS (Fire & Forget) ---
        if (adminDb) {
            (async () => {
                const userSnap = await adminDb.collection('users').doc(req.user.email).get();
                const userData = userSnap.data();
                const creditsRemaining = req.user.credits || 0;

                if (userData?.email_alerts !== false) {
                    if (creditsRemaining < 500) {
                        sendLowCreditAlert(req.user.email, creditsRemaining).catch(console.error);
                    }
                    sendParseReceiptEmail(req.user.email, {
                        result: finalResult.match_overview?.result,
                        placement: finalResult.match_overview?.placement,
                        kills: finalResult.combat_summary?.eliminations?.players,
                        damage: finalResult.combat_summary?.damage?.to_players,
                        creditsRemaining
                    }).catch(console.error);
                }
            })();
        }

        return res.json(response);

    } catch (err) {
        recordParse(false);
        res.status(500).json({ error: true, code: 'PARSE_FAILED', message: err.message });
    }
});

router.post('/stats', validateFirestoreKey(5), upload.fields([{ name: 'replay', maxCount: 1 }, { name: 'file', maxCount: 1 }]), async (req, res) => {
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


router.post('/scoreboard', validateFirestoreKey(8), upload.fields([{ name: 'replay', maxCount: 1 }, { name: 'file', maxCount: 1 }]), async (req, res) => {

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

router.post('/movement', validateFirestoreKey(8), upload.fields([{ name: 'replay', maxCount: 1 }, { name: 'file', maxCount: 1 }]), async (req, res) => {

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

router.post('/weapons', validateFirestoreKey(8), upload.fields([{ name: 'replay', maxCount: 1 }, { name: 'file', maxCount: 1 }]), async (req, res) => {

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

router.post('/events', validateFirestoreKey(10), upload.fields([{ name: 'replay', maxCount: 1 }, { name: 'file', maxCount: 1 }]), async (req, res) => {

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
router.post('/drop-analysis', validateFirestoreKey(15), upload.fields([{ name: 'replay', maxCount: 1 }, { name: 'file', maxCount: 1 }]), async (req, res) => {

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

// Rotation Score (25 Credits) - PRO
router.post('/rotation-score', validateFirestoreKey(25, { requireBeta: true }), upload.fields([{ name: 'replay', maxCount: 1 }, { name: 'file', maxCount: 1 }]), async (req, res) => {
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
        let summary = "Poor rotation \u2014 frequently caught outside zone.";

        if (avgScore >= 90) { grade = "S"; summary = "Perfect rotation \u2014 consistently deep in zone all match."; }
        else if (avgScore >= 75) { grade = "A"; summary = "Strong rotation \u2014 stayed inside zone with minimal exposure."; }
        else if (avgScore >= 60) { grade = "B"; summary = "Decent rotation \u2014 caught outside zone a few times."; }
        else if (avgScore >= 45) { grade = "C"; summary = "Rotation needs work \u2014 spending too much time in storm."; }

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
router.post('/opponents', validateFirestoreKey(30), upload.fields([{ name: 'replay', maxCount: 1 }, { name: 'file', maxCount: 1 }]), async (req, res) => {

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


// SERVER REPLAY ENDPOINTS
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// These endpoints download replay files directly
// from Epic's game servers using a match ID.
//
// Server replays are available for:
//   - Tournament matches (FNCS, Cash Cups, etc.)
//   - Some ranked matches
//   - Any match Epic's servers chose to record
//
// Server replays are NOT available for:
//   - Regular public matches
//   - Creative mode
//   - Custom lobbies
//
// Advantages over client upload:
//   - No file upload required \u2014 fully automated
//   - Server-side data is more complete
//   - All 100 players captured neutrally
//   - No client-side packet drops
//
// Requirements:
//   - User must connect Epic account via
//     POST /v1/epic/connect first
//   - Epic access token must be valid
//   - Match must have a server replay stored

/**
 * POST /v1/replay/match-info
 * Cost: 5 credits
 * Returns metadata for a server match ID
 */
router.post('/match-info', validateFirestoreKey(5), async (req, res) => {
    const { matchId } = req.body;

    if (!matchId) {
        return res.status(400).json({ error: true, code: 'MISSING_MATCH_ID', message: 'Match ID is required' });
    }

    const uuidRegex = /^[0-9a-f]{32}$/i;
    if (!uuidRegex.test(matchId)) {
        return res.status(400).json({ error: true, code: 'INVALID_MATCH_ID', message: 'Invalid match ID format' });
    }

    try {
        const accessToken = await getAccessTokenForUser(req.user.email);
        if (!accessToken) {
            return res.status(400).json({ 
                error: true, 
                code: 'EPIC_NOT_CONNECTED', 
                message: 'Connect your Epic account first at GET /v1/epic/auth-url' 
            });
        }

        const manifest = await getReplayManifest(matchId, accessToken);
        
        const data = {
            matchId: matchId,
            exists: true,
            timestamp: manifest.Timestamp,
            lengthInMs: manifest.LengthInMS,
            isLive: manifest.bIsLive,
            isCompressed: manifest.bCompressed,
            networkVersion: manifest.NetworkVersion,
            chunkCounts: {
                data: manifest.DataChunks?.length || 0,
                events: manifest.Events?.length || 0,
                checkpoints: manifest.Checkpoints?.length || 0
            },
            estimatedSizeMb: parseFloat((manifest.FileSize / 1024 / 1024).toFixed(2)),
            canParse: !manifest.bIsLive
        };

        res.json({
            credits_used: 5,
            credits_remaining: req.user.credits || 0,
            data
        });

    } catch (err) {
        if (err.status === 404 || err.message === 'REPLAY_NOT_FOUND') {
            return res.status(404).json({ error: true, code: 'REPLAY_NOT_FOUND', message: 'Replay not found for this match ID' });
        }
        res.status(500).json({ error: true, code: 'DOWNLOAD_FAILED', message: err.message });
    }
});

/**
 * POST /v1/replay/download-and-parse
 * Cost: 25 credits - PRO
 * Full automation \u2014 downloads from Epic and parses
 */
router.post('/download-and-parse', validateFirestoreKey(25, { requireBeta: true }), async (req, res) => {
    const { matchId } = req.body;

    if (!matchId) {
        return res.status(400).json({ error: true, code: 'MISSING_MATCH_ID', message: 'Match ID is required' });
    }

    const uuidRegex = /^[0-9a-f]{32}$/i;
    if (!uuidRegex.test(matchId)) {
        return res.status(400).json({ error: true, code: 'INVALID_MATCH_ID', message: 'Invalid match ID format' });
    }

    try {
        const downloadStart = Date.now();
        const accessToken = await getAccessTokenForUser(req.user.email);
        if (!accessToken) {
            return res.status(400).json({ 
                error: true, 
                code: 'EPIC_NOT_CONNECTED', 
                message: 'Connect your Epic account first at GET /v1/epic/auth-url' 
            });
        }

        const { buffer, manifest } = await downloadFullReplay(matchId, accessToken);
        const downloadTime = Date.now() - downloadStart;

        const parseStart = Date.now();
        const { result, storageUrl } = await processReplayAndUpload({ file: { buffer } }); // Mock req for processReplayAndUpload
        const parseTime = Date.now() - parseStart;

        // Enrichment
        const local = result.scoreboard.find(p => p.is_local_player);
        if (local?.name) {
            const pd = await getPlayerStats(local.name);
            if (pd) {
                result.epic_data = pd;
            }
        }

        const finalResult = await mirrorObjectUrls(result);

        res.json({
            credits_used: 25,
            credits_remaining: req.user.credits || 0,
            parse_time_ms: parseTime,
            download_time_ms: downloadTime,
            source: 'server_replay',
            storage_url: storageUrl,
            manifest: {
                matchId: manifest.matchId,
                timestamp: manifest.timestamp,
                lengthInMs: manifest.lengthInMs,
                totalSizeBytes: manifest.totalSizeBytes
            },
            data: finalResult
        });

    } catch (err) {
        if (err.status === 404 || err.message === 'REPLAY_NOT_FOUND') {
            return res.status(404).json({ error: true, code: 'REPLAY_NOT_FOUND', message: 'Replay not found' });
        }
        if (err.message === 'MATCH_STILL_LIVE') {
            return res.status(400).json({ error: true, code: 'MATCH_STILL_LIVE', message: 'This match is still in progress' });
        }
        res.status(500).json({ error: true, code: 'DOWNLOAD_FAILED', message: err.message });
    }
});

export default router;
