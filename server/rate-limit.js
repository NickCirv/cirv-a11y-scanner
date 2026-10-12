'use strict';

// Minimal in-memory per-IP rate limiter for the scan endpoint.
// Fixed window: `limit` requests per `windowMs` per client IP.
// In-memory by design: the service runs as a single instance (Render free
// plan), so no shared store is needed. State resets on restart.

const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW_MS = 60 * 1000;
const MAX_TRACKED_CLIENTS = 10000;

function createRateLimiter(options) {
  const opts = options || {};
  const limit = opts.limit || DEFAULT_LIMIT;
  const windowMs = opts.windowMs || DEFAULT_WINDOW_MS;
  const now = opts.now || Date.now;
  const maxClients = opts.maxClients || MAX_TRACKED_CLIENTS;

  const hits = new Map(); // ip -> { count, windowStart }

  function middleware(req, res, next) {
    const ip = req.ip || (req.socket && req.socket.remoteAddress) || 'unknown';
    const ts = now();

    const prev = hits.get(ip);
    const entry =
      prev && ts - prev.windowStart < windowMs
        ? { count: prev.count + 1, windowStart: prev.windowStart }
        : { count: 1, windowStart: ts };
    hits.set(ip, entry);

    if (entry.count > limit) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((entry.windowStart + windowMs - ts) / 1000)
      );
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: `Too many scans from your address. Try again in ${retryAfterSec}s.`,
        code: 'rate_limited',
      });
    }

    // Opportunistic cleanup so the map cannot grow without bound.
    if (hits.size > maxClients) {
      for (const [key, value] of hits) {
        if (ts - value.windowStart >= windowMs) hits.delete(key);
      }
    }

    return next();
  }

  middleware.reset = () => hits.clear();
  return middleware;
}

module.exports = { createRateLimiter };
