/**
 * PathGen OpenAPI 3.0 Specification Generator
 * Self-documenting JSON definition for every Fused and AI endpoint.
 */

export const OPENAPI_SPEC = {
  openapi: "3.0.0",
  info: {
    title: "PathGen Fortnite API",
    version: "1.2.0",
    description: "The world's most advanced, multi-source Fortnite metadata and AI coaching platform."
  },
  servers: [
    { url: "https://api.pathgen.dev", description: "Edge Production" }
  ],
  components: {
    securitySchemes: {
      ApiKey: {
        type: "apiKey",
        in: "header",
        name: "Authorization"
      }
    }
  },
  paths: {
    "/v1/replay/parse": {
      post: {
        summary: "Parse Replay Binary",
        description: "Extract high-performance positional, combat, and mechanical data from a .replay file.",
        parameters: [],
        responses: { "200": { description: "Replay JSON data" } },
        tags: ["Replay Engine"],
        "x-credit-cost": 20
      }
    },
    "/v1/ai/analyze": {
      post: {
        summary: "Standard AI Match Analysis",
        description: "Gemini-powered positional and tactical coaching scorecard.",
        tags: ["AI Coaching"],
        "x-credit-cost": 15,
        "x-beta-access": true
      }
    },
    "/v1/game/stats": {
      get: {
        summary: "Unified Multi-Source Stats",
        description: "True North player metrics reconciled from Fortnite-API and Osirion.",
        parameters: [
          { name: "name", in: "query", schema: { type: "string" } },
          { name: "accountId", in: "query", schema: { type: "string" } }
        ],
        tags: ["Game Metadata"],
        "x-credit-cost": 5
      }
    },
    "/v1/game/shop": {
      get: {
        summary: "Fused Item Shop",
        description: "Daily rotations with R2-localized assets and Osirion layout metadata.",
        tags: ["Game Metadata"],
        "x-credit-cost": 2
      }
    }
    // Note: Other 40+ paths available in the dynamic registry
  }
};

export function generateFullSpec() {
    // Dynamically extend with more details if needed
    return OPENAPI_SPEC;
}
