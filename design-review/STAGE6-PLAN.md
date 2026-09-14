# Stage 6 — motion on paper: the plan

> **Status (2026-09-14): implemented and measured green.** Lead primitives
> `60c5c3d`, six groups `4483b9b`, integration `057bcde`, then the fix rounds
> `24e8bb7`, `747ad78`, `4921161` and `4b7f238`. Gate 19/19; the drop-level
> matrix chose level 0. What was built, what the measurements found and the
> final numbers are in the stage log (`design-review/INVERSION-PLAN.md`).

Branch `aegean`. Written 2026-09-14 from the stage-6 planning pass, the brief
audit (`design-review/BRIEF-AUDIT.md`) and the owner's decisions of the same
day. This file supersedes the stage-4 do-not-touch list for stage 6: from here
the lead owns the foundation files named below, and a fan-out agent owns only
the files its group lists. The stage-4 list expired at the stage-5 boundary.

## The owner's decisions (2026-09-14)

1. **Media metadata.** Strip GPS, camera serials and embedded thumbnails from
   every published photograph; keep photographer/copyright credit. Strip
   location from every published video. The stripped files are the only
   publish-ready versions, and a metadata check joins the gate so nothing
   carrying GPS or serials can ship again.
2. `posterimage.png` joins the withheld list (done: `b0cdf48`, eight entries).
3. Old preview deployments containing withheld files or names are deleted
   (done: 16 previews; production untouched — see the stage log).
4. No third-party skills. The project skill and the CLAUDE.md precedence
   clause are installed from the audit's drafts (pre-work step 5).
5. Security headers and CSP after the merge, Report-Only first; HSTS without
   `includeSubDomains` while webmail, ftp and mail resolve to the old host.
6. A fail-closed local pre-push hook (source: `scripts/hooks/pre-push`).
7. Pre-work in this order, then the motion work. Home must recover toward its
   stage-4 score, not sit at the floor.

The owner is handling repository visibility, GitHub security settings and the
old live site.

## Pre-work, in order

| # | Step | Status | Pass |
|---|---|---|---|
| 1 | `next` and `eslint-config-next` 15.5.25 | done `e7252a7` | OSV/npm audit: no advisory on next; tsc, eslint, build clean; lockfile = next family + one transitive patch |
| 2 | Media metadata strip + `metadata-audit` in the gate | done `2fda5aa`, `c40de6c` (149 files; 390 clean) | every tracked still: decoded pixels identical, ICC identical, credit kept, GPS/serial/thumbnail 0; every video: per-stream hash identical, location 0; `npm run qa` gains the check; the pre-push hook runs it |
| 3 | Lighthouse reference on the stripped tree | done on `c40de6c` (gate 16/16; Home 83) | median of three, local build, labelled with the framework version; taken before any loading fix so recovery is attributable |
| 4 | The four loading fixes | done `41c473b` (gate 16/16; Home 83 → 88, all criteria met) | below |
| 5 | Conventions layer: `CLAUDE.md`, `.claude/skills/aegean-bone/SKILL.md`, `.gitignore` entries | done `379f577` | drafts from BRIEF-AUDIT §7, reconciled with this plan |

Until step 1 landed no local server listened beyond 127.0.0.1; they still do
not (the gate server, `with-server.ps1` and the measurement supervisor bind
loopback).

## The four loading fixes (before any motion group, before the drop-level matrix)

The matrix must not cut motion to pay for loading bugs.

1. **PageTransition runs on first mount.** Its curtain covers a server-painted
   page and sets content to opacity 0 on every hard load. Fix: a module-level
   first-mount flag — the curtain is for client navigations only.
   Pass: Home's LCP element paints without waiting for the curtain; LCP element
   recorded for each route, before and after.
2. **Gallery tiles preloaded by React 19.** React's server renderer preloads
   every non-lazy image; venue pages have their gallery below the fold. Fix:
   venue pages pass `eager={0}`, and `priority` follows `eager`.
   Pass: a venue page's HTML carries only the title-card preloads.
3. **/venues first plate.** Pass: `venues.html` has exactly one image preload,
   with `fetchPriority="high"`.
4. **GSAP Flip in the shared chunk.** Only `EventsBrowser` uses Flip, but
   `src/lib/gsap.ts` imports and registers it for every route. Fix: import and
   register Flip in `EventsBrowser` only.
   Pass: Flip is absent from every shared/layout chunk; first-load JS on
   non-events routes drops.

**Home's target:** back toward its stage-4 reading (90), measured as a median
of three against the step-3 reference. If the four fixes do not recover it, the
next candidates, in order, each measured: the Hero's still mounted lazily at
hydration (only after a trace), `source(none)` + explicit `@source` in
`globals.css`, then the drop-level matrix.

## Motion on paper

Principle: **nothing on paper fades.** Type is set from behind its line, blocks
settle, photographs are uncovered, rules draw, sheets move. Transform or
opacity on decorative layers only; never animate `box-shadow`; nothing may
hide, cut or cover a focused element; `prefers-reduced-motion` shows the final
state everywhere.

- **Ivory panels** — a sheet of `--surface-raised` moving on transform Y with
  the curtain ease (`M0,0 C0.83,0 0.17,1 1,1`, matching `--ease-curtain`):
  the preloader (word rise and rule draw kept, opacity tweens gone), the page
  transition (client navigations only, bloom deleted, curtain lifts, content
  opacity/transform removed, skipped when a keyboard-focused link navigated),
  the mobile menu (panel slides instead of a clip wipe; label masks inside the
  links so a focus ring is never clipped; row hairlines draw).
- **Ink-on-paper reveals** — Reveal and Stagger keep the lift and lose the
  opacity, and a focus inside a block still in flight finishes it; gallery
  batches settle without opacity; TextReveal's descender clipping fixed with
  padding cancelled by equal negative margins; MaskReveal gains the in-view
  guard; the arrival facts become a clip plus lift (an intended hero-states
  change); the Hero holds its headline only when something will cover it.
- **Soft-shadow choreography** — a shadow only while something is lifted, tinted
  `rgb(var(--shadow-tint) / α)`, never on the focused element, within the 3%
  ceiling. Three uses only: interactive plates lifting (a `lift` prop on
  `Plate`), the moving sheet's leading edge, the venue transition layer.
- **Rule-line draws** — RuleDraw gains the in-view guard; the menu rows, the
  footer's gold hairline and legal rule, and the /venues rule draw; the active
  nav underline draws on route change.
- **Deleted** — the `.glow` light pools (Statement, Footer) and every bloom
  (`.bloom`, the page-transition flare).
- **Tuning** — grain opacity by measurement (the shipped tile only); JourneyTeaser
  parallax amplitude inside its mat; the marquee and the hero cross-fade pause
  off-screen; the scroll cue runs at `lg` only.

## The drop order

One switch, `src/lib/motion-tier.ts`: `DROP_ORDER = ["preloader", "parallax",
"grain", "shadow"]` and `PHONE_DROP_LEVEL` (0–4, always a prefix of the owner's
order), applied on phones (`max-width: 767px`) by an inline script that sets
`data-drop` on `<html>` before first paint (SSR-safe; `?drop=N` for
measurement; desktop never drops). The level is the smallest that keeps every
route's mobile median ≥ 83 and worst run ≥ 80 (the rest ≥ 90), measured by a
Lighthouse matrix of levels × routes × three runs **after** the loading fixes.
If level 4 still fails, stop and report.

## Gates added in stage 6

- `focus-motion` — motion ON, 390 and 1440: a focused element is never hidden,
  clipped or covered at 50/200/500/900 ms after a trigger (Tab into a reveal,
  keyboard navigation, the menu, a venue row, a chapter mid-scrub).
- `typeset-clip` — no clipped ink in any TextReveal line.
- `motion-tier` — the drop switch applies exactly its prefix at 390, nothing at
  1440.
- `paper-legibility --motion` / `--lift` — no paper text left part-transparent
  mid-scroll; lift shadows within the 3% ceiling.
- INP under a 4× CPU throttle (outside the gate: machine-dependent), with a
  hydration wait, route navigations, FAQ taps and a scroll pass.
- hero-states compare with `--intended facts.opacity,facts.clipPath`.
- Lighthouse: median and worst of three, LCP element recorded, labelled with
  build source and framework version.

## Ownership (disjoint file groups)

- **Lead first:** `src/lib/motion-tier.ts` (new), `src/app/layout.tsx`,
  `src/lib/gsap.ts`, `src/lib/intro.ts`, `src/components/ui/Plate.tsx`,
  `src/app/globals.css`, `src/components/motion/Grain.tsx` — and the four
  loading fixes above.
- **G1 panels:** PageTransition, Preloader, VenueTransition, Header.
- **G2 reveals:** `src/components/motion/Reveal.tsx`, `src/components/ui/Accordion.tsx`.
- **G3 home choreography** (owns hero-states): Hero, Arrival, ScrollImage, JourneyTeaser.
- **G4 deletions and colophon:** Statement, Footer, Marquee.
- **G5 plates:** VenueCard, EventsStrip, EditorialGallery, EventsBrowser, VenuePlates, VenueIndex.
- **G6 gates:** `scripts/inp.mjs`, `focus-motion.mjs`, `motion-tier.mjs`,
  `typeset-clip.mjs`, `hero-states.mjs`, `lighthouse.mjs`,
  `paper-legibility.mjs`, `reduced-motion-audit.mjs`, `qa.mjs`, `package.json`.

Every fan-out prompt opens: invoke the `aegean-bone` skill; you own only these
files; copy, facts and routes are frozen; no new dependencies; no builds,
servers, commits or pushes.

## Stage 7 carries

Seal matrix and redirect-loop guard; harness-injected CSP measurement (headers
ship after the merge); baselines as medians of three after the media strip;
the docs pass (superseded banners, launch runbook drift, QA-TOOLKIT count);
`qa.yml` permissions; the stage log's advisory table.
