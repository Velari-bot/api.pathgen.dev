const API_KEY = "rs_vgyqz2jwi203htfpug";
const BASE_URL = process.argv[2] || "https://api.pathgen.dev";

const endpoints = [
  { path: "/", name: "Root" },
  { path: "/v1/account/balance", name: "Account Balance", authenticated: true },
  { path: "/v1/account/keys", name: "List API Keys", authenticated: true },
  { path: "/v1/account/lookup?name=blackgirlslikeme", name: "Player Lookup" },
  { path: "/v1/game/map", name: "Game Map" },
  { path: "/v1/game/shop", name: "Item Shop" },
  { path: "/v1/game/weapons", name: "Weapons List" },
  { path: "/v1/game/news", name: "In-game News" },
  { path: "/v1/game/playlists", name: "Active Playlists" }
];

async function runTests() {
  console.log("🚀 Starting API Tests...");
  console.log(`Using Key: ${API_KEY}`);
  console.log(`Targeting: ${BASE_URL}\n`);

  for (const ep of endpoints) {
    const url = `${BASE_URL}${ep.path}`;
    const options = ep.authenticated 
      ? { headers: { "Authorization": `Bearer ${API_KEY}` } } 
      : {};

    try {
      const start = Date.now();
      const res = await fetch(url, options);
      const duration = Date.now() - start;
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = text;
      }

      console.log(`[${res.status}] ${ep.name.padEnd(20)} (${duration}ms)`);
      if (res.status !== 200) {
        console.log(`   ⚠️ Message: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
      }
    } catch (err) {
      console.log(`[ERR] ${ep.name.padEnd(20)} - ${err.message}`);
    }
  }
}

runTests();
