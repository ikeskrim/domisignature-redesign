# Aegean Bone — the merge report

**Preview:** added by the commit that follows the stage-8 snapshot (the snapshot's own preview cannot be named inside it).
The branch is sealed against search engines; the production alias still serves `main`.

The owner approved the merge on 2026-09-17, after one pre-merge fix commit and a
green gate. Nothing here has touched `main` yet: the merge itself waits on the
owner's word, and this report is what it rests on.

---

## What changed, stage by stage

**1 — Tokens and the ground switch.** Nine semantic roles replace named colours;
a dark chapter is a local inversion (`data-ground="dark"`), never a conditional.
The light ground's text ramp is solved at 13.53 / 7.65 / 4.92:1, and the dark
ground gained its first boundary rule that meets 3:1. `verify:ground` reads the
live cascade, not the token file.

**2 — The grade.** Grade B ("window") across every light surface, chosen on the
evidence and the owner's look; the runner-up stays reachable at `?grade=a`.

**3 — The arrival.** Arrival A ("plate") ships: five real photographs at 62% under
an ivory wash, near-black type, the pin kept with its direction inverted so the
legibility floor is the resting state. Image quality re-priced by measurement
(q75: +55 KB on the one frame phones load).

**4 — Leaf components and scenes.** 49 files migrated to roles; zero palette
literals under `src/`, enforced in the gate. Three rules closed whole classes of
defect: colour re-resolves at every ground, the focus ring is a 3px near-black
ring over a halo (never gold), and the paper lamp is one definition.

**5 — Chrome, menu, footer and the editorial plate.** One `Plate`, built once:
`/venues` ships the approved north-star study; galleries are matted tiles; a
mid-page dark chapter rests as a plate on the page. The enquiry block's type no
longer sits on the plate's cut edge.

**6 — Pre-work.** Next.js 15.5.25 (out of two critical advisories). Every
published photograph and video stripped of GPS, camera serials and embedded
thumbnails, losslessly, credit kept; a sixteenth gate check keeps it that way. The
four loading defects fixed (Home 81 → 88 mobile). `posterimage.png` withheld; the
pre-push guard installed; the conventions layer (`CLAUDE.md`, the project skill).

**6 — Motion on paper.** Nothing on paper fades: type rises from behind its line,
blocks settle, photographs are uncovered, rules draw, sheets move. The preloader,
page curtain and mobile menu are ivory sheets; reveals finish the moment focus
arrives; five interactive plates lift with a shadow only while lifted. One switch
can give motion up on phones in the owner's order — measured, phones drop nothing.
Three gates joined (19 checks). Found and fixed on the way, all measured:
ScrollTrigger was writing smooth scrolling back inline, so a focused link sat
off-screen; nothing cleared the fixed header on focus; animated headings had lost
the spaces between their words; and — older than this work — every scroll-linked
animation below the arrival ran a full pin distance early at desktop sizes.

**7 — Baselines and QA.** Every capture set rebuilt from the final tree
(`design-review/final/` at 390, 768 and 1440 and the 1920 hero, the palette strips,
all ten contact sheets), and the superseded dark-era sets deleted from the branch
(68 files), so the repository no longer shows two eras at once. The seal re-verified
from outside with a new seal matrix: 96 checks on the production alias and the
preview, sealed, including a loop guard on the legacy redirects. A `/media` pixel
guard now refuses any push that changes a published file's pixels under its old
name without a human verdict. CI runs with a read-only token and reports a
production dependency audit. The proposed security headers were measured without
shipping them: the full Chromium matrix (248 runs: every route, both widths, both motion modes, report and enforce) passes with no violation beyond the positive controls and every embed loading (`design-review/csp-harness.md`). Two earlier runs lost runs to dropped connections and to Maps embeds that did not load, never to the policy. The harness now retries the first and names and reloads the second. The final gate: 19/19 green (`7490369`, on a build of the `840286c` source; nothing the build reads has changed since but three `package.json` script entries). Fixed on the way: the contact-sheet
script lost two venue sheets to CRLF line endings, which turned the gate's media
check red. The docs pass put superseded banners on the dark-era documents, corrected
the launch runbook against `WAITING-FOR-DNS.md` (untouched), and rewrote the
toolkit for the gate as it stands.

**8 — Pre-merge fixes, approved.** Three stale or wrong facts went, each derived
now rather than typed: Home named four settings for three venues, `/venues` typed
its guest ceiling, and a venue's structured data told search engines 200300
guests. The hero wordmark, cut on every phone narrower than about 479px on this
branch and on `main`, fits at every phone width with desktop sizing untouched.
The footer logotype is a drawing — the site's own typeface, in outlines generated
from the built font and checked by a new gate check — so the WCAG logotype
exemption is gone from the footer and from three audit scripts, and the
`/wedding-guide` chapters became `h2` instead of skipping a heading level:
**accessibility is 100 on every route, on both presets, with nothing exempted.**
The `/services?modal` self-redirect is deleted and `/services#…` links land on
their section instead of 232px below it. The venue page sets capacity large once.
CI runs its actions on current majors, off the deprecated Node 20. sharp 0.35.4
and nanoid 3.3.19 landed in their own commits, each with the gate green after it,
which clears every dependency advisory except next's bundled postcss — next 16,
on its own branch after the merge, before 21 October.

---

## Before and after — every route, 1440 and 390

Before is `main` as published (`design-review/final/` there); after is this branch's
regenerated `design-review/final/`. Each pair is one image, both pages scaled to
the same width at their true length.

| Route | 1440 | 390 |
|---|---|---|
| Home | [before · after](design-review/merge-report/1440-home.png) | [before · after](design-review/merge-report/390-home.png) |
| Venues | [before · after](design-review/merge-report/1440-venues.png) | [before · after](design-review/merge-report/390-venues.png) |
| Thalasses | [before · after](design-review/merge-report/1440-venue-thalasses.png) | [before · after](design-review/merge-report/390-venue-thalasses.png) |
| Mountain Escape | [before · after](design-review/merge-report/1440-venue-mountain-escape.png) | [before · after](design-review/merge-report/390-venue-mountain-escape.png) |
| Olive Stories | [before · after](design-review/merge-report/1440-venue-olive-stories.png) | [before · after](design-review/merge-report/390-venue-olive-stories.png) |
| Signature Events | [before · after](design-review/merge-report/1440-events.png) | [before · after](design-review/merge-report/390-events.png) |
| Sunset by the pool | [before · after](design-review/merge-report/1440-event-sunset-by-the-pool.png) | [before · after](design-review/merge-report/390-event-sunset-by-the-pool.png) |
| Villa Party | [before · after](design-review/merge-report/1440-event-villa-party.png) | [before · after](design-review/merge-report/390-event-villa-party.png) |
| Services | [before · after](design-review/merge-report/1440-services.png) | [before · after](design-review/merge-report/390-services.png) |
| Wedding Guide | [before · after](design-review/merge-report/1440-wedding-guide.png) | [before · after](design-review/merge-report/390-wedding-guide.png) |
| About | [before · after](design-review/merge-report/1440-about.png) | [before · after](design-review/merge-report/390-about.png) |
| Contact | [before · after](design-review/merge-report/1440-contact.png) | [before · after](design-review/merge-report/390-contact.png) |
| Not found | [before · after](design-review/merge-report/1440-404.png) | [before · after](design-review/merge-report/390-404.png) |

The 768px captures and the 1920 hero are in `design-review/final/` with the rest.

---

## Lighthouse against the standing bars

Standing bars: mobile performance >= 80 and every other category >= 90;
desktop >= 90 in every category.

Both sides measured on this machine with the same script and the same browser
(Playwright's Chromium 151, not the auto-updating installed Chrome): `main` as
published (`1757bbe`, its own locked dependencies — Next.js 15.5.22 — and its own
build, 3 runs) and this branch (the stage-8 tree, Next.js 15.5.25, sharp 0.35.4,
5 runs mobile and 3 desktop), each served locally at drop level 0.
Performance median with the worst run in brackets; LCP median. This session ran
nothing else during the runs; the machine is shared with other sessions, and
sibling repositories did commit inside the windows, so treat one-point
differences as noise rather than signal.

| Route | Mobile · main | Mobile · aegean | Desktop · main | Desktop · aegean |
|---|---|---|---|---|
| Home | 83 (83) · 3.8 s | **85** (84) · 3.4 s | 98 (98) · 0.8 s | **99** (98) · 0.6 s |
| Venues | 93 (92) · 3.0 s | **91** (91) · 3.2 s | 99 (99) · 0.6 s | **99** (99) · 0.7 s |
| Venue detail | 88 (87) · 3.5 s | **91** (90) · 3.2 s | 98 (98) · 0.7 s | **99** (99) · 0.7 s |
| Signature Events | 93 (91) · 2.9 s | **91** (91) · 3.2 s | 99 (99) · 0.5 s | **99** (99) · 0.7 s |
| Wedding Guide | 92 (91) · 3.0 s | **90** (90) · 3.2 s | 99 (99) · 0.5 s | **99** (99) · 0.7 s |
| Contact | 93 (91) · 2.9 s | **92** (91) · 3.0 s | 99 (99) · 0.6 s | **99** (99) · 0.7 s |

Accessibility: **aegean 100 on every route and both presets**, main 98–100 (main's `/venues` and `/wedding-guide` read 98). Best practices 100, SEO 100, CLS 0–0.001.

**Against the bars, every one holds:** mobile performance >= 80 on every route (lowest median 85, lowest single run 84); every other category >= 90; desktop >= 90 in every category (lowest single run 98). Phones drop no motion (level 0).

---

## Regressions, and why

Measured against `main` as published, on the same machine, the same script and the
same browser:

- **None in accessibility — the stage-7 regression is gone.** Stage 7 read 95–96
  on every route against main's 98–100, for one node: the footer's decorative
  logotype. It is a drawing now, the exemption with it, and `/wedding-guide`'s
  heading skip went too, so every route reads **100** on both presets, where main
  reads 98 on `/venues` and `/wedding-guide`.
- **Mobile performance, route by route, is within a point or two of main and
  moves in both directions** (main first): Home 83 → 85, Venues 93 → 91, Venue detail 88 → 91, Signature Events 93 → 91, Wedding Guide
  92 → 90, Contact 93 → 92. What the branch adds on those routes is motion the
  dark site did not have: plates that lift, rules that draw, settling reveals.
  Three measurement sets of the same tree put Home's mobile median between 85 and
  88 and its worst single run at 80, the floor itself; the machine is shared, and
  the set with the worst Home also had roughly double the blocking time on every
  other route, which is load, not the site. Improvement 2 names what is actually
  left to fix on Home.
- **Home's mobile largest paint is now its subtitle, not the wordmark.** The
  wordmark is smaller on phones since the sizing fix, so a different element is
  the largest, and it paints 0.1 s later than the wordmark did at stage 7 — still
  half a second earlier than main's 3.8 s. Two of Home's points are that.
- **Against its own history:** Home read 90 on mobile at stage 4 and 85–88 now.

Gains, for balance: accessibility 100 everywhere against main's 98–100, Home's
largest paint half a second earlier than main's, the venue page +3, and desktop 99
on every route against main's 98–99.

No visual or content regression is known beyond the flags below. Copy and routes
are otherwise unchanged from `main`. `/wedding-guide` was re-captured after the
heading change: byte-identical at 390 and 768, and at 1440 the type is identical
while one scene's photograph differs by a sub-pixel scroll-linked transform, which
is where the capture's scroll pass left the drift, not the heading.

---

## Five improvements, described only

None of these is built; each is a proposal for after the merge or for the owner
to pick up.

1. **A run-on-word check in the gate.** TextReveal's words lost their spaces in
   stage 6 and no check noticed: typeset-clip photographs a line masked and
   unmasked, which cannot see a missing gap. Measuring the gap between adjacent
   word masks on every line would make that failure impossible to ship again.
2. **Home's main thread at hydration.** Home is the one route whose mobile median
   sits below 90. Its largest paint is text, not a photograph, and what remains is
   script work while the page hydrates: about 2 s of main-thread work and 150–350
   ms of blocking time on the throttled phone, the widest spread of any route.
   Loading the cursor, the magnetic pull and the preloader's timeline after the
   page is interactive would take most of it.
3. **The FAQ, closed in the server render.** The accordion ships open and
   collapses after hydration, so closed answers flash on a slow load. It renders
   nothing today (the answers are pending); when they land, rendering the closed
   panels hidden-until-found keeps them searchable without the flash.
4. **The mobile menu on short landscape phones.** Below the desktop breakpoint,
   on a phone held sideways (844×390), the six rows overflow a panel that does not
   scroll, so the last links can sit out of reach. Letting the panel scroll, or
   tightening the rows at short heights, keeps every link reachable.
5. **The `/events` masonry's 3/3/1 split** (the owner's addition). Seven plates in
   three CSS columns fill 3/3/1, and the aspect cycle repeats with the same period
   as the columns, so the rows line up and the last column reads as unfinished.
   Balancing the columns and breaking that period would settle it.

---

## Waiting on the owner

**The merge itself.** One word. `origin/main` is a single snapshot with no history
in common with `origin/aegean`, and the pre-push guard allows `main` only with the
owner's flag set, one commit whose parent is the remote tip, and this tree — the
same privacy checks as every other push. So the merge is one snapshot of the
approved tree on top of `1757bbe`; Vercel rebuilds production from `main` on the
push, and the alias, the seal matrix and CI are checked after it.

**Deployments: done, and what is left.** 37 deployments were removed on the
owner's instruction (the two canceled production deployments, the two stage-5
previews, and 33 superseded production deployments of `main` that still served
pre-strip media); the stage-8 log lists every id. Five are kept: the production
alias's own deployment and the four post-strip `aegean` previews. Two consequences
for the owner:

- there is no older production deployment left to roll back to;
- the kept production deployment (`main`, `1757bbe`) still serves pre-strip media
  on the `vercel.app` alias. Only the merge's own production build replaces it,
  and it then becomes a superseded pre-strip deployment in its turn — the owner's
  call. The live domain serves none of this: its DNS still points at the old host.

**Correction to the stage-7 report.** It said the two canceled production
deployments served all eight withheld photographs. Measured before deleting them,
they answered every path — withheld or not, existing or not — with Vercel's
"Deployment was cancelled" page, and the withheld files were never in their
commits. The earlier claim came from reading status codes alone.

**Deferred by the owner, or theirs alone:** the history rewrite (earlier snapshots
on `origin/aegean` still carry pre-strip files) until the repository is private;
Deployment Protection; DNS, domains, the old host, Vercel settings and
credentials. The launch stays parked under `WAITING-FOR-DNS.md`, which is
unchanged and keeps working after the merge.

**Dependencies.** sharp and nanoid are done. next 16 is the one advisory left
(next's bundled postcss, high), and it is a major: its own branch after the merge,
before 15.x support ends on 21 October 2026. Two things to know on that branch:
the local AVIF output changed with sharp 0.35 (Vercel's image pipeline does not
use it), and the new `wordmark` gate check reads Next 15's CSS layout, so it must
be taught Turbopack's before that branch can pass.

**Copy and facts, flagged and not changed:** the enquiry form is still published
from another brand's Monday account (it lives in the Monday builder, outside this
repository), and the venue page states capacity twice more quietly — the title
card's line beside the location, and the specimen card's value — which is a design
call, not a defect.

**Judgement calls the owner accepted, recorded:** the home venue list dims its
other rows by stepping to the secondary text colour rather than fading them;
phones drop no motion; `/services#…` links land level with the header clearance.
Two more, made at stage 8 and reversible: `actions/upload-artifact` was bumped
with the three actions the owner named, because it targets the same deprecated
runtime; and the venue page keeps the small capacity line in its title card.

**Two guards that do not exist, now recorded rather than assumed.** The `claims`
check guards scarcity and exclusivity wording, not figures — the toolkit claimed
otherwise until stage 8, and both figure defects this stage fixed were found by
reading code, not by a gate. A figures audit (every number rendered on the site
traced to `content/`) would close it. And on a desktop window narrower than about
450px with a classic scrollbar, the hero's last letter can still lose a pixel or
two, because `100vw` counts the scrollbar; phones, which have none, are clear at
every width from 320 up.
