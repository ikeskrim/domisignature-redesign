# Art direction

The rules this build is held to, and where each one lives in the code.

---

## The signature element

**The venues index** — `src/components/venue/VenueIndex.tsx`.

Hovering a row brings that venue's photograph up full-bleed behind the type
while its siblings drop to 35% and the name shifts right. All four images are
mounted up front and cross-faded by opacity, so the swap is instantaneous rather
than triggering a fetch. Keyboard focus drives the same state, so it is not a
mouse-only feature.

**Why this one and not the other two options:**

- The hero video is required by the brief regardless, so spending the single
  "signature" pick on it would buy nothing.
- The page-transition curtain is real but lasts one second and is seen in
  passing.
- The venues index is where the old site was weakest — a four-up grid of card
  thumbnails that opened modals — and it is where a visitor actually decides.
  Highest leverage, so it gets the one flawless interaction.

Everything around it is deliberately quiet: no custom cursor, no magnetic
buttons, no scroll-jacking.

---

## Palette

Sampled from the site's own photography rather than a generic cream-and-terracotta
default. The dusk aerial that opens the site is the reference frame: poured
limestone terrace, silver-blue sea, olive foliage, amber string lights.

| Token | Value | From |
|---|---|---|
| `limestone` | `#f4f2ed` | the concrete terrace — warm but grey-leaning, not cream |
| `chalk` | `#ebe8e1` | secondary surface |
| `shell` / `drift` | `#dbd6cb` / `#c9c3b6` | hairlines, oversized quiet numerals |
| `stone` / `clay` / `slate` | `#a5a096` / `#736e63` / `#4b4841` | text hierarchy |
| `charcoal` / `ink` | `#23221e` / `#131311` | dark scenes |
| `tide` | `#8f9a9c` | dusk sea, for cool scrims |
| `lamp` | `#b8863f` | **the one accent** — the string lights |

`lamp` appears only on focus rings, the journey bullet rules, and link
underlines on hover. There is no second accent.

The brand mark stays its original teal. It is the only cool colour on the site
and reads as one deliberate spot against the warm neutrals — sand and sea.

---

## Typography

| Role | Size | Notes |
|---|---|---|
| Hero | `clamp(3.5rem, 11vw, 11rem)` | line-height 0.9, tracking −0.03em |
| Section display | `clamp(2.5rem, 6vw, 6.5rem)` | |
| Title | `clamp(2.25rem, 4.5vw, 4.25rem)` | |
| Body | 17px / 1.65 / `max-width: 62ch` | never full width |
| Eyebrow | 11px, tracking 0.22em, uppercase | always paired with a hairline rule |

Cormorant Garamond over Manrope, both self-hosted by `next/font`.

**Index numbers appear in exactly two places** — the six-chapter Wedding Journey
and the venue index — because those are the only genuine sequences. They were
removed from the events galleries, which are a collection.

---

## The grade

One shared class, `.grade` in `globals.css`, applied to every photograph and
every video on the site:

```css
filter: contrast(1.06) saturate(1.08) brightness(1.015) sepia(0.05);
```

The first pass used the brief's suggested starting point,
`contrast(1.03) saturate(1.05)`. Side by side it was effectively invisible — it
did nothing to unify a library shot across many cameras, years and lighting
conditions. The values above are one step up, with a 5% sepia doing the actual
unifying work: it pulls the cool overcast frames and the warm dusk frames toward
the same temperature.

Checked against a deliberately awkward set — the dusk aerial, a midday pool, an
overcast banquet, and a close portrait for skin tones. Skin stays natural.
The before/after is in `design-review/grade/grade-before-after.png`; regenerate
it with `node scripts/grade-preview.mjs`.

Static imagery also carries a 28–32s Ken Burns drift (`.ken` / `.ken-alt`),
alternating direction between neighbours so a column never pulses in unison.
Both are disabled outright under `prefers-reduced-motion`.

---

## Motion

One ease for everything: `cubic-bezier(0.16, 1, 0.3, 1)` (`--ease-cinema`).
The curtain uses `cubic-bezier(0.83, 0, 0.17, 1)` (`--ease-curtain`).

| | |
|---|---|
| Reveals | 0.8–1.2s |
| Stagger | 60–90ms per line or item |
| Hover / micro | 0.45–0.6s — images scale to 1.04, never 1.06 |
| Page transition | curtain up 0.75s, wordmark beat 0.85s, content in 0.9s |
| Hero parallax | media +120px vs copy −70px over the first viewport |
| Scroll images | inner picture 1.1 → 1 across the frame's travel |
| Lenis | duration 1.05, disabled on coarse pointers and reduced motion |

Every one of these is gated behind `useReducedMotion` or the global
`prefers-reduced-motion` block.

---

## The hero

`src/components/home/Hero.tsx`.

A 16.5s muted loop cut from the two dusk drone aerials (`paDJI_2282` and
`paDJI_2288`), cross-faded together and fading through black at the seam so the
loop reads as a cut rather than a jump. 3.3 MB MP4 / 4.2 MB WebM, both under the
8 MB budget. Rebuild with `npm run media:hero`.

**The performance contract:** the poster photograph is a `next/image` with
`priority` and `fetchPriority="high"` — it is the LCP element and paints
immediately. The `<video>` mounts underneath at `opacity: 0` and only fades in
on `canplay`. It is never requested at all when the visitor has reduced motion
on, has Save-Data enabled, or is under 768px wide. If autoplay is refused or the
file fails, the hero silently falls back to a cross-fade of three stills.

---

## Forbidden, and confirmed absent

No card grids with borders or `shadow-md`. No `rounded-xl`. No filled colour
buttons — buttons are hairline pills or text-plus-a-rule. No centred-by-default
layouts. No fast linear transitions. No second accent colour. No default
Tailwind greys or blue links.

---

## Seeing the work

The Browser pane is unavailable in this environment, so review runs on
screenshots:

```bash
powershell -File scripts/review.ps1 round-3
```

Builds for production, serves it, captures every route at 390 / 768 / 1440 plus
the hero at 1920, then shuts the server down. Screenshots are taken against
`next start` rather than `next dev`, because dev recompiles on every edit and
makes Playwright's `networkidle` wait unreliable.

Reveal animations are driven by `whileInView`, so the harness emulates reduced
motion — that renders every section in its final state instead of screenshotting
half a page of invisible elements. The 1920 hero shot is the exception and runs
with motion enabled so the film is visible.
