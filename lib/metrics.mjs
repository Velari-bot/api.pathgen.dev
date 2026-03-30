import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

// High-level request counter
const httpRequestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests processed by PathGen',
    labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestCounter);

// Security alert counter (Track 401s and 403s specially)
const securityAlertCounter = new client.Counter({
    name: 'security_incidents_total',
    help: 'Tracks 401 Unauthorized or 403 Forbidden attempts',
    labelNames: ['type', 'reason'],
});
register.registerMetric(securityAlertCounter);

// Performance histogram
const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Latency of HTTP requests in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.1, 0.5, 1, 2, 5]
});
register.registerMetric(httpRequestDuration);

export const metrics = {
    register,
    httpRequestCounter,
    securityAlertCounter,
    httpRequestDuration
};
