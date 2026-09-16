# Lighthouse

Run against the **production build** (`npm run build` + `next start -p 3004`),
using Playwright's bundled Chromium. Bold = meets the ≥ 90 target.

Source: local build origin/main 1757bbe, next 15.5.22 (the published site). Framework: next 15.5.22.
Runs per route: 3 (median reported; worst performance beside it; CLS and TBT are medians).
Drop level: none requested.
Throttling: simulated (the default).

## Mobile

| Page | Performance (median) | Performance (worst) | Accessibility | Best practices | SEO | LCP (median) | CLS | TBT |
|---|---|---|---|---|---|---|---|---|

## Desktop

| Page | Performance (median) | Performance (worst) | Accessibility | Best practices | SEO | LCP (median) | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| Home | **98** | **98** | **100** | **100** | **100** | 0.8 s | 0.000 | 22 ms |
| Venues | **99** | **99** | **98** | **100** | **100** | 0.6 s | 0.000 | 0 ms |
| Venue detail | **98** | **98** | **100** | **100** | **100** | 0.7 s | 0.001 | 0 ms |
| Signature Events | **99** | **99** | **100** | **100** | **100** | 0.5 s | 0.000 | 0 ms |
| Wedding Guide | **99** | **99** | **98** | **100** | **100** | 0.5 s | 0.000 | 0 ms |
| Contact | **99** | **99** | **100** | **100** | **100** | 0.6 s | 0.000 | 0 ms |

## LCP element per page (mobile)

| Page | LCP element |
|---|---|


Raw output: `design-review/lighthouse-main-ab-desktop.json`.
