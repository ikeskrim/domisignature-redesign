# Lighthouse

Run against the **production build** (`npm run build` + `next start -p 3004`),
using Playwright's bundled Chromium. Bold = meets the ≥ 90 target.

Source: local build 057bcde, next 15.5.25. Framework: next 15.5.25.
Runs per route: 3 (median reported; worst performance beside it; CLS and TBT are medians).
Drop level: ?drop=4 on every route (applies at phone widths only).
Throttling: simulated (the default).

## Mobile

| Page | Performance (median) | Performance (worst) | Accessibility | Best practices | SEO | LCP (median) | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| Home | 87 ⚠️ | 82 ⚠️ | **96** | **100** | **100** | 3.4 s | 0.000 | 266 ms |
| Venues | **92** | **92** | **96** | **100** | **100** | 3.1 s | 0.000 | 77 ms |
| Venue detail | **93** | **92** | **96** | **100** | **100** | 3.0 s | 0.001 | 98 ms |
| Signature Events | **93** | **92** | **96** | **100** | **100** | 3.0 s | 0.000 | 87 ms |
| Wedding Guide | **92** | **92** | **95** | **100** | **100** | 3.0 s | 0.000 | 136 ms |
| Contact | **94** | **94** | **96** | **100** | **100** | 2.9 s | 0.000 | 66 ms |

## Desktop

| Page | Performance (median) | Performance (worst) | Accessibility | Best practices | SEO | LCP (median) | CLS | TBT |
|---|---|---|---|---|---|---|---|---|

## LCP element per page (mobile)

| Page | LCP element |
|---|---|
| Home | `<span data-hero-line="true" class="block font-display text-hero font-light uppercase leading-[0.9] tracking-[…` |
| Venues | `<img alt="" fetchpriority="high" decoding="async" data-nimg="fill" class="grade-b object-cover" style="positio` |
| Venue detail | `<img alt="Thalasses — White walls, blue water, and a private beach fifty metres away." fetchpriority="high" de` |
| Signature Events | `<span class="inline-block">` |
| Wedding Guide | `<img alt="The Mountain Escape estate with its pools and panoramic mountain and sea v…" loading="lazy" decoding` |
| Contact | `<p class="prose-editorial">` |

Raw output: `design-review/lighthouse-stage6-drop4.json`.
