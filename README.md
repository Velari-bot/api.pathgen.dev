# PathGen Developer Engine 🗺️🚀✨🏗️🏜️

Official high-performance backend powering the next generation of Fortnite analytics and interactive map experiences.

---

## 🏗️ 1. Hypermap Tiling Engine
The PathGen Tiling Engine generates **building-level** details (Hypermap) from the live Fortnite map using **Lanczos3 high-fidelity resampling**.

### **Access Pattern**
```
GET https://api.pathgen.dev/v1/game/tiles/{z}/{x}/{y}.png?key=YOUR_API_KEY
```

### **Billing Model: One-Time Map Pass**
We use a developer-friendly "Daily Pass" system to make map building affordable.
*   **Unlock**: **30 Credits ($0.30)** for the very first tile requested of the day.
*   **Unlimited**: For the next **24 hours**, every other tile request for that map version is **Free (0 Credits)**.
*   **Efficiency**: A developer can browse the entire 1,365-tile 8K map for less than the cost of a soda.

---

## 🎨 2. Map Configuration (Zero-Config)
Use the `/v1/game/map` endpoint to automatically initialize your map environment.

```
GET https://api.pathgen.dev/v1/game/map?key=YOUR_API_KEY
```

**Response Snapshot:**
```json
{
  "status": 200,
  "season": "Chapter 7 Season 2",
  "tile_url": "https://api.pathgen.dev/v1/game/tiles/{z}/{x}/{y}.png?key=YOUR_API_KEY",
  "max_zoom": 5,
  "world_bounds": { "min_x": -131072, "max_x": 131072, "min_y": -131072, "max_y": 131072 },
  "pois": [ { "name": "New Sanctuary", "x": 70000, "y": 30000 } ]
}
```

---

## 🏃 3. Developer Integration (3 Lines of Code)
Initialize a world-class interactive map in your frontend in under 30 minutes:

```javascript
// A. Initialize Leaflet Simple CRS
const map = L.map('map', { crs: L.CRS.Simple, minZoom: 0, maxZoom: 5 });

// B. Plug in PathGen Tile Server
L.tileLayer(config.tile_url, { tileSize: 256, noWrap: true, keepBuffer: 4 }).addTo(map);

// C. Center and Zoom
map.setView(L.CRS.Simple.pointToLatLng(L.point(4096, 4096), 5), 1);
```

### **Coordinate Conversion Helper**
```javascript
function worldToLatLng(worldX, worldY) {
  const WORLD_MIN = -131072;
  const WORLD_SIZE = 262144;
  const MAP_PX = 8192; // 256 * 2^5
  
  const px = ((worldX - WORLD_MIN) / WORLD_SIZE) * MAP_PX;
  const py = ((worldY - WORLD_MIN) / WORLD_SIZE) * MAP_PX;
  
  return L.CRS.Simple.pointToLatLng(L.point(px, py), 5);
}
```

---

## 🔐 4. Authentication
All requests must include your API key either as a Bearer Token or a URL parameter:
1. **Header**: `Authorization: Bearer rs_...`
2. **URL**: `https://api.pathgen.dev/v1/game/map?key=rs_...`

---

## 📋 5. Comprehensive API Reference (v1.2.6)

All requests require `?key=YOUR_API_KEY` or `Authorization: Bearer <JWT>`.

### 🧪 Account & Billing
| Method | Endpoint | Cost | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/account/me` | Free | Full profile (balance, tier, stats) |
| `GET` | `/v1/account/balance` | Free | Current credit balance only |
| `GET` | `/v1/account/keys` | Free | List all active API keys |
| `POST` | `/v1/account/keys` | Free | Generate a new RS (secure) key |
| `DELETE` | `/v1/account/keys/{id}` | Free | Revoke an existing key |
| `GET` | `/v1/billing/history` | Free | Transaction & top-up history |
| `POST` | `/v1/billing/checkout` | Free | Generate Stripe Checkout for credits |

### 🌍 Game World Intelligence
| Method | Endpoint | Cost | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/game/stats` | **5 Credits** | **Premium** Unified Stats (Merged FnAPI + Osirion) |
| `GET` | `/v1/game/stats/br/v2` | 2 Credits | Standard BR stats lookup |
| `GET` | `/v1/game/lookup` | 2 Credits | Simple player existence check |
| `GET` | `/v1/game/ranked` | 5 Credits | Ranked history & current progression |
| `GET` | `/v1/game/shop` | 1 Credit | Fused item shop data |
| `GET` | `/v1/game/news` | 1 Credit | Game news & updates feed |
| `GET` | `/v1/game/weapons` | 1 Credit | Current loot pool & weapon stats |
| `GET` | `/v1/game/playlists`| 1 Credit | Active game modes & LTMs |

### 📦 Replay & Match Analysis
*Upload a `.replay` file via POST Multipart Form Data.*

| Method | Endpoint | Cost | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/replay/parse` | 20 Credits | Full match JSON payload |
| `POST` | `/v1/replay/stats` | 5 Credits | Lightweight scoreboard & combat stats |
| `POST` | `/v1/replay/movement` | 8 Credits | Rotation paths & coordinate logs |
| `POST` | `/v1/replay/weapons` | 8 Credits | Weapon-by-weapon performance audit |
| `POST` | `/v1/replay/events` | 10 Credits | Full elimination feed & timeline |
| `POST` | `/v1/replay/rotation-score`| 25 Credits | Zone survival & storm-edge efficiency |
| `POST` | `/v1/replay/opponents` | 30 Credits | Skill assessment of every player in lobby |

### 🤖 AI Coaching & Session (Beta)
| Method | Endpoint | Cost | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/session/analyze` | 50 Credits | Multi-match session summary report |
| `POST` | `/v1/session/auto-analyze`| 75 Credits | **Auto-fetch** tournament history from Epic |
| `POST` | `/v1/ai/coach` | 30 Credits | Deep AI gameplay critique (Vertex AI) |
| `POST` | `/v1/ai/weapon-coach` | 20 Credits | AI loadout optimization advice |
| `POST` | `/v1/ai/opponent-scout` | 25 Credits | AI scouting report on rival player names |

### ⚡ Enhanced Intelligence (Beta)
| Method | Endpoint | Cost | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/replay/enhanced/heatmap`| 15 Credits | Map density grid of movements/kills |
| `POST` | `/v1/replay/enhanced/timeline`| 10 Credits | Unified event feed (Storm/Kills/Movement) |
| `POST` | `/v1/replay/enhanced/compare` | 25 Credits | Side-by-side comparison of two replays |
| `POST` | `/v1/replay/enhanced/clutch` | 20 Credits | Detects peak-performance clutch moments |

---

*For full interactive documentation, visit our [API Explorer](https://platform.pathgen.dev/explorer).*

