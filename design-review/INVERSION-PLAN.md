# Aegean Bone — the inversion plan

**For sign-off. Nothing in here has been built.** The default palette is
untouched, the launch stays parked, and `WAITING-FOR-DNS.md` governs throughout —
the resume line works at any moment during this phase, independently of it.

Approve, amend, or reject. Building starts only on your word.

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
| 7 | Baselines rebuilt; graffiti retired + replaced; full QA | 11/11 gate; Lighthouse table; CI green |
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
