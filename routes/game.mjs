import express from 'express';
import { fortniteLib } from '../fortnite_api.mjs';
import { getTile } from '../lib/tile_gen.mjs';
import { validateFirestoreKey } from '../middleware/firestore-auth.mjs';

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
 * Cost: 3 credits per tile
 */
router.get('/tiles/:z/:x/:y', validateFirestoreKey(3), async (req, res) => {
    const z = parseInt(req.params.z);
    const x = parseInt(req.params.x);
    const y = parseInt(req.params.y);
    
    if (isNaN(z) || isNaN(x) || isNaN(y)) {
        return res.status(400).json({ error: 'Invalid tile coordinates. Must be integers.' });
    }
    
    try {
        // We get the map URL from the first request to associate hash
        const mapData = await fortniteLib.getMap();
        const mapUrl = mapData.images?.blank || 'https://fortnite-api.com/images/map.png';
        
        const tileInfo = await getTile(parseInt(z), parseInt(x), parseInt(y), mapUrl);
        
        if (tileInfo.error) {
            return res.status(202).json(tileInfo);
        }

        // --- NEW: Transparent Proxy Mode ---
        // Instead of redirecting (which breaks CORS in some explorers), we fetch and stream the image
        const imgRes = await fetch(tileInfo.url);
        if (!imgRes.ok) throw new Error('Failed to fetch tile from R2');

        const buffer = Buffer.from(await imgRes.arrayBuffer());
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year in browser
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
