# QA toolkit

Sixteen automated checks, one command, and a GitHub Action that runs them on every
push. This is what stops the site quietly rotting.

```bash
npm run qa
```

Green means all sixteen passed. It exits non-zero if any failed, so it is safe to
put in front of anything.

`npm run qa` builds nothing — run `npm run build` first, or the server-backed
half will be measuring a stale build. CI does the build itself.

---

## What each check actually checks

### Static — read the repository, no server, no browser

| Check | Script | Green means |
| --- | --- | --- |
| **typecheck** | `tsc --noEmit` | TypeScript compiles with no errors. |
| **lint** | `eslint .` | No lint errors, including the accessibility rules. |
| **palette** | `scripts/palette-literals.mjs` | **Zero palette literals** outside the token definitions. Every component asks for a semantic role (`--text-primary`, `--surface`, `--rule`) and the ground it sits on answers; the moment a file names `text-bone` or `#0a0a0b`, a dark chapter stops being a local inversion and becomes a conditional again. Comments do not count; `themeColor` in `layout.tsx` is the one named exception, because metadata cannot read a CSS variable. Rules in `design-review/SEMANTIC-TOKENS.md`. |
| **claims** | `scripts/claims-audit.mjs` | Every number and factual claim rendered on the site traces to `content/`. This is the one that enforces **no invented facts**: "3 venues", "up to 300 guests" and the rest are derived from the content files, never typed into a component. If someone hard-codes a figure, this fails. |
| **prose** | `scripts/prose-audit.mjs` | No placeholder text, no lorem ipsum, no `TODO`, no doubled spaces, no straight quotes where the design uses typographic ones. |
| **media** | `scripts/media-audit.mjs` | Every image and video path referenced in `content/` exists in `public/`. Catches a renamed file before a visitor finds the gap. |
| **manifest** | `scripts/publish-manifest.mjs` | **The privacy gate.** Eight photographs are withheld from the repository — identifiable people, a licence plate, frames the owner pulled. This fails if any of them is referenced from anywhere in the code, so a withheld frame can never quietly come back through a component edit. Rationale per file is in `design-review/publish-manifest.md`. |
| **metadata** | `scripts/metadata-audit.mjs` | **No published file carries GPS, a camera serial or a hidden thumbnail** (owner decision, 2026-09-14). Reads every git-tracked image, video and PDF by its magic bytes — EXIF, XMP, IPTC/Photoshop blocks, MPF previews, bytes after a JPEG's end, MP4/MOV location atoms and telemetry tracks, WebM/Matroska tags — and fails on any location, serial or embedded thumbnail, and on any media file it cannot parse. Photographer/copyright credit is reported and kept, never a failure. It prints tag ids and offsets, never a value. A failing file is fixed with `npm run strip:metadata -- --apply --ledger <path outside the repository>`, which rewrites losslessly (identical pixels, ICC profile and credit; video streams stream-copied and hash-verified). |
| **ingest** | `scripts/ingest-guard.mjs` | No gallery is half-published. `npm run ingest:gallery` writes a stub full of `TODO(title)` and `TODO(alt)` markers, because a title and a line of alt text need someone to look at the photograph. This fails the moment such a marker appears anywhere under `content/`, so a half-filled gallery cannot reach the site. |

### Served — drive a real browser against a real production server

`npm run qa` starts `next start` itself, waits for it, and stops it afterwards.

| Check | Script | Green means |
| --- | --- | --- |
| **assets** | `scripts/asset-check.mjs` | Every asset the rendered pages request returns 200. Not "the file exists" — what the browser actually asks for, including the responsive image variants Next generates. |
| **a11y** | `scripts/a11y.mjs` | axe-core finds **zero** violations across every route. Zero is the standard, not a target. |
| **arrival** | `scripts/arrival-legibility.mjs` | The arrival's type stays legible over the photograph it sits on. The scene is rendered twice — once as it is, once with the type hidden — and every pixel behind each text block is scored against that text's own computed colour, with the **worst** one reported. Bars: 4.5:1 for the standfirst, 3:1 for the display word and the figures. Replaced the graffiti check, which asked whether that same seascape's graffitied rock stayed hidden inside the ink band; the ink band went with the light ground, and the live risk inverted with it. The rock was re-checked on the real composite before the swap and still does not resolve under the ivory wash. |
| **ground** | `scripts/ground-verify.mjs` | The semantic switch resolves, read from the browser's cascade rather than the token file: every role clears its bar on both ladders, gold is the focus on neither, and — on every route — every visible text element's colour is one of the text roles of its *nearest* ground. That last part catches the failure CSS inheritance makes invisible: an unroled child inside a dark frame keeping its section's paper ink. |
| **focus** | `scripts/focus-ring.mjs` | Every route is tabbed through as a keyboard user would. At each stop the element is photographed focused and with its indicator suppressed, and the perimeter is walked: at every position the strongest change on the line running outward must be 3:1 or more (WCAG 2.4.13). A ring that fades over a photograph, is clipped by a scroller, or is never drawn fails. Embeds (`iframe`) are listed, not scored: focus inside a third-party document is invisible to this page, the same reason axe excludes them. axe does not evaluate any of this. |
| **paper** | `scripts/paper-legibility.mjs` | Every text element on paper, at 1440 and 390, scored against the worst pixel behind its glyphs with every glyph hidden — so the vignette, the grain and anything else painted on the ground are counted, which axe (reading CSS colours) cannot do. 4.5:1, or 3:1 for large text. |
| **launch** | `scripts/launch-check.mjs` | The SEO environment flips are correct for this build, the sitemap resolves, and all 21 legacy URLs from the old site land where `design-review/redirect-map.md` says. Also regenerates that map, with the real result of each row. |

---

## Not in the gate, and why

| | |
| --- | --- |
| **Lighthouse** (`npm run audit:lighthouse`) | Needs a quiet, consistent machine to produce comparable numbers; a shared CI runner is neither, and a performance gate that flaps gets ignored within a week. Run locally before a release. Results and history: `design-review/lighthouse.md`. |
| **Cross-browser** (`npm run cross-browser`) | Produces captures for a human to look at. There is no pass/fail to assert. Firefox additionally cannot launch on this machine — see the manual checklist in the report. |
| **Keyboard, layout, reduced-motion, iOS hero** | Diagnostic tools that print findings for a person to judge rather than a verdict a machine can act on. Run them when touching motion, focus order or layout. |

---

## Running one thing

Each audit is its own npm script. The server-backed ones need a running build:

```bash
npm run build
npx next start -p 3004 -H 127.0.0.1
```

(Loopback only: nothing here needs the server reachable from the network.)

Then, in another shell, any of: `audit:claims`, `audit:prose`, `audit:media`,
`audit:assets`, `audit:a11y`, `audit:arrival`, `audit:ingest`, `audit:keyboard`,
`audit:layout`, `audit:reduced-motion`, `audit:ios-hero`, `audit:lighthouse`,
`publish:manifest`, `audit:metadata`, `launch:check`.

On Windows, `scripts/with-server.ps1` does the start/stop for one command:

```bash
powershell -File scripts/with-server.ps1 -Command "npm run audit:a11y"
```

It exists because a background server started in one shell does not reliably
survive into the next one in that environment — the audit then reports a page of
connection errors that look exactly like site failures. `scripts/qa.mjs` solves
the same problem cross-platform, which is what CI uses.

Static-only, no server, for a quick pass:

```bash
npm run qa -- --static
```

---

## Continuous integration

`.github/workflows/qa.yml` runs on every push and pull request to
[the public repository](https://github.com/ikeskrim/domisignature-redesign):
install, build as a production deployment, then the same `npm run qa`. A red run
means the push broke something.

It builds with `VERCEL=1 VERCEL_ENV=production` deliberately. The SEO flips are
decided at build time, so a default build would have the launch check asserting
against the wrong environment and passing for the wrong reason.

Roughly six minutes, against a fifteen-minute ceiling. npm and the Playwright
browser are both cached. On failure it uploads the audit JSON and the redirect
map so a red run can be read without reproducing it.
