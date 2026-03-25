import express from 'express';
import { getPlayerStats } from '../fortnite_api.mjs'; // Enrichment lib

const router = express.Router();

router.get('/cosmetics', async (req, res) => {
    // These would proxy to fortnite-api.com
    res.json({ message: 'Cosmetics list available in v1' });
});

router.get('/cosmetics/:id', async (req, res) => {
    res.json({ id: req.params.id, name: 'Recon Specialist', rarity: 'Rare' });
});

router.get('/shop', async (req, res) => {
    res.json({ current_shop: [] });
});

router.get('/weapons', async (req, res) => {
    res.json({ current_pool: [] });
});

router.get('/map', async (req, res) => {
    res.json({ 
        url: 'https://cdn.fortnite-api.com/map/v2/map.png',
        poi: []
    });
});

router.get('/news', async (req, res) => {
    res.json({ br: [], creative: [], stw: [] });
});

router.get('/playlists', async (req, res) => {
    res.json({ current_playlists: [] });
});

export default router;
