# Media choices — for your review

No new imagery was introduced. Every photograph below already exists on
domisignature.com; I only chose *which* existing photo goes where.

---

## 1. Wedding Journey — six steps, six distinct photographs

On the live site all six steps share the same placeholder,
`/media/about_updated.png`. Here is what each step now uses and why:

| Step | Image | Why this one |
|---|---|---|
| 1 — Choose and Book Your Villa & Wedding Date | `/media/md1.jpg` | The Mountain Escape estate with its pools, mountains and sea in one frame. Literally "choose your villa". |
| 2 — Share Your Vision | `/media/aeIMG_2131.jpg` | The quiet Villa Aetos terrace over the olive groves — the calm, unhurried conversation this step describes. |
| 3 — Define Guests & Budget | `/media/stDSC_5281.jpg` | Guests gathered at golden hour. This step is about *people and numbers*, so the photo shows people. |
| 4 — Mood Board & Concept | `/media/thLK_LD_071.jpg` | The ceremony arch in white florals and linen against the sea — pure colour, texture and styling, which is exactly what a mood board is. |
| 5 — Planning & Coordination | `/media/olth4.jpg` | The long banquet table under canopies of fairy lights: the finished result of layout, décor, partners and logistics. |
| 6 — Come and get married! | `/media/we3-IMG_5776.JPG` | The couple walking hand in hand after the ceremony. The natural closing image. |

Any of these can be swapped in one line in `content/journey.ts`.

---

## 2. Homepage hero

The live masthead uses `/media/spire2.png`. As flagged in **TEXT-FIXES.md §B5**,
that image reads as an AI render rather than your photography.

The hero now runs a slow cross-fade of three of your own photographs:

1. `/media/mdGEOR3108.jpg` — Mountain Escape pool against the mountains
2. `/media/olth4.jpg` — the seaside banquet under fairy lights
3. `/media/thLK_LD_071.jpg` — the floral ceremony arch

`spire2.png` remains downloaded in `/public/media/` and is one line away in
`content/site.ts` if you prefer it.

---

## 3. Services — one editorial image per block

The live services section used Font Awesome icons only. Icons cannot carry a
luxury layout, so each service now has a photograph pulled from your galleries:

| Service | Image |
|---|---|
| Type of Events | `/media/stDSC_5387.jpg` |
| Wedding Planning & Coordination | `/media/blDSC_9516.jpg` |
| Accommodation & Stay | `/media/th1-DSC_9500.jpg` |
| Legal and Symbolic Weddings in Crete | `/media/we3-IMG_5776.JPG` |
| Guest Care & Experiences | `/media/paDJI_2245.JPG` |

---

## 4. Video

Seven videos are referenced by the live site. **All seven downloaded
successfully — none were skipped.**

| Original | Size | New web-ready file |
|---|---|---|
| `deIMG_8840.MOV` | 10.1 MB | `party-germans-1.mp4` / `.webm` |
| `deIMG_8845.MOV` | 6.5 MB | `party-germans-2.mp4` / `.webm` |
| `jdIMG_8749.MOV` | 18.1 MB | `dinner-celebration-1.mp4` / `.webm` |
| `paDJI_2282.mp4` | 18.1 MB | `party-drone-1.mp4` / `.webm` |
| `paDJI_2288.MP4` | 22.8 MB | `party-drone-2.mp4` / `.webm` |
| `Wedding clip.mp4` | 25.5 MB | `wedding-rituals-olive-1.mp4` / `.webm` |
| `xorafi.mp4` | 24.4 MB | `olive-stories.mp4` / `.webm` |

The three `.MOV` files are QuickTime containers that Chrome and Firefox refuse
to play reliably — the live site serves them mislabelled as `video/mp4`, which
is why they are silently broken for most visitors today. All seven are
transcoded to H.264 MP4 + VP9 WebM with a generated poster frame, so they play
everywhere and start far faster.

Originals are kept in `/public/media/` untouched.
