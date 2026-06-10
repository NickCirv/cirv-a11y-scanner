'use strict';

const express = require('express');
const path = require('path');
const { fetchHtml, ScanError } = require('./fetch');
const { scan } = require('./checks');

const app = express();
app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.post('/api/scan', async (req, res) => {
  const url = (req.body && req.body.url ? String(req.body.url) : '').trim();
  if (!url) return res.status(400).json({ error: 'Enter a URL to scan.' });
  try {
    const { html, finalUrl } = await fetchHtml(url);
    const result = scan(html);
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
