import sharp from 'sharp';
import { r2 } from './r2.mjs';
import { cache } from './cache.mjs';
import crypto from 'crypto';

const SOURCE_RESO = 8192; // 8K map
const MAX_ZOOM = 5;

/**
 * Checks R2 for existing tiles and triggers background generation if missing
 */
export async function getTile(z, x, y, mapUrl) {
    const hash = crypto.createHash('md5').update(mapUrl).digest('hex');
    const storageKey = `tiles/${hash}/${z}/${x}/${y}.png`;
    
    // Check if tile exists in R2 or CDN
    // For now we'll just return the URL and let the client fetch it
    // But we should verify if tiles have BEEN generated for this map hash
    const statusKey = `tiles_ready:${hash}`;
    const isReady = await cache.get(statusKey);
    
    if (!isReady) {
        // Trigger background generation for all tiles
        // Note: This is an expensive operation!
        console.log(`[Tiles] Triggering generation for ${mapUrl}`);
        generateTilesInR2(mapUrl).catch(err => console.error('[Tiles Gen Error]', err));
        return { error: 'Tiles are being generated. Please wait.', status: 202 };
    }

    return { 
        url: `${process.env.R2_PUBLIC_URL || 'https://assets.pathgen.dev'}/${storageKey}`,
        status: 200
    };
}

/**
 * Massive background job to generate all tiles for a map
 */
async function generateTilesInR2(mapUrl) {
    const hash = crypto.createHash('md5').update(mapUrl).digest('hex');
    const statusKey = `tiles_ready:${hash}`;
    
    // Download source
    const response = await fetch(mapUrl);
    if (!response.ok) throw new Error('Failed to fetch source map');
    const buffer = Buffer.from(await response.arrayBuffer());
    
    const source = sharp(buffer)
        .resize(SOURCE_RESO, SOURCE_RESO, {
            kernel: sharp.kernel.lanczos3,
            fit: 'fill'
        });
    const sourceBuffer = await source.toBuffer();

    console.log(`[Tiles Gen] Starting job for ${hash}...`);
    
    for (let z = 0; z <= MAX_ZOOM; z++) {
        const tilesPerAxis = Math.pow(2, z);
        const srcTileSize = SOURCE_RESO / tilesPerAxis;
        
        for (let x = 0; x < tilesPerAxis; x++) {
            for (let y = 0; y < tilesPerAxis; y++) {
                const tileBuffer = await sharp(sourceBuffer)
                    .extract({
                        left: Math.floor(x * srcTileSize),
                        top: Math.floor(y * srcTileSize),
                        width: Math.ceil(srcTileSize),
                        height: Math.ceil(srcTileSize)
                    })
                    .resize(256, 256, { kernel: sharp.kernel.lanczos3 })
                    .png()
                    .toBuffer();
                
                const key = `tiles/${hash}/${z}/${x}/${y}.png`;
                await r2.upload(key, tileBuffer, 'image/png');
            }
        }
        console.log(`[Tiles Gen] Zoom ${z} finished`);
    }

    await cache.set(statusKey, 'ready', 86400 * 30); // Valid for 30 days
    console.log(`[Tiles Gen] All tiles generated for ${hash}`);
}
