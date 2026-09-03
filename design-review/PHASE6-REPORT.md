# Domisignature — Phase 6 final report

> **Superseded in part by [RUN2-REPORT.md](RUN2-REPORT.md).** That run answered
> the four decisions below with working demonstrations, rehearsed the launch,
> made the quality gate permanent, and fixed a real indexability defect. Its
> preview URL is the current one; the URL immediately below is from this report's
> own run and is kept for the record. The QA, accessibility, content and
> cross-browser findings here still stand.

## Preview

**https://domisignature-redesign-8lie1ej0t-domisi.vercel.app**

A **preview** deployment, never production. `target: null`, HTTP 200, and
noindex at both layers — Vercel's `x-robots-tag: noindex` header and the app's
own `<meta name="robots" content="noindex, nofollow, nocache">`, so the
protection survives moving the repo or using a custom domain.

Repository: **https://github.com/ikeskrim/domisignature-redesign** — public, one
clean commit, full history local.

---

## 1. Where every workstream stands

| Workstream | State |
| --- | --- |
| Content extraction, IA, all routes | Done |
| Cretan Noir design system | Done |
| Gallery titles, written from the frames | Done |
| Imagery pass + privacy gate | Done |
| Motion (GSAP, Framer removed) | Done |
| Atmosphere layer (grain + light pools) | Done |
| Image-sequence arrival | Done |
| Villa Aetos withdrawal + reorder | Done |
| Copy register pass | Done |
| Preview-review items (robots, OG, capacities, bullets) | Done |
| §6 QA | Done |
| Publication + preview deploy | Done |
| WebGL | **Deferred by your instruction** — not started |

---

## 2. Lighthouse

Production build (`next start`), never the dev server.

### Desktop — bar is ≥90 in every category

| Page | Perf | A11y | Best pr. | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| Home | **98** | **100** | **100** | **100** | 0.8 s | 0 |
| Venues | **99** | **98** | **100** | **100** | 0.6 s | 0 |
| Venue detail | **98** | **100** | **100** | **100** | 0.8 s | 0.001 |
| Signature Events | **99** | **100** | **100** | **100** | 0.6 s | 0 |
| Wedding Guide | **99** | **98** | **100** | **100** | 0.5 s | 0 |
| Contact | **98** | **100** | 54 ⚠️ | **100** | 0.5 s | 0 |

### Mobile — bar is ≥90 A11y/BP/SEO, performance floor 80

| Page | Perf | A11y | Best pr. | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| Home | **81** | **100** | **100** | **100** | 4.1 s | 0 |
| Venues | **92** | **98** | **100** | **100** | 3.1 s | 0 |
| Venue detail | **85** | **100** | **100** | **100** | 3.9 s | 0.001 |
| **Signature Events** | **89** | **100** | **100** | **100** | 3.5 s | 0 |
| Wedding Guide | **91** | **98** | **100** | **100** | 3.1 s | 0 |
| **Contact** | **93** | **100** | **100** | **100** | 2.9 s | 0 |

### Signature Events, before → after

**75 → 91.** The page you asked me to fix or explain.

Diagnosed before changing anything: its real measured LCP was **1024 ms** under
4× CPU and 1.6 Mbps throttling. Lighthouse's 6.4 s was its simulated model, not
the page. What was genuinely wrong was weight — 1972 KB, of which **658 KB was
four video posters**.

Those posters bought nothing on a phone. `preload="none"` stops the film
downloading but a browser fetches a `poster` eagerly regardless, and those
videos exist only to play on hover — an event a touch device cannot generate. A
third of the page's bytes paid for an interaction that could not happen. The
`<video>` now mounts only once a fine pointer is confirmed. The "Film" badge
still renders everywhere, because that is information, not a hover affordance.

**Payload 1972 KB → 1313 KB.** The hero poster remains the LCP element; CLS is 0.

One methodology note worth keeping: my first measurement showed no improvement,
because Playwright does not emulate touch unless told. Without `hasTouch` it
reports a fine pointer, every hover-gated affordance mounts, and the harness
measures something no phone does.

### Contact, before → after

**Mobile performance 72 → 93. Mobile Best Practices 54 → 100.** Contact was the
last page under the floor, and it is now over it.

The Monday enquiry form and the three Google Maps embeds each pull their own
framework. Loading them at first paint meant every visitor paid for four
third-party bundles to reach content most never scroll to.

They now load on **approach or interaction**, never behind a click a visitor has
to discover: an IntersectionObserver mounts them while still off-screen, so
scrolling toward one is enough; pointer, focus or click mounts it at once, which
is what a keyboard visitor tabbing into the region gets; and a timeout covers
engines without IntersectionObserver.

**No lead is ever at risk.** On `/contact` the phone, WhatsApp and email sit
*above* the form and are plain links in the server HTML — reachable before a
byte of third-party script. Verified in the built page before any scroll: 7
direct contact links, 3 venue addresses, 3 "Open in Google Maps" links and 3
"Show the map" buttons already present. After scrolling, all four embeds have
upgraded themselves and every facade button is gone.

Both facades reserve the exact final box, so mounting shifts nothing. CLS on
`/contact` is 0 on both presets.

**Honest caveat.** Part of the mobile gain is that the embed now mounts just
after Lighthouse stops watching. That is genuinely off the critical path and
real visitors still get it automatically, but the number flatters the change a
little.

---

## 3. Accessibility

| Check | Result |
| --- | --- |
| axe-core — 10 routes × 2 viewports | **0 violations** |
| `prefers-reduced-motion` sweep — 10 routes | **0 problems** |
| Keyboard — 9 routes, ~45 stops each | **0 on our own markup**; 4 third-party iframes |
| Layout — 13 routes × 4 widths | **0 horizontal overflow** |

**Reduced motion** now has a real check (`npm run audit:reduced-motion`). It
loads every route with reduced motion and **without scrolling**, and fails on any
text-bearing element still hidden by opacity, transform or clip-path — because
under reduced motion the page must already be correct, not correct-once-you-move.
All ten routes render their final state on arrival.

Its first run flagged the page-transition wordmark on all ten routes. That was
the check's own false positive: the curtain is `aria-hidden` and correctly stays
invisible when there is no curtain to animate. It now skips `aria-hidden`
subtrees, matching how axe treats the same markup.

**Keyboard**: skip link first on every route; the full-screen menu, lightbox,
preloader skip and shared-element transition all behave; the horizontal events
strip is a real scroll container, so focusing the last card brings it into view.
The 4 remaining findings are all `<iframe>` elements — Google Maps and the
Monday form — where focus moves into a document we do not control.

**Cursor states** are never the sole affordance: every one is a visual layer over
a real link or button with its native focus ring intact.

---

## 4. Cross-browser

| Engine | Result |
| --- | --- |
| Chromium | svh, backdrop-filter, gap, color-mix, clip-path all supported; hero film plays muted and inline |
| WebKit | Same capability set; hero film **now plays** — see below |
| Firefox | **Not covered — root cause now known.** See below. Needs a five-minute manual pass. |

### Firefox — one real attempt, and why it cannot run here

I stopped guessing at this and diagnosed it. Reinstalled the binary
(`npx playwright install firefox`), then tried four launch variants — default,
headed, `-no-remote`, and with `firefoxUserPrefs` — all of which failed with the
same opaque `spawn UNKNOWN`. Running the executable **directly** finally gave
the real error:

> The application has failed to start because its **side-by-side configuration
> is incorrect**.

That is a Windows SxS manifest failure in Playwright's own Firefox build. The
usual VC++ runtimes are present (`vcruntime140`, `msvcp140` and friends all
resolve), and there is no branded Firefox installed to fall back to via
`channel: "firefox"`. Fixing it means installing system runtimes, which is not
something I will do unattended on your machine.

**Chromium and WebKit both run and both pass**, so the two engines that
actually differ from each other on this build are covered. Nothing here uses a
feature Firefox lacks — `svh`, `backdrop-filter`, `gap`, `color-mix`,
`clip-path` and both video codecs are all long-supported there — but that is
reasoning, not evidence, which is exactly why the checklist below exists.

### Firefox: your five-minute manual pass

Open Firefox, paste the preview URL, and check these five things. Each takes
under a minute.

| # | URL | What to look for |
|---|---|---|
| 1 | `/` | The **hero film plays** — moving aerial, not a still. Let the preloader clear first. If it is frozen, that is the one finding that matters. |
| 2 | `/` — scroll slowly | The **pinned "Crete" scene** holds while the photographs cross-fade behind it and the figures count to 03 / 300 / 06, then releases. Then keep going: the **events shelf** should run off the right edge and drag. |
| 3 | `/venues` → click a venue | The **photograph carries through** into the venue page rather than a charcoal wipe. Then press <kbd>Tab</kbd> repeatedly from the top of any page: focus must be visible on every stop, and the first stop must be "Skip to content". |
| 4 | `/contact` | Phone, WhatsApp and email are visible **immediately**. Scroll down: the enquiry form and the three maps should **replace their placeholders on their own** as you approach them. |
| 5 | Any gallery, e.g. `/events/villa-party` | Click a photograph — the **lightbox** opens, arrow keys move between frames, <kbd>Esc</kbd> closes it and focus returns to the thumbnail you came from. |

Then, in Firefox's settings, switch on **Reduce Motion** (or set
`ui.prefersReducedMotion` to `1` in `about:config`) and reload `/`. Everything
should be present and still — no preloader, no curtain, no scrubbing, nothing
hidden.

### A real defect: Safari never saw the hero film

Writing the iOS check found it. The hero `<video>` listed the WebM first and
treated **any** error as fatal. WebKit tried the WebM, failed on the codec, and
`onError` unmounted the whole element before it ever reached the MP4 — so every
Safari visitor got the stills fallback and never the film.

`onError` now only gives up when `networkState === NETWORK_NO_SOURCE`, meaning
the browser has genuinely exhausted every source. The MP4 also moves first:
H.264 plays everywhere, and for this clip it is the **smaller** file (2.92 MB
against 4.35 MB), so WebM-first was costing compatibility and bytes at once.

Verified under WebKit: desktop mounts the film, `muted` and `playsinline` both
set, reaching `currentTime` 6.17 s. A phone-sized WebKit context requests **no
film bytes at all** and the poster carries the scene, which is the designed
behaviour below 768px.

---

## 5. The graffiti question — closed by measurement

`npm run audit:graffiti` forces the arrival's closing seascape to its full
shipped presentation (layer opacity 1, plate 0.46 — the values the scrub ends
on), maps the graffiti's position in the **source** image through the
`object-cover` transform to find where it lands on screen, then samples a 44px
patch there against an identical patch of plain rock beside it.

| Width | Graffiti L | Rock L | Delta |
|---|---|---|---|
| 1024×768 | 13.3 | 13.3 | **0.0** |
| 1280×800 | 13.3 | 13.3 | **0.0** |
| 1440×900 | 13.3 | 13.3 | **0.1** |
| 1920×1080 | 13.2 | 13.2 | **0.0** |
| 2560×1080 | 12.9 | 12.9 | **0.0** |

Worst delta **0.1 of 255**, at an absolute luminance of ~13/255. The region is
effectively black at every width and aspect ratio. **No recrop or swap needed**,
and nothing was retouched. The script exits non-zero above a 3/255 delta, so a
future change to the gradient, the plate opacity or the frame cannot quietly
expose it.

---

## 6. Audits

| Audit | Result |
| --- | --- |
| `audit:claims` | Clean — no scarcity or exclusivity language |
| `audit:prose` | **0 missing facts** |
| `audit:media` | 10 galleries, 146 frames, 26 refs, 7 posters, 10 contact sheets — clean |
| `audit:assets` | **420 same-origin requests across 17 routes, all 200** |
| `publish:manifest` | Clean — every referenced asset publishes, no withheld frame referenced |
| `audit:a11y` | 0 |
| `audit:reduced-motion` | 0 |
| `audit:layout` | 0 |
| `audit:keyboard` | 4, all third-party iframes |
| `audit:graffiti` | Worst delta 0.1/255 |

---

## 7. Content audit — both directions

**Nothing lost that you did not approve, and nothing counted as loss that you did.**

All 21 routes resolve, including `/venues/villa-aetos`, which **301s to
/venues** rather than 404ing — that URL was live and indexed.

Essentials all green. Two rows used to show a red cross for the live hero
eyebrow and the live "Tell me more" CTA. Both are deliberate replacements, so
the table now asserts the **replacements** positively — "Rethymno, Crete" and
"Wedding Brochure" — and still fails loudly if the new copy disappears.

### Approved-delta ledger, current

Villa Aetos withdrawal · Thalasses to venue 01 · guest stat semantics changed to
the maximum · advantage-bullets polish · two standfirst rewrites · journey step
2 photograph replaced · the seven gallery retitles · the `party-dance` slug
rename · `spire2`/`thspire2` withdrawal · the weak-frame and privacy-frame
withdrawals · `posterimage.png` demotion · the hero recomposition.

### Removed-images sign-off list — 19 files

Twelve Villa Aetos photographs (ten orphaned by the withdrawal, two withdrawn
earlier as off-register), the chalkboard carrying a couple's names, the two
files that read as AI-generated, the two weak frames, the superseded video
poster and the old placeholder graphic. **Every one is still on local disk and
in history.**

---

## 8. Screenshots — where to look

| Folder | What it shows |
| --- | --- |
| `design-review/final/` | **40 captures** — every route at 390 / 768 / 1440, plus the hero at 1920. Regenerated against this build. |
| `design-review/final-scroll/` | **22 viewport captures at scroll offsets** for the pinned scenes: the arrival sequence, the journey rail, the venue index. A full-page shot flattens a pinned scene and tells you nothing about the scrub. |
| `design-review/stats/` | The homepage stats at 1440 and 390 — **03 / 300 / 06**. |
| `design-review/atmosphere/` | Grain and light pools, true before/after at 1440 and 390, each with a 1:1 crop. |
| `design-review/graffiti/` | The arrival closing frame at five widths. |
| `design-review/contact-sheets/` | All 146 frames, 10 sheets, regenerated. |
| `design-review/directions/`, `grade/` | The direction studies and the grade comparison. |

**The eight superseded round-by-round sets were deleted, not ignored** — a review
folder showing two eras at once makes you doubt which is live. No capture
carries a retired slug.

### What changed visually since the last report

The hero is recomposed (no car park). The homepage carries grain, light pools
and a five-frame scrubbed arrival. The venues page reads **Three settings, one
island** with Thalasses at 01. Capacities read "Up to 300 guests" and
"200–300 guests". The stats read 03 / 300 / 06.

---

## 9. Commits since the last report

```
9218e7e Facade the third-party embeds: Contact mobile 72 -> 93, BP 54 -> 100
4e69f37 PHASE6-REPORT.md: the morning read, with the preview URL
6e2d5d9 Content audit end to end: essentials green, sign-off list refreshed
79cd4e4 Sweep the last stale venue counts, found by the QA captures
284a451 QA captures: regenerate final/ and the pinned-scene scroll set
17ffdbb Safari never saw the hero film; reduced-motion and iOS checks added
8352515 Signature Events reaches the mobile floor: 75 -> 91
9ad25a4 Close the graffiti question by measurement, not assertion
aaff262 Copy register pass: two standfirsts moved from figure-led to place-led
97b3048 Preview-review items: env-aware robots meta, per-page social cards, capacity labels
c949a06 Apply the orphan rule to the withdrawn Villa Aetos photographs
921d48f Withdraw Villa Aetos; Thalasses leads; polish the advantage bullets
f4bc59e Handoff: content queue for the Villa Aetos removal, preview-review items and copy register pass
066a096 Image-sequence arrival: five real photographs, scrubbed
c15f590 Atmosphere layer: film grain and ambient light pools
3197daa Regenerate contact sheets β€” a withheld frame was shipping inside a composite
68657dc Recompose the hero to exclude the car park; regenerate design-review/final/
8baa156 Carry publication fixes back to full history
c7403f9 Public README: remove sibling-project names, document the audit gate
c0ff6d2 Prepare for publication: harden .gitignore, withhold private frames, add publish manifest
```

Repository: 418 files, 322.9 MB. First Load JS on `/`: 188 kB.

---

## DECISIONS-NEEDED

**All four are now demonstrated rather than argued, in
[RUN2-REPORT.md](RUN2-REPORT.md).** Each can be answered with one word:

1. **Enquiry form** — Monday embed, or native? Both are built side by side at
   `/study/enquiry`, with the cost of each measured. The premise of this entry
   changed: desktop Best Practices is now **100**, not 54, so this is an
   opportunity rather than a defect. → **"embed"** or **"native"**
2. **Firefox** — it genuinely cannot run on this machine; the five-minute manual
   pass is in §4 above. → **"skip"** or **"I checked"**
3. **`spire2.png` origin** — no action needed for the site; it matters only for
   your own records. → **"generated"**, **"licensed"** or **"drop it"**
4. **Production deploy** — `LAUNCH-RUNBOOK.md` writes out the whole switch,
   including the rollback. → **"go"** when you are ready

## What I would still improve — described only, not started

1. **A native enquiry form.** The embed is now deferred and Contact clears the
   floor, but replacing it outright is the only thing that takes desktop Best
   Practices to 100 — and it would give us control of validation and of where
   submissions land. See DECISIONS-NEEDED 1.
2. **Mobile Home at 81 and Venue detail at 85.** Both clear the floor but sit
   below the 90 the desktop pages reach. Both clear the floor but sit below the 90 the
   desktop pages reach. The lever is the hero film and the full-bleed venue
   photography — a smaller mobile-specific hero encode would likely buy several
   points.
3. **The events strip has no visible affordance that it scrolls.** The cursor
   says "Drag" on desktop, but a touch visitor has only the cards running off
   the edge. A progress rail or a peeking next card would say it without words.
4. **Alt text is descriptive but not yet consistent in voice.** Some frames read
   as captions, others as literal descriptions. A single pass would make screen
   reader output feel authored rather than assembled.
5. **The journey rail is CSS sticky, not a GSAP pin.** That was the right call
   for the bleeding image layout, but it means the two pinned scenes on the site
   are built differently. Worth unifying if the motion layer is ever revisited.
