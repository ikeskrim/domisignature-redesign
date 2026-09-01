# Phase 5 — QA & ship-readiness

Everything below was measured against the **production build**
(`npm run build` + `next start -p 3004`), never the dev server.

---

## 1. Build

`npm run build` — **passes**. 23 routes, all statically generated. TypeScript
clean, ESLint clean.

`distDir` splits on `NODE_ENV`, so a production build no longer corrupts a
running dev server's `.next`.

---

## 2. Iframes

You left the two result lines blank in the brief, so this is my own finding, not
yours.

| Embed | Result |
|---|---|
| Monday.com contact form | **Loads.** The iframe's `load` fires and the skeleton clears in a real browser against production. |
| Google Maps | **Could not be confirmed painting.** The iframe is in the DOM at the correct size with the live site's exact URL, and `google.com/maps/embed` returns 200 from this machine — but no map tiles were observed and the in-app browser's network log records no request for the iframe document. |

Attributes on both, inspected rather than assumed: `referrerpolicy="no-referrer-when-downgrade"`
(carried over from the live site), **no** `sandbox` attribute, `loading="lazy"`.
No CSP is set by the app, so nothing on our side is blocking them.

**Fallbacks added regardless, as instructed:**

- **Maps** — if the embed has not loaded within 8s, the block is replaced by a
  styled panel with the venue name, its location, and an **"Open in Google Maps"**
  link built from the venue's real coordinates (new `mapLink` field on each
  venue). No empty grey hole is possible.
- **Contact** — phone, WhatsApp and email already sit in their own column beside
  the form at every breakpoint, so a form failure never strands a lead. If the
  form iframe fails, it is additionally replaced by a `role="alert"` panel
  repeating those three plus a retry.

---

## 3. Responsive

Full Playwright sweep at **390 / 768 / 1440**, hero also at **1920**, against
production. Refreshed set in `design-review/final/`.

768 had never been looked at before this phase. It renders correctly: the venue
index switches to its stacked editorial form, services and journey collapse to
single column, the events masonry drops to two columns.

**Layout audit** (`scripts/layout-audit.mjs`) — every route at 390/768/1440/1920:

> **Zero horizontal overflow anywhere.** The negative-margin edge-bleed layouts
> introduced in Phase 4 are sound at every breakpoint.

It also caught uppercase label type rendering at 9.6–10.9px, below the brief's
own 11px floor. All raised to 11px.

---

## 4. Lighthouse

Full table in `lighthouse.md`. Summary:

| | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| **Desktop** (6 pages) | 98–100 ✅ | 95–96 ✅ | 100 ✅ (Contact 54 ❌) | 100 ✅ |
| **Mobile** (6 pages) | 68–94 ⚠️ | 95–96 ✅ | 100 ✅ (Contact 54 ❌) | 100 ✅ |

**CLS is 0.000 on every page** except `/events` at 0.001. The reveal animations
shift nothing.

Fixes applied (technical, not design):

- Removed `priority` / eager loading from images below the fold that were
  competing with the hero poster. Home mobile **84 → 94**, Venues 90 → 93,
  Wedding Guide 91 → 93.
- Made the first events tile `priority` so it is preloaded as that page's LCP.
- Dropped the two full-bleed LCP images from quality 85 to 75 (Next's default).

### Mobile shortfalls — proposals, not applied

Per your instruction, these need a design change and so are proposals:

**`/contact` — Performance 68–71, Best practices 54.** Both are the Monday.com
iframe: it is a heavy third-party document loaded on every visit, and it sets
third-party cookies. *Proposal:* load it behind an explicit "Open the enquiry
form" button (a facade). Fixes both scores outright. Cost: one extra click.
The direct contacts are already alongside, so nothing is lost.

**`/events` — Performance 77–81, LCP 5.3–6.4s.** The first masonry tile is a
4:5 portrait at full viewport width. *Proposal:* use a shorter crop for the
first tile on mobile only, or drop gallery covers to quality 65.

**`/venues/[slug]` — Performance 86–87, LCP 3.8–4.1s.** The 92svh title card.
*Proposal:* reduce the title card to ~70svh on mobile, which cuts the decoded
pixel count substantially.

**`/venues` — 88–93 across runs.** Sits on the line; run-to-run variance on this
machine is roughly ±5 points, so I would not act on it.

Honest note: mobile Lighthouse is simulating slow 4G with a 4× CPU throttle
against a design whose whole premise is full-bleed photography. The remaining
gap is that trade-off, not a defect.

---

## 5. Accessibility

Full detail in `a11y.md`.

- axe started at **26 violations**, now **1**.
- Fixed: colour contrast on three text tokens, low-opacity text on the dark
  scenes, an `<ol>` with non-`<li>` children, and double-nested `<dl>` markup.
- Lighthouse accessibility 95–96 on every page.

**One item needs your decision:** the giant clipped `DOMISIGNATURE` watermark in
the footer is ~1.2:1. It is `aria-hidden` decoration that duplicates the brand
name three other places on the page. Three options are laid out in `a11y.md`;
I recommend documenting it as a decorative exception. Nothing changed pending
your answer.

---

## 6. Content audit

Full checklist in `content-audit.md`, generated by diffing the archived live
HTML against the content files and the built routes.

- **All 20 routes 200**, custom 404 returns 404.
- **All 24 essential items present** in the built HTML — meta title/description/
  keywords, Open Graph, favicon, tagline, both creteholidayhome.com links,
  phone, WhatsApp, email, all three socials, brochure PDF, Γ.Ε.ΜΗ., copyright,
  all three team members and the team paragraph, the Monday.com form.
- **Venue galleries:** 16/23/5/12 live → 16/23/6/12 new. Nothing lost.
- **Event galleries:** 25/13/32/9/3/15/10 live → 25/15/32/9/4/17/11 new.
- **All 6 journey steps** present.
- **All legacy anchors** resolve, including `#portfolio1Modal2` → `/events/villa-party`.

### Images from the live site no longer referenced — for your sign-off

**One file: `/media/about_updated.png`.**

That is the single placeholder the live site repeated on all six Wedding Journey
steps, replaced in Phase 4 by six distinct photographs. It is still downloaded
in `/public/media/`.

Every other image referenced by the live site is still referenced by the build.

---

## 7. Cross-browser

`scripts/cross-browser.mjs`, production build, screenshots in
`design-review/cross-browser/`.

| Engine | 100svh | backdrop-filter | flex gap | color-mix | clip-path | Hero video |
|---|---|---|---|---|---|---|
| Chromium | ✅ | ✅ | ✅ | ✅ | ✅ | plays, muted + playsinline, 5.9s in |
| WebKit | ✅ | ✅ | ✅ | ✅ | ✅ | **falls back to stills** |
| Firefox | — | — | — | — | — | **could not launch** |

**WebKit:** every CSS feature the design depends on is supported. The video does
not play because Playwright's headless WebKit on Windows ships no H.264 decoder,
so `video.play()` rejects — and the hero correctly falls back to the poster plus
the stills cross-fade. That is the fallback chain working as designed, but it
means **real Safari / iOS autoplay is still unverified.** Worth one check on an
actual device before launch.

**Firefox:** `browserType.launch: spawn UNKNOWN` — an environment restriction in
this sandbox, not a code problem. Not verified.

---

## 8. Still open

1. **Footer watermark contrast** — your decision (§5).
2. **Three mobile performance proposals** — your decision (§4).
3. **Google Maps painting** — needs one look in your own browser (§2). The
   fallback means a failure is now graceful either way.
4. **Real Safari / iOS hero autoplay** — needs a device (§7).
5. **Firefox** — unverified (§7).
6. **Screen reader and physical keyboard pass** — not performed (`a11y.md`).
7. **Testimonials, FAQ, statistics** — still empty, still awaiting your content
   (`CONTENT-NEEDED.md`). Unchanged from Phase 1.

No deploys were made. Nothing outside this list was touched.
