# Domisignature

Luxury Events, Weddings & Private Celebrations in Crete — *Where Every Moment Is Signed*.

A complete redesign and rebuild of [domisignature.com](https://domisignature.com), which was a
one-page Bootstrap "Agency" template with venues and galleries trapped in modal
popups. Every word of content is preserved; the presentation is entirely new.

---

## Running it

```bash
npm install
npm run dev
```

The dev server is pinned to **port 3004**.

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3004 |
| `npm run build` | Production build — **stop the dev server first**; they share `.next` |
| `npm start` | Serve the production build on 3004 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run media:video` | Transcode source video to web-ready MP4 + WebM + posters |

### Audits

The build is gated on six checks, all of which exist because something got past
a review once. `design-review/PHASE6-REPORT.md` explains each one.

| Script | Catches |
|---|---|
| `npm run audit:a11y` | axe-core, 10 routes × 2 viewports |
| `npm run audit:claims` | scarcity and exclusivity claims, by idea rather than phrasing |
| `npm run audit:media` | broken galleries, duplicate frames, unoptimised video posters, non-camera PNGs |
| `npm run audit:prose` | facts lost from the original copy |
| `npm run audit:keyboard` | focus traps, missing focus indicators, stranded stops |
| `npm run audit:layout` | horizontal overflow, prose below 14px |

### A note on missing files

Some assets referenced in this repository's history are deliberately absent:
withheld photographs, raw camera masters, and superseded review captures.
`design-review/publish-manifest.md` lists every one and why, and
`npm run publish:manifest` fails if anything the site actually needs is missing.

---

## Content is the source of truth

Everything a visitor reads lives in `/content` as typed data. **No component
hardcodes copy.**

| File | Holds |
|---|---|
| `content/site.ts` | Meta tags, hero, contact details, navigation, footer, legal |
| `content/services.ts` | The five service blocks, with the external links preserved as copy runs |
| `content/venues.ts` | The venues: prose, advantage lists, capacity, maps, galleries |
| `content/events.ts` | The seven Signature Events galleries |
| `content/journey.ts` | The six Wedding Journey steps |
| `content/team.ts` | The three team members and the team statement |
| `content/pending.ts` | Testimonials, FAQs, stats — **intentionally empty**, see `CONTENT-NEEDED.md` |

To change a word on the site, change it in `/content`. Nowhere else.

### Read these before reviewing

- **`TEXT-FIXES.md`** — every text change I made, and every question I have.
- **`MEDIA-CHOICES.md`** — which photograph I chose for what, and why.
- **`CONTENT-NEEDED.md`** — the three sections waiting on real content from you.

---

## Architecture

Next.js 15 App Router · TypeScript · Tailwind CSS v4 · Motion (Framer Motion) ·
Lenis · `next/font` · `next/image`.

```
src/
  app/                 routes — one folder per page, plus sitemap.ts and robots.ts
  components/
    layout/            Header, Footer, back-to-top, legacy anchor redirects
    motion/            Reveal / MaskReveal / TextReveal / Stagger, page transitions, Lenis
    gallery/           EditorialGallery, Lightbox, VideoPlayer
    venue/             VenueCard, VenueFacts
    events/            EventsBrowser (category filtering)
    contact/           MondayForm (with skeleton + fallback)
    seo/               JSON-LD structured data
    ui/                Button, Container, SectionHeading, PageHeader, Accordion, …
  lib/                 utilities
content/               all copy
public/media/          every image and video from the live site
public/media/video/    web-ready transcodes
scripts/               asset download, video transcode, logo mark extraction
```

### Design tokens

Defined once in `src/app/globals.css` under `@theme`. Warm whites, soft blacks,
stone and sand, with muted gold used only for small accents. Type is
Cormorant Garamond (display) over Manrope (UI), both self-hosted by `next/font`.
Nothing uses a stock Tailwind colour or a default type scale.

### Old URLs still work

The one-page site published anchors — `#services`, `#portfolio`, `#portfolio1`,
`#about`, `#team`, `#contact`, plus one per modal. Anchors never reach the
server, so `src/components/layout/LegacyAnchorRedirect.tsx` resolves them
client-side to the matching new page, including deep links straight to a
specific venue or gallery.

---

## Media

`scripts/fetch-assets.ps1` downloaded all 179 assets referenced by the live site
(zero failures). `npm run media:video` transcodes the seven source videos —
three of which are `.MOV` files that Chrome and Firefox will not play reliably,
and which the live site serves mislabelled as `video/mp4`.

Originals are kept untouched in `public/media/`.
