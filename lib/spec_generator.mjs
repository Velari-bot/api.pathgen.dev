/**
 * PathGen Full OpenAPI 3.0 Documentation Registry
 * Automatically generated from the live service architecture.
 */

export const OPENAPI_SPEC = {
  openapi: "3.0.0",
  info: {
    title: "PathGen Fortnite Platform API",
    version: "1.2.5",
    description: "The world's most comprehensive Fortnite developer interface. Masking Osirion, Fortnite-API, and Epic Games behind a single high-performance edge."
  },
  servers: [{ url: "https://api.pathgen.dev", description: "Production Gateway" }],
  security: [{ ApiKey: [] }],
  components: {
    securitySchemes: {
      ApiKey: { type: "apiKey", in: "header", name: "Authorization", description: "Bearer YOUR_API_KEY" }
    }
  },
  paths: {
    // --- REPLAY ENGINE ---
    "/v1/replay/parse": {
      post: {
        summary: "Parse Replay Binary",
        description: "Extract raw performance, positions, and combat data from a .replay file.",
        tags: ["Replay Engine"],
        "x-credit-cost": 20
      }
    },
    "/v1/replay/enhanced/heatmap": {
      post: {
        summary: "Generate Match Heatmap",
        description: "Returns a 64x64 density grid of all positional activity.",
        tags: ["Replay Enhanced"],
        "x-credit-cost": 15,
        "x-tier": "PRO"
      }
    },
    "/v1/replay/enhanced/timeline": {
      post: {
        summary: "Match Chronology Feed",
        description: "Chronological list of all significant deaths and storm shifts.",
        tags: ["Replay Enhanced"],
        "x-credit-cost": 10,
        "x-tier": "PRO"
      }
    },
    "/v1/replay/enhanced/compare": {
      post: {
        summary: "Side-by-Side Comparison",
        description: "Delta analysis between two separate replay sessions.",
        tags: ["Replay Enhanced"],
        "x-credit-cost": 25,
        "x-tier": "PRO"
      }
    },
    "/v1/replay/enhanced/clutch-moments": {
      post: {
        summary: "Clutch Moment Detection",
        description: "Isolates high-pressure wins and low-HP eliminations.",
        tags: ["Replay Enhanced"],
        "x-credit-cost": 20,
        "x-tier": "PRO"
      }
    },

    // --- AI COACHING (BETA) ---
    "/v1/ai/analyze": {
      post: {
        summary: "Basic AI Scorecard",
        description: "Gemini-powered breakdown of match strengths and weaknesses.",
        tags: ["AI AI Coaching (BETA)"],
        "x-credit-cost": 15,
        "x-tier": "PRO"
      }
    },
    "/v1/ai/coach": {
      post: {
        summary: "Deep Tactical Coaching",
        description: "Verbously explains professional strategies for early, mid, and late game.",
        tags: ["AI AI Coaching (BETA)"],
        "x-credit-cost": 30,
        "x-tier": "PRO"
      }
    },
    "/v1/ai/session-coach": {
      post: {
        summary: "Multi-Match Pattern Analysis",
        description: "Detects trends across 6 matches (consistency, choke-points).",
        tags: ["AI AI Coaching (BETA)"],
        "x-credit-cost": 50,
        "x-tier": "PRO"
      }
    },
    "/v1/ai/weapon-coach": {
      post: {
        summary: "Weapon Master Analysis",
        description: "Critique of weapon-specific accuracy and loadout choices.",
        tags: ["AI AI Coaching (BETA)"],
        "x-credit-cost": 20,
        "x-tier": "PRO"
      }
    },
    "/v1/ai/rotation-review": {
      post: {
        summary: "Rotation Strategic Review",
        description: "Explains rotation scores and dead-zone avoidance.",
        tags: ["AI AI Coaching (BETA)"],
        "x-credit-cost": 15,
        "x-tier": "PRO"
      }
    },

    // --- GAME METADATA ---
    "/v1/game/stats": {
      get: {
        summary: "Unified Career Stats",
        description: "Fused wins/kills profile (FN-API + Osirion).",
        parameters: [{ name: "name", in: "query" }, { name: "accountId", in: "query" }],
        tags: ["Game Metadata"],
        "x-credit-cost": 5
      }
    },
    "/v1/game/ranked": {
      get: {
        summary: "Competitive Rank Profile",
        description: "Current division and global leaderboard standing.",
        parameters: [{ name: "name", in: "query" }, { name: "accountId", in: "query" }],
        tags: ["Game Metadata"],
        "x-credit-cost": 5
      }
    },
    "/v1/game/player/locker": {
      get: {
        summary: "Equipped Player Locker",
        description: "Currently equipped skin, backbling, and pickaxe (OAuth Required).",
        tags: ["Game Metadata"],
        "x-credit-cost": 10,
        "x-tier": "PRO"
      }
    },
    "/v1/game/shop": {
      get: {
        summary: "PathGen Item Shop",
        description: "Fused layouts with R2 image localized URLs.",
        tags: ["Game Metadata"],
        "x-credit-cost": 2
      }
    },
    "/v1/game/news": {
      get: {
        summary: "Personalized News Feed",
        description: "BR, Creative, and STW news triage.",
        tags: ["Game Metadata"],
        "x-credit-cost": 1
      }
    },
    "/v1/game/discovery": {
      get: {
        summary: "Creative Surface (Discovery)",
        description: "Trending islands and active CCU counts.",
        tags: ["Game Metadata"],
        "x-credit-cost": 2
      }
    },

    // --- AUTOMATION & IDENTITY ---
    "/v1/webhooks/subscribe": {
      post: {
        summary: "Register Event Webhook",
        description: "Trigger real-time push notifications for shop rotations or news.",
        tags: ["Automation"],
        "x-credit-cost": 5,
        "x-tier": "PRO"
      }
    },
    "/v1/billing/balance": {
      get: {
        summary: "Check Credit Balance",
        description: "View remaining USD-based credit balance for the account.",
        tags: ["Identity"]
      }
    }
  }
};

export function generateFullSpec() { return OPENAPI_SPEC; }
