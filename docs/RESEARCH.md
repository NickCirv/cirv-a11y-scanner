# cirv-a11y-scanner — documentation research

Reviewed 21 September 2026. Public GitHub source only.

## Revision and scope

- Commit: [`e72e234bec16a74193aa507d1a43ad5295b9074e`](https://github.com/NickCirv/cirv-a11y-scanner/commit/e72e234bec16a74193aa507d1a43ad5295b9074e).
- Tree: `8ed40a7f118f5b27854b65eb0fa4eee178ad6928`; truncated: `false`.
- Capture: 9 of 9 eligible text files; all eligible text files.
- Method: package and entrypoint inspection, implementation-interface review, targeted behavior/limitation inspection, and test-source review. This is not an exhaustive correctness or security audit.
- Commands run against repository code: **none**. External services, deployment and npm publication were not verified.

## Claim and evidence map

| Documentation claim | Pinned evidence | Assessment |
| --- | --- | --- |
| Runtime, executable and development commands | [package.json](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/package.json) | Source declaration inspected; runtime unverified |
| Provides a Cirvgreen web interface and API for selected static HTML accessibility checks. | [server/index.js](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/server/index.js) · [server/checks.js](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/server/checks.js) | Implementation interfaces inspected; behavior not executed |
| POST /api/scan accepts a url; checks alternative text, headings, selected color pairs, form labels and link text; GET /healthz supports health checks. | [server/checks.js](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/server/checks.js), [server/fetch.js](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/server/fetch.js), [server/index.js](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/server/index.js) | Source-backed scope, not a test result |
| Checks inspect fetched HTML, not a rendered browser session. Scores are screening signals, not WCAG or ADA certification. The scan endpoint fetches user-selected URLs through the repository's URL-safety checks. | [server/checks.js](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/server/checks.js), [server/fetch.js](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/server/fetch.js), [server/index.js](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/server/index.js) | Material limits documented; service compatibility remains open |
| Existing checks | [test.js](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/test.js) | Test source read; no passing-run claim |

## Documentation inventory and disposition

| Existing document | Decision |
| --- | --- |
| [README.md](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/README.md) | Rewritten with source-specific purpose, direct checkout setup, limitations and verification status. Old section fragments retained where practical. |

Added `docs/REFERENCE.md` for the observed implementation and command surface, and this research record. Protected license and attribution files remain in their original locations without edits. No source or product UI was changed.

## Quality dimensions

| Dimension | Status | Evidence / next step |
| --- | --- | --- |
| Pinned provenance | Verified | Captured commit, tree and per-file hashes recorded below |
| Interface documentation | Partially verified | Source inspection only; run clean-checkout quickstart |
| Runtime behavior | Unverified | No repository execution in this review |
| Test results | Unverified | Existing tests were not run |
| Deployment / package availability | Unverified | No remote publish or live-service check |
| Visual / link checks | Unverified | Portfolio renderer and independent QA are separate from this authoring step |

## Unresolved issues

Checks inspect fetched HTML, not a rendered browser session. Scores are screening signals, not WCAG or ADA certification. The scan endpoint fetches user-selected URLs through the repository's URL-safety checks.

## Captured source inventory

This lists captured provenance, not a claim that every line received a full audit. Binary/generated/excluded files are outside the eligible text capture.

| File | SHA-256 | Bytes |
| --- | --- | --- |
| [LICENSE](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/LICENSE) | `68729cab364d82364078b08d8580ccfa51dc69c81a7d64e8d8d47a1da6c9349d` | 1072 |
| [README.md](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/README.md) | `aaf4d9b4320180ca3ba6a4569031a57c5a1e965ee113cc9152bee013366f3057` | 5159 |
| [package.json](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/package.json) | `56a8c97ed0c7f5fe76404d653dcfa4d6657a765c98c7385dfeced6a1021a5c37` | 443 |
| [.github/workflows/ci.yml](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/.github/workflows/ci.yml) | `e818f4e6bd805f798665dbbf04964d02f12fc59dd7f18903ad63d26d374ae3f0` | 380 |
| [render.yaml](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/render.yaml) | `3e95d5293e70e0011ef7dc290890c34fbb5be719efdfa66747f814cdf3c4728c` | 215 |
| [test.js](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/test.js) | `19746fe6215815ffd928e39f4b3ded73322aa4020f3f551d0692c44d1645b9a8` | 3496 |
| [server/checks.js](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/server/checks.js) | `20d2fcc2960ba6a71d36989b97ff8192654b0e5fb37c94172099e13c73ab17b8` | 8165 |
| [server/fetch.js](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/server/fetch.js) | `576df9bc8c2f9b3b3429dcc4ca5f553ccf00bb65d2dc5a7fc7ada6e4c9ef26af` | 3972 |
| [server/index.js](https://github.com/NickCirv/cirv-a11y-scanner/blob/e72e234bec16a74193aa507d1a43ad5295b9074e/server/index.js) | `5d37d9670a5abb5d6ab020926648dc18bc861dd4081ca6c79e3a8e263f4fdba0` | 1662 |

## Extended capture

The final capture includes 10 eligible text files, including HTML. Application pages and generated site output are preserved as product implementation, not rewritten as repository documentation. The final portfolio quality report verifies every captured file hash.
