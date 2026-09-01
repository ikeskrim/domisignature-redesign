# Handoff — content queue

Last commit: **`066a096`** on `master` (22+ commits, full history). Public tree
pushed as a single commit, `9265170` → https://github.com/ikeskrim/domisignature-redesign

Working tree clean. All gates green at this point: tsc, ESLint, production
build, **axe 0**, claims/media/prose/manifest/asset audits clean, Lighthouse
desktop 97–99 and mobile 81–93 (Signature Events 75 is the known exception in
`PHASE6-REPORT.md` §6).

## Done and approved

Phase 6 §1–§7 complete. Publication complete. Plus, from the research report:
the atmosphere layer (`c15f590` — film grain + ambient light pools, before/after
in `design-review/atmosphere/`) and the image-sequence arrival (`066a096` —
five real stills, desktop-gated, mobile floor re-verified).

**WebGL stays deferred.** Revisit only after QA, desktop-only and gated, and
only when the owner says so.

---

## Queue, in order. Commit per section.

### 1. Remove Villa Aetos entirely

Owner-approved removal. Delete the venue and everything that points at it:

- `content/venues.ts` — the whole `villa-aetos` entry
- `/venues/villa-aetos` → **redirect to `/venues`** in `next.config.ts`
  (a `permanent: true` redirect, alongside the existing `party-dance` one)
- the index row, the homepage `FeaturedVenues` entry, the related-venues cards
  on the other venue pages, and its map on `/contact`
- its assets become unreferenced — **follow the manifest's orphan rule**: add
  them to `.gitignore` and record them in `design-review/publish-manifest.md` §3

Everything driven by `venueSlugs` (sitemap, static params, footer venue column)
updates itself. Verify rather than assume.

### 2. Thalasses becomes venue 01

Reorder `content/venues.ts` so Thalasses is first. Mountain Escape and Olive
Stories keep their relative order after it. The index numerals come from
`pad2(i + 1)`, so they follow the array — check the venue index, the mobile
stacked list, and the footer.

### 3. Sweep the consequences

The derived stats update themselves, which is the point of them — but **verify
what they render**:

- `venues.length` 4 → 3, so the first stat becomes **`03`**
- capacities become `[200, 300, 200, 300]`, so the range becomes **`200–300`**,
  not the current `20–300` (Villa Aetos was the only venue admitting 20 guests).
  `CountUp` handles two numeric runs, but confirm it on screen.

Then sweep every place the count is written out — these are **not** derived:

| Where | Current |
|---|---|
| `content/site.ts` hero `subtitle` | "across four venues in Crete" |
| `src/components/home/Statement.tsx` body | "Four venues on one island…" |
| `FeaturedVenues` heading | "Four settings, one island" |
| `src/app/venues/page.tsx` metadata description | "Four venues in Crete…" |

`npm run audit:prose` and `scripts/content-audit.mjs` will read the removal as
content loss. **Record it as an owner-approved delta** — the approved-deltas
table in `scripts/content-audit.mjs` and the `APPROVED` set in
`scripts/prose-audit.mjs` — so it is signed off rather than silently missing.

Also update the route lists that name the venue: `scripts/shots.mjs`,
`scripts/layout-audit.mjs`, `scripts/keyboard-audit.mjs`,
`scripts/asset-check.mjs`, and the `venueMap` in `scripts/content-audit.mjs`.

Then **regenerate** `design-review/final/` and `npm run contact-sheets`
(`audit:media` fails on stale sheets — that guard exists because a withheld
frame once shipped baked into one).

### 4. The four preview-review items

1. **Env-aware robots meta on previews.** `src/app/robots.ts` already disallows
   everything unless `VERCEL_ENV === "production"`. What is missing is the
   per-page `<meta name="robots">`; add it via `metadata.robots` in the root
   layout, driven by the same check.
2. **Per-page og/twitter alignment.** Root layout sets both; most pages set only
   `title`/`description`, so they inherit the site-wide OG image and title.
   Give each route its own `openGraph` and `twitter` block, using that page's
   own cover image.
3. **Range capacities lose the "Up to" prefix.** `capacityLabel()` in
   `src/lib/utils.ts` currently produces "Up to 200-300". A range should read
   **"200–300 guests"** with an en dash; a single figure keeps "Up to 200".
4. **Polish the venue advantage bullets — approved.** They are the client's old
   English, e.g. *"Cycladic white and blue style - feel yourself in Greece!"*.
   These are **facts** in `content/venues.ts`, so this is the one place the
   untouchable-facts rule bends by explicit owner approval. **Before → after in
   `copy-deck.md` for approval before it ships.**

### 5. Copy register pass (research report §3)

Rewrite hero lines and venue standfirsts to the short, mood-first,
place-anchored register: **3–7 word headlines, one-sentence standfirsts of
~10–15 words**, adjective-forward, place used for rhythm.

Hard constraints:

- **Never copy the reference brands' lines.** Aman, Cheval Blanc, Six Senses,
  Belmond and One&Only are register models only; several of those lines are
  trademarked taglines.
- Facts stay intact and SEO keywords stay present — `audit:prose` enforces the
  first, and the venues/events metadata carries the second.
- **No scarcity or exclusivity claim, in any wording.** `audit:claims` searches
  the idea, not the phrasing. It exists because "Crete — by invitation" shipped
  once.
- Full before → after deck in `copy-deck.md` for approval.

### 6. Then §6 QA and update `PHASE6-REPORT.md`

Full gate:

```bash
npm run typecheck && npm run lint && npm run build
```

```bash
npm run audit:a11y && npm run audit:claims && npm run audit:media && npm run audit:prose && npm run audit:keyboard && npm run audit:layout && npm run audit:assets && npm run publish:manifest
```

---

## Things that will bite

- **Playwright must run in the foreground.** It cannot spawn Chromium from a
  backgrounded task here. Split runs with `--only=` / `--routes=`.
- **Measure against `next start`, never `next dev`.** Use the
  `domisignature-prod` launch entry. Lighthouse against the dev server reported
  mobile LCP of 19–23s and 1.2 MB of "unused JavaScript"; the tell was
  `unminified-javascript` appearing in a production audit.
- **No transformed ancestor around a pinned scene.** `position: fixed` resolves
  against any transformed parent, so `PageTransition` ends with
  `clearProps: "transform"` plus a `ScrollTrigger.refresh()`. Do not reintroduce
  a lingering transform on a wrapper.
- **`TextReveal` must never go back to `aria-label`.** It is prohibited on `<p>`
  and produced 20 axe violations the moment the footer used `as="p"`. The string
  rides an `sr-only` span.
- **Publishing is two branches.** `master` is full local history; the public
  repo gets a single orphan commit. To push: rebuild the orphan from master's
  tree (`git branch -D public-main`, `git checkout --orphan public-main`,
  `git add -A`, commit, `git push --force-with-lease origin public-main:main`) —
  `git checkout master -- .` leaves deleted files behind and the trees diverge.
- **PowerShell mangles multi-line `-m` messages.** Write the message to a file
  and use `git commit -F`. `Set-Content -Encoding utf8` adds a BOM that breaks
  JSON — use node to rewrite JSON files.

## Standing laws

No invented facts. **No scarcity or exclusivity claim, in any wording, on any
surface.** No AI-generated photographic imagery. No frame with a client's name
legible without confirmed permission. Real photography only — no stock, no AI.
Dark ground. SEO preserved. axe 0. Nothing disappears silently: removals go on a
sign-off list.

## Still open with the owner

1. **Vercel** — blocked on `npx vercel login` being interactive. Commands are in
   the previous report; `.vercelignore` and the `distDir` fix are already in.
2. **`spire2.png` origin** — withdrawn either way; sweep results in
   `PHASE6-REPORT.md` §2.
3. **Firefox** needs a manual pass; the Playwright binary will not launch here.
4. **The Contact form** is the only thing keeping the performance bar short of a
   clean sweep.
