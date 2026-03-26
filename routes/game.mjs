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

router.get('/map', async (req, res) => {
    try {
        const data = await fortniteLib.getMap();
        
        // Add Coordinate conversion helper constants for Leaflet
        const MAP_HELPERS = {
            WORLD_MIN: -131072,
            WORLD_SIZE: 262144,
            MAX_ZOOM: 5,
            MAP_PX: 256 * Math.pow(2, 5), // 8192px
            LEAFLET_CRS: 'CRS.Simple',
            CONVERSION_JS: `
                function worldToLatLng(worldX, worldY) {
                    const pctX = (worldX - WORLD_MIN) / WORLD_SIZE;
                    const pctY = (worldY - WORLD_MIN) / WORLD_SIZE;
                    return L.CRS.Simple.pointToLatLng(L.point(pctX * 8192, pctY * 8192), 5);
                }
            `
        };

        res.json({ status: 200, data, helpers: MAP_HELPERS });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Could not fetch map' });
    }
});

/**
 * High-performance Tile Redirect
 * Model: One-Time Map Pass (30 Credits for 24h Unlimited)
 */
router.get('/tiles/:z/:x/:y', validateFirestoreKey(0), async (req, res) => {
    const z = parseInt(req.params.z);
    const x = parseInt(req.params.x);
    const y = parseInt(req.params.y);
    
    if (isNaN(z) || isNaN(x) || isNaN(y)) {
        return res.status(400).json({ error: 'Invalid tile coordinates. Must be integers.' });
    }
    
    try {
        const mapData = await fortniteLib.getMap();
        const mapUrl = mapData.images?.blank || 'https://fortnite-api.com/images/map.png';
        const mapHash = mapData.hash || 'v1'; // fallback
        
        // 1. Check if user already has a 24h pass for this map
        const passKey = `map_pass:${req.user.email}:${mapHash}`;
        const hasPass = await cache.get(passKey);
        
        if (!hasPass) {
            console.log(`[Billing] Triggering 30-credit Map Pass for ${req.user.email}`);
            
            try {
                // Charge for the full 24h map pass
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

        // --- NEW: Smart Format Detection (Automated) ---
        // If the requester explicitly asks for JSON (like the API Explorer), we give them a metadata object.
        // Otherwise, we serve the raw binary PROXY of the tile.
        const wantsJson = req.query.json === 'true' || (req.headers.accept && req.headers.accept.includes('application/json'));
        
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
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
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
