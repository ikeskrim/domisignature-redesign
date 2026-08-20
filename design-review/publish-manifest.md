# Publication manifest

What goes into the public repository, what does not, and why.

Regenerate with `npm run publish:manifest`. It exits non-zero if any asset the
build references is missing from the published set, or if any withheld frame is
referenced again.

| | Files | Size |
| --- | --- | --- |
| Published (whole repo) | 382 | **300.7 MB** |
| — of which `public/` assets | 188 | 142.4 MB |
| — of which `design-review/final/` | 38 | 110.9 MB |
| Excluded | 17 assets + 9 screenshot sets | ~250 MB |
| **Largest single committed file** | | **21.95 MB** (`public/media/video/wedding-rituals-olive-1.mp4`) |

No file approaches the 95 MB ceiling; the largest is under a quarter of it.

---

## 1. Withheld frames — absent from the published tree

These are the Phase 6 §4 withdrawals. They remain in local history and on the
local disk; they are **not** in the pushed tree.

| File | Why |
| --- | --- |
| `olLK_LD_072.jpg` | A welcome board with a couple's first names legible. No confirmed written permission. |
| `spire2.png` | Reads as AI-generated: no EXIF, no ICC profile, PNG at 1534×1023, and a pool reflection that does not obey the scene's geometry. |
| `thspire2.png` | Byte-identical duplicate of `spire2.png` under a second name. |
| `stHARLEY.jpg` | Withdrawn as a weak frame (a parked motorcycle). |
| `blDSC_9849.jpg` | Withdrawn as a weak frame (a lamp on a bare wall). |
| `ae9Z8A4481-Edit.jpg` | Off-register — a bare irrigation field. |
| `aeIMG_2133.jpg` | Off-register — a child's play tent and a hammock. |

`content/site.ts` used to carry `originalImage: "/media/spire2.png"`. That field
is gone: publishing a code reference to a file the imagery policy forbids would
only invite someone to restore it.

## 2. Raw camera masters — 125.5 MB

`Wedding clip.mp4`, `xorafi.mp4`, `paDJI_2288.MP4`, `paDJI_2282.mp4`,
`jdIMG_8749.MOV`, `deIMG_8840.MOV`, `deIMG_8845.MOV`.

Each is recorded in an `original:` field in `content/events.ts` or
`content/venues.ts`, so the provenance of every transcode stays documented. None
of them is served — the site plays the web transcodes in `public/media/video/`,
which **are** committed. Publishing 125 MB of source footage to make a text
record clickable is the wrong trade.

`npm run media:video` regenerates every transcode from these masters if they are
ever needed.

## 3. Unreferenced leftovers

| File | Why |
| --- | --- |
| `posterimage.png` (2.9 MB) | The wedding film's original poster, superseded in §6 by a 175 KB optimised JPEG. Nothing links to it, **and it shows identifiable people at a real ceremony** — so it does not go to a public repository. |
| `about_updated.png` (47 KB) | The live site's placeholder graphic, replaced in Phase 4. |
| `close-icon.svg` (0 KB) | Legacy Bootstrap icon, unused since Phase 3. |
| **The ten `ae*` Villa Aetos photographs** (1.9 MB) | The owner withdrew that venue from the collection. Nothing references them, so they follow this rule rather than lingering as dead weight. They remain on local disk and in history — the venue can be restored. |

## 4. Review screenshots — kept and dropped

`design-review/` **is** published: it is how a reviewer sees the build without
running it. All reports (`.md` / `.json`) ship, plus:

**Kept** — `final/` (110.9 MB), `contact-sheets/` (31.5 MB), `directions/`
(13.3 MB), `grade/` (2.0 MB).

`final/` was **regenerated in full** against the current build after a review
found it stale — it still carried the pre-copy-pass eyebrow and subtitle, a
"Tell me more" CTA, the teal mark, and a file named for the retired
`party-dance` slug. The superseded captures were deleted rather than left
alongside the new ones: a review folder showing two eras of the design at once
is worse than no review folder, because it makes a reviewer doubt which is
current. 38 captures now — 14 at 1440, 14 at 768, 9 at 390, and the 1920 hero.

**Dropped** — intermediate round-by-round captures, superseded by `final/`:

| Set | Size | What it was |
| --- | --- | --- |
| `round-4/` | 56.9 MB | Phase 4 art-direction round |
| `phase6-imagery/` | 16.9 MB | §4 spot checks |
| `phase6-motion/` | 12.7 MB | §5 spot checks |
| `noir-r1/` | 12.1 MB | First Cretan Noir pass |
| `noir-voyage/` | 9.4 MB | Voyage-order pass |
| `phase6-final/` | 7.0 MB | §6 mobile sweep |
| `noir-copy/` | 4.7 MB | Copy pass captures |
| `cross-browser/` | 3.3 MB | WebKit/Chromium probes |
| `noir-r2/` | 1.9 MB | Second noir pass |

All nine are reproducible: `npm run shots -- <label>` and
`node scripts/shots-scroll.mjs <label>`.

## 5. Never committed

`node_modules/`, `.next/`, `.next-build/`, `.vercel/`, every `.env` form,
`*.pem` / `*.key` / `*.p12`, editor and OS noise, one-off `_*.mjs` diagnostics,
commit-message drafts, and `public/_grade-preview.html`.

**No environment variable is required to build or run this site.** The enquiry
form is a public Monday.com embed and every contact detail on the site is
already published. If an email provider is added later, its key belongs in
Vercel's environment variables — never in this repository.

## 5a. A withheld frame that was published anyway

Found while verifying the pushed tree, and worth recording because it defeated
the whole exclusion mechanism.

The contact sheets are **composites** of gallery frames, and they are published.
They had not been regenerated since §2, so they still showed the pre-§4
galleries — which meant the chalkboard carrying a couple's names was **baked
into the pixels of `event-wedding-rituals-olive.png`**, and the image withdrawn
for reading as AI-generated was baked into `venue-thalasses.png`. Both source
files were correctly excluded from the repository. It made no difference: their
pixels shipped inside a montage.

Excluding a file is not the same as excluding a photograph.

All eleven sheets were regenerated from the current galleries — 156 frames,
matching the live content exactly — and `event-party-dance.png` is gone with the
retired slug.

`npm run audit:media` now checks the generated sheet index against the live
galleries and fails on any mismatch of slug or frame count. There is no cheap
way to prove a PNG does not contain a given photograph, but staleness is a
sound proxy: a sheet regenerated from the current galleries cannot contain a
frame those galleries no longer list. Verified against a deliberately stale
index before shipping.

## 6. Verification that nothing needed was dropped

`npm run audit:assets` crawls all eighteen routes of the production build and
fails on any same-origin request that does not return 200.

**457 same-origin requests across 18 routes — every one returned 200.**

That is the check that matters here: a green build only proves the code
compiles, whereas this proves the pages can actually fetch everything they ask
for after 135 MB of assets were excluded.

## 7. Two caveats for anyone working from the public tree

- `npm run sweep:spire` reads `public/media/spire2.png` and will fail here by
  design. Its findings are recorded in `PHASE6-REPORT.md` §2.
- `original:` fields in `content/*.ts` name masters that are not in this tree.
  They are provenance records, not links, and nothing resolves them at runtime.
