import dotenv from 'dotenv';
import { cache } from './lib/cache.mjs';
dotenv.config();

const API_KEY = process.env.FORTNITE_API_KEY;

/**
 * Generic fetch for fortnite-api.com with local caching
 */
async function fetchWithCache(path, ex = 3600) {
    const cacheKey = `fnapi:${path}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
        console.log(`[Cache Hit] ${path}`);
        return JSON.parse(cached);
    }

    const url = `https://fortnite-api.com${path}`;
    console.log(`[External Req] ${url}`);
    
    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': API_KEY || ''
            }
        });

        const parsed = await res.json();
        
        if (parsed.status === 200) {
            const result = parsed.data;
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
    
    // 2. Map
    getMap: () => fetchWithCache('/v1/map', 86400),
    
    // 3. News
    getNews: () => fetchWithCache('/v2/news', 3600),
    getBRNews: () => fetchWithCache('/v2/news/br', 3600),
    
    // 4. Shop
    getShop: () => fetchWithCache('/v2/shop', 1800),
    
    // 5. Playlists
    getPlaylists: () => fetchWithCache('/v1/playlists', 86400),
    getPlaylistById: (id) => fetchWithCache(`/v1/playlists/${id}`, 86400),
    
    // 6. Cosmetics
    getCosmetics: () => fetchWithCache('/v2/cosmetics', 86400),
    getNewCosmetics: () => fetchWithCache('/v2/cosmetics/new', 3600),
    getBRCosmetics: () => fetchWithCache('/v2/cosmetics/br', 86400),
    getCosmeticById: (id) => fetchWithCache(`/v2/cosmetics/br/${id}`, 86400),
    searchCosmetic: (query) => fetchWithCache(`/v2/cosmetics/br/search?${new URLSearchParams(query)}`, 3600)
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
