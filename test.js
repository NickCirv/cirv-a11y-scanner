'use strict';

// Lightweight assertions — no framework. Run: npm test
const assert = require('assert');
const { scan, parseColor, contrastRatio } = require('./server/checks');
const { isBlockedIp } = require('./server/fetch');

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); console.log(`  ok  ${name}`); pass++; }
  catch (e) { console.error(`  FAIL ${name}\n       ${e.message}`); fail++; }
};

// --- colour math ---
t('parseColor #fff', () => assert.deepStrictEqual(parseColor('#fff'), [255, 255, 255]));
t('parseColor #000000', () => assert.deepStrictEqual(parseColor('#000000'), [0, 0, 0]));
t('parseColor rgb()', () => assert.deepStrictEqual(parseColor('rgb(10, 20, 30)'), [10, 20, 30]));
t('contrast black/white = 21', () => assert.strictEqual(Math.round(contrastRatio([0,0,0],[255,255,255])), 21));

// --- alt text ---
t('missing alt fails', () => {
  const r = scan('<html><body><h1>x</h1><img src="a.jpg"></body></html>');
  assert(r.results.some((x) => x.check === 'Alt Text' && x.status === 'fail'));
});
t('decorative empty alt + role=presentation ok', () => {
  const r = scan('<html><body><h1>x</h1><img src="a.jpg" alt="" role="presentation"></body></html>');
  assert(r.results.some((x) => x.check === 'Alt Text' && x.status === 'pass'));
});

// --- headings ---
t('missing h1 fails', () => {
  const r = scan('<html><body><h2>only h2</h2></body></html>');
  assert(r.results.some((x) => x.check === 'Heading Hierarchy' && /missing an H1/.test(x.message)));
});
t('skipped level fails', () => {
  const r = scan('<html><body><h1>a</h1><h3>skip</h3></body></html>');
  assert(r.results.some((x) => /skipped: H1 to H3/.test(x.message)));
});
t('clean headings pass', () => {
  const r = scan('<html><body><h1>a</h1><h2>b</h2></body></html>');
  assert(r.results.some((x) => x.check === 'Heading Hierarchy' && x.status === 'pass'));
});

// --- contrast (inline) ---
t('low inline contrast fails', () => {
  const r = scan('<html><body><h1>x</h1><p style="color:#777;background-color:#888">low</p></body></html>');
  assert(r.results.some((x) => x.check === 'Color Contrast' && x.status === 'fail'));
});

// --- form labels ---
t('unlabeled input fails', () => {
  const r = scan('<html><body><h1>x</h1><form><input type="text" name="q"></form></body></html>');
  assert(r.results.some((x) => x.check === 'Form Labels' && x.status === 'fail'));
});
t('aria-label input passes', () => {
  const r = scan('<html><body><h1>x</h1><form><input type="text" aria-label="Search"></form></body></html>');
  assert(r.results.some((x) => x.check === 'Form Labels' && x.status === 'pass'));
});

// --- link text ---
t('generic link text fails', () => {
  const r = scan('<html><body><h1>x</h1><a href="/p">click here</a></body></html>');
  assert(r.results.some((x) => x.check === 'Link Text' && /Generic/.test(x.message)));
});

// --- score formula ---
t('score is 0-100 int', () => {
  const r = scan('<html><body><h1>a</h1><h2>b</h2></body></html>');
  assert(Number.isInteger(r.score) && r.score >= 0 && r.score <= 100);
});

// --- SSRF guard ---
t('blocks loopback', () => assert.strictEqual(isBlockedIp('127.0.0.1'), true));
t('blocks metadata IP', () => assert.strictEqual(isBlockedIp('169.254.169.254'), true));
t('blocks private 192.168', () => assert.strictEqual(isBlockedIp('192.168.1.1'), true));
t('allows public IP', () => assert.strictEqual(isBlockedIp('8.8.8.8'), false));

// --- rate limiter (unit, fake clock) ---
const { createRateLimiter } = require('./server/rate-limit');

const mockRes = () => ({
  headers: {}, statusCode: null, body: null,
  set(k, v) { this.headers[k] = v; return this; },
  status(c) { this.statusCode = c; return this; },
  json(b) { this.body = b; return this; },
});
const hit = (mw, ip) => {
  const res = mockRes();
  let nexted = false;
  mw({ ip }, res, () => { nexted = true; });
  return { res, nexted };
};

t('limiter allows up to the limit', () => {
  const mw = createRateLimiter({ limit: 3, windowMs: 60000, now: () => 1000 });
  for (let i = 0; i < 3; i++) assert.strictEqual(hit(mw, '1.2.3.4').nexted, true);
});
t('limiter 429s past the limit with Retry-After', () => {
  const mw = createRateLimiter({ limit: 3, windowMs: 60000, now: () => 1000 });
  for (let i = 0; i < 3; i++) hit(mw, '1.2.3.4');
  const { res, nexted } = hit(mw, '1.2.3.4');
  assert.strictEqual(nexted, false);
  assert.strictEqual(res.statusCode, 429);
  assert.strictEqual(res.body.code, 'rate_limited');
  assert.strictEqual(res.headers['Retry-After'], '60');
});
t('limiter resets after the window', () => {
  let ts = 1000;
  const mw = createRateLimiter({ limit: 2, windowMs: 60000, now: () => ts });
  hit(mw, '1.2.3.4'); hit(mw, '1.2.3.4');
  assert.strictEqual(hit(mw, '1.2.3.4').nexted, false);
  ts += 60000;
  assert.strictEqual(hit(mw, '1.2.3.4').nexted, true);
});
t('limiter buckets IPs independently', () => {
  const mw = createRateLimiter({ limit: 1, windowMs: 60000, now: () => 1000 });
  assert.strictEqual(hit(mw, '1.1.1.1').nexted, true);
  assert.strictEqual(hit(mw, '1.1.1.1').nexted, false);
  assert.strictEqual(hit(mw, '2.2.2.2').nexted, true);
});

// --- HTTP integration: scan endpoint rate limit + embed CORS (localhost only) ---
(async () => {
  process.env.EMBED_ORIGINS = 'https://cirvgreen.com';
  process.env.SCAN_RATE_LIMIT = '10';
  const app = require('./server/index');
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const at = async (name, fn) => {
    try { await fn(); console.log(`  ok  ${name}`); pass++; }
    catch (e) { console.error(`  FAIL ${name}\n       ${e.message}`); fail++; }
  };

  await at('GET /healthz returns ok', async () => {
    const r = await fetch(`${base}/healthz`);
    assert.strictEqual(r.status, 200);
    assert.deepStrictEqual(await r.json(), { ok: true });
  });
  await at('CORS preflight allowed for configured origin', async () => {
    const r = await fetch(`${base}/api/scan`, { method: 'OPTIONS', headers: { Origin: 'https://cirvgreen.com' } });
    assert.strictEqual(r.status, 204);
    assert.strictEqual(r.headers.get('access-control-allow-origin'), 'https://cirvgreen.com');
  });
  await at('POST carries CORS header for configured origin', async () => {
    const r = await fetch(`${base}/api/scan`, { method: 'POST', headers: { Origin: 'https://cirvgreen.com' } });
    assert.strictEqual(r.status, 400); // no url supplied; counts as 1 scan attempt
    assert.strictEqual(r.headers.get('access-control-allow-origin'), 'https://cirvgreen.com');
  });
  await at('no CORS header for unknown origin', async () => {
    const r = await fetch(`${base}/api/scan`, { method: 'POST', headers: { Origin: 'https://evil.example' } });
    assert.strictEqual(r.status, 400);
    assert.strictEqual(r.headers.get('access-control-allow-origin'), null);
  });
  await at('11th scan in a minute gets 429 + Retry-After', async () => {
    // 2 POSTs consumed above; send 8 more to reach the limit of 10.
    for (let i = 0; i < 8; i++) {
      const r = await fetch(`${base}/api/scan`, { method: 'POST' });
      assert.strictEqual(r.status, 400);
    }
    const r = await fetch(`${base}/api/scan`, { method: 'POST' });
    assert.strictEqual(r.status, 429);
    const retryAfter = Number(r.headers.get('retry-after'));
    assert(retryAfter >= 1 && retryAfter <= 60, `Retry-After out of range: ${retryAfter}`);
    const body = await r.json();
    assert.strictEqual(body.code, 'rate_limited');
  });

  server.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
