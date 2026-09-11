# Stage 5 — decisions settled before any agent edits

Source: INVERSION-PLAN §6, the owner's stage-5 brief, and the 52 later-scope
findings from the stage-4 visual review (13 routes, both widths).

## Shared primitives — built once, by me, before the fan-out

1. **`Plate`** (`src/components/ui/Plate.tsx`) — the one sourcebook plate: the
   photograph inside a `--surface-raised` mat (p-3 / sm:p-4 / lg:p-5), a
   `--rule` hairline at the mat's edge, an optional caption BENEATH on paper
   (label + derived plate number, both `.eyebrow`). Children = the caller's own
   `<Image>` (sizes/priority/loading/grade stay the caller's). Captions are
   apparatus only: an existing title / venue name / category, and a number from
   position. No new sentences.
2. **Chapter rest state** (`Chapter.tsx` + `.chapter` CSS) — the most repeated
   finding (CtaBlock ×10, Chapter ×3): at rest the dark chapter is a razor cut
   full-bleed across the page. Fix in the one definition: the *masked* edges
   rest inset by one gutter. CSS default `--chapter-in/out` = the gutter when
   that edge is masked (data attributes `data-enter` / `data-exit`), so the
   server render and reduced motion both show a plate on the page; with motion,
   the scrub still expands it to full bleed while it is the subject and narrows
   it again on exit. Openers (`enter={false}`) keep a full-bleed top edge.
   Hero choreography must re-measure identical (hero-states) — only the clip
   may change.

## Per surface

| Surface | Decision |
| --- | --- |
| `/venues` | Ships the north star: the venues-index study layout — alternating 7/5 grid, each venue a `Plate` (grade-b, 4:3), number / name / standfirst / rule / capacity · location / coordinates / Enquire beneath or beside. Same facts, new setting. `VenueIndex` (hover list) stays the home scene's signature interaction; `/venues` gets a new `VenuePlates`. The shared-element transition starts from the plate image. |
| Venue page gallery | `EditorialGallery` tiles become `Plate`s (mat + hairline; number as caption). Placeholder reads as an empty plate, not a hole. |
| `VenueFacts` | A specimen card: `Plate`-like card on `--surface-raised` with `--rule` hairline rows, label in `.eyebrow`, value set large; capacity, location, **coordinates** (already on the page in the title card), note, fact list, advantages. One bullet mark for both lists. Facts unchanged. |
| Related venues (`VenueCard`) | A `Plate` with the name as caption; the index number moves off the photograph into the caption — removes the type-over-photo legibility problem at its root. |
| Events index (`EventsBrowser`) | Captioned plates, no card wall: photograph in a `Plate`, title + category as a caption on paper beneath. The data-ground frame and its veil go; the Film badge becomes a caption mark. Masonry rhythm kept. |
| Event page gallery | Same `Plate` tiles as the venue gallery (shared component). |
| Services / guide / about / contact | Photographs become plates where they are objects on the page; full-bleed scene photography that bleeds past the gutter (ServiceScenes, JourneyChapters) stays full-bleed — the report's patterns only where they fit. The JourneyChapters xl rail collision was fixed in stage 4 (a thumb-index tab in the gutter). MapEmbed mounted-but-blank state gets the facade's hairline frame. |
| Header | Hairline under the scrolled bar (`--rule`), wordmark and mark near-black, letterspaced nav. Active page: underline carries it (reported: no accent step exists). |
| Overlay menu | `--surface-raised`, large near-black links. **Add the focus trap and focus restore the plan says it has** — today it has neither (ESC only); focus currently escapes behind a full-screen panel. `aria-modal` dialog semantics. |
| Preloader / page curtain | Ivory panels (done in stage 4); verify timing only. Motion is stage 6. |
| Footer | Editorial colophon on `--surface-raised`: near-black headings, tertiary meta, one gold hairline permitted. Decide the wordmark weight (--rule reads, not felt) — record it. `+` in phone numbers set in the sans. |
| Cursor | Verify the difference blend on ivory, plates and chapters; no redesign. |
| Hairlines over photographs inside dark chapters | `--rule-strong` (a line over an unknown image must be seen) — title-card eyebrow rule and border, CtaBlock RuleDraw and dl border. |
| Breadcrumb separator | Settled in stage 4: a text role (`--text-tertiary`), not a hairline — as `--rule` it measured 1.24:1. |
| VideoPlayer ring over posters | from the type ladder (`color-mix(--text-primary 60%)`), not the rule ladder. |

## Not stage 5

TextReveal descender clipping → stage 6 typesetting. Pools/bloom deletion,
grain, shadow choreography, rule draw-ons → stage 6. Monday form styling and its
foreign logo → owner (outside the repo). The stale "four settings" sentence on
Home and the literal "300" on /venues → flagged in the report, not changed.

## Gates

axe 0 (both widths, every route) · focus-ring audit clean · ground verify incl.
text-on-own-ground · paper legibility · arrival legibility · keyboard audit ·
hero choreography re-measured identical · palette 0 · build wrapper green ·
mobile floor (Home ≥ 80) with the drop order if threatened.
