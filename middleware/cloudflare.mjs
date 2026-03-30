/**
 * Cloudflare IP Filtering Middleware
 * Blocks all requests that do not originate from Cloudflare's public IP ranges.
 * 
 * Note: Cloudflare updates these IPs occasionally. 
 * For absolute security, you can fetch them from https://www.cloudflare.com/ips-v4
 */

const CLOUDFLARE_IPS = [
    '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
    '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
    '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
    '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22'
];

import ipRangeCheck from 'ip-range-check';

export const cloudflareOnly = (req, res, next) => {
    // Skip IP check in local development if needed, but in production, this is critical.
    if (process.env.NODE_ENV === 'development' || process.env.SKIP_CF_CHECK === 'true') {
        return next();
    }

    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (ipRangeCheck(clientIp, CLOUDFLARE_IPS)) {
        next();
    } else {
        console.warn(`SECURITY: Blocked attempt to bypass Cloudflare from IP: ${clientIp}`);
        res.status(403).json({
            error: true,
            code: 'FORBIDDEN',
            message: 'Direct IP access is not allowed. Please use the Cloudflare gateway.'
        });
    }
};
