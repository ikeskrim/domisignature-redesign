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
| Home | 83 ⚠️ | 83 ⚠️ | **100** | **100** | **100** | 3.8 s | 0.000 | 212 ms |
| Venues | **93** | **92** | **98** | **100** | **100** | 3.0 s | 0.000 | 51 ms |
| Venue detail | 88 ⚠️ | 87 ⚠️ | **100** | **100** | **100** | 3.5 s | 0.001 | 47 ms |
| Signature Events | **93** | **91** | **100** | **100** | **100** | 2.9 s | 0.000 | 44 ms |
| Wedding Guide | **92** | **91** | **98** | **100** | **100** | 3.0 s | 0.000 | 102 ms |
| Contact | **93** | **91** | **100** | **100** | **100** | 2.9 s | 0.000 | 42 ms |

## Desktop

| Page | Performance (median) | Performance (worst) | Accessibility | Best practices | SEO | LCP (median) | CLS | TBT |
|---|---|---|---|---|---|---|---|---|

## LCP element per page (mobile)

| Page | LCP element |
|---|---|
| Home | `<img alt="" loading="lazy" decoding="async" data-nimg="fill" class="grade ken object-cover" sizes="100vw" srcs` |
| Venues | `<img alt="" loading="lazy" decoding="async" data-nimg="fill" class="grade object-cover ken" style="position: a` |
| Venue detail | `<img alt="Thalasses — White walls, blue water, and a private beach fifty metres away." fetchpriority="high" de` |
| Signature Events | `<span data-word="true" class="inline-block">` |
| Wedding Guide | `<img alt="The Mountain Escape estate with its pools and panoramic mountain and sea v…" loading="lazy" decoding` |
| Contact | `<p class="prose-editorial">` |

Raw output: `design-review/lighthouse-main-ab-mobile.json`.
