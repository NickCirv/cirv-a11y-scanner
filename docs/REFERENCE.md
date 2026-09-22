# cirv-a11y-scanner — implementation reference

Source revision: `e72e234bec16a74193aa507d1a43ad5295b9074e`. This reference records source declarations; it is not a transcript of a successful run.

## Entrypoint and runtime

[package.json](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/package.json) declares `server/index.js`. Node.js `>=20` and npm.

## Supported workflow

POST /api/scan accepts a url; checks alternative text, headings, selected color pairs, form labels and link text; GET /healthz supports health checks.

Checks inspect fetched HTML, not a rendered browser session. Scores are screening signals, not WCAG or ADA certification. The scan endpoint fetches user-selected URLs through the repository's URL-safety checks.

## HTTP API

Start with `npm start`; `PORT` defaults to `3000`. The Express app serves the repository's `public/` directory and accepts JSON bodies up to 16 KB.

| Request | Input | Response |
| --- | --- | --- |
| `GET /healthz` | None | `200` with `{"ok":true}` |
| `POST /api/scan` | JSON object with a public HTTP(S) `url` | `200` with final URL and static findings |
| `GET /api/click?cta=NAME` | Optional CTA label; sanitized and limited to 20 characters | `204`; logs an event to stdout |

Example request against your local server; this triggers an outbound fetch of the supplied URL:

```sh
curl -X POST http://localhost:3000/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com"}'
```

Response fields, derived from the handler and scanner rather than a live scan:

| Field | Meaning |
| --- | --- |
| `url` | Final fetched URL after permitted redirects |
| `score` | Rounded `passes / total * 100`, or 0 for no results |
| `passes`, `fails`, `total` | Counts of individual check results |
| `results` | Array of result objects |
| `results[].status` | `pass` or `fail` |
| `results[].check`, `.wcag` | Check label and associated criterion label |
| `results[].message`, `.element` | Explanation and relevant markup excerpt |

An illustrative result entry has this shape; it is not a measured result from example.com:

```json
{"status":"fail","check":"Alt Text","wcag":"A (1.1.1)","message":"Image missing alt attribute","element":"<img src=\"product.png\">"}
```

## Errors and check boundaries

| HTTP status | Condition / body |
| --- | --- |
| `400` | Missing URL: `{"error":"Enter a URL to scan."}` |
| `400` | Known fetch/validation error: object with `error` and `code` |
| `500` | Unexpected scan error: `{"error":"Something went wrong scanning that page."}` |

Known `code` values in the fetch module are `bad_url`, `bad_scheme`, `blocked`, `dns`, `fetch`, `not_html` and `redirects`. Express can also reject malformed or oversized JSON before the route handler. The fetcher rejects internal/private destinations and limits redirects; this source review does not certify the guard against every network edge case.

The five check groups inspect image alternatives, heading hierarchy, inline-style color contrast, form labels and link text. They do not render external CSS, run JavaScript, interact with consent controls or evaluate keyboard navigation. An issue-based score is a triage aid, not a conformance certificate.

## Package scripts

| Script | Exact command |
| --- | --- |
| `start` | `node server/index.js` |
| `test` | `node test.js` |

## Environment references

The implementation reads `PORT`. Some are optional or mode-specific; inspect their call sites before configuring a service. Credentials and endpoint values are never supplied by this document.

## Implementation sources

[server/index.js](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/server/index.js).

## Verification boundary

No repository code, tests, network operation, hook installer or migration was executed for this review. Source inspection supports the documented interface; runtime correctness and external-service compatibility remain unverified.
