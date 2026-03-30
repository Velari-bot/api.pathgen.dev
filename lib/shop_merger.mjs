/**
 * PathGen Shop Fusion Engine
 * Merges high-fidelity assets from Fortnite-API.com with 
 * rich layout metadata from Osirion.
 */

export function mergeShop(fnShop, osShop) {
    if (!fnShop && !osShop) return null;

    const fnOffers = fnShop?.featured?.entries || fnShop?.daily?.entries || [];
    const osOffers = osShop?.offers || [];

    // Map Osirion offers by their primary ID for quick reconciliation
    const osMap = new Map();
    osOffers.forEach(o => {
        if (o.primaryId) osMap.set(o.primaryId, o);
    });

    const unifiedOffers = (fnShop?.featured?.entries || []).concat(fnShop?.daily?.entries || []).map(offer => {
        const primaryId = offer.items?.[0]?.id;
        const osMatch = osMap.get(primaryId);

        return {
            ...offer,
            // Layer Osirion enhancements
            layout: osMatch?.layout || null,
            colors: osMatch?.colors || null,
            gifting_enabled: osMatch?.giftingEnabled ?? true,
            web_url: osMatch?.webUrl || null,
            os_banner: osMatch?.banner || null,
            catalog_raw: osMatch ? { 
                dev_name: osMatch.devName, 
                offer_id: osMatch.offerId 
            } : null
        };
    });

    return {
        hash: fnShop?.hash || osShop?.lang || 'v1',
        date: fnShop?.date || new Date().toISOString(),
        vbuxtitle: fnShop?.vbuckIcon || null,
        offers: unifiedOffers,
        sources: {
            fortnite_api: !!fnShop,
            osirion: !!osShop,
            fused_at: new Date().toISOString()
        }
    };
}
