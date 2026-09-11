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

**Stage state:** see the stage log in `design-review/INVERSION-PLAN.md`. Stage
5 decisions are settled in `design-review/STAGE5-DECISIONS.md`; the shared
primitives (`Plate`, `Phone`, the chapter rest state) are built before the
fan-out; the implementation workflow is `stage5-implement.js`. The stage-5 kit
(`stage5-prep.sh`, `Plate.draft.tsx`, `Phone.draft.tsx`, `patch-chapter-rest.py`,
`stage5-implement.js`) and the run tooling (`supervisor.mjs`, `boundary.sh`,
`domi-node.exe`) live in the session scratchpad:
`%TEMP%\claude\<project>\0a003c78-ae1c-4f96-a659-04bce0e3b549\scratchpad\`.
Launch long chains through WMI (`Win32_Process.Create`, new console + new
process group) so a peer's Ctrl+C cannot reach them. A WMI child is outside the
desktop app's MSIX package and cannot see its virtualised `%LOCALAPPDATA%`, so
the chain exports `PLAYWRIGHT_BROWSERS_PATH` to
`%LOCALAPPDATA%\Packages\Claude_<id>\LocalCache\Local\ms-playwright` and
probes a browser launch before measuring anything.
