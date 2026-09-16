# Aegean Bone — the inversion plan

**APPROVED with five amendments, folded in below.** The default palette is
untouched, the launch stays parked, and `WAITING-FOR-DNS.md` governs throughout —
the resume line works at any moment during this phase, independently of it.

## The five amendments

1. **The semantic switch covers every role**, not only text and surface — see §1.
   No component may reference a palette-literal token. This protects the plan's
   own thesis: dark chapters are local inversions, never conditionals.
2. **The whole inversion runs on a branch (`aegean`)** with its own preview
   deployment. `main` stays the verified dark palette, deployable at any moment
   including the parked launch, until stage 8 merges. Stages 4–7 never touch
   `main`.
3. **Chapter boundaries are defined once** — a token-driven wipe or scale-mask,
   no hard cuts — and applied everywhere, so nine scenes do not each invent
   their own.
4. **Grade A/B evidence includes a full venues-index composition per candidate**,
   because the north star is where the grade will be judged. For the arrival,
   **recommending removal of the scene is explicitly permitted** alongside
   "keep it dark".
5. **A subtle warm wash/vignette is pre-approved** as a tuning device if the
   ivory reads flat in stage 4's visual diff — same laws, decorative only,
   behind text.

---

## What this actually is

Not a recolour. **44 files** reference the dark tokens, across **158** uses of
`text-bone`, 40 of `text-muted`, 36 of `text-faint`, 31 of `bg-ink`, 21
`border-hair`, 20 `bg-graphite`, 20 `grade`, 14 `text-gold`. Eight routes, nine
home scenes, eleven motion components, and three baseline sets totalling 62
captures.

The north star is the venues index study: matted plates on warm ivory, hairline
frames, sourcebook rhythm. **Everything else rises to that standard or does not
ship.**

**Frozen this phase:** all copy, all facts, all SEO keywords. Derived stats stay
derived. No route changes, no IA changes, no content changes. This is ground,
type, motion and photography treatment only.

**Absolute:** every pixel of imagery stays a real photograph from the library.
Grain, wash and emboss are CSS and SVG applied over real photographs. No
synthetic people, couples, weddings, venues or events — not as placeholder, not
as texture, not anywhere. If a surface needs an image the library does not have,
the answer is a real styled shoot, and the surface waits.

---

## 1. Token architecture

Two ladders and a switch, rather than one palette.

```
/* the page ground — light */
--color-ivory   #f2ece1    ground
--color-card    #fbf7f0    plate mattes, panels, overlay menu
--color-ink     #27211b    warm near-black — 13.53:1 on ivory, 14.90:1 on card
--color-stone   #6b6558    secondary — 4.92:1 on ivory, 5.42:1 on card
--color-rule    #d8cfc0    hairlines

/* dark chapters keep the shipped ladder, unchanged */
--color-night   #0a0a0b    (today's ink)
--color-bone    #f3efe7    17.26:1 on night
--color-mutedD  #9b968c    6.72:1 on night
```

**The switch.** Every text colour resolves through two semantic tokens rather
than being named per surface:

```
--text-primary    /* ink on light sections, bone in dark chapters */
--text-secondary  /* stone on light, muted in dark */
--surface         /* ivory or night */
```

A section declares `data-ground="light"` or `data-ground="dark"` and the tokens
resolve underneath it. That is what makes a dark chapter a **local inversion**
rather than 44 files of conditional classes, and it is the single most important
structural decision in this plan — get it wrong and every subsequent stage costs
double.

**Migration order** (each its own boundary commit): tokens defined → semantic
switch wired → leaf components → scenes → routes → chrome. Nothing merges to the
default until the whole ladder is green.

**One hand edit that cannot be tokenised:** `layout.tsx` hardcodes
`themeColor: "#0a0a0b"` for the mobile browser tint. Metadata cannot read a CSS
variable. It becomes `#f2ece1`.

---

## 2. Gold and focus — law, not preference

Measured, not asserted:

| pair | ratio | verdict |
| --- | --- | --- |
| `#b98f4a` on night | 6.68:1 | fine — dark chapters keep gold as today |
| `#b98f4a` on ivory | **2.52:1** | fails AA body **and** the 3:1 non-text bar |
| `#b98f4a` on card | **2.77:1** | fails both |
| `#27211b` on ivory | 13.53:1 | the focus ring |

**On light ground, gold carries nothing that matters.** Permitted: the logo
mark, and decorative hairline rules that no one needs to see to understand the
page. Forbidden: text of any size, focus rings, essential borders, state
indication, icon-only affordances.

**The focus ring becomes law.** Today it is `2px solid var(--color-gold)`
sitewide — 6.68:1 on the shipped dark, and it would be **2.52:1** on ivory. The
light-ground ring is near-black at 13.53:1, offset 3px, and inside dark chapters
it stays gold. This is the defect the light study already caught, promoted from
a scoped fix to a rule. **axe will not verify this for you** — it does not
evaluate focus-indicator contrast — so it gets its own measured check in the QA
suite.

**`#856635` is not proposed.** It clears 4.52:1 on ivory, but it leaves the
brand with two golds depending on ground, which is worse than having one gold
that knows its place. I will propose it **only** if a surface proves it needs a
text accent that near-black and stone genuinely cannot carry — and I expect to
come back and tell you it was not needed.

---

## 3. Motion — re-tune, do not rewrite

Everything below already ships. The mechanics stay; the ground and the palette
change. This is why the motion stage is days, not weeks.

| Shipped | On paper | Work |
| --- | --- | --- |
| `PageTransition` — `bg-charcoal` panel, bone label | ivory panel wipe — `bg-card`, near-black label | token swap |
| `Preloader` — 128 lines, dark | ivory ground, near-black wordmark | token swap + re-time |
| `Reveal` — 268 lines, masked line rise | unchanged; ink-on-paper is the same motion | none |
| `ScrollImage` parallax | unchanged; retune amplitude inside mattes | tuning |
| `Grain` — 19 lines, 4% over dark | paper fibre — re-tune opacity and blend for light | tuning |
| `Cursor`, `Magnetic` | colour only | token swap |
| `VenueTransition` (Flip) | shared element now lands in a matte | geometry check |
| light pools / bloom | **removed** — nothing blooms on paper | delete |
| — | **soft-shadow choreography** on plates, warm-tinted | new, small |
| — | **rule-line draw-ons** for dividers and nav | new, small |

**Every stage gates on the mobile floor.** Mobile Home sits at **83 against a
floor of 80** — seventeen points of headroom in total and only three above the
line. The measured constraint there was never motion: it is a 72.8 KB stylesheet
and main-thread work. Adding to that page is the real risk in this plan.

**Agreed drop order if the floor is threatened:** preloader → parallax → grain →
shadow choreography. I will not negotiate past that list; if all four are gone
and the floor still fails, I stop and report rather than trimming something you
did not agree to lose.

`prefers-reduced-motion` continues to gate everything, and Lenis keeps honouring
it.

---

## 4. Photographic grade — decision point 1

Today: `.grade` is `contrast(1.06) saturate(1.08) brightness(1.015) sepia(0.05)`,
tuned to sit on near-black. On ivory the same filter reads muddy — the shadows
that used to disappear into the ground now have a light ground behind them.

I will build **two candidates** and put them side by side on the same frames:

- **A — Plate.** Slightly lifted black point, contrast held, sepia reduced. Aims
  at "photograph printed on warm stock".
- **B — Window.** Contrast held higher, blacks kept deep, warmth unchanged. Aims
  at "the dark photograph is a window in a light wall" — more drama, more
  distance from the paper.

Evidence: the same six frames — two dusk, two night, two daylight — in both
grades, at 1440 and 390, on ivory and inside a dark chapter. **Your pick.**

The library is ~200 photographs. Whichever grade wins is applied as a filter,
not baked into files, so it is reversible and no original is touched.

---

## 5. The arrival scene — decision point 2

The hardest single item, and the one that is genuinely a redesign rather than a
re-tune.

Today it is a pinned scene: photographic plates at **30–46% opacity** beneath a
full-height `linear-gradient(to top, ink, ink/70, ink/85)`, with display type at
`clamp(5rem, 21vw, 19rem)` in bone. The plates are served at quality 50 precisely
because they never resolve — they are texture under an ink wash, and one of them
hides a graffitied rock inside the dark band.

**None of that mechanism survives a light ground.** An ivory wash over a plate
does not conceal; it reveals. This is the section where "invert the palette"
stops being a sentence and starts being a design problem.

Two proposals, both on study routes, both with real photography:

- **A — The plate holds.** Keep the pinned structure; replace the ink wash with
  an ivory wash and raise plate opacity so the photograph is deliberately
  visible rather than hidden. The scene becomes a fading photographic ground
  under near-black type — closer to a printed title page.
- **B — The chapter.** Drop the wash entirely. The arrival becomes a full-bleed
  **dark chapter** — the one place the site goes to night — with the ivory
  resuming underneath. Keeps today's drama exactly, at the cost of the light
  system's continuity at the top of the page.

**Your pick.** If A wins, the legibility question is live and new (see §7). If B
wins, today's mechanism survives almost intact and the graffiti premise survives
with it.

---

## 6. Chrome, menu, and the plate system

- **Header** on ivory: hairline rule instead of a border, near-black wordmark,
  letterspaced small-caps nav, near-black focus rings.
- **Overlay menu** on `#fbf7f0` with large near-black links; focus trap, ESC to
  close, focus restored — as today.
- **Footer** as an editorial colophon on card: near-black headings, stone meta,
  one gold hairline permitted.
- **Venues index** — already built and approved as the north star; it becomes
  the shipped implementation.
- **Venue pages** — dark title card chapter, ivory reading zone, gallery as
  matted plates.
- **Venue facts as a specimen card** — the capacity, location and coordinates
  typeset on card with hairline rules. Facts frozen: same values, same derived
  figures, new typesetting only.
- **Events, services, guide, about, contact** — sourcebook rhythm, captioned
  plates, no uniform card wall.

The Monday enquiry embed is a white third-party iframe on a dark site today, and
its facade already reserves 1600px. On ivory it will sit *better*, not worse —
one of the few things this inversion makes easier.

---

## 7. Baselines, and retiring the graffiti check

**Rebuilt:** all 40 route captures, 11 contact sheets, 11 palette strips; the
full Lighthouse table on both presets; `design-review/final/` regenerated so the
repository never shows two eras at once.

**The graffiti check is retired**, and this needs saying plainly because it has
been a standing gate for months. Its premise is that a graffitied rock is
indistinguishable *inside a dark ink band* — measured as luminance delta between
two sampled points, today 0.0–0.1/255. On a light ground there is no ink band,
so the check would either pass meaninglessly or fail for the wrong reason.
**Retiring it without replacement would be a silent loss of coverage**, so it is
replaced by whatever premise the new arrival actually has:

- If **arrival A** wins: a new legibility check — the plate is now *deliberately
  visible*, so the question becomes whether anything unwanted resolves at the
  raised opacity. That is a real question with a real answer, and it needs the
  owner's eyes once before it can be automated.
- If **arrival B** wins: the existing check survives nearly as-is, re-pointed at
  the dark chapter.

Either way the replacement lands in the same commit as the retirement. The
eleven-check gate does not shrink.

**QA to the standing bars:** axe 0 on every route at both breakpoints, in light
sections *and* inside dark chapters; the focus-ring contrast check added; the
full token-pair sweep on both ladders; desktop ≥90 all categories; mobile ≥80
performance and ≥90 for the rest.

---

## Stage log

**Stage 1 — tokens and the ground switch: DONE.** On branch `aegean`, preview
[`/study/aegean`](https://domisignature-redesign-jkb8xq8vf-domisi.vercel.app/study/aegean).
`main` is untouched and still deployable, including the parked launch.

The switch covers all nine roles (amendment 1) and the study pages now contain
**zero palette literals** — that is the proof. Dark chapters invert locally by
declaring `data-ground="dark"` on their own section; the served HTML of the hero
carries both `data-ground="light"` and `data-ground="dark"`.

Two findings:

- The light ground supports a genuine three-step text ramp — **13.53 / 7.65 /
  4.92** — but only just. Tertiary sits near the floor, so hierarchy below it has
  to come from size and tracking, not another colour. Small letterspaced labels
  sit on tertiary; running prose on secondary. That is a small visual change from
  the approved study, where everything secondary used one value.
- **The dark ground had no rule meeting 3:1.** Today's `hair` is 1.41:1 on ink,
  so a boundary that must be seen to be understood has never had a token that
  qualifies. A pre-existing gap, not one the inversion created; closed with a
  solved `--rule-strong` at 3.12:1, with `hair` unchanged for the decorative
  hairlines it already draws.

Gate: `npm run verify:ground` reads the **cascade**, not the token file — a role
resolving to the wrong ladder looks perfect in CSS and is invisible until
someone measures pixels. 8 of 9 roles invert; accent is the one that does not,
correctly, because it is the same gold meaning different things. axe 0 on four
routes × two breakpoints; full gate 11/11.

---

**Stage 2 — the grade: DECIDED — GRADE B ("window").**
[`/study/aegean/grade`](https://domisignature-redesign-jkb8xq8vf-domisi.vercel.app/study/aegean/grade)
· venues north star: [`?grade=a`](https://domisignature-redesign-jkb8xq8vf-domisi.vercel.app/study/aegean/venues?grade=a)
· [`?grade=b`](https://domisignature-redesign-jkb8xq8vf-domisi.vercel.app/study/aegean/venues?grade=b)

```
today  .grade    contrast(1.06) brightness(1.015) saturate(1.08) sepia(0.05)
A      .grade-a  contrast(0.96) brightness(1.06)  saturate(1.02) sepia(0.03)
B      .grade-b  contrast(1.12) brightness(0.99)  saturate(1.10) sepia(0.05)
```

Six frames, **classified by looking at the contact sheet rather than by
filename** — two dusk (`th3-DSC_5495`, `th2b-DSC_5385`), two night
(`th3-DSC_9730`, `thDSC_9614`), two daylight (`th4`, `th1-DSC_9500`). All are
published frames from the Thalasses gallery; nothing withheld, nothing
generated, no file modified. Both candidates are CSS filters, so either reverts
by deleting a class.

Each frame appears twice — matted on ivory, and again inside a dark chapter with
the mats stripped away, because a grade that flatters the paper and ruins the
chapter is not a candidate. Per amendment 4, the full venues index is rendered
once per grade so the decision is made on the north star, not on a specimen row.

Captures in `design-review/grade/`, 1440 and 390.

**A — plate.** Shadows open, contrast eased. The photograph settles into the
page and the whole surface reads as one printed object. Risk: the dusk frames
give up some of their depth, and on the darkest night frames it can tip toward
grey.

**B — window.** Blacks held, contrast raised. The photograph keeps its own world
and the paper frames it, which preserves what the dark site was good at. Risk:
more contrast between plate and ground, so the page reads as photographs *on*
paper rather than *of* it — further from Wedinspire, closer to today.

**My read: B on the evidence I can see, but this is genuinely yours.** B holds
the dusk and night library — which is most of it — and the mats already supply
the editorial calm that A is reaching for. A is the more faithful Wedinspire
register and the better answer if the site should feel like a printed
sourcebook above all.

One thing found while building: the first capture came back with empty mats.
Next rejects any `quality` not declared in `next.config.ts`, and 82 is not in
the allowed list, so every image 400'd. Moved to 80, which is allowed, rather
than widening the shipped config for a study.

Gate 11/11, ground switch clean, axe 0 across seven study routes at both
breakpoints.

---

**Stage 2 closed — Grade B ("window") is the pick.** An earlier confirmation of
Grade A came from a source that had not seen the frames and was corrected on
review; B is what the evidence and the owner's own look support. Applied across
every light surface: the aegean hero, venue opening, venues index and the motion
study's plate grid. `?grade=a` still renders the runner-up, so the comparison
that produced the decision stays reachable rather than being deleted with it.

`.grade` (the shipped dark-ground filter) is untouched and still used by the
dark-palette study components — Grade A is the *light* system's grade, not a
replacement for the one the live site serves.

**Stage 2a — three new interactions** at
[`/study/motion`](https://domisignature-redesign-jkb8xq8vf-domisi.vercel.app/study/motion):
a marquee that answers scroll velocity, a broken grid with a cursor-tracking
label, and the six steps with the title held. Built on GSAP + ScrollTrigger +
Lenis; **Framer Motion was not added** and the typefaces were not touched, both
confirmed by the owner. Four of the five requested components already shipped
and were left alone rather than rebuilt.

The finding worth keeping from that work: **an opacity fade is not available on
a light ground.** A scrubbed element rests in its start state and axe evaluates
it there — a fade from 0.18 was 21 contrast failures. Starting higher does not
help: on ivory, primary text needs α ≥ 0.64 and secondary ≥ 0.79 to hold AA,
leaving no perceptible range. Steps now arrive by lifting and un-masking with
`clip-path`, which never reduces a visible pixel's contrast and removes nothing
from the accessibility tree.

**Copy fix, authorised:** `content/journey.ts` step 1 read "Pick one of the
four" — stale since Villa Aetos was withdrawn. Now "three". Worth noting that
**no audit could have caught it**: the claims audit checks scarcity and
exclusivity language, and the prose audit checks placeholders and typography.
A stale count inside otherwise-correct prose is invisible to both. This is the
second instance of that exact bug class after "The other three", and both were
found by reading, not by tooling.

---

**Stage 3 — the arrival: BUILT, awaiting the pick.**
[`arrival/plate`](https://domisignature-redesign-jkb8xq8vf-domisi.vercel.app/study/aegean/arrival/plate)
· [`arrival/chapter`](https://domisignature-redesign-jkb8xq8vf-domisi.vercel.app/study/aegean/arrival/chapter)
· captures in `design-review/arrival/`

The shipped scene works by **concealment**: plates at 30% under a full-height
ink gradient, served at quality 50 precisely because they never resolve. An
ivory wash does not conceal — it reveals — so this is the one part of the
inversion that could not be re-coloured, only re-decided.

**A — plate.** The structure holds. The photograph rises to 62% and is washed
back with ivory rather than hidden by it, under near-black type. It reads as a
printed title page with a photographic ground.

**B — chapter.** The wash idea is dropped. The arrival becomes the one place the
site goes to night, with ivory resuming underneath — today's scene, kept.

**Both hold their type, and this was measured rather than assumed.**
`scripts/arrival-legibility.mjs` is the replacement premise the plan promised in
§7. It renders each variant twice — once as-is, once with the type hidden —
samples the real composite behind every text box, and scores the **worst pixel**
against the text's computed colour, because legibility is decided by the hardest
pixel a letter lands on rather than the average:

| | the word (3:1) | standfirst (4.5:1) | stats (3:1) |
| --- | --- | --- | --- |
| plate | 7.90 | **5.13** | 10.39 |
| chapter | 13.64 | 5.72 | 15.70 |

So the light arrival is genuinely viable — the open question from the plan is
answered yes. Plate's tightest margin is the standfirst at 5.13 against a 4.5
bar, which is real headroom but the number to watch if the wash is ever eased.

**I am not recommending removal.** Amendment 4 permits it and I would say so if
either proposal were limp; neither is.

**My read: A.** B is today's scene preserved, which is a fine answer but does not
advance the direction the inversion was chosen for — it puts the site's loudest
moment back in the dark it is moving away from. A proves the light system can
carry the site's biggest gesture, and it is the only one of the two that would
make someone say the site had changed.

The graffiti check is not retired yet — it retires in the same commit that
migrates the real arrival, per §7, so the gate never shrinks. It currently still
guards the shipped dark scene and passes.

---

**Stage 3 closed — Arrival A ("plate") is the pick, and it ships.** The real
`Arrival.tsx` now runs on the plate mechanism: five photographs at 62% under
the ivory wash, near-black type, the light-ground grade. The pin is kept and
its direction inverted — on ink the plate *rose* out of the dark (30 → 46); on
paper it is strongest the moment you arrive and settles back (0.62 → 0.50) as
the facts land. That also puts the legibility floor at the resting state by
construction: exposure only ever decreases across the scrub.

**Quality re-priced by measurement, not raised by instinct.** 50 was never a
performance default — it was priced for concealment. Composited exactly as the
scene composites (62%, grade-b, the wash) and diffed against q85:

| | q50 | q75 | q80 | bytes q50 → q75 |
| --- | --- | --- | --- | --- |
| worst max delta, five frames | 15–16/255 | 6–8 | 5–7 | |
| the frame every visitor loads | 78 KB | 133 KB | 162 KB | **+55 KB** |
| all five (desktop ≥1024 only) | 301 KB | 510 KB | 609 KB | +209 KB |

q75 clears the visible artefact band; q80 buys about one level of 255 for
another 99 KB. Four of the five frames only mount on desktop, so the mobile
floor pays the 55 and nothing more. `scripts/arrival-quality.mjs`.

**The graffiti check is retired and replaced in the same commit.**
`arrival-legibility.mjs` now guards the *shipped* scene — every one of the five
frames raised in turn at the resting exposure, at 1440 and 390 — with the two
study proposals kept measurable alongside it:

| | the word (3:1) | standfirst (4.5:1) | stats (3:1) |
| --- | --- | --- | --- |
| shipped, 1440, worst of five frames | 7.81 | **5.17** (frame 3) | 10.88 |
| shipped, 390 | 12.61 | 7.35 | 9.30 |
| study — plate | 7.90 | 5.13 | 10.39 |
| study — chapter (runner-up) | 13.64 | 5.72 | 15.70 |

The rock itself was looked at before the swap, not assumed away: it sits in
the lower band, under the heaviest part of the wash (0.94 → 0.72), and still
does not resolve. It simply stopped being the interesting risk.

Two small things found on the way. `.rule` inside a declared ground now follows
that ground's `--rule` — a no-op on dark, and the only thing stopping a light
section drawing near-black hairlines. And the measurement hooks travel through
`TextReveal` and `CountUp` as an explicit `measure` prop, because TypeScript
does not check hyphenated JSX attributes on a component: a stray `data-*` passed
there compiles perfectly and never reaches the DOM, and a check that cannot find
its target would report "not on screen", which reads like a pass. A missing
hook is now a FAIL.

[`/study/aegean/arrival/chapter`](https://domisignature-redesign-jkb8xq8vf-domisi.vercel.app/study/aegean/arrival/chapter)
stays reachable as the runner-up, as `?grade=a` does for the grade. Gate 11/11.

**Stage 4 — leaf components and scenes: DONE.** Branch preview
[`lwycv01tj`](https://domisignature-redesign-lwycv01tj-domisi.vercel.app) (snapshot `118f48c`) · captures `design-review/stage4/` (all routes, 1440 and 390) ·
amendment 5 before / rejected / after in `design-review/stage4-vignette-{before,rails,after}/`.

**The completion test is mechanical and it is met.** `npm run verify:palette`
reports zero palette literals outside the token definitions across all 91 files
under `src/`, and it is a permanent check in the gate. Dark chapters declare
`data-ground="dark"` locally; nothing references a ladder. The one light→dark
boundary is `Chapter.tsx`, used by the three designated chapters (home hero,
enquiry block, venue title card) and nothing else.

Thirteen agents migrated 49 files against one rulebook
(`design-review/SEMANTIC-TOKENS.md`); three fresh sweeps closed what they
missed; thirteen reviewers then read every route at 1440 and 390 against the
dark captures, tile by tile. Worst finding, a blocker: the venue names on the
mobile cards were near-black on dark photographs.

**Three rules came out of measuring the result — each closes a class, not an instance:**

1. *Colour re-resolves at every ground.* CSS `color` inherits as a computed
   value, so an unroled child inside a dark frame kept its section's paper ink —
   that is how the venue names went dark on dark. `[data-ground]` now declares
   its own primary, and `verify:ground` checks every visible text element on
   every route against its nearest ground's ladder: 1,050 on eleven routes, all
   on their own ground.
2. *The focus ring has a halo and is never gold.* A `--surface` band under the
   ring means every point is ring-against-halo or halo-against-page. The ring
   is 3px, not 2: over a dark scrim a night halo changes nothing, so the ring
   alone must carry 2.4.13, and at 2px the venue title card's "Enquire" pill
   measured 572px² of change against the 576 required. Near-
   black on paper, **bone on night** (your stage-5 law, and the arithmetic
   agrees: gold with a night halo leaves photograph tones where neither clears
   3:1). Where a ring outside would be clipped — a masonry tile, a button
   filling a clipped frame — `.focus-inset` draws the same ring and halo inside.
3. *Paper has a lamp* (amendment 5). All thirteen reviewers called the ivory flat. The first remedy, an
   inset-shadow vignette down both margins, was measured by an independent
   review as grey rails (-4.7% at the edge, nothing from 10% to 90% of the
   width, no vertical variation) that stepped 9-22 levels wherever a shaded
   sheet met an unshaded one - rejected; its captures are kept. Each paper
   sheet now carries its own lamp: a soft lift in its middle and two warm
   lobes on its flanks, every layer zero before the sheet's top and bottom, so
   no join can step. A second review found the lift peaking at only +1.3% (my
   comment claimed +3%; the raised step is only 4.6% above the page), so the
   mix went from 30% to 65%. Measured on the final captures, lamp minus flat:
   centre +2.8 to +3.3%, very edge -2.9 to -3.4%, -0.4 to -0.5% at the gutter
   where type begins, and down the centre 0.8 -> 3 -> 0.8% - the paper varies
   both ways. The largest step at any join is 1-2 levels, the gradient's own
   banding (the rails' was 11). No ground under type is darker than 1.6%; the
   3% ceiling holds. It is a background layer, so axe reports 1,680
   contrast checks as "needs review" - printed, and covered on pixels by the
   paper sweep, every route, both widths. Not fixed: the 404's first screen,
   under its photograph's veil, stays flat; changing that means touching a
   section.

**The five open items, each measured:**

- **The silent type-check death — found, in Next.** 15.5 runs type checking in
  a worker with `maxRetries: 0` and catches any failure from it with a bare
  `process.exit(1)`, assuming the worker already logged. A dead worker logs
  nothing. Proved by killing the worker mid-check (bare Next printed one cryptic
  line and died) and by a deliberate type error (Next prints it loudly — the
  silence is specific to a death). Three traced rebuilds of the failing tree
  passed. `npm run build` is now `scripts/build.mjs`: tsc first, so a type error
  stops the build with file and line; then Next; then a check that a fresh,
  type-checked build exists — and a death with no reason is named as a death.
  `next.config.ts` states `ignoreBuildErrors: false` explicitly.
- **What was killing processes — found, and not this project.** Three other
  Claude sessions on this machine work on the sibling projects; at 10:33 UTC
  every node process on the machine was terminated, theirs and ours. That is
  every "silent" server death since 4 September: exit 1, empty stderr, no crash
  in the event log. The ink-hotels session has since confirmed it from its
  side. Our long suites now run under a renamed copy of node.exe on port 3104
  through a supervisor that logs and restarts; nothing of theirs was touched.
- **The Hero's root rewire — verified by behaviour, kept.** Built the Hero both
  ways and read the choreography at sixteen scroll offsets: parallax, the copy's
  lift and fade, the arrival's pin and spacer, the plate's exposure and scale,
  which photograph is up — identical at every one. Only the hero's clip differs:
  the chapter exit mask, by design. Re-measured on the final build: identical,
  clip included.
- **The focus ring on Home — fixed.** Before: 31 of 412 tab stops failed — the
  gold ring over the hero photograph, the skip link over the hero, the events
  strip clipping its cards' rings, the video buttons and gallery tiles clipping
  theirs. After: **0 of 391** stops on the ten audited routes fail WCAG
  2.4.13's area test or the no-gap test. The last three closed on the final
  build. The ring went to 3px: over a dark scrim a night halo changes nothing,
  and at 2px the venue title card's "Enquire" pill measured 572px² against the
  576 required. And the events strip now keeps a focused card whole: the
  mandatory snap had parked the shade-sail card 36px past the viewport, and
  the shelf's end padding lay off-screen, so the last card sat flush on the
  window's edge with its ring outside it. Embeds (the venue map; the contact
  form and maps) are recorded, not scored — see the flags below.
- **Amendment 5 — applied, reviewed, re-shaped.** See rule 3.
- **The review fix pass — finished.** Nine fixes from the visual review, plus:
  the breadcrumb separator moved from a hairline role to a text role (it was
  1.24:1); the journey rail became a thumb-index tab in the gutter, clear of
  the text it overran ("05" at 3.56:1); the events strip gained room for a
  focused card's ring without moving; the per-scene glow pools a fixer added to
  ServiceScenes were taken back (amendment 5 touches no section).

**Found in an interrupted fixer's work, and decided.** A globals fixer that hit
the session limit left a half-built amendment 5 in the committed tree: a body
gradient plus a `.paper` class every section would have had to adopt, the pools
re-cast as shadows, and a grain retune. The gradient and class were removed;
the pools went back to the harmless lift stage 6 deletes; the grain retune was
measured — its dark specks took tertiary type to 4.41:1 on the worst pixel — and
reverted. Its one solid number was kept: 3% is the most any pixel under type may
take.

**Instruments corrected on the way, because a wrong instrument is worse than
none:** the paper sweep scored whole element boxes, so a bullet hairline or a
pill's rounded corner counted as "the ground behind the text" — it now samples
the glyphs' own line boxes. The focus audit looked only outward, so indicators
drawn inside read as missing — it now looks both ways, centres each stop before
measuring, and applies WCAG 2.4.13's area test plus a no-gap test (no side may
fade out along more than 5% of its length). Every sub-3:1 position is still
printed. Scoring every single position was stricter than 2.4.13 and could not
survive photographs: a 2px umbrella pole ran exactly under the ring for seven
rows with pale sea under both halos.

**Measured, final build:** axe **0** on every route at both widths; 1,680
contrast checks axe cannot compute over the lamp, reported rather than hidden,
and covered on pixels by the paper sweep — every route, both widths, green;
arrival legibility green on the final build (tightest: the standfirst at
5.13:1 against 4.5, worst pixel); ground switch clean.
Gate **15/15 green** on the final build. Lighthouse mobile against the
floor (performance ≥ 80, the rest ≥ 90): Home 90, Venues 93, Venue detail 87,
Signature Events 92, Wedding Guide 92, Contact 92; accessibility 98–100, best
practices and SEO 100 (`design-review/lighthouse-stage4.md`) — measured on the
build before the last two focus fixes, which change neither loading nor
anything at rest.

**Flagged, not changed — copy and facts are frozen:**

- Home, the venues standfirst: *"A mountain estate, a private beach, an olive
  field and a house in the hills"* — four settings for three venues; the house
  in the hills was Villa Aetos. The third stale count of this kind; no audit can
  see one inside correct prose.
- `/venues` header: "Up to **300** guests" is typed, not derived from
  `content/venues.ts`. Right today; not guarded.
- The Monday enquiry form is published from another brand's Monday account (a
  "Crete Holiday Home" logo) and paints a cool white card. Both live in the
  Monday builder, outside this repository.
- Embeds and focus: with focus inside the Monday form or a Google map, the frame
  matches neither `:focus` nor `:focus-within` in this page, so no rule here can
  draw its indicator; the keyboard audit records the same four iframes on
  `main`. Recorded, not chased this stage, as instructed.

Privacy gate: a false alarm from my own grep (a keep-list entry in the manifest
script read as withheld) was run down before any push; the gate now reads the
manifest's exported `WITHHELD` map, requires exactly seven entries and zero
hits by exact path.

**Stage 5 — chrome, menu, preloader, footer and cursor on ivory; the editorial
plate system: DONE.** Branch preview [`7apxf9ext`](https://domisignature-redesign-7apxf9ext-domisi.vercel.app) (snapshot `0c89d8c`) · captures
`design-review/stage5/` (all routes, 1440 and 390).

**One plate, built once.** Before any group fanned out, the shared primitives
went in: `Plate` (the sourcebook plate from the venues-index study — the
photograph in a mat of the raised surface, a `--rule` hairline, a caption
beneath on paper, a derived number), `Phone` (Playfair has no plus sign; the
"+" of a phone number is set in the sans, the number itself untouched), and
the chapter's rest state — the reviewers' most repeated finding, a mid-page
dark chapter resting as a full-bleed slab with a razor cut across the paper:
masked on both edges, it now rests inset by a gutter, a plate on the page,
wherever no scrub runs (reduced motion, the server render, every capture);
openers rest full-bleed. Nine groups then worked on disjoint files, and a
fresh law sweep read every change. It came back with one finding — the venue
film unplated while the event films were plated — and two notes; all three
were taken.

**Where the plate landed.** `/venues` ships the north star: `VenuePlates`, the
approved study made real — alternating 7/5 plates, number, name, standfirst,
rule, capacity / location, coordinates, Enquire; every fact the shipped list
showed is still there, the shared-element transition lifts from the plate's
own photograph, and the home page keeps its hover list. Venue and event
galleries are matted tiles; the facts panel is a specimen card (coordinates
now among the facts, under the existing "Location"); related venues, team
portraits, the home strip, the journey teaser and the films are plates; the
events index is captioned plates, the title and category on paper beneath and
the type off the photograph at last. Full-bleed scenes (the hero, the service
scenes, the journey chapters) stay full-bleed.

**A rule came out of it: a plate sits on the page ground; a raised section
hosts no plates.** A mat is the raised tone, so on a raised band a plate reads
as a bare hairline — four groups hit it independently. Six sections moved to
paper: the venue gallery and films, the event films, the related venues, both
team sections, the journey teaser, the contact maps band. Raised surfaces that
host no plate stay raised: the footer, the facts card, the form and map
shells, the menu panel, the guide's band.

**Chrome.** The menu now has the focus trap and restore the plan always said
it had: opening moves focus in, Tab and Shift+Tab cycle the panel and Close,
the page behind is `inert`, Escape closes, focus returns to the menu button.
It is a named dialog without `aria-modal`, on purpose — Close lives in the
header, outside the panel, and aria-modal lets VoiceOver hide everything
outside a dialog, the one way out included; `inert` already takes the page out
of reach for every assistive technology. No audit had ever opened the menu —
the keyboard audit runs at 1440 — so a new check (`menu-trap`) opens it at 390
on four routes and walks the cycle both ways: it holds on every one. A real
defect went with it:
opening the menu over the hero left the header on the dark ground above the
ivory panel, Close bone on ivory at about 1.07:1. The header's hover dimming
is a colour step, not an opacity fade, and on paper only — over the unveiled
hero nothing below primary holds. The footer is an editorial colophon on the
raised surface: near-black headings, tertiary meta, one gold hairline, the
wordmark mixed toward the ground so it is felt rather than read. Hairlines
that sit over photographs are `--rule-strong`; the video ring comes from the
type ladder; a map that has mounted but painted nothing still reads as a
framed plate.

**The visual review, and what it changed.** Six reviewers read every route,
tile by tile, at 1440 and 390 against stage 4. All six found the same fault,
and it was mine: the enquiry block at rest had its type on the plate's cut
edge — eyebrow, heading and pill 0–1px inside it — and stood straight on the
footer, because the rest state inset only the sides of the clip and moved
nothing inside. Fixed in the one definition: a resting mid-page chapter now
insets its foot too, so paper lies beneath it, and its content steps in by
the same gutter (static padding, never tied to the scrub, so nothing re-wraps
while the sides open). Eleven smaller findings were taken: Home was 12px wider
than the window (the strip's negative margin pushed it past the edge it
already reached — there since before this phase, visible now against the
lighter footer); related venues said their name twice; gallery numbers ran
down the masonry columns (01 / 09 / 17 across the top row) and were dropped;
the facts card broke its button onto two lines and outran its column (five
columns, not four); the coordinates became Location's second line instead of
an unlabelled row; sections that now share one ground stacked two paddings
into dead air; the footer's WhatsApp tag inherited the serif; every plate's
caption now aligns with the photograph's edge; Home's tightest join opened by
5rem; and below 1024px the full-bleed scenes of /services and /wedding-guide
— inside the gutter there, objects on the page, their pale edges dissolving —
are matted as plates, bare again where they bleed.

**Judgements recorded.** The /venues photographs keep the empty alt the list
always had — the link beside them already reads the name and standfirst, and
alt text is frozen. A related venue's link name kept its "02" (Plate hides its
number; the same derived number is restored for screen readers). The first
/venues plate loads with priority — it is in the first screen. `verify:ground`
now skips the one decorative logotype axe already excludes; nothing else is
exempt.

**Surfaces that wanted a text accent:** none — no group asked for one.
**Surfaces that wanted words they do not have** (reported, not written): a
label for the coordinates row (it sits under "Location"); a visible caption
for each film ("Film 1" exists only as an aria-label).

**Measured, final build:** axe **0** on every route at both widths (1,243
contrast checks axe cannot compute over the lamp, fewer than stage 4's 1,680
now that six raised sections are paper, covered on pixels by the paper sweep);
ground switch clean — every visible text element on its own ladder; the paper
sweep **1,799 text elements, every one clearing its bar on the worst pixel**
(tightest 4.67:1 against 4.5, a tertiary eyebrow over the lamp); arrival
legibility unchanged (tightest: the standfirst, 5.13:1 against 4.5); focus
**391 stops on ten routes, and at every position of every perimeter the
indicator changes the page by 3:1 or more** — the strict criterion now holds
everywhere, not only 2.4.13's area test (weakest 4.04:1, a film's play button
over its poster); the menu trap holds on every route; the keyboard audit
shows only the recorded third-party frames, as on `main`. The Hero's pin and
scrub are identical to stage 4's at all sixteen offsets; the only value that
differs is the page's height (16,622 → 16,860px, the plates below it and the
5rem opened above "How it works"). Every capture is exactly 1440 or 390 wide —
Home's extra 12px is gone. Gate **15/15 green** on the final tree (`f371558`), including axe, the ground
switch, focus, paper and arrival legibility, assets and the launch checks. Lighthouse mobile, median of three
runs on the final tree (performance, runs in brackets; LCP): Home **81**
(84/81/81; 3.9 s), Venues **91** (91/91/91; 3.2 s), Venue detail **87**
(86/87/87; 3.7 s), Signature Events **91** (92/91/91; 3.1 s), Wedding Guide
**91** (92/90/91; 3.1 s), Contact **93** (92/93/94; 2.9 s); accessibility
98–100, best practices and SEO 100, CLS 0–0.001 — every route over the floor
(≥ 80, the rest ≥ 90), Home by one point. Read it as a margin to win back, not
noise: the stage-5 tree before the review fixes read 94 in a single run and
stage 4 read 90, though two of the three samples here overlapped a sibling
session's dev server on the same machine. The brief audit found the likely
cause class — loading, not motion: the page curtain sets content to opacity 0
on first mount, React 19 preloads the first gallery tiles, /venues lacks a
fetch priority on its first plate, and GSAP Flip sits in the shared chunk. They
are the first work of stage 6, ahead of its drop-level matrix, so motion is
not cut to pay for loading.

**Flagged, not changed:**

- The venue page now sets capacity large twice — the page's own line under
  the description and the specimen card's value. Both are right; the echo is
  a design call for the owner.
- Map shells render blank in the headless captures: Google Maps does not
  paint there. Real browsers draw the map inside the framed plate.
- Carried forward from stage 4, unchanged: Home's "four settings" sentence
  for three venues; the typed "300" on /venues; the Monday form published
  from another brand's account; focus inside a third-party frame.
- Seen by the reviewers, there before this phase: the /events masonry splits
  3/3/1 with a repeating aspect stack; the fine venue details over pale water
  on the mobile venue list read faintly; the hero wordmark is cut at 390.
- Found by the stage-6 planning pass, all for stage 6: the preloader's Skip
  button sits inside an aria-hidden root; the page curtain runs on first load
  too; motion hides the focus ring in four places (every audit runs with
  reduced motion, so none saw it); the arrival's facts are a scrubbed fade on
  paper text; Lighthouse 13 dropped the audit the report's LCP-element column
  read.

### Stage 6 — pre-work (2026-09-14)

On the owner's decisions of 2026-09-14 (`design-review/STAGE6-PLAN.md`), in
the owner's order, before any motion is touched.

**1. Next.js 15.5.25** (`e7252a7`). `next` and `eslint-config-next` from
15.5.22, out of GHSA-2xp9-vwfh-vxw4 and GHSA-p293-qw3h-jr36 / CVE-2026-75604;
the lockfile moved only the next family and one transitive patch. Every local
server binds 127.0.0.1.

**2. Media metadata** (tooling `2fda5aa`, files `c40de6c`). Before: 150 of the
390 tracked media files carried a camera serial (140), GPS (50) or an embedded
thumbnail (28). Every published photograph and video was rewritten losslessly
— JPEG marker surgery, a stream-copy remux for video — keeping the ICC profile,
orientation and the photographer/copyright credit: 149 files changed (141
stills, 8 videos), 27 already clean. Independently verified: 15 sampled stills
pixel-identical with the same ICC, orientation and credit; all 8 videos
identical by the hash of their copied packets. After: all 390 clean, and
`metadata` is the gate's sixteenth check, so nothing carrying GPS, a serial or
a hidden thumbnail can ship again. The brochure PDF's page thumbnails picture
its own pages; they are noted, not failed. `posterimage.png` joined the
withheld list (eight entries, `b0cdf48`); the pre-push guard is installed
(`94be282`). The ledger lives outside the repository and records no
coordinate or serial.

**Old previews removed.** Sixteen preview deployments whose trees carried
withheld files or names were deleted (target verified as preview each time;
production untouched): ten Git-built previews of 1–11 September and six CLI
deployments of 17–21 August. Links to them no longer resolve: stage 1's
`jkb8xq8vf` and stage 4's `lwycv01tj` above, and the previews named in
`RUN2-REPORT.md`, `RUN3-REPORT.md` and `PHASE6-REPORT.md`. The stage-5 and
docs previews (`7apxf9ext`, `ikw1wxqqc`) are clean and kept.

**3. The four loading fixes** (`41c473b`), measured against a reference taken
on `c40de6c` before them (same machine, loopback, three mobile samples each):

- The page curtain no longer runs on the first mount.
- Gallery tile preloads follow `eager`; venue pages pass `eager={0}`.
- The first /venues plate carries `fetchPriority="high"`.
- GSAP Flip leaves the shared motion contract.

Built output, before (reference build) → after: Home — two image preloads,
the hero poster at high priority → unchanged, as it should be; /venues — two preloads, the first
plate at the default priority, every plate image lazy or unmarked → the plate at high priority, its image marked high;
a venue page — six preloads, four of them gallery tiles below the fold, and
four eager tiles → two, the header mark and the title card at high priority, no eager tile; an event page — five preloads, its gallery opening
the page (left as it is: those tiles are in the first screen) → unchanged; GSAP
Flip in the chunks of 11 of 24 page entries, Home among them → the events index alone.

Lighthouse mobile, performance median of three (runs; LCP median). The
reference gate was 16/16 green.

| Route | Stage 5 `f371558` | Reference `c40de6c` | Fixes `41c473b` |
|---|---|---|---|
| Home | 81 (84/81/81; 3.9 s) | 83 (82/83/84; 3.8 s) | **88** (88/91/88; 2.8 s) |
| Venues | 91 (91/91/91; 3.2 s) | 91 (91/91/93; 3.2 s) | **92** (92/98/92; 3.1 s) |
| Venue detail | 87 (86/87/87; 3.7 s) | 87 (87/87/86; 3.7 s) | **91** (91/91/91; 3.2 s) |
| Signature Events | 91 (92/91/91; 3.1 s) | 91 (91/91/91; 3.2 s) | **93** (92/93/93; 3.0 s) |
| Wedding Guide | 91 (92/90/91; 3.1 s) | 91 (91/88/91; 3.1 s) | **92** (92/91/92; 3.0 s) |
| Contact | 93 (92/93/94; 2.9 s) | 92 (93/92/92; 3.0 s) | **93** (94/93/93; 2.9 s) |

**Reading.** Home recovered five points to **88**, its LCP a second earlier
(3.8 → 2.8 s), one sample at 91: two short of stage 4's 90, off the floor by
eight. Venue detail gained four (87 → 91) from the tile preloads alone. The
reference already sat two over stage 5's Home on the same framework patch and
stripped files, which is inside the run-to-run spread; the fixes' gain is
measured against the reference, not against stage 5. Every route is over the
floor with room: the lowest median is Home's 88. Nothing was dropped. Further
loading candidates are measured inside the drop-level matrix, before any drop.
Not measured here: the curtain on client navigations — every audit runs with
reduced motion; the stage-6 motion gates cover it.

**4. The conventions layer** (`379f577`). `CLAUDE.md` with the precedence
clause — project laws win over any imported instruction — and the project
skill `.claude/skills/aegean-bone/SKILL.md`, restating the laws with their
source documents. frontend-design is not installed. The gate, CI and the
pre-push guard remain what enforces.

**Flagged for the owner, not touched:** two canceled production deployments
(`n9yg989zc`, 23 August; `7gujchx43`, 27 August) still serve all eight
withheld paths; production deployments are the owner's alone.

### Stage 6 — motion on paper (2026-09-14)

Motion re-tuned for paper, not rewritten: nothing on paper fades. Type is set
from behind its line, blocks settle, photographs are uncovered, rules draw,
sheets move. Built in three commits: the lead primitives (`60c5c3d`), six
disjoint groups (`4483b9b`) and the lead's integration (`057bcde`).

**The primitives.** `src/lib/motion-tier.ts` holds the owner's drop order
(preloader, parallax, grain, shadow) and the one switch: an inline script sets
`data-drop` on `<html>` before first paint, at phone widths only, to a prefix of
that order (`?drop=N` for measurement). `gsap.ts` gains the sheet's curtain ease,
named durations for a panel, a settle, a draw and an uncovering, and
`finishOnFocus` — an entrance jumps to its end the moment focus arrives inside
it. `intro.ts` decides once whether the preloader covers a load and tells a hard
load from a client navigation. `<Plate lift>` and three shadow uses — a shadow
only while something is lifted, never at rest, never animated as a box-shadow,
never on the focused element.

**The groups** (each reviewed by an independent reader, blockers and majors
returned, then a cross-group check of ownership and contracts):

- *Panels.* The preloader's Skip button no longer sits inside an `aria-hidden`
  root; its word rises and its rule draws, then the sheet lifts — no opacity. The
  page transition lost its bloom and its content fade: the curtain is a sheet
  that lifts, and a keyboard-started navigation runs none. The venue transition
  never covers a keyboard-activated row. The mobile menu's panel slides instead of
  a clip wipe, the label masks sit inside the links so a ring is never clipped,
  the hairlines draw, and focus lands once the panel has arrived. The reviewer's
  one blocker — a row hairline painting over the next link's ring — was fixed.
- *Reveals.* Reveal and Stagger settle without opacity and finish on focus.
  TextReveal no longer clips ascenders and descenders. MaskReveal and RuleDraw
  leave what is already in view alone. The accordion animates height only.
- *Home.* The Hero holds its entrance only when something will cover it, and a
  focus finishes it; its copy stays opaque while focused. The arrival's facts
  arrive as a clip plus a lift instead of a scrubbed fade — the one intended
  hero-states change. The stills pause off-screen; the scroll cue runs at `lg`.
- *Deletions.* The light pools are gone; the footer's gold hairline and legal
  rule draw; the marquee pauses off-screen.
- *Plates.* Five interactive plates lift; gallery and events batches settle
  without opacity and finish on focus.
- *Gates.* `focus-motion` (motion on: a focused element is never hidden, clipped
  or covered at 50/200/500/900 ms after a trigger), `motion-tier` (the switch
  applies exactly its prefix at 390, nothing at 1440) and `typeset-clip` (no
  clipped ink in any TextReveal line) join the gate; `paper-legibility --motion`
  and `--lift`, INP under a 4× CPU throttle, hero-states `--intended`, and
  Lighthouse medians with the worst run and the LCP element run beside it. The
  reviewer's one major — `typeset-clip` could pass silently — was fixed.

**Integration.** ScrollImage now clamps its drift to the headroom its scale
leaves: unclamped, a strip of the mat showed at the top of a plate short against
the viewport (JourneyTeaser, JourneyChapters, ServiceScenes at phone width).
`.group:focus-visible` joins the plate lift. `.glow` is deleted.
`focus-motion`'s ring box is 7px, the indicator's real reach.

**The integration build (`057bcde`) measured, and what it found.** The gate
read 16/19. Reduced motion was clean on every route, and the paper sweep with
motion on saw 1,932 text elements, none part-transparent at any stop. Four
defects came out, each cause established by measurement or by a read-only
diagnosis whose every patch an independent skeptic checked:

- *Focused elements scrolled slowly, and under the header.* `<html>` carried an
  inline `scroll-behavior: smooth` that outranked the Lenis rule: GSAP
  ScrollTrigger records the root's computed value before Lenis mounts and writes
  it back inline after its own scroll work. Every Tab scroll animated for about
  200ms (measured frame by frame), so a focused link sat off-screen; and nothing
  accounted for the fixed header, so a focused link at 1440 settled under it.
  The stylesheet no longer sets smooth scrolling on `<html>` (Lenis still smooths
  the wheel), and `scroll-padding-top` is the header's height plus 8px.
- *TextReveal still clipped ink* — 85 of 148 lines. Nothing clips at rest now:
  the masks are clipped only for the length of an entrance. The line's extra
  padding, which had grown the arrival word's measured box from 272 to 321px and
  put an empty band of photograph into the legibility audit, is gone.
- *The lift shadow's blur tail reached captions* under the event plates at 390
  (3.8–4.8% darkening against the 3% ceiling). Only that layer's blur changed.
- *The INP script demanded an FAQ the page does not render* — the wedding
  guide's answers are still pending, and copy is frozen; it now skips that
  action while the list is empty, says so, and checks every other tap did
  something.

**The fix round measured, and what it found next.** Re-measured on `747ad78`,
the gate read 18/19: typeset-clip and the arrival passed, and every focus sample
was clean. Hero-states matched the integration build at all sixteen offsets.
The lift sweep passed all 1,800 elements (the worst shadow under type 1.0%).
INP read 48–112 ms. Two more defects came out of what was left, and a third
turned out not to be one:

- *Home was 136px shorter than stage 5, and the reason was visible.* Placing the
  difference band by band against stage 5's full-page capture put it exactly on
  two TextReveal headings, which read "Thepeopleyouwill beworkingwith" and
  "WhereEveryMomentIsSigned". The space after each word sat inside its
  inline-block mask, and an inline-block drops a trailing space from its own
  width — measured in Chromium, no gap in any inside-the-mask variant, a real
  one with the space between the masks. The run-on words wrapped onto fewer
  lines (−62 and −74px). The space now sits between the masks. typeset-clip
  photographs a line masked and unmasked, which cannot see a missing space; the
  height comparison against stage 5 did.
- *At desktop sizes every scrub below the arrival ran a full pin distance early*
  — older than this stage (the image-sequence arrival, 17 August). The gate's
  one remaining failure was the closing chapter "not mid-scrub", and a sweep
  showed why: at 1440 its exit inset read a full gutter at every scroll position,
  while at 390, where the arrival does not pin, the same scrub matched its
  geometry to 0.01. The arrival decides its sequence in an effect, so its pin is
  created a commit after every section below it has made its ScrollTriggers, and
  ScrollTrigger refreshes in creation order: everything below kept positions
  measured without the pin's spacing. The arrival now sorts the instances back
  into page order and refreshes once its pin exists.
- *Lighthouse's accessibility score fell from 100 to 95–96 on a single node*:
  axe's colour-contrast flags the footer's decorative logotype (`aria-hidden`,
  1.21:1) on every route, at every moment after load. WCAG 1.4.3 exempts
  logotypes and pure decoration, and the gate's own axe run already excludes this
  element; stage 5's runs did not report it, most likely because the deleted light
  pool had left its background indeterminate. Recorded, not changed; the ≥ 90 bar
  holds.

**Measured, final build (`4b7f238`):** the gate is **19/19 green** — including the
three stage-6 checks: the drop switch applies exactly its prefix on a phone and
nothing on desktop, no focused element is hidden, clipped or covered with motion
on, and no TextReveal line clips its own ink. Hero-states against stage 5: pin and
scrub **identical at all sixteen offsets**, the clip identical too; the only
differences are the declared ones (the facts' clip and opacity), and the page is
16,860px again. Home's full-page capture is 15,240px, as at stage 5, identical
from the arrival's foot to the bottom of the page. The closing chapter's exit now
runs where its geometry says at both widths (the sweep's 100px offset is its own
step size, and the same at 390, where it was always right). Reduced motion: clean
on every route. Paper with motion on: 1,932 text elements, none part-transparent
at any stop. Every plate lifted: 1,800 text elements clear their bars, the lift
shadow under type at most 1.0%. INP under a 4× CPU throttle at 390: 64–120 ms on
every route (≤ 200), the FAQ left out and reported while its answers are pending.

Lighthouse mobile, level 0 (phones drop nothing), three runs per route
(performance median / worst; LCP median):

| Route | Stage 5 | Pre-work fixes `41c473b` | Stage 6 `4b7f238` |
|---|---|---|---|
| Home | 81 | 88 | **87** / 86 · 3.3 s |
| Venues | 91 | 92 | **92** / 92 · 3.1 s |
| Venue detail | 87 | 91 | **91** / 91 · 3.2 s |
| Signature Events | 91 | 93 | **93** / 92 · 3.0 s |
| Wedding Guide | 91 | 92 | **92** / 91 · 3.0 s |
| Contact | 93 | 93 | **93** / 93 · 2.9 s |

Every route clears the mobile floor (≥ 80), Home by seven points; best practices
and SEO 100; accessibility 95–96 (the logotype, above); CLS 0–0.001. Desktop,
measured on the integration build: performance 99 on every route. The motion
stage cost Home one point against the loading fixes and nothing elsewhere.

**The drop level.** Lighthouse mobile on `057bcde`, three runs per route per
level (performance median / worst; LCP median):

| Route | L0 | L1 | L2 | L3 | L4 |
|---|---|---|---|---|---|
| Home | 86/86 · 3.4 s | 87/87 · 3.4 s | 88/88 · 3.4 s | 88/87 · 3.3 s | 87/82 · 3.4 s |
| Venues | 92/92 · 3.1 s | 93/93 · 3.1 s | 93/93 · 3.1 s | 93/93 · 3.1 s | 92/92 · 3.1 s |
| Venue detail | 91/90 · 3.2 s | 92/92 · 3.2 s | 92/92 · 3.2 s | 92/91 · 3.2 s | 93/92 · 3.0 s |
| Signature Events | 93/92 · 3.0 s | 94/93 · 3.0 s | 93/93 · 3.0 s | 93/93 · 3.0 s | 93/92 · 3.0 s |
| Wedding Guide | 92/91 · 3.0 s | 93/93 · 3.0 s | 93/93 · 3.0 s | 93/93 · 3.0 s | 92/92 · 3.0 s |
| Contact | 94/94 · 2.9 s | 94/94 · 2.9 s | 95/94 · 2.9 s | 95/94 · 2.9 s | 94/94 · 2.9 s |

Every level clears the plan's rule (every median ≥ 83, every worst run ≥ 80,
the other categories ≥ 90), so the smallest — **level 0** — is the level: phones
drop nothing. The planning pass had recommended level 1 (the preloader off on
phones); measured, it buys Home one point, inside the spread, so the rule's
literal reading stands and the recommendation is recorded for the owner.

Desktop on `057bcde`: performance 99 on every route, accessibility 95–96, best
practices and SEO 100.

**Judgements recorded.** Hero copy fades stay: the Hero is a dark chapter over a
photograph, not paper, and its fades are measured hero states — focus overrides
them. Reveal's and Stagger's default lift moved from 28 and 24px to 20. The
subagents could not load the new project skill (installed mid-session; skills
register when a session starts) and read it directly.

**Flagged for the owner, not changed:**

- The home venue list's dimmed rows now step to the secondary text role instead
  of fading to 30% — no text on paper fades. A change to a signature interaction.
- Pre-existing: the mobile menu overflows on short landscape phones below `lg`;
  the accordion's server render shows every panel open until hydration.
- The drop level: the rule reads level 0 (phones drop nothing); the planning
  pass recommended level 1 (no preloader on phones), which measured one point on
  Home. The rule's reading ships; level 1 is one constant away if preferred.
- `/services#…` landings: the service scenes carry their own `scroll-mt-32`, and
  the new scroll padding for the fixed header now adds to it, so a scene link
  stops about 232px below the top at `lg`. Dropping the scene's own margin is a
  layout call, not made here.
- The wedding guide's FAQ is not measured for INP while its answers are pending;
  the script says so and will measure it as soon as answers exist.
- Carried from the pre-work: the two kept previews (`7apxf9ext`, `ikw1wxqqc`)
  and every deployment built before the metadata strip still serve the
  unstripped media; two canceled production deployments (`n9yg989zc`,
  `7gujchx43`) still serve all eight withheld paths. Production is the owner's.

### Stage 7 — baselines, the full QA pass, the seal and the docs (2026-09-14 to 2026-09-16)

Built on the closed stage-6 tree (`840286c`, source identical to `4b7f238`). Six
tasks with no servers ran in parallel, each checked by an independent reader and
fixed where the checker found a real defect; every measurement was run by the
lead on this machine.

**Baselines rebuilt.** `design-review/final/` regenerated from the final tree —
all thirteen routes at 390, 768 and 1440, and the 1920 hero — so the branch no
longer shows the dark era beside the light one. The palette study's strips were
rebuilt with the Aegean panel beside the three studied palettes, and the full-page home strip at 1440 (written only by `palette-shots.mjs fullpage`) was rebuilt with them. The
contact sheets were rebuilt — all ten galleries, 146 frames. The superseded dark-era capture sets were
deleted from the branch (68 files: `final-scroll`, `atmosphere`, `run3`, `stats`,
`study`, `directions`, `graffiti`); they stay in `main`'s history, and every report
that linked them now says so. `grade/`, `arrival/` and the stage-4 and stage-5 sets
are the light system's own record and stay.

**The full gate:** 19/19 green (`7490369`, on a build of the `840286c` source; nothing the build reads has changed since but three `package.json` script entries). Hero-states against stage 5: pin and scrub identical at
all sixteen offsets, the clip identical, only the declared facts change.

**Lighthouse,** medians of three runs (worst beside it), local production build of
`840286c`, Next.js 15.5.25, phones at drop level 0:

| Route | Mobile performance | Mobile LCP | Desktop performance | Desktop LCP |
|---|---|---|---|---|
| Home | **87** / 86 | 3.3 s | **99** / 92 | 0.7 s |
| Venues | **92** / 92 | 3.1 s | **99** / 99 | 0.6 s |
| Venue detail | **91** / 91 | 3.2 s | **99** / 99 | 0.6 s |
| Signature Events | **92** / 92 | 3.0 s | **99** / 99 | 0.6 s |
| Wedding Guide | **91** / 91 | 3.0 s | **99** / 99 | 0.6 s |
| Contact | **93** / 93 | 2.9 s | **99** / 99 | 0.6 s |

Accessibility 95–96 on both presets (the decorative logotype, stage 6), best
practices and SEO 100, CLS 0–0.001. Every standing bar holds: mobile performance
≥ 80 on every route (the lowest median 87, the lowest single run 86), every other
category ≥ 90, desktop ≥ 90 everywhere. Largest paints: Home's hero headline, the
first `/venues` plate, the venue title card's photograph, a TextReveal word on
`/events`, the Mountain Escape photograph on `/wedding-guide` (settled, as the
brief audit asked), the editorial paragraph on `/contact`.

**The published site, measured the same way** (`origin/main`, its own locked
dependencies and build, the same Lighthouse script on this machine): mobile Home 83 (worst 83), Venues 93 (92), Venue detail 88 (87), Signature Events 93 (91), Wedding Guide 92 (91), Contact 93 (91); desktop 98–99 on every route; accessibility 98–100 (`design-review/lighthouse-main-ab-mobile.md`, `-desktop.md`). Against it the branch gains four points on Home (a largest paint half a second earlier) and three on the venue page, stays within `main`'s own spread on Venues, Events and the Wedding Guide (one point each), and gives up 2–5 points of accessibility to the exempt logotype. The published site's own single-run table (Events 97) was one run on an earlier state of the machine; three runs put it at 93. Those two reports first named Next.js 15.5.25 as their framework: `lighthouse.mjs` read the version from the checkout running it, not from the build it measured. They were corrected to 15.5.22 by hand, and the script now takes the served build's version in `LH_FRAMEWORK`.

**The seal, re-verified from outside:** a new seal matrix (`npm run audit:seal`)
asks the production alias and the stage-6 preview, over the internet, for every
route family, the sitemap, a 404, `/_next/image` at `w=640`, a `/media` file and
robots.txt. **96 checks, all green: sealed.** Every non-redirect response carries
`noindex`; robots.txt holds `Disallow: /` at line start and no `Allow: /`; the
preview serves the light build and the alias still serves `main`'s; each of the
three legacy path rows lands in one hop with a 200, and a hop-following guard
fails any loop. `/services?modal` is deliberately not requested while its
redirect loop waits on the owner. The preview's host is never written down.

**Content Security Policy, measured without shipping it:** the full Chromium matrix of
`npm run audit:csp` (31 routes, 390 and 1440, both motion modes, report and enforce:
248 runs on the final build) **passes, 248 of 248** (`98703f8`,
`design-review/csp-harness.md`). No run recorded a violation other than the two
positive-control probes, and the probes fired on every run with that run's own
disposition. All 48 embeds loaded, the one real Monday form included, with no page
error. Child frames went only to the Monday form and the Maps embed. None of the three
full matrices saw a redirect to `consent.google.com` from this machine.

Two earlier full runs are part of the record; neither recorded an unexpected
violation. The first (`7490369`) failed four runs: three lost a fetch to a dropped
loopback connection between the harness and the server, and one Maps embed never
loaded. The second, with a transport retry (`2699238`), failed two, each a Maps
embed on the first run of its route (`/contact` and `/venues/mountain-escape`),
with nothing recorded to say why. The harness now records any child frame whose
document fails to load, with the browser's reason, and reloads such a frame once
after a network error (`98703f8`). A throwaway copy that reset the first Maps
document of 16 runs proved it: every reset was recorded, one frame was reloaded, and
every map loaded. The passing run needed one transport retry and no reload, so the
two unexplained Maps failures were not caught again; if they recur, the report will
name the cause. Every retry and reload is counted in the report.

**The `/media` pixel rule, enforced.** `scripts/media-pixel-guard.mjs` compares
every `public/` file modified between two revisions by its decoded pixels (images,
EXIF orientation honoured on both sides) or its copied packets and display
geometry (video), and fails any change that has no human verdict in
`design-review/media-pixel-verdicts.json`. It runs in the boundary script and in
the pre-push hook. Proof on the metadata strip itself (`c40de6c`): 149 files
modified, 149 metadata-only.

**CI.** `qa.yml` now runs with a read-only token and audits production
dependencies. The audit is reported, not enforced, because today it names four
findings whose fixes are the owner's to choose, not a reviewed patch: Next's bundled
PostCSS (high) and Next itself through it (moderate), fixed only in Next 16; sharp
(high, libvips and libheif), fixed only in sharp 0.35.4; and nanoid (high), a
transitive in-range bump that needs its own approved commit. The stage-6 snapshot (`189e059`) passed CI on GitHub's runner: install, build and the full gate.

**The docs pass.** `DESIGN.md` and the old handoff carry superseded banners;
README's stack and type notes say what ships now, and its audits section points to
the nineteen-check gate; the reports that linked the deleted captures say where they
went; `OWNER-MANUAL.md` describes the gate as it is; `LAUNCH-RUNBOOK.md` is corrected
against `WAITING-FOR-DNS.md` in eleven places (the DNS records, the TTL, the
launch-day steps, and a step 6 that would have false-failed over plain HTTP), each
old and new text kept in the task's record. `WAITING-FOR-DNS.md` is untouched.

**Found on the way.** The gate's media check went red after the contact sheets
were rebuilt: the sheet script reads the content files as text and split venues on
LF line endings, and `content/venues.ts` is checked out with CRLF, so every venue
after the first merged into one block and two venue sheets vanished. The reader now
normalises line endings.

**Advisories.**

**Next.js advisories on this branch**

| Advisory | Severity | Affected 15.x → fixed in | 1. Disclosed and fixed upstream | 2. When this branch was affected (next 15.5.22) | 3. When this branch was patched |
|---|---|---|---|---|---|
| **GHSA-2xp9-vwfh-vxw4**: remote code execution without login in the Image Optimization API, triggered by a crafted AVIF input (libheif, reached through sharp). Next's advisory has no CVE. The upstream libheif advisory is GHSA-g89c-p67h-r497 / CVE-2026-84383. | Critical, CVSS v4 9.5 | >= 10.0.0 < 15.5.24 → 15.5.24 | **2026-08-25.** The repository advisory went up at 16:16 UTC and next 15.5.24 reached npm at 16:14 UTC (the upstream libheif advisory was out at 11:17 UTC). No NVD entry. It reached GitHub's global database, and so `npm audit`, on 2026-09-08 at 21:21 UTC. | **2026-08-06 to 2026-09-14.** The branch's first lockfile (`cd3a28e`) already resolved 15.5.22; before 2026-08-25 the flaw was unknown. It was public for about 19 days 6 hours (2026-08-25 16:16 UTC to `e7252a7` at 2026-09-13 21:52 UTC). `npm audit` could report it for the last 5 days. | **2026-09-14 00:52 +03:00:** local commit `e7252a7`, next and eslint-config-next 15.5.25. **2026-09-14 17:56 +03:00:** snapshot `a553df2` put it on origin/aegean. |
| **GHSA-p293-qw3h-jr36 / CVE-2026-75604**: remote code execution without login on servers using a Windows filesystem, in apps using the Pages Router and App Router without Cache Components (path traversal). | Critical, CVSS v3.1 9.0 | >= 13.4 < 15.5.24 → 15.5.24 | **2026-08-25.** The repository advisory went up at 16:15 UTC and next 15.5.24 reached npm at 16:14 UTC. NVD published the CVE on 2026-09-01 at 22:17 UTC. It reached GitHub's global database, and so `npm audit`, on 2026-09-08 at 20:51 UTC. | **2026-08-06 to 2026-09-14.** Same lockfile history. It was public for about 19 days 6 hours (2026-08-25 16:15 UTC to 2026-09-13 21:52 UTC). `npm audit` could report it for the last 5 days. Local QA servers listened on every network interface until `e6db177` (2026-09-14 00:15 +03:00). | **2026-09-14 00:52 +03:00:** `e7252a7` (15.5.25). **2026-09-14 17:56 +03:00:** snapshot `a553df2`. |

Commit times are local (+03:00); advisory and registry times are UTC. The bump committed on 2026-09-14 is 2026-09-13 in UTC.

**Timeline**

| When | Event | Source |
|---|---|---|
| 2026-07-25 20:45 UTC | next 15.5.22 published | npm registry |
| 2026-08-06 16:41 +03:00 | First lockfile on the branch resolves next 15.5.22 | `cd3a28e`, package-lock.json |
| 2026-08-25 11:17 UTC | Upstream libheif advisory GHSA-g89c-p67h-r497 / CVE-2026-84383 | GitHub advisory record (libheif) |
| 2026-08-25 16:14 UTC | next 15.5.24 on npm (GitHub release 16:16 UTC) | npm registry; GitHub releases |
| 2026-08-25 16:15 / 16:16 UTC | Repository advisories GHSA-p293-qw3h-jr36 / GHSA-2xp9-vwfh-vxw4 published | GitHub advisory records (vercel/next.js) |
| 2026-08-25 16:39 UTC | Vercel changelog published (edited 2026-08-27 18:44 UTC) | page metadata |
| 2026-08-25 18:00 UTC | nextjs.org August 2026 security-release post | page metadata |
| 2026-08-31 19:59 UTC | next 15.5.25 on npm | npm registry |
| 2026-09-01 10:49 +03:00 | origin/main `1757bbe` committed on next 15.5.22 (7 days after the fix) | git |
| 2026-09-01 22:17 UTC | NVD publishes CVE-2026-75604 | GitHub global advisory record |
| 2026-09-03 to 2026-09-14 00:25 +03:00 | Six origin/aegean snapshots carry 15.5.22 (`ce525d5`, `036b4e6`, `118f48c`, `538f0bc`, `0c89d8c`, `cb7ecba`) | git |
| 2026-09-08 20:51 / 21:21 UTC | GitHub global database (so `npm audit`) lists p293 / 2xp9 | GitHub global advisory records |
| 2026-09-14 00:15 +03:00 | Gate server binds 127.0.0.1 (`e6db177`); with-server.ps1 follows at 00:17 (`c918be5`) | scripts/qa.mjs:143-147 |
| 2026-09-14 00:52 +03:00 | `e7252a7`: next and eslint-config-next 15.5.25 | git |
| 2026-09-14 17:56 +03:00 | Snapshot `a553df2` puts 15.5.25 on origin/aegean | git |
| Now (HEAD `840286c`) | Lockfile and installed next are 15.5.25. GitHub lists 0 advisories against next@15.5.25 and 2 against 15.5.22. | package-lock.json:6036-6038; node_modules/next/package.json |

**Whether the preconditions held on this branch**

- **GHSA-2xp9-vwfh-vxw4:** the installed version was affected, but no route for an attacker's AVIF was found. AVIF appears only as an output format (next.config.ts:33-34), there is no `remotePatterns`, and no .avif, .heic or .heif file exists under public/ or content/.
- **GHSA-p293-qw3h-jr36:** the installed version was affected, and local QA runs on Windows, so the host condition was met. The router condition looks unmet: the site has no `pages/` or `src/pages/` and no Cache Components flag in next.config.ts. Next's and Vercel's write-ups describe apps that use both routers (this agrees with BRIEF-AUDIT.md:670).
- **Production on Vercel:** protected according to Vercel's changelog (see the citation check). Production itself was not probed.
- **origin/main:** still resolves next 15.5.22.

The Vercel changelog the audit relies on was re-read: in its section on Vercel
deployments it says hosted apps are protected — "No upgrades, configuration
changes, or redeploys are required." The page was edited on 27 August, after its
25 August publication, so the wording on the day is not confirmed.

**Flagged for the owner:** the four dependency findings above; `origin/main` still
resolves Next 15.5.22, inside both August advisories, until the merge; the
runbook's step 3 now says to deploy from git only, never `vercel deploy --prod` from
a local folder (a local checkout holds ignored camera masters) — more than drift,
and easy to reverse; the Google Maps embed may redirect through
`consent.google.com`, which an enforced policy would need to allow. No run of the three full
CSP matrices saw that redirect from this machine; visitors elsewhere may differ.

---

## Stages and gates

Each stage is a boundary commit and push. Each gate must be green before the
next begins; a red gate stops the phase and reports rather than proceeding.

| # | Stage | Gate |
| --- | --- | --- |
| 1 | Tokens + semantic light/dark switch, on study routes only | contrast sweep both ladders; axe 0; default untouched |
| 2 | Grade A/B built and captured | **your pick** |
| 3 | Arrival A/B built on study routes | **your pick** |
| 4 | Leaf components and scenes migrated | axe 0; visual diff reviewed |
| 5 | Routes migrated; chrome, menu, footer | axe 0; focus-ring check; mobile floor |
| 6 | Motion re-tuned | mobile floor with CPU 4× throttle; INP green |
| 7 | Baselines rebuilt; full QA (graffiti was retired and replaced by the arrival check in stage 3) | the full gate (19 checks since stage 6); Lighthouse table; CI green |
| 8 | Merge to default palette | **your final approval** |

**Honest estimate: one to two weeks of working time**, most of it judgement
rather than typing. Stages 2 and 3 block on you; the rest do not.

---

## The risks I am not going to pretend away

1. **Mobile Home has three points of headroom.** This is the likeliest failure
   in the plan. Mitigated by the agreed drop order, gated at every stage.
2. **The arrival may not survive as a light scene.** Proposal A may simply look
   worse than what ships today. If both proposals disappoint, I will say so and
   recommend B or keeping the section dark — I would rather report that than
   deliver a scene I would not defend.
3. **The grade is subjective and ~200 photographs ride on it.** Hence two
   candidates and your eyes, not my preference.
4. **Two grounds double the accessibility surface.** Every check runs twice, in
   light and dark, including focus.
5. **The site is one DNS entry from launch.** This phase does not touch that,
   but the longer it runs the longer the launch sits parked. If you would rather
   launch on the current dark palette and invert afterwards, that remains
   available and costs nothing — the two are independent.

---

## What I need from you

1. **Approve, amend or reject this plan.** Nothing starts without it.
2. Then two picks during the work: **grade A or B** (stage 2), **arrival A or B**
   (stage 3).
3. Then **final approval to merge** to the default palette (stage 8).

Everything else is mine.
