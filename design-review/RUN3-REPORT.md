# Run 3 — guard the finish, build around it

**Preview:** https://domisignature-redesign-jhwd6ce43-domisi.vercel.app

Verified after deploying: 200, target `preview`, `X-Robots-Tag: noindex`,
`robots.txt` says `Disallow: /`. Nothing promoted to production, no DNS touched.

**Repository:** https://github.com/ikeskrim/domisignature-redesign
**CI:** [green](https://github.com/ikeskrim/domisignature-redesign/actions) — 11/11 on every push
**New for you:** [`OWNER-MANUAL.md`](../OWNER-MANUAL.md), with a Greek quick-start at the end.

The site was launch-ready when this run started and it still is. Five real
defects were found and fixed, none of them design changes. Your morning is
unchanged: four one-word answers, five minutes of Firefox, and the go.

---

## The five defects

All five were live. None was visible in a way anyone would have noticed, which
is why they survived every previous pass.

**1. Every venue page said "guests guests".** *"Up to 300 guests guests /
Private beachfront, Rethymno, Crete"*, on all three venue pages, in two places
each. `capacityLabel()` already ends in the word and the page appended another.
Found by the Villa Aetos rehearsal — the restored page rendered "20–30 GUESTS
GUESTS" large enough to catch the eye, and the same code serves the three venues
that ship.

**2. Every page preloaded a 1080px file into a 32px box.** The site mark
declared the source file's own `width={512}` with no `sizes`, so every phone took
the 2× candidate: **22.7 KB at preload priority**, competing with the real LCP
image for the first bytes on the wire — for a logo drawn 32px wide. Now 3.2 KB
at DPR 1.75 and 6.2 KB at DPR 3. Drawn size before and after: 32px, unchanged.

**3. A film badge nobody could read.** The "2 FILMS" label sits top-right on the
events cards, and the card's scrim is bottom-only. On a bright sky that is
bone/80 on cream: **measured 1.99:1 against the 4.5:1 that 11px text needs**.
axe reports zero because it cannot compute contrast against a photograph.

**4. `/about` printed the same paragraph twice** — the 250-character team
statement as a body paragraph, then again as the closing block's standfirst. The
fix adds no new words: it drops the prop and falls back to the default every
other page already uses.

**5. Every venue page said "The other three" above a grid holding two.** Written
when there were four venues; Villa Aetos was withdrawn and the heading stayed.
No audit could see it — the claims audit checks figures, and this was a word. It
now derives from the array, so it reads "The other two" today and "The other
three" again the day a fourth venue returns.

---

## The backlog, converted

The five standing items, classified honestly. **Two of the five notes described
the wrong problem**, and finding that out was worth more than implementing them
would have been.

| | Item | Verdict |
| --- | --- | --- |
| 1 | Enquiry form is a third-party embed | Already demonstrated at `/study/enquiry` in Run 2. **Your call**, unchanged. |
| 2 | Mobile Home 82, Venue detail 86 | **Diagnosis was wrong — fixed something better.** |
| 3 | Events strip has no scroll affordance | **Premise partly wrong.** Demonstrated, not shipped. |
| 4 | Alt text inconsistent in voice | **Premise wrong.** Demonstrated, not shipped. |
| 5 | Journey rail is CSS sticky, not a GSAP pin | **Skipped deliberately.** |

**Item 2 named the wrong lever.** It said the hero film was the cost on mobile.
Below 768px the hero never requests the film at all — `Hero.tsx` returns early
and falls back to stills — so there was no mobile encode to shrink. Measuring
instead of trusting the note found the 1080px site mark on every page instead.

**Item 3 asked for an affordance that already exists.** Measured at 390px, the
cards are 78vw, so the next one already peeks by 38px with its title visible.
What is genuinely missing is *extent*: the shelf scrolls 2,273px inside a 366px
window — six and a quarter screens — and nothing says so. `/study/backlog` puts a
progress rail beside the real component, imported unmodified. My view: earns its
place on a phone, clutter on a desktop showing three cards at once. Direction
call, so it is yours.

**Item 4 described the wrong problem.** Alt text is not inconsistent in voice —
there is barely any. Gallery photographs are marked decorative and the tile is
announced by position: *"Open image 3 of 24 full screen"*. Technically correct,
which is why axe reports zero, and close to announcing nothing on a page whose
entire content is photographs. Two frames rewritten by looking at them are in the
study as a sample of the voice. Not shipped: two hundred photographs of honest
alt text cannot be generated, and it is copy.

**Item 5 is a refactor with no user-visible outcome** — unifying two pinned
scenes that both work. Tonight's brief puts refactors of working code out of
bounds, and it is right to.

**Demonstration:** [`/study/backlog`](https://domisignature-redesign-jhwd6ce43-domisi.vercel.app/study/backlog)
· captures in `design-review/run3/` · `noindex`, unlinked, absent from the sitemap.

---

## New tooling

### The gallery ingest tool

```bash
npm run ingest:gallery -- "C:/path/to/photos" --slug some-gallery
```

Resizes every frame for the web, **strips all metadata**, builds a numbered
contact sheet, and writes a content stub full of `TODO` markers.

The metadata stripping is the part worth arguing for. Wedding photographs carry
EXIF and EXIF carries GPS. Publishing the coordinates of a private client's villa
because they rode along inside a JPEG is a privacy failure none of the existing
audits can see — the manifest check knows which files are withheld, not what is
hidden inside the ones that ship. Verified: source frames had EXIF and ICC,
every derivative had neither.

**It refuses to write a title or a word of alt text.** Both need eyes on the
photograph, and a plausible sentence generated from a filename is exactly the
invented content your rules forbid. And the refusal is enforced, not requested:
`scripts/ingest-guard.mjs` is now the eleventh check in the gate, so CI fails
while any `TODO(` remains under `content/`. Proved both ways — injected a marker
and the gate went red naming the file and line; removed it and it went green.

Proved end to end on a temp copy of six Thalasses frames, then every test
artefact deleted.

### The alias seal check

```bash
npm run check:alias
```

Run 2 found a crawlable second copy of the site at the project's Vercel alias.
This asks the real deployed address, over the real internet, whether it is still
sealed. Run after every push. It has been run after every push tonight and has
said `sealed.` every time.

---

## The Villa Aetos return path — rehearsed, nothing shipped

Done on a throwaway branch, now deleted. `main` was never touched.

**It is not one line. It is five steps**, and after only the first one everything
looks right: the site builds, the type check passes, the venue appears on
`/venues`, and the sitemap advertises its URL — **while the page itself returns
308 to the venue list and cannot be opened at all**, because the withdrawal
redirect is still in `next.config.ts`. A silently broken venue that every
automated check calls fine.

The other three steps: repoint the old `#portfolioModal4` anchor; run
`npm run contact-sheets` **with no argument** (passing a name replaces the whole
set rather than adding to it); and update the redirect map test, which fails
until it stops expecting the old behaviour — the system correctly reporting that
the map no longer matches the site.

What happens correctly on its own: the venue count derives to **04**; the guest
figure **stays at 300**, because it is a maximum and Aetos holds far fewer; page,
index row, map and related cards all return.

The full tested procedure is in [`OWNER-MANUAL.md`](../OWNER-MANUAL.md) §5.
Screenshots in `design-review/run3/`.

---

## The fresh-eyes sweep

Every route captured at 390 / 768 / 1440 and reviewed independently. **39
captures, 30 claims raised, 3 real** — the three defects above. Two objective
checks alongside: the layout audit found no horizontal overflow and no
undersized body copy at any breakpoint, and **all 18 internal links resolve**.

The most useful thing the sweep produced was a fault in my own instrument.

**My 1440 capture script was lying.** It walked each page to trigger the
scroll-reveals, then scrolled back to the top before the screenshot — which
reverses them. Full-page captures therefore showed revealed content at opacity 0:
large stretches of flat `#0A0A0A` exactly where the copy belongs. It looks
identical to broken. Five independent reviewers reported "entire sections
unpainted" on `/services`, `/wedding-guide` and the venue pages, several with
pixel-level confirmation that a 2,281px band was single-valued.

Every one of those sections is present and visible on the live page. Verified by
walking each route and reading the computed opacity of every text node: **0 of
138 stayed below 0.1**. Then re-captured correctly and cropped the exact band one
reviewer flagged as unpainted — it is the footer, fully rendered. Related claims
went the same way: "only 9 of 22 gallery images render" measures 22 tiles, 22
loaded, on the live page.

The script no longer scrolls back, and the captures now match the site. Worth
recording plainly: a confident, evidence-backed report can still be an artefact
of how the evidence was made.

### Looks wrong, is not — do not "fix" these

- **Empty grey boxes where maps should be.** Third-party iframes do not render in
  a Playwright screenshot. Four iframes are present on `/contact` — one form,
  three maps.
- **An `<img>` with a zero-sized box on every page.** The shared-element venue
  transition layer: `aria-hidden`, `pointer-events-none`, and it carries no `src`
  attribute at all, so it requests nothing.
- **Headings appear twice in the DOM** (`"Villa PartyVilla Party"`). The masked
  line-reveal, done correctly: an `sr-only` copy for screen readers and an
  `aria-hidden` visual copy. Announced once. `pb-[0.08em]` already reserves
  descender space, which also answers the "descenders are sliced off" reports —
  no clipping ancestor cuts those headings.
- **Venue index numbers.** Derived with `pad2(i + 1)`; 01, 02, 03 by
  construction. I misread a downscaled capture and checked.

### Taste-level, untouched — for you

1. **"Assistance" as a role label** on `/about`. The other two are "Manager" and
   "CEO". If the intended word is "Assistant", it is a one-word content change
   and it is yours to make.
2. **"Type of Events"** on `/services` — reads oddly in English next to a plural
   list. Also content.
3. **A progress rail on the events shelf** — see `/study/backlog`.
4. **Descriptive alt text for ~200 gallery photographs** — see `/study/backlog`.
5. **Two cards in a three-column grid** on the venue pages' "The other two"
   section. Correct since Villa Aetos left, and it is how the approved captures
   look; changing the grid is a design decision.

---

## The gate, and three flakes worth knowing about

`npm run qa` is now **eleven checks**, and green. CI runs the same command on
every push and is green on HEAD.

Three separate audits went red tonight on code that was fine, and each was fixed
rather than re-run, because a gate that fails for unrelated reasons is one people
learn to skim past:

- **assets** recorded each URL on its first response only, so one hiccup from the
  image optimiser marked it failed for the whole run. Non-200s are now re-fetched
  once; a genuinely missing asset still fails, and a URL that recovers is printed
  by name rather than swallowed.
- **assets** also timed out in CI on a documentation-only commit, waiting for
  `load` — which waits for the hero film. It now waits for `domcontentloaded`.
- **CI** hung fourteen minutes on Ubuntu's package mirrors inside
  `playwright install --with-deps`. That step is gone; the image already ships
  what Chromium needs.

One more is environmental and not fixed, only made legible: several checks were
killed mid-run on this machine — memory pressure with a server and several
Chromium instances alive at once. `qa.mjs` now reports **`KILLED (SIGTERM) —
this is the machine, not the site`** and names the script to re-run alone. CI has
never hit it.

---

## Final battery

| | |
| --- | --- |
| CI on HEAD | green, 11/11 |
| `npm run qa` | 11/11 green |
| axe-core | 0 violations |
| Layout audit | 0 problems, all routes × 4 breakpoints |
| Internal links | 18/18 resolve |
| Lighthouse floors | all hold — lowest mobile performance 83, BP and SEO 100 everywhere |
| Privacy gate vs **remote** tree | 15/15 withheld paths absent, 0 env files, largest file 21.9 MB |
| Alias seal | `sealed.` after every push tonight |
| Preview | `noindex`, target `preview` |
| Production | **untouched.** No deploy, no DNS. |

---

## Commits

| | |
| --- | --- |
| `0c95ed7` | The site mark was shipping a 1080px file into a 32px box |
| `08ae731` | Asset audit: tell a missing file apart from a hiccup |
| `9a46684` | Backlog items 3 and 4 are taste, not defects — shown at /study/backlog |
| `64d1ef2` | Gallery ingest: do the machine's half, refuse to fake the person's half |
| `9c8ff61` | Every venue page said "guests guests" |
| `9b81cf5` | OWNER-MANUAL.md, and the Villa Aetos return path proved on a branch |
| `b3ba126` | Regenerate the whole capture set against the current build |
| `87696fd` | Three objective defects from the fresh-eyes sweep |

---

## Your morning

Unchanged from Run 2, and short.

1. **Four one-word answers** — `RUN2-REPORT.md` has them with their
   demonstrations: the enquiry form (`embed` / `native`), Firefox (`skip` /
   `I checked`), `spire2.png` (`generated` / `licensed` / `drop it`), and the
   production deploy (`go`).
2. **Five minutes of Firefox** on the preview URL. The checklist is in
   `RUN2-REPORT.md` §Firefox.
3. **The go.** `LAUNCH-RUNBOOK.md` is the whole switch, including the rollback.

And, whenever you have them: the three sections in `content/pending.ts` that are
built and waiting — testimonials, FAQ, verified statistics. `CONTENT-NEEDED.md`
says exactly what to send, and `OWNER-MANUAL.md` §8 says where it goes.

---

## What I would still improve — described only, not started

1. **The enquiry form is still a third-party embed.** Faster and on-brand if
   native, but it needs a delivery path and changes where submissions land. See
   Run 2, decision 1.
2. **Gallery photographs are announced by position, not description.** "Open
   image 3 of 24 full screen" is valid and nearly contentless. Two hundred lines
   of honest alt text, written with the pictures open. The ingest tool stops the
   backlog growing; it cannot clear it.
3. **Mobile Home at 83 and Venue detail at 86.** Both clear the floor, both below
   the 90 the desktop pages reach. The remaining levers are a 72.8 KB stylesheet
   and 12 KB of legacy-browser JavaScript — build-level changes with real
   trade-offs, not free wins.
4. **The events shelf still does not say how far it runs.** Six and a quarter
   screens on a phone with nothing to indicate it. Prototype at `/study/backlog`.
5. **The journey rail is CSS sticky, not a GSAP pin.** Right call for the
   bleeding image layout; it means the site's two pinned scenes are built
   differently. Worth unifying only if the motion layer is ever reopened.
