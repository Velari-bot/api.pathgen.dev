import { cache } from './cache.mjs';
import { mirrorObjectUrls } from './image_mirror.mjs';

/**
 * Osirion Fortnite Public API Wrapper (Complete v0.1.2)
 * Base URL: https://fnapi.osirion.gg
 */

const BASE_URL = 'https://fnapi.osirion.gg';

async function fetchWithMirror(url, ex = 3600) {
    const cacheKey = `osir_mirror:${url}`;
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return null;
        let data = await res.json();
        
        // Mirror images to R2
        data = await mirrorObjectUrls(data);
        
        await cache.set(cacheKey, JSON.stringify(data), ex);
        return data;
    } catch (err) {
        console.error(`[Osirion Error] ${url}:`, err.message);
        return null;
    }
}

export const osirion = {
    /**
     * Account Lookups
     */
    lookupByDisplayName: async (displayName) => {
        return fetchWithMirror(`${BASE_URL}/v1/accounts/lookup-by-display-name?displayName=${encodeURIComponent(displayName)}`);
    },

    lookupByAccountIdBulk: async (accountIds) => {
        const ids = Array.isArray(accountIds) ? accountIds.join(',') : accountIds;
        return fetchWithMirror(`${BASE_URL}/v1/accounts/lookup-by-account-id-bulk?accountIds=${ids}`);
    },

    /**
     * Cosmetics
     */
    getCosmetics: async () => {
        return fetchWithMirror(`${BASE_URL}/v1/cosmetics`, 86400);
    },

    searchCosmetics: async (params = {}) => {
        const searchParams = new URLSearchParams(params);
        return fetchWithMirror(`${BASE_URL}/v1/cosmetics/search?${searchParams.toString()}`);
    },

    getCosmeticSets: async () => {
        return fetchWithMirror(`${BASE_URL}/v1/cosmetics/sets`, 86400);
    },

    /**
     * Discovery & Islands
     */
    getDiscoverySurface: async (type = 'FRONTEND', accountId = null, lang = 'en') => {
        return fetchWithMirror(`${BASE_URL}/v1/discovery/surface?surfaceType=${type}${accountId ? `&playerPageId=${accountId}` : ''}&lang=${lang}&includeLinkData=true`);
    },

    getDiscoveryPage: async (pageToken, includeLinkData = true) => {
        return fetchWithMirror(`${BASE_URL}/v1/discovery/surface-page?pageToken=${pageToken}&includeLinkData=${includeLinkData}`);
    },

    getIslandData: async (mnemonic, lang = 'en') => {
        return fetchWithMirror(`${BASE_URL}/v1/links/lookup?linkCode=${mnemonic}&lang=${lang}&includeCCU=true`);
    },

    getIslandDataBulk: async (mnemonics, lang = 'en') => {
        const codes = Array.isArray(mnemonics) ? mnemonics.join(',') : mnemonics;
        return fetchWithMirror(`${BASE_URL}/v1/links/lookup-bulk?linkCodes=${codes}&lang=${lang}&includeCCU=true`);
    },

    /**
     * Content (News, Shop, Playlists, Weapons)
     */
    getNews: async (mode = 'br', lang = 'en', linkCode = null) => {
        return fetchWithMirror(`${BASE_URL}/v1/news?mode=${mode}&lang=${lang}${linkCode ? `&linkCode=${linkCode}` : ''}`);
    },

    getPlaylists: async (lang = 'en') => {
        return fetchWithMirror(`${BASE_URL}/v1/playlists?lang=${lang}`, 86400);
    },

    getWeapons: async () => {
        return fetchWithMirror(`${BASE_URL}/v1/weapons`, 86400);
    },

    getShop: async () => {
        return fetchWithMirror(`${BASE_URL}/v1/shop/item-shop`, 1800);
    },

    /**
     * Competitive & Ranked
     */
    getTournaments: async (region = 'EU', platform = 'Windows') => {
        return fetchWithMirror(`${BASE_URL}/v1/tournaments?region=${region}&platform=${platform}`, 3600);
    },

    getTournamentLeaderboard: async (eventId, sessionId, page = 0) => {
        return fetchWithMirror(`${BASE_URL}/v1/tournaments/leaderboard?leaderboardEventId=${eventId}&leaderboardEventWindowId=${sessionId}&page=${page}`, 300);
    },

    getRankedData: async (accountId) => {
        return fetchWithMirror(`${BASE_URL}/v1/ranked/account-ranks?accountId=${accountId}`, 1800);
    },

    getRankedModes: async () => {
        return fetchWithMirror(`${BASE_URL}/v1/ranked/modes`, 86400);
    },

    getAccountStats: async (accountId, timeframe = 'season') => {
        return fetchWithMirror(`${BASE_URL}/v1/stats/account?accountId=${accountId}&timeframe=${timeframe}`, 1800);
    }
};
