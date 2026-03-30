/**
 * PathGen Edge Gateway - Cloudflare Worker
 * 
 * Features:
 * 1. Edge Auth: Validates JWT signature at the Edge.
 * 2. API Shield: Enforces basic request schema (Free tier equivalent).
 * 3. Origin Protection: Forwards valid requests with a secret trust header.
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // 1. PUBLIC ROUTES (Allow them to pass through)
        const publicRoutes = ['/', '/health', '/metrics', '/robots.txt', '/debug', '/v1/auth/register', '/v1/auth/login'];
        if (publicRoutes.includes(path)) {
            return fetch(request);
        }

        // 2. EDGE AUTH (Check JWT)
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ 
                error: true, 
                code: 'UNAUTHORIZED',
                message: "Missing or invalid Bearer token" 
            }), { 
                status: 401, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        const token = authHeader.split(" ")[1];
        const isValid = await verifyJWT(token, env.JWT_SECRET || 'secret');

        if (!isValid) {
            return new Response(JSON.stringify({ 
                error: true, 
                code: 'INVALID_TOKEN',
                message: "Authentication failed at the Edge. Invalid token." 
            }), { 
                status: 401, 
                headers: { "Content-Type": "application/json" } 
            });
        }

        // 3. API SHIELD (Schema Enforcement)
        if (request.method === "POST") {
            try {
                // We need a clone because reading the body consumes it
                const clonedRequest = request.clone();
                const body = await clonedRequest.json();

                // Validation for /v1/ai
                if (path.includes('/v1/ai')) {
                    if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.length < 5) {
                        return rejectSchema('Prompt is required and must be at least 5 chars.');
                    }
                }

                // Validation for /v1/replay
                if (path.includes('/v1/replay')) {
                    if (!body.game_id && !body.replay_id) {
                        return rejectSchema('Either game_id or replay_id is required.');
                    }
                }
            } catch (err) {
                // Only reject if it was supposed to be JSON but failed parsing
                if (request.headers.get("Content-Type")?.includes("application/json")) {
                    return rejectSchema('Invalid JSON payload.');
                }
            }
        }

        // 4. FORWARD TO ORIGIN
        const modifiedHeaders = new Headers(request.headers);
        modifiedHeaders.set("X-Edge-Authenticated", "true");
        modifiedHeaders.set("X-Edge-Gateway", "PathGen-v1");
        
        // Secure signature so origin knows this IS the worker
        if (env.EDGE_TRUST_TOKEN) {
            modifiedHeaders.set("X-Edge-Signature", env.EDGE_TRUST_TOKEN);
        }

        // Pass decoded user info to origin to save DB lookups/re-validation
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
                modifiedHeaders.set("X-Edge-User", payload);
            }
        } catch (e) {
            // Fallback
        }

        const newRequest = new Request(request, {
            headers: modifiedHeaders
        });

        return fetch(newRequest);
    }
};

/**
 * Fast JWT verification using SubtleCrypto (Edge-compatible)
 */
async function verifyJWT(token, secret) {
    try {
        const [headerB64, payloadB64, signatureB64] = token.split('.');
        if (!headerB64 || !payloadB64 || !signatureB64) return false;

        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const signedData = encoder.encode(`${headerB64}.${payloadB64}`);

        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
        const isValid = await crypto.subtle.verify('HMAC', key, signature, signedData);

        if (!isValid) return false;

        // Check expiration
        const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && Date.now() / 1000 > payload.exp) {
            return false;
        }

        return true;
    } catch (e) {
        return false;
    }
}

function rejectSchema(message) {
    return new Response(JSON.stringify({ 
        error: true, 
        code: 'SCHEMA_VALIDATION_FAILED',
        message: `API Shield: ${message}` 
    }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
    });
}
