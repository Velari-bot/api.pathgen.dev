import express from 'express';
import { fortniteLib } from '../fortnite_api.mjs';
import { getTile } from '../lib/tile_gen.mjs';
import { validateFirestoreKey, deductCredits } from '../middleware/firestore-auth.mjs';
import { cache } from '../lib/cache.mjs';

const router = express.Router();

router.get('/cosmetics', async (req, res) => {
    try {
        const data = await fortniteLib.getBRCosmetics();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Could not fetch cosmetics' });
    }
});

router.get('/cosmetics/new', async (req, res) => {
    try {
        const data = await fortniteLib.getNewCosmetics();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Could not fetch new cosmetics' });
    }
});

router.get('/cosmetics/:id', async (req, res) => {
    try {
        const data = await fortniteLib.getCosmeticById(req.params.id);
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Could not fetch cosmetic detail' });
    }
});

router.get('/shop', async (req, res) => {
    try {
        const data = await fortniteLib.getShop();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Could not fetch shop' });
    }
});

router.get('/weapons', async (req, res) => {
    res.json({ status: 200, data: { pool: ['Assault Rifle', 'Shotgun', 'Sniper', 'Pistol', 'SMG'] } });
});

router.get('/map', validateFirestoreKey(0), async (req, res) => {
    try {
        const mapData = await fortniteLib.getMap();
        const mapHash = mapData.hash || 'v1';
        
        // --- TURBO EDGE: Pre-unlock the Map Pass on first config fetch ---
        const passKey = `map_pass:${req.user.email}:${mapHash}`;
        const hasPass = await cache.get(passKey);
        
        if (!hasPass) {
            console.log(`[Billing] Proactive 30-credit Map Pass for ${req.user.email}`);
            try {
                await deductCredits(req.user.email, 30, 'MAP_UNLOCKED_TURBO', `/v1/game/map (Proactive)`);
                await cache.set(passKey, 'active', 86400); // 24 hours
            } catch (billingErr) {
                if (billingErr.message === 'Insufficient Balance') {
                    return res.status(402).json({ error: true, code: 'INSUFFICIENT_CREDITS', message: 'Insufficient Credits ($0.30) to unlock this world.' });
                }
                throw billingErr;
            }
        }

        const MAP_CONFIG = {
            season: 'Chapter 7 Season 2',
            // --- NEW: Direct CDN Tile URL for Osirion-level performance (Bypass API server) ---
            tile_url: `${process.env.R2_PUBLIC_URL || 'https://assets.pathgen.dev'}/tiles/${mapHash}/{z}/{x}/{y}.png`,
            
            // --- Fallback: Proxied URL for Explorer/Tools ---
            proxied_tile_url: `${req.protocol}://${req.get('host')}/v1/game/tiles/{z}/{x}/{y}.png?key=${req.query.key || 'your_api_key'}`,
            
            max_zoom: 5,
            min_zoom: 0,
            tile_size: 256,
            world_bounds: { min_x: -131072, max_x: 131072, min_y: -131072, max_y: 131072 },
            pois: (mapData.pois || []).map(p => ({
                id: p.id,
                name: p.name,
                x: p.location?.x || 0,
                y: p.location?.y || 0
            }))
        };

        res.json({ status: 200, ...MAP_CONFIG });
    } catch(err) {
        console.error('[Map Sync Error]', err.message);
        res.status(500).json({ status: 500, error: 'Could not fetch map config' });
    }
});

/**
 * High-performance Tile Redirect
 * Model: One-Time Map Pass (30 Credits for 24h Unlimited)
 */
router.get('/tiles/:z/:x/:y', validateFirestoreKey(0), async (req, res) => {
    // Correctly handle the .png suffix if provided by Leaflet
    const z = parseInt(req.params.z);
    const x = parseInt(req.params.x);
    const y = parseInt(req.params.y.replace('.png', ''));
    
    if (isNaN(z) || isNaN(x) || isNaN(y)) {
        return res.status(400).json({ error: 'Invalid tile coordinates. Must be integers.' });
    }
    
    try {
        const mapData = await fortniteLib.getMap();
        const mapUrl = mapData.images?.blank || 'https://fortnite-api.com/images/map.png';
        const mapHash = mapData.hash || 'v1';
        
        const passKey = `map_pass:${req.user.email}:${mapHash}`;
        const hasPass = await cache.get(passKey);
        
        if (!hasPass) {
            console.log(`[Billing] Triggering 30-credit Map Pass for ${req.user.email}`);
            try {
                await deductCredits(req.user.email, 30, 'MAP_UNLOCKED', `/v1/game/tiles (New Day Pass)`);
                await cache.set(passKey, 'active', 86400); // 24 hours
            } catch (billingErr) {
                if (billingErr.message === 'Insufficient Balance') {
                    return res.status(402).json({ error: true, code: 'INSUFFICIENT_CREDITS', message: 'Please recharge to unlock the 24h Map Pass (30 Credits).' });
                }
                throw billingErr;
            }
        }

        const tileInfo = await getTile(z, x, y, mapUrl);
        
        if (tileInfo.error) {
            return res.status(202).json(tileInfo);
        }

        // --- NEW: Smart Format Detection (Enhanced) ---
        // 1. Explicitly requested ?json=true
        // 2. Accept header includes application/json
        // 3. Request is coming from the Platform API Explorer (CORS/AJAX)
        const origin = req.headers.origin || '';
        const referer = req.headers.referer || '';
        const isExplorer = origin.includes('pathgen.dev') || referer.includes('pathgen.dev/explorer');
        
        const wantsJson = req.query.json === 'true' || 
                         (req.headers.accept && req.headers.accept.includes('application/json')) ||
                         isExplorer;
        
        if (wantsJson) {
            return res.json({
                status: 200,
                data: {
                    z: z, x: x, y: y,
                    mimeType: 'image/png',
                    url: `${req.protocol}://${req.get('host')}${req.path}?key=${req.query.key || '...'}`,
                    description: 'High-fidelity map tile (Lanczos3 resampled)'
                }
            });
        }

        const imgRes = await fetch(tileInfo.url);
        if (!imgRes.ok) throw new Error('Failed to fetch tile from R2');

        const buffer = Buffer.from(await imgRes.arrayBuffer());
        res.set({
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=2592000, immutable',
            'Access-Control-Allow-Origin': '*',
            'CDN-Cache-Control': 'max-age=2592000'
        });
        res.send(buffer);
    } catch (err) {
        console.error('[Tile Request Error]', err.message);
        res.status(500).json({ error: 'Failed to build tile path' });
    }
});

router.get('/news', async (req, res) => {
    try {
        const data = await fortniteLib.getNews();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Could not fetch news' });
    }
});

router.get('/playlists', async (req, res) => {
    try {
        const data = await fortniteLib.getPlaylists();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Could not fetch playlists' });
    }
});

export default router;
