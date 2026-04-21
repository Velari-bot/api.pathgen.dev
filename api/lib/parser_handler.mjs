import { parseReplay } from '../core_parser.mjs';
import { r2 } from './r2.mjs';

/**
 * Handles the common flow of parsing a replay and uploading it to R2.
 * Centralized to ensure all endpoints (free, mid, pro, legacy) return storage links.
 */
export const processReplayAndUpload = async (req) => {
    // Support both 'replay' and 'file' field names for high compatibility
    const file = req.file || (req.files ? (req.files.replay?.[0] || req.files.file?.[0]) : null);
    if (!file) throw new Error('No replay file provided (use field "replay" or "file")');
    
    // 1. Parse the replay
    const result = await parseReplay(file.buffer);
    
    // 2. Handle R2 Upload
    const sessionId = result.match_overview?.session_id || `replay_${Date.now()}`;
    const storageKey = `replays/${sessionId}.replay`;
    
    let storageUrl = null;
    
    // Only upload if not explicitly skipped (e.g. in some local tests)
    // We default to uploading for "live api" requirements
    if (process.env.SKIP_R2_UPLOAD !== 'true') {
        try {
            await r2.upload(storageKey, file.buffer, 'application/octet-stream');
            storageUrl = `https://assets.pathgen.dev/${storageKey}`;
        } catch (err) {
            console.error(`[ParserHandler] R2 Upload failed: ${err.message}`);
            // Fallback: if upload fails, we still return the parsed data but without the storage URL
        }
    } else {
        console.log(`[ParserHandler] R2 Upload skipped for ${storageKey}`);
    }
    
    return { result, storageUrl };
};
