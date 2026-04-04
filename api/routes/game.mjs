import express from 'express';
import { fortniteLib, getPlayerStats } from '../fortnite_api.mjs';
import { getTile } from '../lib/tile_gen.mjs';
import { validateFirestoreKey, deductCredits } from '../middleware/firestore-auth.mjs';
import { cache } from '../lib/cache.mjs';
import { osirion } from '../lib/osirion.mjs';
import { mergeStats } from '../lib/stats_merger.mjs';
import { mergeShop } from '../lib/shop_merger.mjs';
import { mergeNews } from '../lib/news_merger.mjs';
import { mergeRanked } from '../lib/ranked_merger.mjs';
import { mirrorObjectUrls } from '../lib/image_mirror.mjs';

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

router.get('/cosmetics/search', async (req, res) => {
    const { name, lang } = req.query;
    if (!name) return res.status(400).json({ error: 'Missing name parameter for search' });
    
    try {
        const data = await fortniteLib.searchCosmetic({ name, language: lang || 'en' });
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Search failed' });
    }
});

router.get('/cosmetics/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!id || id === '{id}') {
            return res.status(400).json({ error: 'Please provide a valid cosmetic ID.' });
        }
        const data = await fortniteLib.getCosmeticById(id);
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Could not fetch cosmetic detail' });
    }
});


router.get('/shop', async (req, res) => {
    try {
        const [fnShop, osShop] = await Promise.all([
            fortniteLib.getShop(),
            osirion.getShop()
        ]);

        const fused = mergeShop(fnShop, osShop);
        if (!fused) return res.status(404).json({ error: 'Shop data unavailable' });
        
        // Final Mirroring check for R2 storage
        const finalResult = await mirrorObjectUrls(fused);
        res.json({ status: 200, data: finalResult });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Shop fetch and merge failed' });
    }
});

router.get('/weapons', async (req, res) => {
    res.json({ status: 200, data: { pool: ['Assault Rifle', 'Shotgun', 'Sniper', 'Pistol', 'SMG'] } });
});

router.get('/map', validateFirestoreKey(0), async (req, res) => {
    try {
        const mapData = await fortniteLib.getMap();
        res.json({ status: 200, data: mapData });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Could not fetch map images' });
    }
});

router.get('/map/config', validateFirestoreKey(0), async (req, res) => {
    try {
        const mapData = await fortniteLib.getMap();
        const mapHash = mapData.hash || 'v1';
        
        const MAP_CONFIG = {
            season: 'Chapter 7 Season 2',
            tile_url: `${process.env.R2_PUBLIC_URL || 'https://assets.pathgen.dev'}/tiles/${mapHash}/{z}/{x}/{y}.png`,
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
        res.status(500).json({ status: 500, error: 'Could not fetch map config' });
    }
});

router.get('/map/tiles', validateFirestoreKey(0), async (req, res) => {
    try {
        const mapData = await fortniteLib.getMap();
        const mapHash = mapData.hash || 'v1';
        const baseUrl = process.env.R2_PUBLIC_URL || 'https://assets.pathgen.dev';
        
        const tiles = [];
        for (let z = 0; z <= 5; z++) {
            const tilesPerAxis = Math.pow(2, z);
            for (let x = 0; x < tilesPerAxis; x++) {
                for (let y = 0; y < tilesPerAxis; y++) {
                    tiles.push({
                        z, x, y,
                        url: `${baseUrl}/tiles/${mapHash}/${z}/${x}/${y}.png`
                    });
                }
            }
        }
        
        res.json({ 
            status: 200, 
            data: {
                map_hash: mapHash,
                total_tiles: tiles.length,
                tiles
            }
        });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Could not generate tile list' });
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
        const [fnNews, osNews] = await Promise.all([
            fortniteLib.getNews(),
            osirion.getNews()
        ]);

        const fused = mergeNews(fnNews, osNews);
        if (!fused) return res.status(404).json({ error: 'News data unavailable' });
        
        // Final Mirroring check for R2 storage
        const finalResult = await mirrorObjectUrls(fused);
        res.json({ status: 200, data: finalResult });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'News fetch and merge failed' });
    }
});

router.get('/playlists/:id', async (req, res) => {
    try {
        const data = await fortniteLib.getPlaylistById(req.params.id);
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Playlist lookup failed' });
    }
});

/**
 * Creator & Code Metadata
 */
router.get('/creator/:name', async (req, res) => {
    try {
        const data = await fortniteLib.getCreatorCode(req.params.name);
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Creator lookup failed' });
    }
});

/**
 * Banner Assets
 */
router.get('/banners', async (req, res) => {
    try {
        const data = await fortniteLib.getBanners();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Banners fetch failed' });
    }
});

router.get('/banners/colors', async (req, res) => {
    try {
        const data = await fortniteLib.getBannerColors();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Banner colors fetch failed' });
    }
});

/**
 * Specialized Cosmetics (LEGO, Cars, Tracks, Instruments, Beans)
 */
router.get('/cosmetics/br', async (req, res) => {
    try {
        const data = await fortniteLib.getBRCosmetics();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'BR cosmetics fetch failed' });
    }
});

router.get('/cosmetics/tracks', async (req, res) => {
    try {
        const data = await fortniteLib.getTracks();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Track cosmetics fetch failed' });
    }
});

router.get('/cosmetics/instruments', async (req, res) => {
    try {
        const data = await fortniteLib.getInstruments();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Instrument cosmetics fetch failed' });
    }
});

router.get('/cosmetics/cars', async (req, res) => {
    try {
        const data = await fortniteLib.getCars();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Car cosmetics fetch failed' });
    }
});

router.get('/cosmetics/lego', async (req, res) => {
    try {
        const data = await fortniteLib.getLego();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'LEGO cosmetics fetch failed' });
    }
});

router.get('/cosmetics/lego/kits', async (req, res) => {
    try {
        const data = await fortniteLib.getLegoKits();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'LEGO kits fetch failed' });
    }
});

router.get('/cosmetics/beans', async (req, res) => {
    try {
        const data = await fortniteLib.getBeans();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Fall Guys beans fetch failed' });
    }
});

/**
 * Advanced Cosmetic Search (Search/All and Search/IDs)
 */
router.get('/cosmetics/search/all', async (req, res) => {
    try {
        const data = await fortniteLib.searchCosmeticsAll(req.query);
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Advanced search failed' });
    }
});

router.get('/cosmetics/search/ids', async (req, res) => {
    const { ids } = req.query;
    if (!ids) return res.status(400).json({ error: 'Missing ids parameter' });
    try {
        const data = await fortniteLib.searchCosmeticsIds(ids.split(','));
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'IDs lookup failed' });
    }
});

/**
 * Categorized News (STW, Creative, BR)
 */
router.get('/news/br', async (req, res) => {
    try {
        const data = await fortniteLib.getBRNews();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'BR news fetch failed' });
    }
});

router.get('/news/stw', async (req, res) => {
    try {
        const data = await fortniteLib.getSTWNews();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'STW news fetch failed' });
    }
});

router.get('/news/creative', async (req, res) => {
    try {
        const data = await fortniteLib.getCreativeNews();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Creative news fetch failed' });
    }
});

/**
 * Account Lookups (Osirion Masked)
 */
router.get('/accounts/bulk', async (req, res) => {
    const { ids } = req.query;
    if (!ids) return res.status(400).json({ error: 'Missing ids' });
    try {
        const data = await osirion.lookupByAccountIdBulk(ids.split(','));
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Bulk account lookup failed' });
    }
});

/**
 * Cosmetics Data (Osirion Masked)
 */
router.get('/cosmetics', async (req, res) => {
    try {
        const data = await osirion.getCosmetics();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Cosmetics fetch failed' });
    }
});

router.get('/cosmetics/search', async (req, res) => {
    const { name, id, set, rarity, series, matchType, hasVariants } = req.query;
    try {
        const data = await osirion.searchCosmetics({ name, id, set, rarity, series, matchType, hasVariants });
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Cosmetics search failed' });
    }
});

router.get('/cosmetics/sets', async (req, res) => {
    try {
        const data = await osirion.getCosmeticSets();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Cosmetic sets fetch failed' });
    }
});

/**
 * Competitive & Tournaments (Masked from Osirion)
 */
router.get('/tournaments', async (req, res) => {
    const { region, platform } = req.query;
    try {
        const data = await osirion.getTournaments(region, platform);
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Tournament lookup failed' });
    }
});

router.get('/tournaments/leaderboard', async (req, res) => {
    const { event_id, session_id, page } = req.query;
    if (!event_id || !session_id) return res.status(400).json({ error: 'Missing event_id or session_id' });
    try {
        const data = await osirion.getTournamentLeaderboard(event_id, session_id, page);
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Leaderboard lookup failed' });
    }
});

/**
 * Creative & Discovery (Masked from Osirion)
 */
router.get('/discovery', async (req, res) => {
    const { surface_type, account_id, lang } = req.query;
    try {
        const data = await osirion.getDiscoverySurface(surface_type || 'FRONTEND', account_id, lang);
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Discovery fetch failed' });
    }
});

router.get('/discovery/page', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Missing page token' });
    try {
        const data = await osirion.getDiscoveryPage(token);
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Discovery page fetch failed' });
    }
});

router.get('/mnemonic/bulk', async (req, res) => {
    const { codes } = req.query;
    if (!codes) return res.status(400).json({ error: 'Missing codes parameter' });
    try {
        const data = await osirion.getIslandDataBulk(codes.split(','));
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Bulk island lookup failed' });
    }
});

router.get('/mnemonic/:id', async (req, res) => {
    try {
        const data = await osirion.getIslandData(req.params.id);
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Island lookup failed' });
    }
});

/**
 * Dynamic Encryption & Build Stats
 */
router.get('/aes', async (req, res) => {
    try {
        const keyInfo = await getAESKey();
        res.json({
            status: 200,
            build: keyInfo.version,
            mainKey: keyInfo.key,
            source: keyInfo.source
        });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'AES fetch failed' });
    }
});

// Version 1 Free
router.get('/lookup', async (req, res) => {
  const { name, accountId } = req.query;
  if (!name && !accountId) return res.status(400).json({ error: 'Missing name or accountId parameter' });

  try {
    let stats;
    if (name) {
      stats = await getPlayerStats(name);
      // Fallback to Osirion if Primary fails or is empty
      if (!stats) {
          const osData = await osirion.lookupByDisplayName(name);
          if (osData?.success) {
              const osStats = await osirion.getAccountStats(osData.accountId);
              if (osStats?.success) {
                  stats = {
                      account_id: osData.accountId,
                      display_name: name,
                      level: osStats.stats.battlePass?.level || 0,
                      wins: osStats.stats.all?.overall?.wins || 0,
                      kills: osStats.stats.all?.overall?.kills || 0,
                      kd: osStats.stats.all?.overall?.kd || 0
                  };
              }
          }
      }
    } else {
      // If only accountId is provided
      const raw = await fortniteLib.getStatsById(accountId);
      if (!raw || raw.error) return res.status(404).json({ error: 'Player not found' });
      // Map raw stats to getPlayerStats format
      stats = {
        account_id: raw.account.id,
        display_name: raw.account.name,
        platform: 'PC',
        level: raw.battlePass?.level || 0,
        wins: raw.stats?.all?.overall?.wins || 0,
        kills: raw.stats?.all?.overall?.kills || 0,
        kd: raw.stats?.all?.overall?.kd || 0,
        matches: raw.stats?.all?.overall?.matches || 0,
        win_rate: raw.stats?.all?.overall?.winRate || 0
      };
    }
    
    if (!stats) return res.status(404).json({ error: 'Player not found' });
    res.json(stats);
  } catch(err) {
    res.status(500).json({ error: 'Lookup failed' });
  }
});

router.get('/ranked', async (req, res) => {
  const { name, accountId } = req.query;
  if (!name && !accountId) return res.status(400).json({ error: 'Missing name or accountId parameter' });

  try {
    let fnData, osData;
    if (name) {
        [fnData, osData] = await Promise.all([
            fortniteLib.getStats(name),
            osirion.lookupByDisplayName(name).then(l => l?.success ? osirion.getRankedData(l.accountId) : null)
        ]);
    } else {
        [fnData, osData] = await Promise.all([
            fortniteLib.getStatsById(accountId),
            osirion.getRankedData(accountId)
        ]);
    }
    
    const fused = mergeRanked(fnData, osData);
    if (!fused) return res.status(404).json({ error: 'Player not found' });
    
    // Final Mirroring check for R2 storage
    const finalResult = await mirrorObjectUrls(fused);
    res.json(finalResult);
  } catch(err) {
    res.status(500).json({ error: 'Ranked reconcile failed' });
  }
});

router.get('/stats', async (req, res) => {
  const { name, accountId, timeWindow } = req.query;
  if (!name && !accountId) return res.status(400).json({ error: 'Missing name or accountId parameter' });

  try {
    // Parrallel fetch from multiple sources for True North data
    const [fnData, osData] = await Promise.all([
        name ? fortniteLib.getStats(name, timeWindow || 'lifetime') : fortniteLib.getStatsById(accountId, timeWindow || 'lifetime'),
        accountId ? osirion.getAccountStats(accountId, timeWindow || 'lifetime') : null // Need accountId for Osirion lookup
    ]);

    // Handle initial lookup if only name was provided for Osirion
    let finalOsData = osData;
    if (!accountId && name && !osData) {
        const lookup = await osirion.lookupByDisplayName(name);
        if (lookup?.success) {
            finalOsData = await osirion.getAccountStats(lookup.accountId, timeWindow || 'lifetime');
        }
    }

    const merged = mergeStats(fnData, finalOsData);
    if (!merged) return res.status(404).json({ error: 'Player not found' });
    
    res.json(merged);
  } catch(err) {
    res.status(500).json({ error: 'Stats fetch and merge failed' });
  }
});

router.get('/ranked/modes', async (req, res) => {
    try {
        const data = await osirion.getRankedModes();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Could not fetch ranked modes' });
    }
});

/**
 * BR Stats v2 (Username or ID)
 */
router.get('/stats/br/v2', async (req, res) => {
    const { name, timeWindow } = req.query;
    if (!name) return res.status(400).json({ error: 'Missing name parameter' });
    try {
        const data = await fortniteLib.getStats(name, timeWindow || 'lifetime');
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Stats V2 fetch failed' });
    }
});

router.get('/stats/br/v2/:accountId', async (req, res) => {
    const { timeWindow } = req.query;
    try {
        const data = await fortniteLib.getStatsById(req.params.accountId, timeWindow || 'lifetime');
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Stats V2 by ID fetch failed' });
    }
});

/**
 * Unified Discovery & Playlists
 */
router.get('/playlists', async (req, res) => {
    try {
        const data = await osirion.getPlaylists();
        res.json({ status: 200, data });
    } catch(err) {
        res.status(500).json({ status: 500, error: 'Playlists fetch failed' });
    }
});



/**
 * Private Player Identity (Requires OAuth Session)
 */
router.get('/stats/history', validateFirestoreKey(8, { requireBeta: true }), async (req, res) => {
    const { accountId } = req.query;
    if (!accountId) return res.status(400).json({ error: 'Missing accountId' });
    try {
        const data = await osirion.getAccountStats(accountId, 'all_time');
        res.json({ status: 200, credits_used: 8, data: data.seasonHistory || [] });
    } catch(err) {
        res.status(500).json({ error: 'History lookup failed' });
    }
});

router.get('/player/locker', validateFirestoreKey(10, { requireBeta: true }), async (req, res) => {
    const { accountId } = req.query;
    if (!accountId) return res.status(400).json({ error: 'Missing accountId' });
    try {
        const data = await osirion.getRankedData(accountId); // Osirion locker fallback
        res.json({ status: 200, credits_used: 10, data: data.equipped || {} });
    } catch(err) {
        res.status(500).json({ error: 'Locker lookup failed' });
    }
});

router.get('/player/achievements', validateFirestoreKey(5, { requireBeta: true }), async (req, res) => {
    const { accountId } = req.query;
    if (!accountId) return res.status(400).json({ error: 'Missing accountId' });
    try {
        // Placeholder for Epic Achievement API (currently not public in Osirion)
        res.json({ status: 200, credits_used: 5, data: { count: 42, completion: '68%' } });
    } catch(err) {
        res.status(500).json({ error: 'Achievement lookup failed' });
    }
});

router.get('/ping', (req, res) => {
    res.json({ status: 200, message: 'pong', time: new Date().toISOString() });
});

export default router;
