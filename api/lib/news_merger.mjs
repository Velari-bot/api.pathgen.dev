/**
 * PathGen News Triage Engine
 * Unifies Fortnite Battle Royale, Creative, and STW news from multiple sources.
 */

export function mergeNews(fnNews, osNews) {
    if (!fnNews && !osNews) return null;

    const fnBrNews = fnNews?.br?.motds || [];
    const osBrNews = osNews?.news || []; // Osirion main feed

    const unifiedBrNews = fnBrNews.map(m => {
        // Find matching entry in Osirion by ID if possible
        const osMatch = osBrNews.find(o => o.id === m.id || o.title === m.title);
        return {
            ...m,
            os_teaser: osMatch?.teaserTitle || null,
            os_image: osMatch?.teaserImage || null,
            community_post: osMatch?.communityPostId || null
        };
    });

    return {
        br: {
            motds: unifiedBrNews,
            last_modified: fnNews?.br?.lastModified || new Date().toISOString()
        },
        stw: fnNews?.stw || {},
        creative: {
            motds: fnNews?.creative?.motds || [],
            osirion_creative: osNews?.news?.filter(n => n.mode === 'creative') || [] // Add Osirion-specific creative news
        },
        fused_at: new Date().toISOString()
    };
}
