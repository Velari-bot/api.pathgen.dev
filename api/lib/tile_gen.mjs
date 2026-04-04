import sharp from 'sharp';
import { r2 } from './r2.mjs';
import { cache } from './cache.mjs';
import crypto from 'crypto';

const SOURCE_RESO = 8192; // 8K map
const MAX_ZOOM = 5;

// Local lock to prevent multiple simultaneous jobs for the same map in the same process
const activeJobs = new Set();

/**
 * Checks R2 for existing tiles and triggers background generation if missing
 */
export async function getTile(z, x, y, mapUrl) {
    const hash = crypto.createHash('md5').update(mapUrl).digest('hex');
    const storageKey = `tiles/${hash}/${z}/${x}/${y}.png`;
    const statusKey = `tiles_ready:${hash}`;
    
    // Check if tiles are fully ready in cache first
    const status = await cache.get(statusKey);
    const cdnUrl = `${process.env.R2_PUBLIC_URL || 'https://assets.pathgen.dev'}/${storageKey}`;

    if (status === 'ready') {
        return { url: cdnUrl, status: 200 };
    }

    // [New Heal logic] If not in cache, check if the first tile (0/0/0) exists in R2
    // This allows recovery if the cache was cleared but generation was actually finished.
    const sentinelKey = `tiles/${hash}/0/0/0.png`;
    const exists = await r2.exists(sentinelKey);
    if (exists) {
        console.log(`[Tiles Heal] Detected existing tiles for ${hash} in R2. Marking as ready.`);
        await cache.set(statusKey, 'ready', 86400 * 30);
        return { url: cdnUrl, status: 200 };
    }

    // Check if generation is already in progress
    if (status === 'pending' || activeJobs.has(hash)) {
        console.log(`[Tiles] Generation already in progress for ${hash}. Waiting...`);
        return { error: 'Tiles are being generated. Please wait.', status: 202 };
    }

    // No job in progress, trigger one
    console.log(`[Tiles] Triggering NEW generation for ${hash}`);
    generateTilesInR2(mapUrl, hash).catch(err => {
        console.error('[Tiles Gen Error]', err);
        activeJobs.delete(hash);
        cache.del(`tiles_ready:${hash}`);
    });

    return { error: 'Tiles are being generated. Please wait.', status: 202 };
}

/**
 * Massive background job to generate all tiles for a map
 */
async function generateTilesInR2(mapUrl, hash) {
    if (activeJobs.has(hash)) return;
    
    activeJobs.add(hash);
    const statusKey = `tiles_ready:${hash}`;
    await cache.set(statusKey, 'pending', 3600); // 1 hour lock
    
    try {
        console.log(`[Tiles Gen] Downloading source: ${mapUrl}`);
        const response = await fetch(mapUrl);
        if (!response.ok) throw new Error(`Failed to fetch source map: ${response.statusText}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        
        console.log(`[Tiles Gen] Resampling 8K map with Lanczos3...`);
        const sourceData = await sharp(buffer)
            .resize(SOURCE_RESO, SOURCE_RESO, {
                kernel: sharp.kernel.lanczos3,
                fit: 'fill'
            })
            .toBuffer();

        console.log(`[Tiles Gen] Starting tile iteration for ${hash}...`);
        
        for (let z = 0; z <= MAX_ZOOM; z++) {
            const tilesPerAxis = Math.pow(2, z);
            const srcTileSize = SOURCE_RESO / tilesPerAxis;
            const uploadPromises = [];
            
            for (let x = 0; x < tilesPerAxis; x++) {
                for (let y = 0; y < tilesPerAxis; y++) {
                    const promise = (async () => {
                        const tileBuffer = await sharp(sourceData)
                            .extract({
                                left: Math.floor(x * srcTileSize),
                                top: Math.floor(y * srcTileSize),
                                width: Math.ceil(srcTileSize),
                                height: Math.ceil(srcTileSize)
                            })
                            .resize(256, 256, { kernel: sharp.kernel.lanczos3 })
                            .png({ compressionLevel: 6, quality: 90 })
                            .toBuffer();
                        
                        const key = `tiles/${hash}/${z}/${x}/${y}.png`;
                        await r2.upload(key, tileBuffer, 'image/png');
                    })();
                    uploadPromises.push(promise);
                    
                    if (uploadPromises.length >= 20) {
                        await Promise.all(uploadPromises);
                        uploadPromises.length = 0;
                    }
                }
            }
            await Promise.all(uploadPromises);
            console.log(`[Tiles Gen] Zoom ${z} finished`);
        }

        await cache.set(statusKey, 'ready', 86400 * 30);
        console.log(`[Tiles Gen] ALL TILES GENERATED SUCCESSFULLY for ${hash}`);
    } catch (err) {
        console.error(`[Tiles Gen Critical] ${err.message}`);
        throw err;
    } finally {
        activeJobs.delete(hash);
    }
}
