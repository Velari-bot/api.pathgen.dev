/**
 * PathGen Ranked Reconciler
 * Pairs Fortnite Battle Royale ranking progression from multiple sources.
 */

export function mergeRanked(fnRanked, osRanked) {
    if (!fnRanked && !osRanked) return null;

    // Reconciliation logic
    const osModes = osRanked?.modes || [];
    const fnModes = fnRanked?.battlePass || { level: 0, progress: 0 }; // Adjusted for FN stats structure
    
    // Normalize into a standard Division response
    const unifiedModes = osModes.map(m => {
        return {
            type: m.rankingType, // ranked-br, ranked-zb, etc.
            current: {
                division: m.currentDivision.division,
                name: m.currentDivision.divisionName,
                group: m.currentDivision.divisionGroupName,
                progress_percent: m.promotionProgress
            },
            highest: {
                division: m.highestDivision.division,
                name: m.highestDivision.divisionName,
                group: m.highestDivision.divisionGroupName
            },
            last_updated: m.lastUpdatedAt || new Date().toISOString()
        };
    });

    return {
        account_id: osRanked?.accountId || fnRanked?.account?.id || null,
        battle_pass: fnModes,
        ranks: unifiedModes,
        fused_at: new Date().toISOString()
    };
}
