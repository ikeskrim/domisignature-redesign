# Lighthouse

Run against the **production build** (`npm run build` + `next start -p 3004`),
using Playwright's bundled Chromium. Bold = meets the ≥ 90 target.

## Mobile

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | 81 ⚠️ | **100** | **100** | **100** | 3.8 s | 0 | 240 ms |
| Venues | **92** | **98** | **100** | **100** | 3.0 s | 0 | 70 ms |
| Venue detail | 86 ⚠️ | **100** | **100** | **100** | 3.7 s | 0.001 | 80 ms |
| Signature Events | **91** | **100** | **100** | **100** | 3.1 s | 0 | 100 ms |
| Wedding Guide | **91** | **98** | **100** | **100** | 2.9 s | 0 | 140 ms |
| Contact | **92** | **100** | **100** | **100** | 2.9 s | 0 | 70 ms |

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

Raw output: `design-review/lighthouse-stage4-early.json`.
