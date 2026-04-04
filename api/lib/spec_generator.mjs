/**
 * PathGen Master Registry (v1.2.9)
 * Unified Platform Documentation - Grand Sync Edition
 */

export const OPENAPI_SPEC = {
  openapi: "3.0.0",
  info: {
    title: "PathGen Fortnite Platform API",
    version: "1.2.9",
    description: "Pathgen abstracts the complexity of Fortnite-API, Osirion, and Epic Games behind a single high-performance edge. Fused Intelligence for the Future of Fortnite Development.",
    contact: {
      name: "Wrench Develops",
      url: "https://x.com/WrenchDevelops"
    },
    "x-logo": {
      url: "https://api.pathgen.dev/favicon.ico",
      altText: "Pathgen Platform Logo"
    }
  },
  servers: [{ url: "https://api.pathgen.dev", description: "Edge Production Gateway" }],
  security: [{ ApiKey: [] }],
  components: {
    securitySchemes: {
      ApiKey: { type: "apiKey", in: "header", name: "Authorization", description: "Bearer rs_your_api_key_here" }
    }
  },
  paths: {
    // --- 1. AUTH & GLOBAL ---
    "/health": { get: { summary: "System Heartbeat", tags: ["1. Auth & Global"], "x-credit-cost": 0 } },
    "/health/detailed": { get: { summary: "Detailed Server Health", description: "Memory, CPU, and Uptime metrics.", tags: ["1. Auth & Global"], "x-credit-cost": 0 } },
    "/metrics": { get: { summary: "Prometheus Monitoring", tags: ["1. Auth & Global"], "x-credit-cost": 0 } },
    "/v1/game/ping": { get: { summary: "Connectivity Check", tags: ["1. Auth & Global"], "x-credit-cost": 0 } },
    "/v1/spec": { get: { summary: "Machine-Readable API Catalog", tags: ["1. Auth & Global"], "x-credit-cost": 0 } },

    // --- 2. GAME WORLD DATA ---
    "/v1/game/map": { get: { summary: "Current Map & POIs", description: "Fused POI data with R2 localized imaging.", tags: ["2. Game World Data"], "x-credit-cost": 0 } },
    "/v1/game/map/config": { get: { summary: "Coordinate Conversion logic", tags: ["2. Game World Data"], "x-credit-cost": 0 } },
    "/v1/game/news": { get: { summary: "Fused News Feed (Triage)", tags: ["2. Game World Data"], "x-credit-cost": 0 } },
    "/v1/game/playlists": { get: { summary: "Active Game Modes", tags: ["2. Game World Data"], "x-credit-cost": 0 } },
    "/v1/game/weapons": { get: { summary: "Active Weapon Pool Meta", tags: ["2. Game World Data"], "x-credit-cost": 0 } },
    "/v1/game/shop": { get: { summary: "Fused Item Shop Layouts", tags: ["2. Game World Data"], "x-credit-cost": 0 } },
    "/v1/game/cosmetics": { get: { summary: "Complete Cosmetics DB", tags: ["2. Game World Data"], "x-credit-cost": 0 } },
    "/v1/game/cosmetics/new": { get: { summary: "Recently Added Items", tags: ["2. Game World Data"], "x-credit-cost": 0 } },

    // --- 3. PLAYER INTELLIGENCE ---
    "/v1/game/lookup": { get: { summary: "Account ID Resolver", tags: ["3. Player Intelligence"], "x-credit-cost": 0 } },
    "/v1/game/ranked": { get: { summary: "Rank & Division Profile", tags: ["3. Player Intelligence"], "x-credit-cost": 0 } },
    "/v1/game/stats": { get: { summary: "Unified Wins/Kills Career Profile", tags: ["3. Player Intelligence"], "x-credit-cost": 0 } },
    "/v1/game/discovery": { get: { summary: "Trending Island CCU Data", tags: ["3. Player Intelligence"], "x-credit-cost": 0 } },
    "/v1/game/player/locker": { get: { summary: "Equipped Cosmetics (OAuth)", tags: ["3. Player Intelligence"], "x-credit-cost": 10, "x-tier": "PRO" } },

    // --- 4. CORE REPLAY ENGINE ---
    "/v1/replay/parse": { post: { summary: "Full Replay Binary Extraction", tags: ["4. Core Replay Engine"], "x-credit-cost": 20 } },
    "/v1/replay/stats": { post: { summary: "Lightweight Match Summary", tags: ["4. Core Replay Engine"], "x-credit-cost": 10 } },
    "/v1/replay/scoreboard": { post: { summary: "Match Top 100 Ranking", tags: ["4. Core Replay Engine"], "x-credit-cost": 10 } },
    "/v1/replay/movement": { post: { summary: "Movement & Pathing Logic", tags: ["4. Core Replay Engine"], "x-credit-cost": 15 } },
    "/v1/replay/events": { post: { summary: "Match Chronology Log", tags: ["4. Core Replay Engine"], "x-credit-cost": 15 } },
    "/v1/replay/drop-analysis": { post: { summary: "POI Landing Analysis", tags: ["4. Core Replay Engine"], "x-credit-cost": 15 } },

    // --- 5. ENHANCED VISUALIZATION ---
    "/v1/replay/enhanced/heatmap": { post: { summary: "64x64 Positional Heatmap", tags: ["5. Enhanced Visualization (PRO)"], "x-credit-cost": 25, "x-tier": "PRO" } },
    "/v1/replay/enhanced/timeline": { post: { summary: "Interactive Kill Chronology", tags: ["5. Enhanced Visualization (PRO)"], "x-credit-cost": 20, "x-tier": "PRO" } },
    "/v1/replay/enhanced/compare": { post: { summary: "Dual-Match Delta Comparison", tags: ["5. Enhanced Visualization (PRO)"], "x-credit-cost": 40, "x-tier": "PRO" } },
    "/v1/replay/enhanced/clutch": { post: { summary: "High-Pressure Clutch Moment Discovery", tags: ["5. Enhanced Visualization (PRO)"], "x-credit-cost": 20, "x-tier": "PRO" } },

    // --- 6. AI COACHING HUB ---
    "/v1/ai/analyze": { post: { summary: "AI Strategy Scorecard", tags: ["6. AI Coaching Hub (PRO)"], "x-credit-cost": 15, "x-tier": "PRO" } },
    "/v1/ai/coach": { post: { summary: "Deep Tactical Critique", tags: ["6. AI Coaching Hub (PRO)"], "x-credit-cost": 25, "x-tier": "PRO" } },
    "/v1/ai/session-coach": { post: { summary: "Multi-Match Pattern Discovery", tags: ["6. AI Coaching Hub (PRO)"], "x-credit-cost": 50, "x-tier": "PRO" } },
    "/v1/ai/weapon-coach": { post: { summary: "Weapon Loadout Optimization", tags: ["6. AI Coaching Hub (PRO)"], "x-credit-cost": 20, "x-tier": "PRO" } },
    "/v1/ai/drop-recommend": { post: { summary: "Strategic Landing POV Sugg.", tags: ["6. AI Coaching Hub (PRO)"], "x-credit-cost": 10, "x-tier": "PRO" } },
    "/v1/ai/opponent-scout": { post: { summary: "Enemy Scouting Forecast", tags: ["6. AI Coaching Hub (PRO)"], "x-credit-cost": 30, "x-tier": "PRO" } },
    "/v1/ai/rotation-review": { post: { summary: "Precision Rotation Feedback", tags: ["6. AI Coaching Hub (PRO)"], "x-credit-cost": 20, "x-tier": "PRO" } },

    // --- 7. DEVELOPER & BILLING ---
    "/v1/account/balance": { get: { summary: "Current Wallet Balance", tags: ["7. Developer & Billing"], "x-credit-cost": 0 } },
    "/v1/account/keys": { get: { summary: "List Active Keys", tags: ["7. Developer & Billing"] }, post: { summary: "Generate Secret Key", tags: ["7. Developer & Billing"] } },
    "/v1/account/usage": { get: { summary: "Account Platform Analytics", tags: ["7. Developer & Billing"] } },
    "/v1/billing/history": { get: { summary: "Transaction History", tags: ["7. Developer & Billing"] } },
    "/v1/billing/checkout": { post: { summary: "Credit Recharge (Stripe)", tags: ["7. Developer & Billing"] } },

    // --- 8. AUTOMATION LAYER ---
    "/v1/webhooks/subscribe": { post: { summary: "Real-time Push Subscription", tags: ["8. Automation Layer (PRO)"], "x-credit-cost": 10, "x-tier": "PRO" } },
    "/v1/webhooks/events": { get: { summary: "Trigger Discovery Feed", tags: ["8. Automation Layer (PRO)"] } }
  }
};

export function generateFullSpec() { return OPENAPI_SPEC; }
