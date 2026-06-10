# Cirv A11y Scanner

Free public WCAG/ADA accessibility scanner — the top-of-funnel lead magnet for the [Cirv Guard](https://wordpress.org/plugins/cirv-guard/) WordPress plugin.

Enter a URL → fetch the page → run 5 WCAG checks → return a 0–100 score + issue list → CTA to install Cirv Guard.

## Why it exists
The plugin can only be found by people already searching WP.org. This hosted tool is found via Google ("free ADA accessibility checker"), is shareable, and demonstrates Guard's value *before* install. The 5 checks are ported rule-for-rule from `cirv-guard.php` so the scanner and the plugin agree.

## Checks (matches the plugin)
- Alt text — WCAG 1.1.1
- Heading hierarchy — WCAG 1.3.1
- Inline colour contrast — WCAG 1.4.3 *(inline `style` only, same as the free plugin; full rendered-CSS contrast is Guard Pro)*
- Form labels — WCAG 1.3.1
- Link text — WCAG 2.4.4

## Run locally
```bash
npm install
npm test        # unit tests (checks + SSRF guard)
npm start       # serves on :3000
```

## Deploy (Render)
`render.yaml` is included — Node web service, free plan, `npm install` → `node server/index.js`. Connect the repo in Render; no env vars required.

## Security
`server/fetch.js` blocks SSRF: only http/https, resolves the host and rejects private/loopback/link-local/metadata IP ranges, re-validating on every redirect hop. 12s timeout, 3 MB cap, HTML-only. The UI builds results with DOM methods (no `innerHTML`), so untrusted scanned-page content can't execute.

## Structure
```
server/fetch.js   safe remote fetch + SSRF guard
server/checks.js  the 5 WCAG checks + score (ported from cirv-guard.php)
server/index.js   express: GET / (static), POST /api/scan
public/index.html single-page UI
test.js           assertions
```
