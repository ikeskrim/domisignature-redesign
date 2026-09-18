# Lighthouse

Run against the **production build** (`npm run build` + `next start -p 3004`),
using Playwright's bundled Chromium. Bold = meets the ≥ 90 target.

## Mobile

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | 84 ⚠️ | **100** | **100** | **100** | 3.8 s | 0 | 180 ms |
| Venues | **93** | **100** | **100** | **100** | 3.0 s | 0 | 40 ms |
| Venue detail | 86 ⚠️ | **100** | **100** | **100** | 3.8 s | 0.001 | 40 ms |
| Signature Events | **91** | **100** | **100** | **100** | 3.2 s | 0 | 50 ms |
| Wedding Guide | **91** | **98** | **100** | **100** | 3.1 s | 0 | 110 ms |
| Contact | **92** | **100** | **100** | **100** | 3.0 s | 0 | 50 ms |

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

Raw output: `design-review/lighthouse-stage6-ref-c.json`.
