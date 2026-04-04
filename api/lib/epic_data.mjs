/**
 * Epic Games Protected Data Store
 * Fetches Phase 2 data (Ranked, Crown Wins, match history) from internal Epic APIs
 */

const FN_BASE = 'https://fngw-mcp-gc-livefn.ol.epicgames.com';
const ACCOUNT_BASE = 'https://account-public-service-prod.ol.epicgames.com';
const STATS_BASE = 'https://statsproxy-public-service-prod06.ol.epicgames.com';

export async function getRankedData(accountId, accessToken) {
    const url = `${STATS_BASE}/statsproxy/api/statsv2/account/${accountId}`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    if (!res.ok) return null;
    const data = await res.json();
    const stats = data?.stats?.all?.overall || {};
    const rankedKey = Object.keys(stats).find(k => k.includes('ranked_track_progression') && k.includes('br'));
    const rankedZBKey = Object.keys(stats).find(k => k.includes('ranked_track_progression') && k.includes('zb'));
    return {
        ranked_br: rankedKey ? parseRankedProgress(stats[rankedKey]) : null,
        ranked_zb: rankedZBKey ? parseRankedProgress(stats[rankedZBKey]) : null
    };
}

function parseRankedProgress(rawValue) {
    if (!rawValue) return null;
    const DIVISIONS = ['Bronze I', 'Bronze II', 'Bronze III', 'Silver I', 'Silver II', 'Silver III', 'Gold I', 'Gold II', 'Gold III', 'Platinum I', 'Platinum II', 'Platinum III', 'Diamond I', 'Diamond II', 'Diamond III', 'Elite', 'Champion', 'Unreal'];
    const divisionIndex = Math.floor(rawValue / 100);
    const progress = rawValue % 100;
    return { division: divisionIndex, division_name: DIVISIONS[divisionIndex] || 'Unknown', promotion_progress: progress, is_unreal: divisionIndex >= 17, raw_value: rawValue };
}

export async function getCrownWins(accountId, accessToken) {
    const url = `${FN_BASE}/fortnite/api/game/v2/profile/${accountId}/client/QueryProfile?profileId=athena&rvn=-1`;
    const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    if (!res.ok) return null;
    const data = await res.json();
    const profileStats = data?.profileChanges?.[0]?.profile?.stats?.attributes;
    return {
        crown_wins: profileStats?.s30_royale_with_crown_win_count || 0,
        crowns_picked_up: profileStats?.s30_royale_with_crown_pickup_count || 0
    };
}
