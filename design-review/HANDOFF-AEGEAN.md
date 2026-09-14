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

**Gate:** sixteen checks (`npm run qa`, `PORT` env sets the server port); the
sixteenth, `metadata`, fails any tracked file carrying GPS, a camera serial or
an embedded thumbnail. Measurement scripts read `SHOTS_BASE`.

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
(`CLAUDE.md` and the `aegean-bone` project skill). Then the motion work.

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
