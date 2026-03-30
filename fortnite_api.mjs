import dotenv from 'dotenv';
import { cache } from './lib/cache.mjs';
import { mirrorObjectUrls } from './lib/image_mirror.mjs';
dotenv.config();

const API_KEY = process.env.FORTNITE_API_KEY;

/**
 * Generic fetch for fortnite-api.com with local caching and image mirroring
 */
async function fetchWithCache(path, ex = 3600) {
    const cacheKey = `fnmirror:${path}`;
    
    // Check if we already have it in cache
    const cached = await cache.get(cacheKey);
    if (cached) {
        console.log(`[Cache Hit] ${path}`);
        let result = JSON.parse(cached);
        
        // Double-check if we need to mirror more images that might have been added to the response schema 
        // or were missed. Actually, let's just return it if it's there.
        return result;
    }

    const url = `https://fortnite-api.com${path}`;
    console.log(`[External Req] ${url}`);
    
    try {
        // Use AbortController for a 10s fetch timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': API_KEY || ''
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const parsed = await res.json();
        
        if (parsed.status === 200) {
            let result = parsed.data;
            
            // Mirror all images detected in the JSON to PathGen's R2 storage
            // Optimization: Filter out massive payloads to avoid Vercel/proxy timeouts
            const isLargePayload = path.includes('/cosmetics') || path.includes('/shop');
            
            if (isLargePayload) {
                console.log(`[Mirror Skip] Payload for ${path} is too large for synchronous mirroring.`);
            } else {
                try {
                    console.log(`[Mirror] Syncing images for ${path}...`);
                    result = await mirrorObjectUrls(result);
                } catch (mirrorErr) {
                    console.error(`[Mirror Warning] Background mirroring failed for ${path}:`, mirrorErr.message);
                }
            }
            
            // Always cache whatever we have (mirrored or original) to satisfy subsequent requests
            await cache.set(cacheKey, JSON.stringify(result), ex);
            return result;
        } else {
            console.error(`[FN-API Error] Status: ${parsed.status}, Msg: ${parsed.error}`);
            return { error: true, status: parsed.status, message: parsed.error || 'API Error' };
        }
    } catch (err) {
        console.error(`[Network/Fetch Error] ${err.message}`);
        return { error: true, message: err.message };
    }
}

export const fortniteLib = {
    // 1. Account & Stats
    getStats: (name, timeWindow = 'lifetime') => fetchWithCache(`/v2/stats/br/v2?name=${encodeURIComponent(name)}&timeWindow=${timeWindow}`, 1800),
    getStatsById: (id, timeWindow = 'lifetime') => fetchWithCache(`/v2/stats/br/v2/${id}?timeWindow=${timeWindow}`, 1800),
    getCreatorCode: (name) => fetchWithCache(`/v2/creatorcode?name=${encodeURIComponent(name)}`, 86400),

    // 2. Map
    getMap: () => fetchWithCache('/v1/map', 86400),
    
    // 3. News
    getNews: () => fetchWithCache('/v2/news', 3600),
    getBRNews: () => fetchWithCache('/v2/news/br', 3600),
    getSTWNews: () => fetchWithCache('/v2/news/stw', 3600),
    getCreativeNews: () => fetchWithCache('/v2/news/creative', 3600),
    
    // 4. Shop
    getShop: () => fetchWithCache('/v2/shop', 1800),
    
    // 5. Playlists
    getPlaylists: () => fetchWithCache('/v1/playlists', 86400),
    getPlaylistById: (id) => fetchWithCache(`/v1/playlists/${id}`, 86400),
    
    // 6. Cosmetics (All Categories)
    getCosmetics: () => fetchWithCache('/v2/cosmetics', 86400),
    getNewCosmetics: () => fetchWithCache('/v2/cosmetics/new', 3600),
    getBRCosmetics: () => fetchWithCache('/v2/cosmetics/br', 86400),
    getTracks: () => fetchWithCache('/v2/cosmetics/tracks', 86400),
    getInstruments: () => fetchWithCache('/v2/cosmetics/instruments', 86400),
    getCars: () => fetchWithCache('/v2/cosmetics/cars', 86400),
    getLego: () => fetchWithCache('/v2/cosmetics/lego', 86400),
    getLegoKits: () => fetchWithCache('/v2/cosmetics/lego/kits', 86400),
    getBeans: () => fetchWithCache('/v2/cosmetics/beans', 86400),
    
    getCosmeticById: (id) => fetchWithCache(`/v2/cosmetics/br/${id}`, 86400),
    searchCosmetic: (query) => fetchWithCache(`/v2/cosmetics/br/search?${new URLSearchParams(query)}`, 3600),
    searchCosmeticsAll: (query) => fetchWithCache(`/v2/cosmetics/br/search/all?${new URLSearchParams(query)}`, 3600),
    searchCosmeticsIds: (ids) => fetchWithCache(`/v2/cosmetics/br/search/ids?ids=${Array.isArray(ids) ? ids.join(',') : ids}`, 86400),

    // 7. Banners
    getBanners: () => fetchWithCache('/v1/banners', 86400),
    getBannerColors: () => fetchWithCache('/v1/banners/colors', 86400)
};

// Legacy support for getPlayerStats
export async function getPlayerStats(displayName) {
    const data = await fortniteLib.getStats(displayName);
    if (!data || data.error) return null;

    const account = data.account || {};
    const stats = data.stats?.all || {};
    const overall = stats.overall || {};
    
    return {
        account_id: account.id,
        display_name: account.name || displayName,
        platform: 'PC',
        level: data.battlePass?.level || 0,
        wins: overall.wins || 0,
        kills: overall.kills || 0,
        kd: overall.kd || 0,
        matches: overall.matches || 0,
        win_rate: overall.winRate || 0
    };
}
