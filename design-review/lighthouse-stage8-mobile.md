# Lighthouse

Run against the **production build** (`npm run build` + `next start -p 3004`),
using Playwright's bundled Chromium. Bold = meets the ≥ 90 target.

Source: local build 23f1297, next 15.5.25, sharp 0.35.4. Framework: next 15.5.25.
Runs per route: 5 (median reported; worst performance beside it; CLS and TBT are medians).
Drop level: ?drop=0 on every route (applies at phone widths only).
Throttling: simulated (the default).

## Mobile

| Page | Performance (median) | Performance (worst) | Accessibility | Best practices | SEO | LCP (median) | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| Home | 85 ⚠️ | 84 ⚠️ | **100** | **100** | **100** | 3.4 s | 0.000 | 255 ms |
| Venues | **91** | **91** | **100** | **100** | **100** | 3.2 s | 0.000 | 74 ms |
| Venue detail | **91** | **90** | **100** | **100** | **100** | 3.2 s | 0.001 | 101 ms |
| Signature Events | **91** | **91** | **100** | **100** | **100** | 3.2 s | 0.000 | 81 ms |
| Wedding Guide | **90** | **90** | **100** | **100** | **100** | 3.2 s | 0.000 | 151 ms |
| Contact | **92** | **91** | **100** | **100** | **100** | 3.0 s | 0.000 | 79 ms |

## Desktop

| Page | Performance (median) | Performance (worst) | Accessibility | Best practices | SEO | LCP (median) | CLS | TBT |
|---|---|---|---|---|---|---|---|---|

## LCP element per page (mobile)

| Page | LCP element |
|---|---|
| Home | `<p class="max-w-sm text-[0.95rem] leading-relaxed text-[var(--text-primary)]">` |
| Venues | `<img alt="" fetchpriority="high" decoding="async" data-nimg="fill" class="grade-b object-cover" style="positio` |
| Venue detail | `<img alt="Thalasses — White walls, blue water, and a private beach fifty metres away." fetchpriority="high" de` |
| Signature Events | `<span class="inline-block">` |
| Wedding Guide | `<img alt="The Mountain Escape estate with its pools and panoramic mountain and sea v…" loading="lazy" decoding` |
| Contact | `<p class="prose-editorial">` |

Raw output: `design-review/lighthouse-stage8-mobile.json`.
