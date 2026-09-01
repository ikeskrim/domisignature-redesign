# Phase 9 — Palette study

**Nothing has shipped.** The default palette is byte-identical to what is on the
production deployment, the launch machinery is exactly as parked
(`WAITING-FOR-DNS.md` still governs, and the resume line works this second), and
every variant here lives behind a query parameter or a `noindex` study route
that nothing links to.

Four things to look at, then one word back: **"Stay as is"**, **"Ember Ink"**,
**"Ember Ink deep"**, or **"Aegean Bone — plan the inversion"**.

| | |
| --- | --- |
| Two dark variants | add `?palette=ember` or `?palette=ember-deep` to any URL |
| The light study | `/study/aegean` — three surfaces |
| Captures | [`design-review/palette/`](palette/) — eleven strips |
| Gate with everything present | **11/11 green**, default unchanged |
| axe | **0 violations** — 5 routes × 2 breakpoints on each dark variant, 4 × 2 on the light study |

**The imagery law is unchanged and was not bent to make any of this work.** Every
frame in every variant is a real photograph already in the library, ungraded
beyond the filter the live site already applies. No synthetic people, couples,
weddings, venues or events, anywhere. Where the light ground made photography
hard, the answer was mats, frames and dark chapters — never a generated image
and never a hazed one. If beauty ever needs more than this library plus
treatment, the path is a real styled shoot.

---

## The diagnosis, confirmed by measurement

Both reviews agreed on one thing and the tokens confirm it: **every shipped
ground is blue-leaning while the type is warm.** Read as red-minus-blue:

| | ink | charcoal | graphite | hair | | bone | muted |
| --- | --- | --- | --- | --- | --- | --- | --- |
| shipped | **−1** | **−3** | **−4** | **−5** | | +12 | +15 |

Warm type on cool ground. That mismatch is a real, measurable reason the dark
reads austere rather than candlelit, and it is the whole subject of this study.

**What was *not* wrong:** the colour report proposed swapping "shiny gold" for a
flat champagne. Our gold is `#b98f4a` — already flat, already muted, no
gradient, rationed to one appearance per screen, and inside the report's own
recommended range. It is untouched in both variants. `#A89474` is recorded here
as a swatch and applied nowhere.

---

## Two variants, because the anchor turned out to cost something

The ladder was not eyeballed. `scripts/derive-ember.mjs` measures the shipped
ladder's rung spacing as WCAG contrast ratios between neighbours
(1.0672 / 1.1162 / 1.1795) and rebuilds those exact steps in a warm hue — the
rebuilt spacing lands within **0.0043**.

### Ember Ink — anchored where the report asked

```
ink #17140f   charcoal #1f1b14   graphite #29241b   hair #373024
faint #938e85  (the one type token that moves)
```

r−b becomes **+8, +11, +14, +19**. Every ground is warm.

**But `#17140f` sits at more than twice `ink`'s luminance**, so the whole ladder
lifts and **twelve pairs lose about 7% of their contrast** — bone 14.49 → 13.44
on graphite, muted 5.64 → 5.24, gold 5.61 → 5.20. All still AA at their usage
size, and axe finds nothing, but it is a real cost.

It also pushed `faint` to 4.38 on graphite, under AA for the small uppercase
labels it is used for. `#8d8880 → #938e85` is the **minimum** lift that restores
its shipped ratio — 4.73 against 4.72 — in the same warm direction. Hue barely
moves: r−b goes 13 → 14. That is a correction the numbers demanded, not a
redesign of the type.

### Ember Ink (deep) — the same warmth, none of the cost

Warmth and lift are separable. Solve each rung at the luminance the shipped rung
already has:

```
ink #0b0a07   charcoal #16130e   graphite #221e16   hair #312b20
```

r−b becomes **+4, +8, +12, +17** — every ground warm — and **zero pairs lose
contrast.** Every ratio on the site is preserved exactly. `faint` needs no
correction at all.

Worth noting: `graphite` lands on `#221e16`, one digit from the `#221E17` the
colour report proposed as its **surface** anchor. That value was well judged. It
was the *ground* anchor that dragged the ladder up.

---

## Three lines each

**Stay as is.** The cool ground is the only thing anyone has identified as
wrong, and nobody has complained about it except in the abstract. Zero risk,
zero work, and the site launches on a palette that has been verified for months.
Against it: the mismatch is real and now measured, and it will keep being the
answer to "why does it feel austere".

**Ember Ink.** The change you can actually see — in the footers, the prose bands
and the rules it reads candlelit rather than clinical, which is exactly what was
asked for. Against it: the ground lifts to twice its depth, so the photographs
lose a little of their "only light in the room" quality, twelve pairs give up
about 7% of their contrast, and the arrival sequence's ink band nearly doubles
in luminance (23.5 against 13.3 — the graffiti still hides, delta 0.0–0.1, but
with less headroom than before).

**Ember Ink (deep).** All of the warmth, none of the arithmetic cost: nothing
regresses, no type token moves, the ink band is unchanged at 13.3, and the
photographs keep their absolute dark. Against it: it is subtle. On
photo-dominant surfaces like a venue opening it is nearly invisible; it shows in
footers, long prose and hairlines. If the complaint was "not beautiful enough",
this may be too quiet to answer it.

**My recommendation: Ember Ink (deep)**, and only after launch. It fixes the one
defect anyone has identified, costs nothing measurable, and cannot regress a
site that is one DNS entry from going live. If the owner looks at the strips and
finds it too quiet, Ember Ink is the honest next step and its cost is now priced
rather than guessed.

---

## What was verified

Read back out of the browser after the cascade ran, never from the token file —
`scripts/ember-verify.mjs`:

- The swap applies and the default carries no palette attribute at all.
- Every ground warm in both variants; every shipped ground cool.
- bone, muted and gold identical across all three palettes.
- Full contrast sweep, every token pair, from resolved values.
- **axe-core: 0 violations** on home, venues, venue detail, wedding guide and
  contact, at 1440 and 390, in **both** variants.
- **Graffiti check re-run in both**, since its premise moves with the ground:
  the rock stays indistinguishable, worst delta 0.1/255 either way.
- Scrims and gradients need no changes — they are built with
  `color-mix(in srgb, var(--color-ink) …)` and follow the ground. Verified in
  the stylesheet, not assumed. `.grade` is a filter carrying no colour token, so
  the photography is graded identically in all three.

## The one thing that would need a hand edit if a variant ships

`src/app/layout.tsx` sets `themeColor: "#0a0a0b"` — the mobile browser chrome
tint. It is metadata, so it cannot follow a CSS variable. It is the only
hardcoded colour left in the shipped tree, and it would need changing to match
whichever ladder wins.

## Aegean Bone — the light mini-study

Reference confirmed as wedinspire.com, so it was built: **three surfaces only**,
on study routes, at `/study/aegean`.

| | |
| --- | --- |
| Hero | [`/study/aegean/hero`](https://domisignature-redesign.vercel.app/study/aegean/hero) |
| Venues index | [`/study/aegean/venues`](https://domisignature-redesign.vercel.app/study/aegean/venues) |
| Venue opening | [`/study/aegean/venue`](https://domisignature-redesign.vercel.app/study/aegean/venue) |
| axe | **0 violations**, 4 routes × 2 breakpoints |

Tokens solved rather than picked (`scripts/derive-aegean.mjs`):

```
ivory  #f2ece1     ground
card   #fbf7f0     the matte photographs sit in
ink    #27211b     warm near-black — 13.53:1 on ivory
stone  #6b6558     secondary — 4.92:1 on ivory
rule   #d8cfc0     hairlines
```

**Not one photograph was touched.** Same files, same `grade` filter, no tint, no
fade, no haze. The work is done by three devices only: generous near-white mats
with a hairline frame, full-bleed dark chapters where a photograph should own
the screen, and air where a dark chapter meets the ivory ground.

### The finding that matters most: the gold does not survive

`#b98f4a` measures **6.68:1 on the shipped ink and 2.52:1 on ivory.** That fails
not only AA for body text but the 3:1 bar for large text as well. On a light
ground the accent cannot carry a single word.

Two ways out, and both cost something:

- **Keep `#b98f4a` and use it only as a hairline rule**, never text — which is
  what the study does. The "one gold moment per screen" survives as a mark
  rather than a word.
- **Darken it to about `#856635`** to clear 4.5:1 — but that is a different
  colour, not the same accent rationed differently, and the brand would then
  have two golds depending on the ground.

Nobody had priced this before. It is the single strongest argument that the
light direction is a rebrand rather than a recolour.

---

## The cost memo — what a full light inversion would invalidate

This is not a token swap. Three surfaces took an afternoon; the site is
seventeen routes plus an arrival sequence, and the following would all have to
be redone. Effort figures are honest estimates, not quotes.

| What breaks | Why | Realistic effort |
| --- | --- | --- |
| **The photographic grade** | `.grade` (contrast 1.06 / saturate 1.08 / brightness 1.015 / sepia 0.05) and `.grade-hero` were tuned to sit on near-black. On ivory the same filter reads muddy. Re-grading means re-reviewing the whole library by eye — and the standing rule is that judgement cannot be automated. | 1–2 days, plus the owner's review |
| **The arrival sequence** | Built entirely on dark: light pools, 4% grain, an ink band that hides a graffitied rock. On ivory there is no ink band, so the scene is not re-coloured, it is re-designed. | 2–4 days |
| **The graffiti check** | Its premise is that the graffiti is indistinguishable *inside a dark band*. On a light ground that band does not exist and the check becomes meaningless — the underlying question has to be answered again, possibly by re-cropping the frame. | Re-answer from scratch |
| **Every capture set** | `design-review/final/` is 40 captures, the contact sheets are 11 sheets over 156 frames, and the palette strips are 11 more. All show a dark site. | Half a day of regeneration |
| **The Lighthouse baselines** | The 12-cell table measures the dark build. Mats change rendered image sizes, so LCP moves in both directions and every number needs re-taking before it means anything. | Half a day |
| **The accent** | See above — a second gold, or gold demoted to decoration site-wide. | A brand decision, not an effort |
| **The hero join** | Dark scrim over film works because the page underneath is dark. Every dark-chapter-to-ivory transition on the site needs designing. | 1–2 days |
| **`themeColor`** | `src/app/layout.tsx` hardcodes `#0a0a0b` for the mobile browser tint. Metadata cannot follow a CSS variable. | One line |
| **axe, across everything** | New pairs everywhere. The current zero is a property of the dark system, not a property of the site. | Half a day |

**Total, honestly: one to two weeks of design and verification**, most of it
judgement rather than typing — and it lands on a site that is currently one DNS
entry from going live. Ember Ink (deep) is an afternoon and regresses nothing.

---

## Now four, side by side

`design-review/palette/` — the three built surfaces carry four panels
(current / ember / ember-deep / aegean-bone); journey and contact stay
three-panel, because the light study is three surfaces and an empty fourth
panel would imply something exists that does not.

The Aegean panels come from different routes, and that is the honest signal:
**a light inversion is not a token swap.** It needs mats, frames and chapters,
which are layout, not colour. The other three variants are the same page with
different variables.

One thing the captures made me fix: the light study first rendered inside the
site's near-black header and footer, because `ChromeGate` only hid chrome on
`/direction`. An ivory page framed in black is not what a light site looks like,
so the gate now covers `/study/aegean` too — and only it. `/study/enquiry` keeps
its chrome deliberately, since the point there is judging a form inside the
design it would ship into.

### Aegean Bone, three lines

It is genuinely beautiful on the venues index — matted plates on warm ivory read
like a printed sourcebook, which is exactly the Wedinspire register, and the
mats solve the dusk problem without touching a pixel of the photography. Against
it: the accent dies at 2.52:1, the photographic grade was tuned for black and
would need re-doing by eye, and the arrival sequence is not re-colourable but
re-designable. It is a rebrand with a one-to-two-week tail, offered here as
three honest surfaces rather than a promise.

---

## Cross-check against the second report (light-ground patterns)

A second research report arrived after the study was built. It agrees with the
measurement that matters — gold at 2.52:1 fails even the 3:1 non-text bar on
ivory — and its imagery caveat matches the standing law exactly: grain, wash and
emboss are CSS/SVG effects applied to real photographs, never synthetic imagery.

Three things to record, because two of them changed the study.

**It found a real defect in my light study.** The report warns "do not use gold
for focus". This site's focus ring *is* gold: `outline: 2px solid
var(--color-gold)`. On the shipped near-black that is **6.68:1**, comfortably
over the 3:1 a focus indicator needs. On ivory the identical ring is **2.52:1**
and fails — a keyboard visitor would lose it on the surface where focus is
hardest to track. **axe did not catch this and would not: it does not evaluate
focus-indicator contrast.** Only measuring the pair does. Fixed, scoped to the
study: the ring is now near-black at 13.53:1 on ivory, and the shipped gold ring
on dark is untouched. Verified by focusing a link on each ground and reading the
computed outline colour back.

**One of its contrast claims is backwards.** It says stone `#6b6558` "drops" on
the lighter card-ivory `#fbf7f0` and should be re-verified there. Measured, it
*rises*: **4.92:1 on ivory, 5.42:1 on card.** Dark text gains contrast on a
lighter ground. Worth correcting so nobody spends time chasing a problem that
does not exist — the genuine risks on ivory are the gold, the hairlines and the
focus ring, all of which are now priced.

**Its feasibility verdict is optimistic about this site specifically.** The
report argues the motion set is safe because it animates only transform, opacity
and clip-path. That is true in isolation, but mobile Home currently sits at **83
against a floor of 80**, and the measured constraint there was never motion — it
was a 72.8 KB stylesheet and main-thread work. Adding a preloader, parallax,
grain, page-transition panels and an overlay menu adds JavaScript and main-thread
time to the page with the least headroom on the site. It is not a reason not to
do it; it is a reason to hold the mobile floor as the gate on every stage, and to
be ready to drop the preloader and parallax first.

Also worth knowing before anyone prices it again: several patterns the report
proposes building **already exist** — the preloader, page transitions, masked
line reveals, parallax, grain and cursor states all ship today. In an inversion
they would be re-tuned for a light ground, not written from scratch. That makes
parts of the estimate cheaper than it reads, and does not change the total
much, because the expensive items remain the ones that need eyes: the
photographic grade and the arrival sequence.

---

## The pick

Four things to look at, one word back:

**"Stay as is"** · **"Ember Ink"** · **"Ember Ink deep"** · **"Aegean Bone — plan the inversion"**

Nothing ships until it arrives. The launch stays parked exactly as it is, and
`WAITING-FOR-DNS.md` still governs — the resume line works this second,
independently of anything in this study.
