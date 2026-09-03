# Lighthouse

Run against the **production build** (`npm run build` + `next start -p 3004`),
using Playwright's bundled Chromium. Bold = meets the ≥ 90 target.

## Mobile

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | 83 ⚠️ | **100** | **100** | **100** | 3.9 s | 0 | 180 ms |
| Venues | **93** | **98** | **100** | **100** | 3.0 s | 0 | 40 ms |
| Venue detail | 86 ⚠️ | **100** | **100** | **100** | 3.9 s | 0.001 | 30 ms |
| Signature Events | **97** | **100** | **100** | **100** | 2.4 s | 0 | 40 ms |
| Wedding Guide | 88 ⚠️ | **98** | **100** | **100** | 3.6 s | 0 | 70 ms |
| Contact | **94** | **100** | **100** | **100** | 2.8 s | 0 | 40 ms |

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

Raw output: `design-review/lighthouse.json`.
