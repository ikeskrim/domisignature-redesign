# Lighthouse

Run against the **production build** (`npm run build` + `next start -p 3004`),
using Playwright's bundled Chromium. Bold = meets the ≥ 90 target.

## Mobile

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | **90** | **100** | **100** | **100** | 3.0 s | 0 | 150 ms |
| Venues | **93** | **98** | **100** | **100** | 3.0 s | 0 | 30 ms |
| Venue detail | 87 ⚠️ | **100** | **100** | **100** | 3.7 s | 0.001 | 30 ms |
| Signature Events | **92** | **100** | **100** | **100** | 3.1 s | 0 | 40 ms |
| Wedding Guide | **92** | **98** | **100** | **100** | 3.0 s | 0 | 70 ms |
| Contact | **92** | **100** | **100** | **100** | 3.0 s | 0 | 20 ms |

## Desktop

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|

## LCP element per page (mobile)

| Page | LCP element |
|---|---|
| Home | `—` |
| Venues | `—` |
| Venue detail | `—` |
| Signature Events | `—` |
| Wedding Guide | `—` |
| Contact | `—` |

Raw output: `design-review/lighthouse-stage4.json`.
