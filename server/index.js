'use strict';

const express = require('express');
const path = require('path');
const { fetchHtml, ScanError } = require('./fetch');
const { scan } = require('./checks');
const { createRateLimiter } = require('./rate-limit');

const app = express();
// Render terminates TLS at its proxy; trust the first hop so req.ip is the
// real client address (otherwise every visitor shares the proxy's IP bucket).
app.set('trust proxy', 1);
app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Opt-in CORS for the embed snippet (docs/EMBED.md). Off unless EMBED_ORIGINS
// is set to a comma-separated list of exact origins, e.g. "https://cirvgreen.com".
const EMBED_ORIGINS = String(process.env.EMBED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use('/api/scan', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && EMBED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '86400');
      return res.status(204).end();
    }
  }
  return next();
});

// Per-IP abuse guard on the one endpoint that triggers outbound fetches.
const scanLimiter = createRateLimiter({
  limit: Number(process.env.SCAN_RATE_LIMIT) || 10,
  windowMs: 60 * 1000,
});

app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Lightweight funnel tracking — logs to stdout (Render captures), no external analytics, no PII.
app.get('/api/click', (req, res) => {
  const cta = String((req.query && req.query.cta) || '').slice(0, 20).replace(/[^a-z0-9_-]/gi, '');
  console.log(JSON.stringify({ evt: 'click', cta: cta || 'unknown', ts: Date.now() }));
  res.status(204).end();
});

app.post('/api/scan', scanLimiter, async (req, res) => {
  const url = (req.body && req.body.url ? String(req.body.url) : '').trim();
  if (!url) return res.status(400).json({ error: 'Enter a URL to scan.' });
  try {
    const { html, finalUrl } = await fetchHtml(url);
    const result = scan(html);
    try { console.log(JSON.stringify({ evt: 'scan', host: new URL(finalUrl).hostname, score: result.score, fails: result.fails, ts: Date.now() })); } catch (_e) {}
    return res.json({ url: finalUrl, ...result });
  } catch (err) {
    if (err instanceof ScanError) return res.status(400).json({ error: err.message, code: err.code });
    console.error('scan error:', err && err.message);
    return res.status(500).json({ error: 'Something went wrong scanning that page.' });
  }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Cirv A11y Scanner on :${PORT}`));
}

module.exports = app;
