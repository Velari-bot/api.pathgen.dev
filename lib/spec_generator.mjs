/**
 * PathGen Full Platform Documentation (v1.2.8)
 * Complete Registry of all 50+ Platform, AI, and Game Endpoints.
 */

export const OPENAPI_SPEC = {
  openapi: "3.0.0",
  info: {
    title: "PathGen Fortnite Platform API",
    version: "1.2.8",
    description: "The complete, carrier-grade Fortnite developer interface. Unified Game World, AI Coaching, Replay Analytics, and Automation Layers."
  },
  servers: [{ url: "https://api.pathgen.dev", description: "Edge Production Gateway" }],
  security: [{ ApiKey: [] }],
  components: {
    securitySchemes: {
      ApiKey: { type: "apiKey", in: "header", name: "Authorization", description: "Bearer YOUR_API_KEY" }
    }
  },
  paths: {
    // --- 1. AUTH & GLOBAL ---
    "/health": { get: { summary: "System Heartbeat", tags: ["Auth & Global"], "x-credit-cost": 0 } },
    "/health/detailed": { get: { summary: "Detailed Server Health", description: "Memory, CPU, and Uptime metrics.", tags: ["Auth & Global"], "x-credit-cost": 0 } },
    "/metrics": { get: { summary: "Prometheus Metrics", tags: ["Auth & Global"], "x-credit-cost": 0 } },
    "/v1/game/ping": { get: { summary: "API Connectivity Check", tags: ["Auth & Global"], "x-credit-cost": 0 } },

    // --- 2. GAME WORLD DATA ---
    "/v1/game/map": { get: { summary: "Current Map & POIs", description: "Fused POI data with R2 asset localized URLs.", tags: ["Game World Data"], "x-credit-cost": 0 } },
    "/v1/game/map/config": { get: { summary: "Map Coordinate Conversion", tags: ["Game World Data"], "x-credit-cost": 0 } },
    "/v1/game/map/tiles": { get: { summary: "Map Tile Index", tags: ["Game World Data"], "x-credit-cost": 0 } },
    "/v1/game/tiles/{z}/{x}/{y}": { get: { summary: "Fetch Map Tile", description: "Layer-based map rendering.", tags: ["Game World Data"], "x-credit-cost": 30 } },
    "/v1/game/news": { get: { summary: "Fused News Feed", description: "BR, Creative, and STW triage.", tags: ["Game World Data"], "x-credit-cost": 0 } },
    "/v1/game/playlists": { get: { summary: "Available Game Modes", tags: ["Game World Data"], "x-credit-cost": 0 } },
    "/v1/game/weapons": { get: { summary: "Weapon Pool Metadata", tags: ["Game World Data"], "x-credit-cost": 0 } },
    "/v1/game/shop": { get: { summary: "Fused Item Shop", description: "Premium layout with R2 localized imaging.", tags: ["Game World Data"], "x-credit-cost": 0 } },

    // --- 3. PLAYER STATISTICS ---
    "/v1/game/lookup": { get: { summary: "Account ID Lookup", tags: ["Player Statistics"], "x-credit-cost": 0 } },
    "/v1/game/ranked": { get: { summary: "Competitive Rank Profile", description: "Ranked division and global leaderboard.", tags: ["Player Statistics"], "x-credit-cost": 0 } },
    "/v1/game/stats": { get: { summary: "Unified Career Stats", description: "Fused wins/kills profile (FN-API + Osirion).", tags: ["Player Statistics"], "x-credit-cost": 0 } },

    // --- 4. REPLAY PARSING ---
    "/v1/replay/parse": { post: { summary: "Full Replay Binary Parse", description: "Positional, combat, and mechanical data.", tags: ["Replay Analysis"], "x-credit-cost": 20 } },
    "/v1/replay/stats": { post: { summary: "Lightweight Match Stats", tags: ["Replay Analysis"], "x-credit-cost": 5 } },
    "/v1/replay/scoreboard": { post: { summary: "Match Scoreboard Extraction", tags: ["Replay Analysis"], "x-credit-cost": 8 } },
    "/v1/replay/movement": { post: { summary: "Movement & Pathing Data", tags: ["Replay Analysis"], "x-credit-cost": 8 } },
    "/v1/replay/events": { post: { summary: "Chronological Event Feed", tags: ["Replay Analysis"], "x-credit-cost": 10 } },
    "/v1/replay/drop-analysis": { post: { summary: "POI Drop Efficiency Review", tags: ["Replay Analysis"], "x-credit-cost": 15 } },

    // --- 5. ACCOUNT & KEYS ---
    "/v1/account/balance": { get: { summary: "Check Current Balance", tags: ["Account & Keys"], "x-credit-cost": 0 } },
    "/v1/account/keys": { get: { summary: "List API Keys", tags: ["Account & Keys"] }, post: { summary: "Generate New Secure API Key", tags: ["Account & Keys"] } },
    "/v1/account/keys/{id}": { delete: { summary: "Revoke API Key", tags: ["Account & Keys"] } },
    "/v1/account/usage": { get: { summary: "Cumulative Account Analytic", tags: ["Account & Keys"] } },

    // --- 6. BILLING ---
    "/v1/billing/history": { get: { summary: "Transaction & Credit History", tags: ["Billing Hub"], "x-credit-cost": 0 } },
    "/v1/billing/checkout": { post: { summary: "Initiate Credit Recharge", tags: ["Billing Hub"], "x-credit-cost": 0 } },

    // --- 7. ADMIN LOGS (BETA / ADMIN) ---
    "/logs/requests": { get: { summary: "Live Traffic Stream", tags: ["Admin Logs Overlay"], "x-tier": "PRO" } },
    "/logs/errors": { get: { summary: "Production Error Feed", tags: ["Admin Logs Overlay"], "x-tier": "PRO" } },
    "/logs/live": { get: { summary: "Real-time Platform Heartbeat", tags: ["Admin Logs Overlay"], "x-tier": "PRO" } },

    // --- 8. AI ANALYSIS & COACHING (PRO & BETA) ---
    "/v1/ai/analyze": { post: { summary: "Match Strategy Review", tags: ["AI Intelligence Suite"], "x-credit-cost": 15, "x-tier": "PRO" } },
    "/v1/ai/coach": { post: { summary: "Deep Tactical Coaching", tags: ["AI Intelligence Suite"], "x-credit-cost": 30, "x-tier": "PRO" } },
    "/v1/ai/session-coach": { post: { summary: "Cross-Match Pattern Discovery", tags: ["AI Intelligence Suite"], "x-credit-cost": 50, "x-tier": "PRO" } },
    "/v1/ai/weapon-coach": { post: { summary: "Weapon Mastery Critique", tags: ["AI Intelligence Suite"], "x-credit-cost": 20, "x-tier": "PRO" } },
    "/v1/ai/drop-recommend": { post: { summary: "Strategic Start POI Suggestion", tags: ["AI Intelligence Suite"], "x-credit-cost": 20, "x-tier": "PRO" } },
    "/v1/ai/opponent-scout": { post: { summary: "Real-time Opponent Scouting", tags: ["AI Intelligence Suite"], "x-credit-cost": 25, "x-tier": "PRO" } },
    "/v1/ai/rotation-review": { post: { summary: "Advanced Rotation Feedback", tags: ["AI Intelligence Suite"], "x-credit-cost": 15, "x-tier": "PRO" } }
  }
};

export function generateFullSpec() { return OPENAPI_SPEC; }
