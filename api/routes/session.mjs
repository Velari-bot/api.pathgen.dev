import express from 'express';
import { parseReplay } from '../core_parser.mjs';
import { upload } from '../middleware/upload.mjs';
import { r2 } from '../lib/r2.mjs';

import { validateFirestoreKey } from '../middleware/firestore-auth.mjs';
import { getAccessTokenForUser } from '../lib/epic_token_manager.mjs';
import { downloadFullReplay } from '../lib/replay_downloader.mjs';


const router = express.Router();

// Auth handled per route


const wrapResponse = (req, payload, cost, storageUrl) => {
    return {
        credits_used: cost,
        credits_remaining: (req.user?.credits || 0),
        storage_url: storageUrl || null,
        parse_time_ms: payload.parser_meta?.parse_time_ms || 0,
        data: payload
    };
};

router.post('/analyze', validateFirestoreKey(50), upload.single('session'), async (req, res) => {

    if (!req.file) return res.status(400).json({ error: 'No session file' });

    try {
        const start = Date.now();
        const result = await parseReplay(req.file.buffer);
        
        const sessionId = "sess_" + Math.random().toString(36).substr(2, 9);
        const storageKey = `sessions/${sessionId}.replay`;
        await r2.upload(storageKey, req.file.buffer, 'application/octet-stream');
        const storageUrl = `https://assets.pathgen.dev/${storageKey}`;

        const payload = {
            session_id: sessionId,
            summary: {
                matches_processed: 1,
                total_elims: result.combat_summary.eliminations.total,
                average_placement: result.match_overview.placement
            },
            parser_meta: { parse_time_ms: Date.now() - start }
        };

        res.json(wrapResponse(req, payload, 50, storageUrl));
    } catch(err) {
        console.error('Session analysis failed:', err);
        res.status(500).json({ error: 'Session analysis failed' });
    }
});


/**
 * POST /v1/session/auto-analyze
 * Cost: 75 credits
 * Automatically find, download, and analyze tournament matches
 */
router.post('/auto-analyze', validateFirestoreKey(75), async (req, res) => {
    const { accountId, eventId } = req.body;

    if (!accountId || !eventId) {
        return res.status(400).json({ error: true, code: 'MISSING_PARAMS', message: 'accountId and eventId are required' });
    }

    try {
        const accessToken = await getAccessTokenForUser(req.user.email);
        if (!accessToken) {
            return res.status(400).json({ 
                error: true, 
                code: 'EPIC_NOT_CONNECTED', 
                message: 'Connect your Epic account first' 
            });
        }

        // 1. Fetch match history for this event
        console.log(`[AutoAnalyze] Fetching history for ${accountId} in ${eventId}`);
        const historyUrl = `https://events-public-service-live.ol.epicgames.com/api/v1/events/Fortnite/${eventId}/history/${accountId}`;
        const historyRes = await fetch(historyUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!historyRes.ok) {
            throw new Error(`Failed to fetch event history: ${historyRes.status}`);
        }

        const history = await historyRes.json();
        // The history object contains "matches" which is an array of match summaries
        const matchIds = (history.matches || [])
            .map(m => m.matchId)
            .filter(id => !!id)
            .slice(0, 6);

        if (matchIds.length === 0) {
            return res.status(404).json({ 
                error: true, 
                code: 'NO_MATCHES_FOUND', 
                message: 'No server replays found for this event.' 
            });
        }

        console.log(`[AutoAnalyze] Found ${matchIds.length} matches. Starting download/parse...`);

        const results = [];
        let totalPlacementPoints = 0;
        let totalElims = 0;

        for (const matchId of matchIds) {
            try {
                const { buffer } = await downloadFullReplay(matchId, accessToken);
                const parseResult = await parseReplay(buffer);
                results.push({
                    match_id: matchId,
                    placement: parseResult.match_overview.placement,
                    elims: parseResult.combat_summary.eliminations.total,
                    timestamp: parseResult.match_overview.timestamp
                });
                totalPlacementPoints += (100 - parseResult.match_overview.placement); // Simple placeholder score
                totalElims += parseResult.combat_summary.eliminations.total;
            } catch (err) {
                console.warn(`[AutoAnalyze] Skipping match ${matchId} due to error:`, err.message);
            }
        }

        if (results.length === 0) {
            return res.status(500).json({ error: true, code: 'PROCESSING_FAILED', message: 'Failed to process any matches' });
        }

        const avgPlacement = results.reduce((s, r) => s + r.placement, 0) / results.length;
        
        const payload = {
            event_id: eventId,
            account_id: accountId,
            matches_found: matchIds.length,
            matches_parsed: results.length,
            source: 'server_replays',
            session_score: Math.round((totalPlacementPoints + (totalElims * 2)) / results.length),
            total_placement_points: totalPlacementPoints,
            total_elims: totalElims,
            avg_placement: parseFloat(avgPlacement.toFixed(1)),
            consistency_rating: avgPlacement < 10 ? 'High' : (avgPlacement < 25 ? 'Medium' : 'Low'),
            matches: results,
            trends: {
                placement_trend: results.map(r => r.placement),
                elim_trend: results.map(r => r.elims)
            }
        };

        res.json({
            credits_used: 75,
            credits_remaining: req.user.credits || 0,
            data: payload
        });

    } catch (err) {
        console.error('[AutoAnalyze] Error:', err);
        res.status(500).json({ error: true, code: 'INTERNAL_ERROR', message: err.message });
    }
});

export default router;
