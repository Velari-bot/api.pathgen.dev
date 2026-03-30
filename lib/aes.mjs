import axios from 'axios';
import { cache } from './cache.mjs';

/**
 * PathGen AES Key Orchestrator
 * Automatically fetches and caches the current Fortnite AES key every 6 hours.
 * This ensures the replay parser remains resilient to new game seasons.
 */

const AES_CACHE_KEY = 'fortnite_aes_data';
const CACHE_TTL = 3600 * 6; // 6 hours

export async function getAESKey() {
    const cached = await cache.get(AES_CACHE_KEY);
    if (cached) return cached;

    try {
        console.log('[AES Cache] Fetching fresh keys from Fortnite-API...');
        const response = await axios.get('https://fortnite-api.com/v2/aes');
        if (response.data?.status === 200) {
            const data = response.data.data;
            await cache.set(AES_CACHE_KEY, data, CACHE_TTL);
            return data;
        }
        throw new Error('Invalid AES response status');
    } catch (err) {
        console.error('[AES Cache Error]:', err.message);
        // Return a static fallback if API is down, but this is risky
        return null; 
    }
}

/**
 * Pre-warm the cache on server startup
 */
export async function initAESKey() {
    await getAESKey();
}
