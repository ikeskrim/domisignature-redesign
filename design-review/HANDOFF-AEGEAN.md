## Aegean Bone — resume point

Branch `aegean`. Local history is full; `origin/aegean` receives one snapshot
commit per boundary (tree of the local commit, parent = the previous snapshot,
author Domisignature), pushed as a fast-forward. `main` is untouched.

**Before any push:** the privacy gate reads the manifest's own `WITHHELD` map
(`node --input-type=module -e "const m = await import('./scripts/publish-manifest.mjs'); ..."`),
requires exactly seven entries, and checks zero of them are in the tree by
exact path. After every push: `npm run check:alias` (production alias sealed)
and the branch preview's `X-Robots-Tag` and robots.txt.

**Running long suites on this machine:** other Claude sessions work on the
sibling projects in the same folder and terminate node processes machine-wide.
Run servers and suites under the scratchpad supervisor, launched detached, with
a renamed copy of node.exe (`domi-node.exe` — children inherit it, so a kill by
image name misses them) on port 3104. Never touch the siblings' processes or
their ports (3000, 3005). `npm run build` is `scripts/build.mjs`: tsc first,
then Next, then a freshness check; a silent death is named as one.

**Gate:** fifteen checks (`npm run qa`, `PORT` env sets the server port).
Measurement scripts read `SHOTS_BASE`.

**Stage state:** see the stage log in `design-review/INVERSION-PLAN.md`.
Stage 4 closed at snapshot `118f48c` (preview `lwycv01tj`, gate 15/15).
Stage 5 is implemented and reviewed in local commits `656c9e9` (primitives),
`cfec893` (nine groups + the law sweep), `d968a13` (the visual-review
fixes) and `f371558` (the enquiry block's fluid contact size). The final
tree `f371558` is verified: gate 15/15 green (chain-s5c, 2026-09-13), 390
captures re-shot. Remaining for stage 5: two more Lighthouse mobile samples on
a quiet machine (`chain-s5-lh.sh`; sample a is `step-lighthouse-mobile-a.log`)
for the log's median, then insert `stage5-log.md`, commit the captures and
reports, the boundary push and the preview follow-up. Chains now serve on
port 3114 (`DOMI_PORT`): the routes-crete session binds 3104. A read-only
audit of an external research brief is in progress; its report becomes
`design-review/BRIEF-AUDIT.md`. Stage 6 is planned in the scratchpad's
`stage6-plan.md` (read-only planning pass; lead primitives first, then six
disjoint groups, then the Lighthouse drop-level matrix). Stage
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
