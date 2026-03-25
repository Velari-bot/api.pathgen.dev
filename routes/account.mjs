import express from 'express';
import { db } from '../lib/db.mjs';
import { getPlayerStats } from '../fortnite_api.mjs';

const router = express.Router();

router.get('/balance', async (req, res) => {
    try {
        const result = await db.query('SELECT balance FROM accounts WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ balance: result.rows[0].balance });
    } catch(err) {
        res.status(500).json({ error: 'Could not fetch balance' });
    }
});

router.get('/keys', async (req, res) => {
    try {
        const result = await db.query('SELECT id, key_id, name, created_at FROM api_keys WHERE account_id = $1', [req.user.id]);
        res.json({ keys: result.rows });
    } catch(err) {
        res.status(500).json({ error: 'Could not fetch keys' });
    }
});

router.post('/keys', async (req, res) => {
    const { name } = req.body;
    const key = `rs_${Math.random().toString(16).substr(2, 8)}`;
    try {
        const result = await db.query('INSERT INTO api_keys (key_id, name, account_id) VALUES ($1, $2, $3) RETURNING *', [key, name, req.user.id]);
        res.status(201).json({ key: result.rows[0] });
    } catch(err) {
        res.status(500).json({ error: 'Could not create key' });
    }
});

router.delete('/keys/:keyId', async (req, res) => {
    try {
        await db.query('DELETE FROM api_keys WHERE key_id = $1 AND account_id = $2', [req.params.keyId, req.user.id]);
        res.json({ message: 'Key deleted' });
    } catch(err) {
        res.status(500).json({ error: 'Could not delete key' });
    }
});

// USAGE
router.get('/usage', async (req, res) => {
    try {
        const result = await db.query('SELECT COUNT(*) FROM logs.requests WHERE key_id = $1', [req.user.id]);
        res.json({ total_requests: parseInt(result.rows[0].count) });
    } catch(err) {
        res.status(500).json({ error: 'Could not fetch usage' });
    }
});

router.get('/usage/daily', async (req, res) => {
    // Placeholder for real time-series data from DB
    res.json({
        "2026-03-23": 1502,
        "2026-03-24": 1840,
        "2026-03-25": 1201
    });
});

// Version 1 Free
router.get('/lookup', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Missing name parameter' });

  try {
    const stats = await getPlayerStats(name);
    if (!stats) return res.status(404).json({ error: 'Player not found' });
    res.json(stats);
  } catch(err) {
    res.status(500).json({ error: 'Lookup failed' });
  }
});

router.get('/ranked', (req, res) => {
  res.json({ status: 'ok', mode: 'Ranked BR', rank: 'Gold II' });
});

router.get('/stats', (req, res) => {
  res.json({ status: 'ok', message: 'General player stats' });
});

export default router;
