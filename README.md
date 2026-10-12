![Nicholas Ashkar — cirv-a11y-scanner](assets/nicholas-ashkar/banner.png)

# cirv-a11y-scanner

Provides a Cirvgreen web interface and API for selected static HTML accessibility checks.







<a id="deploy"></a>

<a id="api"></a>

<a id="post-apiscan"></a>

<a id="get-healthz"></a>

<a id="wcag-checks"></a>

<a id="structure"></a>

## What it does

- POST /api/scan accepts a url, fetches the page HTML and runs five static checks (listed below).
- Responds with a 0-100 score, pass/fail counts and per-finding detail.
- GET /healthz supports health checks.
- POST /api/scan is rate limited per client IP: 10 scans per minute by default (`SCAN_RATE_LIMIT`), then `429` with a `Retry-After` header.
- An unstyled scan box for embedding on an approved origin is documented in [docs/EMBED.md](docs/EMBED.md) (requires `EMBED_ORIGINS`).

## What it checks, and what it does not

This scanner runs an **automatable subset of WCAG checks against fetched
static HTML**. It is a screening tool, not a WCAG conformance audit and not
ADA certification. The five implemented checks (`server/checks.js`):

| Check | WCAG criterion | What is actually inspected |
| --- | --- | --- |
| Alt text | A (1.1.1) | `<img>` elements missing an `alt` attribute; empty `alt` passes with `role="presentation"`/`"none"` |
| Heading hierarchy | A (1.3.1) | Missing/multiple `H1`, skipped heading levels, no headings at all |
| Color contrast | AA (1.4.3) | Only elements with **inline** `style` declaring both `color` and `background-color` (hex/rgb); external CSS is not evaluated |
| Form labels | A (1.3.1) | Inputs/selects/textareas without a `label[for]`, wrapping label, `aria-label`/`aria-labelledby` or `title` |
| Link text | A (2.4.4) | Empty links without image alt, and generic text ("click here", "read more", ...) |

Not covered: rendered CSS, JavaScript-driven content, keyboard navigation,
focus management, ARIA semantics beyond the label checks above, media
alternatives, and the large majority of WCAG success criteria that require
human judgment.

**What feeds the 0-100 score:** each check group emits pass entries and up to
a capped number of fail entries (20 alt, 10 contrast, 15 labels, 15 links);
the score is `round(passes / total results * 100)`. It measures the share of
emitted findings that passed these five checks on one page. It is not a
compliance percentage.

## Quickstart

Prerequisites: Node.js `>=20` and npm.

```sh
git clone https://github.com/NickCirv/cirv-a11y-scanner.git
cd cirv-a11y-scanner
npm ci
npm start
```

**Captured behavior (local run, 12 October 2026):** the Express service
started on the configured port and `GET /healthz` returned `{"ok":true}`.

With the service running, a separate terminal can request its local health endpoint:

```sh
curl http://localhost:3000/healthz
```

To submit a scan, send JSON with a `url` field to `POST /api/scan`; that operation fetches the supplied site.



<a id="security"></a>

<a id="what-it-is-not"></a>

## Boundaries and data

Checks inspect fetched HTML, not a rendered browser session. Scores are screening signals, not WCAG or ADA certification. The scan endpoint fetches user-selected URLs through the repository's URL-safety checks (per-hop redirect revalidation against private/reserved ranges) and is rate limited per client IP.

## Development

The manifest defines `npm test` as:

```sh
node test.js
```

The suite covers the color math, the five checks, the SSRF guard, the rate limiter (unit, with a fake clock) and HTTP integration against a local listener (health check, embed CORS, the 11th-request `429`). Run on 12 October 2026 at this revision: `27 passed, 0 failed`.

See [implementation and command reference](docs/REFERENCE.md) for the package scripts and inspected interfaces, and [research record](docs/RESEARCH.md) for the pinned source, document decisions and unresolved checks.

This is a Cirvgreen product surface; its product-specific brand authority is preserved.

## License and contact

See [LICENSE](LICENSE) for the original terms and attribution. Legal text is unchanged.

[Nicholas Ashkar](https://nicholashkar.com/) · [Discuss a project](https://nicholashkar.com/#oxblood-contact)
