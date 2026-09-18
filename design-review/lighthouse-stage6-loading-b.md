# Lighthouse

Run against the **production build** (`npm run build` + `next start -p 3004`),
using Playwright's bundled Chromium. Bold = meets the ≥ 90 target.

## Mobile

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | **91** | **100** | **100** | **100** | 2.8 s | 0 | 190 ms |
| Venues | **98** | **100** | **100** | **100** | 2.1 s | 0 | 60 ms |
| Venue detail | **91** | **100** | **100** | **100** | 3.2 s | 0.001 | 60 ms |
| Signature Events | **93** | **100** | **100** | **100** | 2.9 s | 0 | 60 ms |
| Wedding Guide | **91** | **98** | **100** | **100** | 3.0 s | 0 | 130 ms |
| Contact | **93** | **100** | **100** | **100** | 2.9 s | 0 | 60 ms |

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

Raw output: `design-review/lighthouse-stage6-loading-b.json`.
