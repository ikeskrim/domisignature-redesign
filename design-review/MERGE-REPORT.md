# Aegean Bone — the merge report

**Preview:** added by the commit that follows the stage-7 snapshot (the snapshot's own preview cannot be named inside it).
The branch is sealed against search engines; the production alias still serves `main`.

This is the report stage 8 waits on. Nothing here has touched `main`; merging is
the owner's decision alone, and nothing merges without it.

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

Standing bars: mobile performance ≥ 80 and every other category ≥ 90; desktop ≥ 90
in every category. Medians of three runs, local production build, labelled with
build source and framework version.

Both sides measured on this machine, the same way, one after the other: `main` as published (`1757bbe`, its own locked dependencies — Next.js 15.5.22 — and its own build) and this branch (`840286c`, Next.js 15.5.25), each served locally, the branch's Lighthouse script, three runs per route. Performance median, worst run in brackets; LCP median.

| Route | Mobile · main | Mobile · aegean | Desktop · main | Desktop · aegean |
|---|---|---|---|---|
| Home | 83 (83) · 3.8 s | **87** (86) · 3.3 s | 98 · 0.8 s | **99** (92) · 0.7 s |
| Venues | 93 (92) · 3.0 s | **92** (92) · 3.1 s | 99 · 0.6 s | **99** · 0.6 s |
| Venue detail | 88 (87) · 3.5 s | **91** (91) · 3.2 s | 98 · 0.7 s | **99** · 0.6 s |
| Signature Events | 93 (91) · 2.9 s | **92** (92) · 3.0 s | 99 · 0.5 s | **99** · 0.6 s |
| Wedding Guide | 92 (91) · 3.0 s | **91** (91) · 3.0 s | 99 · 0.5 s | **99** · 0.6 s |
| Contact | 93 (91) · 2.9 s | **93** (93) · 2.9 s | 99 · 0.6 s | **99** · 0.6 s |

Accessibility: main 98–100, aegean 95–96. Best practices and SEO: 100 on both. CLS 0–0.001 on both.

**Against the bars, every one holds on this branch:** mobile performance ≥ 80 on every route (lowest median 87, lowest single run 86); every other category ≥ 90; desktop ≥ 90 in every category (lowest single run 92). Phones drop no motion (level 0; every drop level was measured and every level clears).

---

## Regressions, and why

Measured against `main` as published, on the same machine:

- **Accessibility, 98–100 → 95–96 on every route.** One node: the footer's decorative logotype (`aria-hidden`, 1.21:1). WCAG exempts logotypes and pure decoration, and the gate's own axe run already excludes it, but Lighthouse's contrast audit cannot. It appeared when stage 6 deleted the light pool that sat over it, which most likely left its background indeterminate before. Improvement 1 below removes it without an exemption.
- **Mobile performance, −1 on Venues, Signature Events and the Wedding Guide** (93 → 92, 93 → 92, 92 → 91). Each is inside `main`'s own spread across its three runs (91–93), so none is a measured regression; they are recorded because they are the only routes that did not gain. What the branch adds there is motion the dark site did not have: plates that lift, rules that draw, settling reveals.
- **Home desktop, one slow run** (92 against a median of 99). The median matches `main`; the single run is recorded, not explained away.
- **Against its own history:** Home read 90 on mobile at stage 4 and 87 now. The four loading fixes of stage 6 took it from 81 back to 88; the motion stage cost it one point. Improvement 3 names what is left.

Gains, for balance: Home +4 on mobile with a largest paint half a second earlier (3.8 → 3.3 s), the venue page +3 (3.5 → 3.2 s), every route's worst run at or above `main`'s except the one Home desktop run above.

No visual or content regression is known beyond the flags below; copy, facts and routes are unchanged from `main`.

---

## Five improvements, described only

None of these is built; each is a proposal for after the merge or for the owner
to pick up.

1. **The footer's logotype as a drawing, not text.** It is decorative and hidden
   from assistive technology, and WCAG exempts logotypes, but Lighthouse's
   contrast audit cannot see an exemption and scores every route 95–96 for it.
   Set as an SVG (or a CSS background), accessibility reads 100 again with nothing
   exempted.
2. **A run-on-word check in the gate.** TextReveal's words lost their spaces in
   stage 6 and no check noticed: typeset-clip photographs a line masked and
   unmasked, which cannot see a missing gap. Measuring the gap between adjacent
   word masks on every line would make that failure impossible to ship again.
3. **Home's main thread at hydration.** Home is the one route still below its
   stage-4 reading (87 against 90). Its largest paint is the hero headline, not a
   photograph, and what remains is script work while the page hydrates: 2.2 s of
   main-thread work and a median 200 ms of blocking time on the throttled phone.
   Loading the cursor, the magnetic pull and the preloader's timeline after the
   page is interactive would take most of it.
4. **The FAQ, closed in the server render.** The accordion ships open and
   collapses after hydration, so closed answers flash on a slow load. It renders
   nothing today (the answers are pending); when they land, rendering the closed
   panels hidden-until-found keeps them searchable without the flash.
5. **The mobile menu on short landscape phones.** Below the desktop breakpoint,
   on a phone held sideways (844×390), the six rows overflow a panel that does not
   scroll, so the last links can sit out of reach. Letting the panel scroll, or
   tightening the rows at short heights, keeps every link reachable.

---

## Waiting on the owner

**Before or at the merge**

- **Deployments still serving private files.** Two canceled production
  deployments (`n9yg989zc`, `7gujchx43`) serve all eight withheld photographs, and
  every deployment built before the metadata strip — the two kept previews
  (`7apxf9ext`, `ikw1wxqqc`) and older production builds — serves the originals
  with GPS and camera serials. Production deployments were never mine to touch.
- **History.** Earlier snapshots on `origin/aegean` still contain the pre-strip
  files; removing them is a history rewrite.
- **Deployment Protection** (previews public through stage 7, decide at stage 8),
  and the www redirect setting at cutover.
- **`/services?modal`:** the redirect loop the audit found (option A, delete the
  line) waits on your approval; routes are frozen until then.

**Copy and facts, flagged and never changed**

- Home says "four settings" for three venues (the fourth was Villa Aetos).
- `/venues` types "Up to 300 guests" instead of deriving it.
- The enquiry form is published from another brand's Monday account.
- The venue page states capacity twice (both correct — a design call).
- The hero wordmark is cut at 390; the `/events` masonry splits 3/3/1.

**Judgement calls made in stage 6, yours to reverse**

- The home venue list dims its other rows by stepping to the secondary text colour
  instead of fading them to 30% — no text on paper fades. A signature interaction.
- Phones drop no motion (the measured rule's answer); the planning pass had
  recommended dropping the preloader on phones, worth one point on Home.
- `/services#…` links now land about 232px down at desktop: the scenes' own top
  margin adds to the new header clearance.

**After the merge (decided, not started)**

Security headers static first, then CSP as Report-Only, then enforcing, never
nonces; HSTS without `includeSubDomains` while webmail, ftp and mail resolve to
the old host; Next.js 16 on its own branch before 15.x support ends on
21 October 2026; sharp 0.35 at your call.
