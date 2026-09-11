# Semantic tokens — the rules of the migration

Stage 4 of the Aegean Bone inversion. This is the single reference every
component migration follows, so that nine scenes do not invent nine readings
of the same token. The completion test is mechanical: `npm run verify:palette`
must report **zero** palette literals outside the token definitions.

## The roles

Two ladders, one switch. `<html data-ground="light">` declares the page ground;
a dark chapter declares `data-ground="dark"` on its own element and every role
under it resolves to the other ladder. **No component names a colour. It asks
for a role, and the ground it sits on answers.**

| role | light (paper) | dark (night) | what it is for |
| --- | --- | --- | --- |
| `--surface` | `#f2ece1` | `#0a0a0b` | the ground itself |
| `--surface-raised` | `#fbf7f0` | `#1e1e22` | a plate matte, a panel, the overlay menu, an image placeholder |
| `--text-primary` | `#27211b` | `#f3efe7` | headings, links, emphasis — 13.53 / 17.26 : 1 |
| `--text-secondary` | `#4f4840` | `#9b968c` | running prose, standfirsts — 7.65 / 6.72 : 1 |
| `--text-tertiary` | `#6b6558` | `#8d8880` | small letterspaced labels, meta, captions — 4.92 / 5.7 : 1 |
| `--rule` | `#d8cfc0` | `#2b2b30` | decorative hairlines; no one needs to see them to understand the page |
| `--rule-strong` | `#8a8378` | `#5f5f66` | a boundary that must be seen — 3.1 : 1 |
| `--focus` | `#27211b` | `#b98f4a` | the focus ring; the global `:focus-visible` already uses it |
| `--accent` | `#b98f4a` | `#b98f4a` | gold: the mark and decorative hairlines. On light, **never** text, focus, or a border that matters |
| `--inverse` | `#27211b` | `#f3efe7` | a solid inverted fill: a pill, a selection highlight |
| `--text-on-inverse` | `#f2ece1` | `#0a0a0b` | the text on that fill |
| `--wash` | `242 236 225` | `10 10 11` | rgb triple — the ground as a translucent veil over a photograph |
| `--shadow-tint` | `39 33 27` | `0 0 0` | rgb triple — soft shadows, warm on paper |

Every value was solved by measurement (`scripts/derive-tokens.mjs`) and is
proven in the browser's cascade (`npm run verify:ground`), not in the file.

## How a component asks for a role

```
text-[var(--text-primary)]        bg-[var(--surface)]          border-[var(--rule)]
text-[var(--text-secondary)]      bg-[var(--surface-raised)]   border-[var(--rule-strong)]
text-[var(--text-tertiary)]       bg-[var(--inverse)]          decoration-[var(--rule-strong)]
text-[var(--text-on-inverse)]     bg-[var(--accent)]  (hairline only)
```

Translucent things are built from a role, never from a palette name:

```
bg-[rgb(var(--wash)/0.85)]                                    a ground-coloured veil (header, lightbox)
bg-[color-mix(in_srgb,var(--text-primary)_12%,transparent)]   an ink-coloured tint on paper, bone-coloured at night
wash-bottom   wash-full                                        the scrims, drawn in the ground's own colour
```

`.rule` and `<RuleDraw>` already draw `--rule`. A stronger line is
`bg-[var(--rule-strong)]`.

## The table

Apply by ROLE, not by value. The right-hand side is what the thing *is for*;
where the old class was doing a job the table does not name, choose the role
that does that job and record the judgement.

| shipped | becomes |
| --- | --- |
| `text-bone`, `text-bone/80`…`/95` | `text-[var(--text-primary)]` |
| `text-muted`, `text-bone/60`…`/75` | `text-[var(--text-secondary)]` |
| `text-faint`, `text-bone/45`…`/55` | `text-[var(--text-tertiary)]` |
| `text-bone/12`…`/40` — decorative giant type (footer wordmark) | `text-[var(--rule)]` |
| `text-ink` (type on a bone fill) | `text-[var(--text-on-inverse)]` |
| `text-hair` | `text-[var(--rule)]` |
| `text-gold` at rest | `text-[var(--text-primary)]` — gold text is not permitted on paper; report the site as an accent request |
| `hover:text-gold` on secondary/tertiary type | `hover:text-[var(--text-primary)]` |
| `hover:text-gold` on primary type | `hover:text-[var(--text-secondary)]` — or keep the existing rule/underline hover if the element has one |
| `bg-ink`, `bg-charcoal` as a section ground | `bg-[var(--surface)]` — and decide whether the section is a chapter (below) |
| `bg-graphite` — a panel lighter than the page, an image placeholder | `bg-[var(--surface-raised)]` |
| `bg-ink/N` — a translucent veil | `bg-[rgb(var(--wash)/0.N)]` |
| `bg-ink/0` (a hover target that starts transparent) | `bg-transparent` |
| `bg-bone` — a solid fill; `hover:bg-bone` | `bg-[var(--inverse)]` with `text-[var(--text-on-inverse)]` |
| `hover:bg-bone/85` | `hover:bg-[color-mix(in_srgb,var(--inverse)_85%,transparent)]` |
| `bg-bone/10`…`/30` — a tint over a photograph or a subtle fill | `bg-[color-mix(in_srgb,var(--text-primary)_N%,transparent)]` |
| `bg-bone/25`…`/35` used as a hairline (`RuleDraw className`) | `bg-[var(--rule)]` |
| `bg-bone/45`…`/70` — a line that must read | `bg-[var(--rule-strong)]` |
| `bg-hair`, `bg-hair/N`, `divide-hair`, `decoration-hair`, `border-hair`, `border-hair/N` | `…-[var(--rule)]` |
| `border-bone/12`…`/40` | `border-[var(--rule)]` |
| `border-bone/60`…`/70` | `border-[var(--rule-strong)]` |
| `border-bone`, `hover:border-bone` | `border-[var(--text-primary)]` |
| `bg-gold` — a hairline | `bg-[var(--accent)]` |
| `decoration-gold`, `decoration-gold/N` | `decoration-[var(--rule-strong)]` |
| `from-ink via-ink/N to-ink/N` gradients over a photograph | `wash-bottom` / `wash-full`, or inline `rgb(var(--wash) / α)` with the same stops |
| `scrim-bottom`, `scrim-full` | `wash-bottom`, `wash-full` (aliases exist; use the new names) |
| `var(--color-x)` in inline styles or CSS | the role that does that job |
| a raw `#hex` / `rgb(…)` | the role that does that job — `#0a0a0b` is `var(--surface)` *inside a dark chapter*, never a colour |
| `grade`, `grade-hero` on a photograph on a light surface | `grade-b` — the light-ground grade (stage 2) |
| `grade`, `grade-hero` inside a dark chapter | unchanged |
| `mix-blend-difference` type over a photograph | put the image frame in `data-ground="dark"`, set `text-[var(--text-primary)]`, drop the blend |
| a per-element gold focus ring | delete it — the global `:focus-visible` resolves `--focus` |

Opacity on text: an alpha-faded colour was the dark site's idiom. On ivory it
has no room — primary needs α ≥ 0.64 and secondary α ≥ 0.79 just to hold AA —
so the ramp is three solved colours and nothing fades. Map the alpha to the
step; do not carry the alpha across.

## Chapters — the only way a section goes dark

`import { Chapter } from "@/components/layout/Chapter"`. It replaces the
section element, sets the ground, and draws the one defined boundary: the
chapter arrives inset by a gutter like a plate on the page and expands to full
bleed as it scrolls in, then narrows again on the way out. Nothing else may
implement a light/dark join.

```tsx
<Chapter ground="dark" enter={false} className="relative flex h-[92svh] …">   // a page opener: no entry mask
<Chapter ground="dark" as="section" aria-labelledby="…">                      // a mid-page chapter: both edges
```

**Designated dark chapters:** the home Hero (`enter={false}`); the CtaBlock;
the venue title card (`enter={false}`). That is the list. The event page was
read before it was listed: it opens on paper, not on a full-bleed photograph,
so it has no chapter. A section that is a wall of prose or a grid of plates is
ivory. The 404 page is paper.

**Not chapters, but dark by nature — declare the attribute directly, no
mask:** the Lightbox root, the VideoPlayer figure, and any image frame with
type set directly over the photograph (an index number, a caption on the
image). A photograph is a dark chapter in miniature; type that sits on it
lives in its ladder. The arrival is the one measured exception and is done.

**The header** carries `data-ground={overHero ? "dark" : "light"}` — over a
designated dark opener (the home hero, a venue title card) it floats on a dark
photograph; scrolled, it takes the page. `overHero` is keyed on the routes
whose opener is a chapter, not on the home route alone. Its mark is
`mark-ink.png` on paper and `mark-bone.png` over the hero (render both, hide
one by ground: `[data-ground="dark"] &` / Tailwind `data-[ground=dark]:hidden`
on the element that carries the attribute is not available across elements,
so use two images with `hidden` toggled by the same `overHero` state).

Everything else — the mobile menu panel, the preloader, the page-transition
curtain, the footer, every inner page, every study — is paper. They inherit
the light ground and need no attribute; their surfaces are `--surface` or
`--surface-raised`.

## Laws, restated for this stage

- **Copy and facts are frozen.** Not a word, not a number. Flag; never fix.
- **No structural change.** Same elements, same order, same routes, same ARIA.
- **No new features, no Framer Motion, no new dependencies.**
- **Photographs are untouched.** Grade classes are CSS filters over real files.
- **Gold on paper**: the mark and decorative hairlines only.
- **No new opacity fade on text.** Existing motion is stage 6's; do not add.
- **Do not touch** `globals.css`, `layout.tsx`, `Chapter.tsx`, `Arrival.tsx`,
  or the `study/aegean` pages — they are the foundation and are done.
- Measurement hooks on `TextReveal`, `CountUp` travel as the `measure` prop.
  A `data-*` attribute passed to a component compiles and silently vanishes.

## Proof, per file

```
node scripts/palette-literals.mjs --list | grep "<file>"    →  nothing
npx tsc --noEmit                                            →  clean
npx eslint <file>                                           →  clean
```

Record every judgement the table did not settle, and every place a surface
seemed to *want* a text accent. Do not invent one; report it.
