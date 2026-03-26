import express from 'express';
import { fortniteLib } from '../fortnite_api.mjs';

const router = express.Router();

router.get('/cosmetics', async (req, res) => {
    try {
        console.log('GET /cosmetics');
        const data = await fortniteLib.getBRCosmetics();
        res.json({ status: 200, data });
    } catch(err) {
        console.error('Error in /cosmetics:', err.message);
        res.status(500).json({ status: 500, error: 'Could not fetch cosmetics' });
    }
});

router.get('/cosmetics/new', async (req, res) => {
    try {
        console.log('GET /cosmetics/new');
        const data = await fortniteLib.getNewCosmetics();
        res.json({ status: 200, data });
    } catch(err) {
        console.error('Error in /cosmetics/new:', err.message);
        res.status(500).json({ status: 500, error: 'Could not fetch new cosmetics' });
    }
});

router.get('/cosmetics/:id', async (req, res) => {
    try {
        console.log('GET /cosmetics/:id', req.params.id);
        const data = await fortniteLib.getCosmeticById(req.params.id);
        res.json({ status: 200, data });
    } catch(err) {
        console.error('Error in /cosmetics/:id:', err.message);
        res.status(500).json({ status: 500, error: 'Could not fetch cosmetic detail' });
    }
});

router.get('/shop', async (req, res) => {
    try {
        console.log('GET /shop');
        const data = await fortniteLib.getShop();
        res.json({ status: 200, data });
    } catch(err) {
        console.error('Error in /shop:', err.message);
        res.status(500).json({ status: 500, error: 'Could not fetch shop' });
    }
});

router.get('/weapons', async (req, res) => {
    console.log('GET /weapons');
    res.json({ status: 200, data: { pool: ['Assault Rifle', 'Shotgun', 'Sniper', 'Pistol', 'SMG'] } });
});

router.get('/map', async (req, res) => {
    try {
        console.log('GET /map');
        const data = await fortniteLib.getMap();
        res.json({ status: 200, data });
    } catch(err) {
        console.error('Error in /map:', err.message);
        res.status(500).json({ status: 500, error: 'Could not fetch map' });
    }
});

router.get('/news', async (req, res) => {
    try {
        console.log('GET /news');
        const data = await fortniteLib.getNews();
        res.json({ status: 200, data });
    } catch(err) {
        console.error('Error in /news:', err.message);
        res.status(500).json({ status: 500, error: 'Could not fetch news' });
    }
});

router.get('/playlists', async (req, res) => {
    try {
        console.log('GET /playlists');
        const data = await fortniteLib.getPlaylists();
        res.json({ status: 200, data });
    } catch(err) {
        console.error('Error in /playlists:', err.message);
        res.status(500).json({ status: 500, error: 'Could not fetch playlists' });
    }
});

export default router;
