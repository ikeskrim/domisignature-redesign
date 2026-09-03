# Imagery report — Phase 6 §4

A photo-editor pass over all eleven galleries: every frame looked at, every
gallery re-sequenced to open on its best image, ten frames withdrawn from
display, and one gallery repaired that had been quietly broken since Phase 1.

Nothing was deleted. Every withdrawn file is still in `/public/media/` and every
one of them is a single line away from returning.

---

## 1. Headline

| | Before | After |
|---|---|---|
| Galleries | 11 | 11 |
| Frames on display | 166 | 156 |
| Frames withdrawn | — | 10 |
| Galleries re-sequenced | — | 11 |
| Third-party or stock images | 0 | 0 |
| AI-generated images | 1 | 0 |

---

## 2. The one that mattered — `thspire2.png`

While choosing a new cover for Thalasses I nearly promoted `thspire2.png` to be
the venue's opening frame. It is a couple at a sunset pool, framed in a white
arch, reflected in the water. It is the most immediately beautiful file in the
library. It is also not a photograph.

What gave it away, in order:

1. **The reflection does not obey the scene.** The couple stand well behind the
   pool coping, yet their reflection begins at the coping and runs the full
   depth of the water. The palms reflect at a scale and detail the geometry
   cannot produce.
2. **It is a PNG at 1534×1023** in a library of camera JPEGs — a 3:2 crop of the
   1536×1024 native output size of common image generators.
3. **No EXIF, no ICC profile.** 157 of the 168 images in `/public/media/` carry
   EXIF. This one carries nothing: no camera, no lens, no date.
4. **It is byte-identical to `spire2.png`** — SHA-256
   `2C5CE131…59D0A485` — the old site's masthead background, which I had already
   flagged in `TEXT-FIXES.md §B5` in Phase 4 as reading synthetic. The same file
   was sitting in the Thalasses gallery under a second name, and I had not
   noticed because Phase 4 only examined the hero.

Under the standing law — **no AI-generated photographic imagery** — it is out of
the gallery and out of the cover slot. `spire2.png` remains unused as the hero.

Thalasses now opens on `th3-DSC_5495.jpg`: the real pool at dusk, string lights,
palms, the sea, the white ceremony gate. Its palm reflection is geometrically
correct, which is the clearest possible statement of the difference.

**This is a question for you, not a decision I have made:** the file is still on
disk and still on the live site. If it came from a photographer and I am wrong,
say so and it goes straight back. If it was generated, it is worth knowing where
else it has been used — brochure, social, ads.

---

## 3. The broken gallery — "Under the shade sail"

Its gallery array listed six entries. Three were photographs. The other three
were `dinner-celebration-1.mp4`, its poster frame, and the raw
`jdIMG_8749.MOV` — all being handed to `next/image`, which cannot render video.
The page also announced "6 photographs" in its standfirst.

Inherited from the live site's own markup and carried through Phase 1 unnoticed,
because the content audit counted gallery entries without ever asking what they
pointed at.

The film now sits in the `videos` array where every other event's film sits, and
plays through `VideoPlayer`. The gallery holds its three photographs and says so.

---

## 4. Removed-images sign-off list

All ten remain in `/public/media/`. Say the word on any of them and it returns.

| # | File | Gallery | Why |
|---|---|---|---|
| 1 | `stHARLEY.jpg` | Sunset by the pool | A parked motorcycle. It was also the gallery's **cover**, so the gallery opened on it. **You approved this by name.** |
| 2 | `blDSC_9849.jpg` | Everyone in white | A lamp on a bare wall. **You approved this by name.** |
| 3 | `olLK_LD_072.jpg` | A ceremony by the water | A welcome board with a couple's first names legible. **Privacy rule** — no confirmed written permission. |
| 4 | `thspire2.png` | Thalasses | Reads as AI-generated; identical to `spire2.png`. See §2. |
| 5 | `ae9Z8A4481-Edit.jpg` | Villa Aetos | A bare irrigation field. Reads as a building site next to the villa's own rooms. |
| 6 | `aeIMG_2133.jpg` | Villa Aetos | A hammock and a child's play tent. Off-register for a wedding venue. |
| 7 | `posterimage.png` | A ceremony by the water | A 1920×1080 frame lifted from the wedding film. **Still the film's poster** — only removed from the stills grid, where it sat at video resolution among photographs. |
| 8 | `dinner-celebration-1.mp4` | Under the shade sail | A video file in a photo gallery. **Now plays as the film.** See §3. |
| 9 | `dinner-celebration-1.jpg` | Under the shade sail | That video's poster frame. **Now used as the poster.** |
| 10 | `jdIMG_8749.MOV` | Under the shade sail | The raw camera file for the same clip. **Superseded by the transcode.** |

Entries 7–10 are not really losses — each is still on the site, doing the job it
was made for instead of pretending to be a photograph.

### Applying the privacy rule to everything else

You asked that any frame with a client's name or personal details legible gets
the same treatment. I went back through the library for text:

- `stDSC_5301.jpg` / `thDSC_5301.jpg` / `olthDSC_5301.jpg` — a chalkboard, but it
  reads *Cocktails: Virgin Mojito, Aperol Spritz…*. A drinks list, no names. **Kept.**
- `olLK_LD_072.jpg` — the only frame carrying personal details. **Removed.**

No other legible name, place card, seating plan or order of service appears in
any of the 156 remaining frames. Faces are a different matter and I have not
touched them: these are the client's own photographs, already published, and
your instruction was specific to names and personal details.

---

## 5. Re-sequencing — every gallery now opens on its best frame

Covers were chosen by compositing all eleven side by side, because a cover is
never seen alone — it is seen in a grid next to the other ten. Judged that way,
six of the original eleven were "a swimming pool in the middle distance", and
three galleries opened on frames that undersold what was inside them.

| Gallery | Was | Now | Why |
|---|---|---|---|
| Sunset by the pool | `stHARLEY.jpg` | `st2-DSC_5316.jpg` | A laid table in warm evening light, pool and sea behind. The old cover was a motorcycle; an empty pool was the obvious replacement, but the table has craft and depth and puts the pool where it belongs — in the background. |
| Villa Party | `deIMG_8838.JPG` | unchanged | Palms against the sunset. Already the strongest frame. |
| Everyone in white | `b1-DSC_9500.jpg` | `bl8-DSC_9672.jpg` | The title promises guests in white; the old cover was a grey-lit empty pool with the party a distant strip. This one delivers the title literally. |
| Vows on the sand | `we2-IMG_4978.JPG` | unchanged | A real ceremony, real people, sea behind. The most human cover in the set. |
| Under the shade sail | `jdIMG_8747.JPG` | `jdIMG_8748.JPG` | The old cover was dominated by a guest's back. This one lets the shade sail sweep the frame. |
| From above | `paDJI_2289.JPG` | unchanged | The whole venue at dusk from the air. Earns its title. |
| A ceremony by the water | `olIMG_5365.jpg` | unchanged | A genuine seaside ceremony. |
| Mountain Escape | `md1.jpg` | unchanged | Pool, lawn, and the mountains beyond. |
| Thalasses | `thspire2.png` | `th3-DSC_5495.jpg` | See §2. |
| Olive Stories | `xDJI_…0065_D.jpg` | unchanged | Aerial olive terraces. The most distinct image in the set. |
| Villa Aetos | `aeIMG_2131.jpg` | `ae9Z8A4452-Edit.jpg` | Shows the villa itself, not just its view — the only cover in the set that leads with architecture. |

Behind the covers, every gallery was re-ordered so the strongest frames come
first and near-duplicates are spaced apart rather than sitting adjacent.

### Frames per gallery

| Gallery | Before | After |
|---|---|---|
| Sunset by the pool | 25 | 24 |
| Villa Party | 13 | 13 |
| Everyone in white | 32 | 31 |
| Vows on the sand | 9 | 9 |
| Under the shade sail | 6 | 3 |
| From above | 15 | 15 |
| A ceremony by the water | 10 | 8 |
| Mountain Escape | 16 | 16 |
| Thalasses | 23 | 22 |
| Olive Stories | 5 | 5 |
| Villa Aetos | 12 | 10 |
| **Total** | **166** | **156** |

---

## 5a. The hero — recomposed, not repaired

Caught in the published-tree review. Both the poster and the film carried, in
the right fifth of the frame, **a red car, a liveried white van**, beachgoers on
the shore beyond the venue wall, and the tip of a thatched parasol. On the first
screen a visitor sees, a parked delivery van is not set dressing.

Fixed by **recomposing the frame, not by repairing it**: a hard crop of
`1390×782` from `x=0, y=180` on both 1920×1080 sources, so that side of the
scene is simply outside the picture. Nothing was retouched, cloned or painted
out — every pixel that ships is a real pixel from the footage, which is the only
version of this fix that respects the no-invented-imagery law.

Two things made this a photo-editor's pass rather than a one-line change:

1. **The drone drifts.** The first crop I chose was clean at the poster's
   timestamp and let the parasol back into the corner at 10.1s. The crop was
   re-chosen by cropping and inspecting *every second of both segments*, then
   verified again against the encoded loop rather than the source.
2. **1390 is every horizontal pixel left.** Both sources are 1920×1080, so the
   poster is written at native crop size. Upscaling it back to 1920 would only
   invent detail — the LCP element should be honest about its own resolution.

`scripts/build-hero-video.mjs` carries the crop, so `npm run media:hero`
reproduces it. Poster 0.14 MB, film 2.92 MB MP4 / 4.35 MB WebM — all inside the
8 MB budget.

Guests remain visible on the venue's **own** beach cabanas at the upper right.
That is event content, not the car park. Say the word if you want the frame
tighter still.

## 6. Tier 2 atmosphere imagery — none used

The policy allowed licensed stock from Unsplash or Pexels for atmosphere. We had
the option and declined it: with 160+ genuine photographs across four venues and
seven events, every surface that could have taken a stock plate was better served
by an actual frame from that venue.

`/public/images/CREDITS.md` records this, and carries the rules that apply the
moment anything third-party is ever added.

## 7. Grade and performance

Unchanged from Phase 4. The single warm grade (`.grade`, and `.grade-hero` for
the lighter hero treatment) is applied consistently; no per-image adjustments
were introduced by this pass. The hero poster remains a real photograph and
remains the LCP element.

---

## 8. New guard — `npm run audit:media`

The Phase 1 content audit counted gallery entries. It could not have caught the
`.mp4` in a photo gallery, the duplicate `th4.jpg` I introduced during this pass,
or a withdrawn frame creeping back in. So there is now a real validator:

- every gallery entry resolves to a file that exists in `/public`
- every entry is a still image — no video files, no poster frames
- no entry appears twice in the same gallery
- `coverImage` is genuinely the gallery's first frame
- nothing on the withdrawn list is on display
- **any PNG with no EXIF and no ICC profile is flagged** — the signature that
  caught `thspire2.png`

It caught a duplicate I had just created, on its first run. It now reports
**11 galleries, 156 frames, no problems**, and exits non-zero on any failure.
