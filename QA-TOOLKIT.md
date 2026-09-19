# QA toolkit

Twenty-two automated checks, one command, and a GitHub Action that runs them on every
push. This is what stops the site quietly rotting.

```bash
npm run qa
```

Green means all twenty-two passed. It exits non-zero if any failed, so it is safe to
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
| **claims** | `scripts/claims-audit.mjs` | **No scarcity or exclusivity claim ships, in any wording** — "by invitation", "a handful of celebrations", "waitlist", "limited to" and the rest of the idea, in `content/` or `src/`. Every allowed instance must be the client's own published copy (checked against `scripts/source.html`) or signed off by name. It does **not** check figures — this line claimed it did until stage 8, when a typed 300 on `/venues` and a wrong capacity in the venue structured data were both found by reading code. That half of the law is now **figures**, below. |
| **figures** | `scripts/figures-audit.mjs` | **No number the site renders is typed into a component** (stage 8, the half of the derived-figures law nothing enforced). Every `.tsx` under `src/` is parsed with the repository's own TypeScript, and every place a number reaches a visitor — JSX text, a literal as a child, `alt`/`aria-label`/`title`/`placeholder`, and the string properties that become copy or metadata — must either trace to `content/` (the same number, not a substring of a longer one) or be allowed by name here, with its reason: the design-direction and study routes, `Error 404`, and one SEO line whose acreage `content/venues.ts` spells in words. An allowance that covers nothing fails too. An expression that computes (`{venues.length}`, `{capacityLabel(...)}`) is not a candidate at all — that is the law working. It is a tripwire, not a proof: it asks whether a number exists in `content/`, not whether it means the same thing there. |
| **prose** | `scripts/prose-audit.mjs` | No placeholder text, no lorem ipsum, no `TODO`, no doubled spaces, no straight quotes where the design uses typographic ones. |
| **media** | `scripts/media-audit.mjs` | Every image and video path referenced in `content/` exists in `public/`. Catches a renamed file before a visitor finds the gap. |
| **manifest** | `scripts/publish-manifest.mjs` | **The privacy gate.** Eight photographs are withheld from the repository — identifiable people, a licence plate, frames the owner pulled. This fails if any of them is referenced from anywhere in the code, so a withheld frame can never quietly come back through a component edit. Rationale per file is in `design-review/publish-manifest.md`. |
| **metadata** | `scripts/metadata-audit.mjs` | **No published file carries GPS, a camera serial or a hidden thumbnail** (owner decision, 2026-09-14). Reads every git-tracked image, video and PDF by its magic bytes — EXIF, XMP, IPTC/Photoshop blocks, MPF previews, bytes after a JPEG's end, MP4/MOV location atoms and telemetry tracks, WebM/Matroska tags — and fails on any location, serial or embedded thumbnail, and on any media file it cannot parse. Photographer/copyright credit is reported and kept, never a failure. It prints tag ids and offsets, never a value. A failing file is fixed with `npm run strip:metadata -- --apply --ledger <path outside the repository>`, which rewrites losslessly (identical pixels, ICC profile and credit; video streams stream-copied and hash-verified). |
| **ingest** | `scripts/ingest-guard.mjs` | No gallery is half-published. `npm run ingest:gallery` writes a stub full of `TODO(title)` and `TODO(alt)` markers, because a title and a line of alt text need someone to look at the photograph. This fails the moment such a marker appears anywhere under `content/`, so a half-filled gallery cannot reach the site. |

### Served — drive a real browser against a real production server

`npm run qa` starts `next start` itself, waits for it, and stops it afterwards.

| Check | Script | Green means |
| --- | --- | --- |
| **wordmark** | `scripts/wordmark-outline.mjs` | The footer's giant wordmark is a drawing (stage 8): Playfair Display's own outlines of `site.name`, laid out as the text was, in `src/components/layout/wordmark-outline.ts`. This regenerates the drawing from the font the build ships and the name in `content/site.ts` and fails if the committed file differs, so a renamed site or a new font version never leaves a stale drawing. It reads the build, not the server; `node scripts/wordmark-outline.mjs --write` regenerates. |
| **assets** | `scripts/asset-check.mjs` | Every asset the rendered pages request returns 200. Not "the file exists" — what the browser actually asks for, including the responsive image variants Next generates. |
| **headers** | `scripts/headers-audit.mjs` | **The security headers ship, and only where they should.** `next.config.ts` declares them; this asks a real server for a document, a build asset, an optimised image and a photograph, and checks what came back. Everywhere: `nosniff`, and HSTS **without `includeSubDomains` or `preload`** — `webmail`, `ftp` and `mail` are independent records still on the old host, and that promise would take them down with it (owner, 2026-09-19). Documents only: `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` — and it fails if those reach an asset, because a rule that matches more than it says is the bug. Nowhere: `X-Powered-By`. It also reads the compiled rule out of `routes-manifest.json`, since a path regex that matches nothing passes every request and protects nothing. The CSP is not asserted here yet: it ships next, Report-Only first. |
| **a11y** | `scripts/a11y.mjs` | axe-core finds **zero** violations across every route, at 390 and 1440, on the WCAG tags **and axe's best-practice set** (widened at stage 8: without it the run could not see `heading-order`, which Lighthouse's accessibility score counts, and `/wedding-guide` scored 98 for a skipped level while this check stayed green). Zero is the standard, not a target. Only third-party frames are excluded; since stage 8 there is no logotype exemption. |
| **arrival** | `scripts/arrival-legibility.mjs` | The arrival's type stays legible over the photograph it sits on. The scene is rendered twice — once as it is, once with the type hidden — and every pixel behind each text block is scored against that text's own computed colour, with the **worst** one reported. Bars: 4.5:1 for the standfirst, 3:1 for the display word and the figures. Replaced the graffiti check, which asked whether that same seascape's graffitied rock stayed hidden inside the ink band; the ink band went with the light ground, and the live risk inverted with it. The rock was re-checked on the real composite before the swap and still does not resolve under the ivory wash. |
| **ground** | `scripts/ground-verify.mjs` | The semantic switch resolves, read from the browser's cascade rather than the token file: every role clears its bar on both ladders, gold is the focus on neither, and — on every route — every visible text element's colour is one of the text roles of its *nearest* ground. That last part catches the failure CSS inheritance makes invisible: an unroled child inside a dark frame keeping its section's paper ink. |
| **focus** | `scripts/focus-ring.mjs` | Every route is tabbed through as a keyboard user would. At each stop the element is photographed focused and with its indicator suppressed, and the perimeter is walked: at every position the strongest change on the line running outward must be 3:1 or more (WCAG 2.4.13). A ring that fades over a photograph, is clipped by a scroller, or is never drawn fails. Embeds (`iframe`) are listed, not scored: focus inside a third-party document is invisible to this page, the same reason axe excludes them. axe does not evaluate any of this. |
| **paper** | `scripts/paper-legibility.mjs` | Every text element on paper, at 1440 and 390, scored against the worst pixel behind its glyphs with every glyph hidden — so the vignette, the grain and anything else painted on the ground are counted, which axe (reading CSS colours) cannot do. 4.5:1, or 3:1 for large text. |
| **launch** | `scripts/launch-check.mjs` | The SEO environment flips are correct for this build, the sitemap resolves, and all 21 legacy URLs from the old site land where `design-review/redirect-map.md` says. Also regenerates that map, with the real result of each row. |
| **motion-tier** | `scripts/motion-tier.mjs` | The drop switch (`src/lib/motion-tier.ts`) does exactly what it says (stage 6). Home at 390 with `?drop=0…4` in a fresh session: `<html data-drop>` holds exactly that prefix of the owner's order (preloader, parallax, grain, shadow), the preloader appears only when it is not dropped, parallax moves only when it is not dropped, grain and the lift and sheet-edge shadows are hidden only when dropped; at 1440 nothing is ever dropped. |
| **focus-motion** | `scripts/focus-motion.mjs` | **Motion on**, at 390 and 1440 — every other audit runs with reduced motion, so none of them can see motion hide a focus. At 50, 200, 500 and 900 ms after each trigger (Tab into a reveal that has not played, Enter on a header link under the page curtain, opening the mobile menu, Enter on a venue row, Tab into the closing chapter mid-scrub), the focused element is never part-transparent, never cut by a clipping ancestor across its indicator's 7px reach, and never covered by another layer. A trigger whose target or precondition cannot be set up fails; it is never skipped. |
| **typeset-clip** | `scripts/typeset-clip.mjs` | No TextReveal line clips its own ink. Every line of word masks is photographed as rendered and again with every mask unclipped; any pixel that differs is ink the mask cut. It cannot see a missing space between words — the height comparison against the previous stage's captures is what caught that. |

---

## Not in the gate, and why

| | |
| --- | --- |
| **Lighthouse** (`npm run audit:lighthouse`) | Needs a quiet, consistent machine to produce comparable numbers; a shared CI runner is neither, and a performance gate that flaps gets ignored within a week. Run locally before a release. Results and history: `design-review/lighthouse.md`. |
| **Cross-browser** (`npm run cross-browser`) | Produces captures for a human to look at. There is no pass/fail to assert. Firefox additionally cannot launch on this machine — see the manual checklist in the report. |
| **INP** (`npm run audit:inp`) | Interaction to Next Paint under a 4× CPU throttle at 390, on the real interactions (the menu, route navigations, the events filter, a gallery tile and its lightbox, a film poster, a venue plate), each confirmed to have done something. Machine-dependent, like Lighthouse, so it is measured locally. Green is ≤ 200 ms on every route. The wedding guide's FAQ is left out, and reported as left out, while its answers are pending. |
| **Paper in motion, plates lifted** (`node scripts/paper-legibility.mjs --motion` / `--lift`) | `--motion` scrolls every route with motion on and fails any paper text left part-transparent at any stop; `--lift` forces every interactive plate into its lifted state and fails if the lift shadow darkens a pixel under type by more than 3%. Slow by design (minutes per route), so they run with each motion change rather than on every push. |
| **CSP harness** (`npm run audit:csp`) | Measures the proposed Content Security Policy and document headers (`design-review/BRIEF-AUDIT.md` section 4.2) without shipping them: the headers are injected in the browser on documents only, in both the report and the enforce disposition, at 390 and 1440 with motion on and off. Positive controls prove the policy is active, and every embed must still load. A dropped connection to the local server is retried up to twice, and an embed whose document fails at the network is recorded with the browser's reason and reloaded once; both are counted in the report and neither is ever a policy result. Network-dependent (Google Maps loads for real) and slow, so it runs before a headers change, not on every push. |
| **Seal matrix** (`npm run audit:seal`) | Asks the production alias, and a preview named in `SEAL_PREVIEW` (never written down), over the internet: every route family, the sitemap, a 404, `/_next/image`, a `/media` file and robots.txt must be sealed against search engines, and the legacy redirect rows are followed hop by hop and fail on a loop. `/services?modal`, which once redirected to itself, must answer 200 on any Aegean build; on the alias it is recorded until the merge. Run after a push; `npm run check:alias` is its quick form. |
| **Pixel guard** (`npm run audit:pixels -- <base> <head>`) | Enforced at the boundary rather than in the gate: the boundary script and the pre-push hook refuse a push in which a `public/` file keeps its name but changes its pixels or video packets, unless `design-review/media-pixel-verdicts.json` holds a human verdict for it. A metadata-only rewrite passes. |
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
