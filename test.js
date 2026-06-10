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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
