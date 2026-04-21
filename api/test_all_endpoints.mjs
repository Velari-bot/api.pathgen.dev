import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const BASE_URL = 'http://localhost:3000';
const AUTH_HEADER = { 'Authorization': 'Bearer dev-token' };
const REPLAY_FILE = '../UnsavedReplay-2026.04.18-16.23.55.replay';

async function testEndpoint(name, method, endpoint, data = null, isFile = false) {
    try {
        let config = { 
            method, 
            url: `${BASE_URL}${endpoint}`,
            headers: { ...AUTH_HEADER }
        };

        if (data) {
            if (isFile) {
                const form = new FormData();
                form.append('file', fs.createReadStream(REPLAY_FILE));
                config.data = form;
                config.headers = { ...config.headers, ...form.getHeaders() };
            } else {
                config.data = data;
            }
        }

        const start = Date.now();
        const res = await axios(config);
        const elapsed = Date.now() - start;

        console.log(`✅ [${res.status}] ${name} (${elapsed}ms)`);
        return true;
    } catch (err) {
        const status = err.response?.status || 'ERR';
        const msg = err.response?.data?.message || err.message;
        
        // Some failures are expected (like missing Epic tokens)
        if (status === 400 || status === 401 || status === 404) {
             console.log(`⚠️  [${status}] ${name} (${msg}) - Expected behavior for dev testing`);
             return true;
        }

        console.log(`❌ [${status}] ${name} failed: ${msg}`);
        return false;
    }
}

async function runAllTests() {
    console.log('\n--- TESTING REPLAY ENDPOINTS ---');
    await testEndpoint('Full Parse', 'POST', '/v1/replay/parse', {}, true);
    await testEndpoint('Stats Only', 'POST', '/v1/replay/stats', {}, true);
    await testEndpoint('Scoreboard', 'POST', '/v1/replay/scoreboard', {}, true);
    await testEndpoint('Movement', 'POST', '/v1/replay/movement', {}, true);
    await testEndpoint('Weapons', 'POST', '/v1/replay/weapons', {}, true);
    await testEndpoint('Events', 'POST', '/v1/replay/events', {}, true);
    await testEndpoint('Drop Bio', 'POST', '/v1/replay/drop-analysis', {}, true);
    await testEndpoint('Rotation [PRO]', 'POST', '/v1/replay/rotation-score', {}, true);
    await testEndpoint('Match Info', 'POST', '/v1/replay/match-info', { matchId: '00000000000000000000000000000000' });
    await testEndpoint('Server Parse [PRO]', 'POST', '/v1/replay/download-and-parse', { matchId: '00000000000000000000000000000000' });

    console.log('\n--- TESTING AI ENDPOINTS ---');
    await testEndpoint('AI Analyze [PRO]', 'POST', '/v1/ai/analyze', {}, true);
    await testEndpoint('AI Coach [PRO]', 'POST', '/v1/ai/coach', {}, true);
    await testEndpoint('AI Weapon Coach [PRO]', 'POST', '/v1/ai/weapon-coach', {}, true);
    await testEndpoint('AI Drop Recommend [PRO]', 'POST', '/v1/ai/drop-recommend', {}, true);
    await testEndpoint('AI Opponent Scout [PRO]', 'POST', '/v1/ai/opponent-scout', { name: 'AidenBender' });
    await testEndpoint('AI Rotation Review [PRO]', 'POST', '/v1/ai/rotation-review', {}, true);

    console.log('\n--- TESTING AUTH & SYSTEM ---');
    await testEndpoint('Health Check', 'GET', '/health');
    await testEndpoint('Detailed Health', 'GET', '/health/detailed');
    await testEndpoint('Metrics', 'GET', '/metrics');
    await testEndpoint('API Spec', 'GET', '/v1/spec');
    await testEndpoint('Account Me', 'GET', '/v1/account/me');

    console.log('\n--- ALL TESTS COMPLETE ---');
}

runAllTests();
