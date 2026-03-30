/**
 * PathGen Unified Stats Engine
 * Reconciles and merges data from Fortnite-API.com and Osirion
 */

export function mergeStats(fnStats, osStats) {
    if (!fnStats && !osStats) return null;

    // Use higher value for common fields (indicating most recent update)
    const pickHigher = (a, b) => {
        const valA = Number(a) || 0;
        const valB = Number(b) || 0;
        return Math.max(valA, valB);
    };

    const fnOverall = fnStats?.stats?.all?.overall || {};
    const osOverall = osStats?.groupedStats?.all?.overall || {}; // Adjust structure based on actual Osirion output
    
    // Cross-source reconciliation
    const wins = pickHigher(fnOverall.wins, osOverall.wins);
    const kills = pickHigher(fnOverall.kills, osOverall.kills);
    const matches = pickHigher(fnOverall.matches, osOverall.matches);
    
    // Calculate derived stats for consistency
    const kd = matches > 0 ? Number((kills / (matches - wins || 1)).toFixed(2)) : 0;
    const winRate = matches > 0 ? Number(((wins / matches) * 100).toFixed(2)) : 0;

    return {
        account: {
            id: fnStats?.account?.id || osStats?.accountId || null,
            name: fnStats?.account?.name || osStats?.displayName || null
        },
        battle_pass: {
            level: pickHigher(fnStats?.battlePass?.level, osStats?.seasonLevels?.[0]?.level),
            progress: fnStats?.battlePass?.progress || osStats?.seasonLevels?.[0]?.levelProgressPctl || 0
        },
        stats: {
            overall: {
                wins,
                kills,
                matches,
                kd,
                win_rate: winRate,
                minutes_played: fnOverall.minutesPlayed || 0,
                last_modified: fnOverall.lastModified || new Date().toISOString()
            },
            // Include unique Osirion data
            season_history: osStats?.seasonLevels || [],
            // Include unique Fortnite-API data
            placements: {
                top3: fnOverall.top3 || 0,
                top5: fnOverall.top5 || 0,
                top10: fnOverall.top10 || 0,
                top25: fnOverall.top25 || 0
            }
        },
        sources: {
            fortnite_api: !!fnStats,
            osirion: !!osStats,
            merged_at: new Date().toISOString()
        }
    };
}
