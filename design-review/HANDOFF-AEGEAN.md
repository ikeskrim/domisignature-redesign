## Aegean Bone — resume point

Branch `aegean`. Local history is full; `origin/aegean` receives one snapshot
commit per boundary (tree of the local commit, parent = the previous snapshot,
author Domisignature), pushed as a fast-forward. `main` is untouched.

**Before any push:** the privacy gate reads the manifest's own `WITHHELD` map
(`node --input-type=module -e "const m = await import('./scripts/publish-manifest.mjs'); ..."`),
requires exactly eight entries (posterimage.png joined on 2026-09-14), and
checks zero of them are in the tree by exact path or by content under any name
(the widened gate is described below). After every push: `npm run check:alias` (production alias sealed)
and the branch preview's `X-Robots-Tag` and robots.txt.

**Running long suites on this machine:** other Claude sessions work on the
sibling projects in the same folder and terminate node processes machine-wide.
Run servers and suites under the scratchpad supervisor, launched detached, with
a renamed copy of node.exe (`domi-node.exe` — children inherit it, so a kill by
image name misses them). Chains serve on port 3114 (`DOMI_PORT`): a sibling
session binds 3104 with its own renamed node, so neither a port nor a
`domi-node.exe` is proof of ownership — check the holder's command line. Never
touch the siblings' processes or their ports (3000, 3005, 3104). Local servers
bind 127.0.0.1 only. `npm run build` is `scripts/build.mjs`: tsc first,
then Next, then a freshness check; a silent death is named as one.

**Gate:** nineteen checks (`npm run qa`, `PORT` env sets the server port).
`metadata` fails any tracked file carrying GPS, a camera serial or an embedded
thumbnail; stage 6 added `motion-tier` (the drop switch applies exactly its
prefix on a phone, nothing on desktop), `focus-motion` (motion on: a focused
element is never hidden, clipped or covered) and `typeset-clip` (no TextReveal
line clips its own ink). INP (`npm run audit:inp`), Lighthouse and the paper
sweeps with `--motion` and `--lift` run beside the gate, not in it.
Measurement scripts read `SHOTS_BASE`.

**Stage state:** see the stage log in `design-review/INVERSION-PLAN.md`.
Stage 4 closed at snapshot `118f48c` (preview `lwycv01tj`, removed on
2026-09-14 with fifteen other previews whose trees carried withheld files or
names; gate 15/15).
Stage 5 is implemented and reviewed in local commits `656c9e9` (primitives),
`cfec893` (nine groups + the law sweep), `d968a13` (the visual-review
fixes) and `f371558` (the enquiry block's fluid contact size). The final
tree `f371558` is verified (gate 15/15; Lighthouse mobile medians of three,
Home 81 against the floor of 80). **Stage 5 closed at snapshot `0c89d8c`**
(preview `7apxf9ext`), after two close commits: `e6db177` (the gate server
binds loopback; a couple's names and a session id out of the review docs)
and `c918be5` (with-server.ps1 binds loopback, refuses a busy port, stops
only its own tree).

**Stage 6 pre-work, in the owner's order** (decisions of 2026-09-14, recorded
in `design-review/STAGE6-PLAN.md`; the audit behind them is
`design-review/BRIEF-AUDIT.md`): (1) `next` and `eslint-config-next` 15.5.25,
out of GHSA-2xp9-vwfh-vxw4 and GHSA-p293-qw3h-jr36 / CVE-2026-75604 — done,
`e7252a7`; (2) media metadata — every published photograph and video
stripped of GPS, camera serials and embedded thumbnails, credit kept, rewritten
losslessly (tooling `2fda5aa`, 149 files `c40de6c`), with the `metadata` check
in the gate; `posterimage.png` joined the withheld list (`b0cdf48`) and the
pre-push guard is installed (`94be282`); (3) the four loading fixes
(PageTransition first mount, gallery tile preloads, the /venues fetch priority,
GSAP Flip out of the shared chunk) — `41c473b`, measured against a Lighthouse
reference taken on `c40de6c` before them; (4) the conventions layer
(`CLAUDE.md` and the `aegean-bone` project skill). Pre-work snapshot
`a553df2` (preview `e1p6wei5j`).

**Stage 6 motion** (local commits): the lead primitives `60c5c3d`
(`src/lib/motion-tier.ts`, the curtain ease and `finishOnFocus`, the intro
handshake, `<Plate lift>`), the six groups `4483b9b`, the lead's integration
`057bcde`, the INP gate fix `24e8bb7`, the fix round `747ad78` (focus
scrolling, the lift shadow, TextReveal's clip), TextReveal's word spaces
`4921161`, and the arrival's ScrollTrigger refresh order `4b7f238`. The
drop-level matrix chose level 0: every level clears the mobile floor, so
phones drop nothing. Two causes worth knowing before touching scroll or
motion. GSAP ScrollTrigger writes the root's computed `scroll-behavior` back
as an inline style, so a stylesheet `scroll-behavior: smooth` on `<html>`
defeats the Lenis rule — keep it off. And ScrollTrigger refreshes in creation
order: a trigger or pin created late (after an effect-decided state flips)
must `ScrollTrigger.sort()` and `refresh()`, or every trigger below it keeps
positions measured without it. **Stage 6 measured green on `4b7f238`**: gate
19/19, hero-states identical to stage 5 at all sixteen offsets apart from the
declared facts change, Lighthouse mobile at level 0 every route over the floor
(Home 87), INP 64–120 ms. The stage log in `design-review/INVERSION-PLAN.md`
has the entry. **Stage 6 closed at snapshot `189e059`** (preview
`kui9vpbga`; CI green on it: install, build and the gate).

**Stage 7 closed** at the snapshot that carries this paragraph; its id and preview are added by the commit after it. Baselines
rebuilt from the final tree (`design-review/final/` at 390, 768 and 1440 and the 1920
hero, the palette strips, all ten contact sheets); the dark-era capture sets deleted
from the branch; before/after pairs for every route at 1440 and 390 in
`design-review/merge-report/`. The final gate: 19/19 green (`7490369`, on a build of the `840286c` source; nothing the build reads has changed since but three `package.json` script entries). Lighthouse medians of three
on the final build, mobile at drop level 0: every route over the floor (Home 87);
desktop 99 everywhere; the published `main` measured the same way beside it. New
beside the gate: the seal matrix (`npm run audit:seal`, run after a push, 96/96
sealed), the CSP harness (`npm run audit:csp`, before any headers change; 248 of 248 runs clean on the final build) and the
`/media` pixel guard (`npm run audit:pixels`, enforced in the boundary script and
the pre-push hook — a published file never changes its pixels under its old name
without a verdict in `design-review/media-pixel-verdicts.json`). CI runs with a
read-only token; its production dependency audit is a warning until the owner
decides next 16, sharp 0.35.4 and the nanoid bump. `scripts/contact-sheet.mjs` now
normalises CRLF (a CRLF checkout of `content/venues.ts` had dropped two sheets).

**The work stops here.** `design-review/MERGE-REPORT.md` is what stage 8 waits on:
the preview, the changes stage by stage, the before/after pairs, the Lighthouse
table against the standing bars and against `main`, the regressions and why, five
improvements described only, and everything waiting on the owner. Nothing merges to
`main` without the owner's approval; production promotion, DNS, deployments,
repository settings and history rewrites stay the owner's.

**Publishing rule:** never push a local branch — local history holds the
private originals. Push only single-parent snapshots through `boundary.sh`,
whose gate (widened 2026-09-14) checks withheld paths, withheld blobs under
any name, leftover files, key/env files, withheld-name counts from a list kept
outside the repo, secret patterns, the metadata audit and snapshot ancestry.
The installed pre-push guard (`scripts/hooks/pre-push`, copied to
`.git/hooks/pre-push`) refuses any other push. Stage 6 is planned in
`design-review/STAGE6-PLAN.md` (lead primitives first, then six disjoint
groups, then the Lighthouse drop-level matrix). Stage
5 decisions are settled in `design-review/STAGE5-DECISIONS.md`; the shared
primitives (`Plate`, `Phone`, the chapter rest state) are built before the
fan-out; the implementation workflow is `stage5-implement.js`. The stage-5 kit
(`stage5-prep.sh`, `Plate.draft.tsx`, `Phone.draft.tsx`, `patch-chapter-rest.py`,
`stage5-implement.js`) and the run tooling (`supervisor.mjs`, `boundary.sh`,
`domi-node.exe`) live in the session scratchpad:
`%TEMP%\claude\<project>\<session>\scratchpad\` (the working session's own
scratchpad; the id is not recorded in this public document).
Launch long chains through WMI (`Win32_Process.Create`, new console + new
process group) so a peer's Ctrl+C cannot reach them. A WMI child is outside the
desktop app's MSIX package and cannot see its virtualised `%LOCALAPPDATA%`, so
the chain exports `PLAYWRIGHT_BROWSERS_PATH` to
`%LOCALAPPDATA%\Packages\Claude_<id>\LocalCache\Local\ms-playwright` and
probes a browser launch before measuring anything.
