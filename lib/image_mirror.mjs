import { r2 } from './r2.mjs';
import { cache } from './cache.mjs';
import crypto from 'crypto';

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://assets.pathgen.dev';

/**
 * Downloads an image from fortnite-api.com and mirrors it to R2
 * Returns the mirrored URL
 */
export async function mirrorImage(originalUrl) {
    if (!originalUrl || typeof originalUrl !== 'string') return originalUrl;
    
    // Only mirror images from fortnite-api.com
    if (!originalUrl.includes('fortnite-api.com')) return originalUrl;

    // Use a hash of the URL as the R2 key to avoid duplicates and handle special chars
    const hash = crypto.createHash('md5').update(originalUrl).digest('hex');
    const extension = originalUrl.split('.').pop() || 'png';
    const storageKey = `mirror/${hash}.${extension}`;
    const mirroredUrl = `${R2_PUBLIC_URL}/${storageKey}`;

    // Check if we've already mirrored this in Redis
    const cacheKey = `img_mirror:${hash}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    try {
        console.log(`[Mirroring] ${originalUrl} -> ${mirroredUrl}`);
        const response = await fetch(originalUrl);
        if (!response.ok) throw new Error(`Failed to fetch original image: ${response.statusText}`);
        
        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get('content-type') || 'image/png';

        await r2.upload(storageKey, buffer, contentType);
        
        // Cache the association permanently (or for a long time)
        await cache.set(cacheKey, mirroredUrl, 604800); // 7 days

        return mirroredUrl;
    } catch (err) {
        console.error(`[Mirror Error] Failed to mirror ${originalUrl}:`, err.message);
        return originalUrl; // Fallback to original if mirroring fails
    }
}

/**
 * Recursively traverses an object and mirrors all strings that look like fortnite-api.com URLs
 */
export async function mirrorObjectUrls(obj) {
    if (!obj) return obj;

    if (Array.isArray(obj)) {
        return Promise.all(obj.map(item => mirrorObjectUrls(item)));
    }

    if (typeof obj === 'string') {
        return mirrorImage(obj);
    }

    if (typeof obj === 'object' && obj !== null) {
        const nextObj = {};
        const entries = Object.entries(obj);
        
        for (const [key, value] of entries) {
            if (typeof value === 'string' && value.includes('fortnite-api.com')) {
                nextObj[key] = await mirrorImage(value);
            } else if (typeof value === 'object' && value !== null) {
                nextObj[key] = await mirrorObjectUrls(value);
            } else {
                nextObj[key] = value;
            }
        }
        return nextObj;
    }

    return obj;
}
