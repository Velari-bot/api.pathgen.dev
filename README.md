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

## 📊 5. Other Endpoints
*   `/v1/replay/parse`: Advanced parsing of Fortnite replay files including movement, scoreboard, and weapon data.
*   `/v1/ai/coach`: AI-powered performance analysis for single matches (30 Credits).
*   `/v1/ai/session-coach`: Tournament-style session analysis for up to 6 matches (50 Credits).
*   `/v1/ai/opponent-scout`: Competitive scouting reports on any player via username (25 Credits).
*   `/v1/game/news`: Live in-game news feed.
*   `/v1/game/playlists`: Active game modes and playlist rotation.

*For full endpoint details and real-time testing, visit our [API Explorer](https://platform.pathgen.dev/explorer).*
