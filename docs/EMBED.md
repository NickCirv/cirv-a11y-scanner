# Embedding the scan box on another site

This page documents a functional, unstyled scan box for embedding on
cirvgreen.com (or any approved origin). It is deliberately bare: the Cirvgreen
brand authority owns all visual treatment, so the snippet below ships zero CSS,
zero colors and zero layout. Apply site styles separately.

## Server prerequisites

Cross-origin calls to `POST /api/scan` are off by default. The deployed
scanner must set the `EMBED_ORIGINS` environment variable to a comma-separated
list of exact origins that may call it, for example:

```
EMBED_ORIGINS=https://cirvgreen.com
```

Matching is exact-origin (scheme + host + port). With the variable unset, the
server sends no CORS headers and browsers block the cross-origin request.
The endpoint is rate limited per client IP (default 10 scans per minute,
`SCAN_RATE_LIMIT`); the snippet handles the resulting `429` and shows the
server's retry message.

## Snippet

Replace `SCANNER_ORIGIN` with the deployed scanner origin. Everything else
works as-is.

```html
<div id="a11y-scan-box">
  <form id="a11y-scan-form">
    <label for="a11y-scan-url">Page URL to check</label>
    <input id="a11y-scan-url" name="url" type="url" required
           placeholder="https://example.com" autocomplete="url">
    <button id="a11y-scan-submit" type="submit">Run accessibility check</button>
  </form>
  <p id="a11y-scan-status" role="status" aria-live="polite"></p>
  <div id="a11y-scan-results" hidden>
    <h3 id="a11y-scan-score"></h3>
    <ul id="a11y-scan-list"></ul>
  </div>
</div>
<script>
(function () {
  var SCANNER_ORIGIN = 'https://SCANNER_ORIGIN'; // <-- deployed scanner origin

  var form = document.getElementById('a11y-scan-form');
  var input = document.getElementById('a11y-scan-url');
  var button = document.getElementById('a11y-scan-submit');
  var status = document.getElementById('a11y-scan-status');
  var results = document.getElementById('a11y-scan-results');
  var score = document.getElementById('a11y-scan-score');
  var list = document.getElementById('a11y-scan-list');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var url = input.value.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) { url = 'https://' + url; input.value = url; }

    button.disabled = true;
    results.hidden = true;
    status.textContent = 'Scanning ' + url + ' ...';

    fetch(SCANNER_ORIGIN + '/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url })
    })
      .then(function (r) {
        return r.json().then(function (body) { return { ok: r.ok, body: body }; });
      })
      .then(function (res) {
        if (!res.ok) {
          status.textContent = (res.body && res.body.error) || 'Scan failed.';
          return;
        }
        status.textContent = '';
        score.textContent = 'Score: ' + res.body.score + '/100 (' +
          res.body.fails + ' of ' + res.body.total + ' checks failed) for ' + res.body.url;
        while (list.firstChild) list.removeChild(list.firstChild);
        res.body.results.forEach(function (item) {
          var li = document.createElement('li');
          li.textContent = '[' + item.status.toUpperCase() + '] ' + item.check +
            ' (WCAG ' + item.wcag + '): ' + item.message +
            (item.element ? ' - ' + item.element : '');
          list.appendChild(li);
        });
        results.hidden = false;
      })
      .catch(function () {
        status.textContent = 'Could not reach the scanner. Try again shortly.';
      })
      .then(function () { button.disabled = false; });
  });
})();
</script>
```

## Behavior notes

- Results render as plain text (`textContent`), so markup excerpts returned by
  the API cannot inject HTML into the host page.
- A `429` response surfaces the server's "try again in Ns" message in the
  status line; no client-side queueing is attempted.
- The scanner checks an automatable subset of WCAG (see the README's
  "What it checks" section). Present embedded results with the same framing:
  a screening signal, not a conformance audit.
- Response shape consumed by the snippet: `score`, `fails`, `total`, `url`,
  and `results[]` with `status`, `check`, `wcag`, `message`, `element`
  (see `docs/REFERENCE.md`).
