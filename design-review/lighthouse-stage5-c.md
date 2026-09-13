# Lighthouse

Run against the **production build** (`npm run build` + `next start -p 3004`),
using Playwright's bundled Chromium. Bold = meets the ≥ 90 target.

## Mobile

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | 81 ⚠️ | **100** | **100** | **100** | 4.0 s | 0 | 230 ms |
| Venues | **91** | **100** | **100** | **100** | 3.2 s | 0 | 50 ms |
| Venue detail | 87 ⚠️ | **100** | **100** | **100** | 3.7 s | 0.001 | 70 ms |
| Signature Events | **91** | **100** | **100** | **100** | 3.1 s | 0 | 70 ms |
| Wedding Guide | **91** | **98** | **100** | **100** | 3.1 s | 0 | 120 ms |
| Contact | **94** | **100** | **100** | **100** | 2.8 s | 0 | 50 ms |

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

Raw output: `design-review/lighthouse-stage5-c.json`.
