import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.FORTNITE_API_KEY;

function get(path) {
    return new Promise((resolve, reject) => {
        const opts = {
            hostname: 'fortnite-api.com',
            path,
            method: 'GET',
            headers: {
                'Authorization': API_KEY || ''
            }
        };
        const req = https.request(opts, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch(e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

export async function getPlayerStats(displayName) {
    try {
        const res = await get(`/v2/stats/br/v2?name=${encodeURIComponent(displayName)}`);
        if (res.status !== 200) return null;
        
        const account = res.data?.account || {};
        const stats = res.data?.stats?.all || {};
        const overall = stats.overall || {};
        const solo = stats.solo || {};

        return {
            account_id: account.id || null,
            display_name: account.name || displayName,
            platform: detectPlatform(res.data),
            level: res.data?.battlePass?.level || null,
            wins: overall.wins || 0,
            kills: overall.kills || 0,
            kd: overall.kd || 0,
            matches: overall.matches || 0,
            win_rate: overall.winRate || 0,
            top10: overall.top10 || 0,
            minutes_played: overall.minutesPlayed || 0,
            solo_wins: solo.wins || 0,
            solo_kd: solo.kd || 0,
            crown_wins: null,
            ranked: null
        };
    } catch(e) {
        console.log(`Fortnite-API failed for ${displayName}:`, e.message);
        return null;
    }
}

function detectPlatform(data) {
    const stats = data?.stats || {};
    const kb = stats.keyboardMouse?.overall?.minutesPlayed || 0;
    const gp = stats.gamepad?.overall?.minutesPlayed || 0;
    const tc = stats.touch?.overall?.minutesPlayed || 0;

    if (kb >= gp && kb >= tc) return 'PC';
    if (gp >= kb && gp >= tc) return 'Console/Gamepad';
    if (tc >= kb && tc >= gp) return 'Mobile/Touch';
    return 'PC';
}
