# Legacy redirect map

Every URL the old one-page site published, and where it lands now. Compiled from
`scripts/source.html` — the archived original — rather than from memory. Each
row below was executed against a production-mode build; the Result column is
what actually happened, not what should happen.

Regenerate with `node scripts/launch-check.mjs` against a running build.

## Paths — server redirects (`next.config.ts`)

308 is a permanent redirect that preserves the request method. Search engines
pass the old URL's accumulated ranking to the new one.

| Old URL | New destination | Why | Result |
| --- | --- | --- | --- |
| `/index.html` | `/` | the old entry point | 308 |
| `/events/party-dance` | `/events/sunset-by-the-pool` | renamed — the photographs are a poolside dinner, not a dance | 308 |
| `/venues/villa-aetos` | `/venues` | venue withdrawn; the URL keeps its crawl equity | 308 |

## Assets — unchanged paths

Still served from exactly where the old site linked them, so no redirect is
needed and no external link breaks.

| Old URL | New destination | Why | Result |
| --- | --- | --- | --- |
| `/assets/files/Weddingbrochure.pdf` | `(same path)` | the brochure — linked from the old site and still served | 200 |
| `/assets/favicon.ico` | `(same path)` | the old favicon path | 200 |

## Fragments — client hop (`src/components/layout/LegacyAnchorRedirect.tsx`)

The old site was a single page: its sections and all eleven photo galleries were
fragments. **No server-side rule can redirect these.** A fragment is never
transmitted in an HTTP request — the browser asks for `/` and resolves
`#portfolioModal2` locally — so Next's `redirects()`, Vercel's config and any
nginx rule are all structurally incapable of seeing it. The only place the
information exists is the browser, so that is where the hop happens: on arrival
at the homepage a known legacy fragment is `replace`d with the route now holding
that content. Unknown fragments are left untouched, so the skip link and any
future in-page anchor are unaffected.

Two things here are counter-intuitive and both are deliberate.

**`#about` lands on `/wedding-guide`, and `#team` lands on `/about`.** The old
anchors were named for their position in the nav, not their contents:
`#about` held "Your Wedding Journey with Domisignature", the step-by-step
guide, and `#team` held "Our Amazing Team". Mapping them by name would send
every visitor to the wrong page. Anyone tidying this later should read
`scripts/source.html` before "correcting" it.

**The event galleries were matched by photo set, not by title.** The old titles
were "Party", "Party", "Party", "Wedding", "Dinner", "Party", "Wedding" — they
identify nothing. Each modal's image prefix (`st*`, `de*`, `bl*`, `we*`,
`jd*`, `pa*`, `ol*`) is what ties it to its new slug.

| Old URL | New destination | Why | Result |
| --- | --- | --- | --- |
| `/#page-top` | `/` | top of the old one-pager | ok |
| `/#about` | `/wedding-guide` | the old #about was "Your Wedding Journey" — the step-by-step guide | ok |
| `/#team` | `/about` | the old #team was "Our Amazing Team" — now the About page | ok |
| `/#services` | `/services` | section becomes a page | ok |
| `/#contact` | `/contact` | section becomes a page | ok |
| `/#portfolio` | `/venues` | the venue grid | ok |
| `/#portfolio1` | `/events` | the events grid | ok |
| `/#portfolioModal1` | `/venues/mountain-escape` | lightbox becomes a page | ok |
| `/#portfolioModal2` | `/venues/thalasses` | lightbox becomes a page | ok |
| `/#portfolioModal3` | `/venues/olive-stories` | lightbox becomes a page | ok |
| `/#portfolioModal4` | `/venues` | Villa Aetos, withdrawn | ok |
| `/#portfolio1Modal1` | `/events/sunset-by-the-pool` | matched by its st* photo set | ok |
| `/#portfolio1Modal2` | `/events/villa-party` | matched by its de* photo set | ok |
| `/#portfolio1Modal3` | `/events/party-celebration` | matched by its bl* photo set | ok |
| `/#portfolio1Modal4` | `/events/wedding-rituals-aerial` | matched by its we* photo set | ok |
| `/#portfolio1Modal5` | `/events/dinner-celebration` | matched by its jd* photo set | ok |
| `/#portfolio1Modal6` | `/events/party-drone` | matched by its pa* photo set | ok |
| `/#portfolio1Modal7` | `/events/wedding-rituals-olive` | matched by its ol* photo set | ok |

## Not redirected, deliberately

| Old URL | What happens | Why |
| --- | --- | --- |
| `/css/styles.css` | 404 | A stylesheet for a site that no longer exists. Nothing links to it but the old HTML, which is itself redirected. |
| `/js/scripts.js` | 404 | Same. |
| Old `/media/*.jpg` paths | 200 where the photograph is still used, 404 where it was withdrawn | These were never navigable pages — they were `<img>` sources. The withheld frames (`design-review/publish-manifest.md`) are 404 **by intent**. |
