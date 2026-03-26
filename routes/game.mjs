import express from 'express';
import { fortniteLib } from '../fortnite_api.mjs';

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
    // Currently no high-level fortnite-api.com endpoint for weapons directly, 
    // often found in separate community parsers but for now we'll keep empty or list common types.
    res.json({ status: 200, data: { pool: ['Assault Rifle', 'Shotgun', 'Sniper', 'Pistol', 'SMG'] } });
});

router.get('/map', async (req, res) => {
    try {
        const data = await fortniteLib.getMap();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Could not fetch map' });
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
