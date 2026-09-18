# Seal matrix

Stage 7, as specified in `design-review/BRIEF-AUDIT.md` section 8. Generated 2026-09-18T09:02:16.735Z by `node scripts/seal-matrix.mjs`. Result: **sealed** (100 checks passed).

Hosts appear as labels only. `alias` is the production alias (`ALIAS_URL`, defaulting to the alias `scripts/alias-check.mjs` checks). `preview` is the host passed in `SEAL_PREVIEW`, which is never recorded. Redirect targets are paths.

What is asserted: every response that is not a 3xx carries `X-Robots-Tag` with `noindex` (a 3xx is exempt); robots.txt has a `User-Agent: *` line whose group holds a line that is exactly `Disallow: /` and no `Allow: /` line; on the preview every HTML response carries `<html data-ground="light">` (on the alias the build is recorded, never failed); /_next/image is requested at `w=640`; each legacy path row of `scripts/launch-check.mjs` is followed hop by hop, at most 6 requests, and fails on a revisit, on more than 5 hops or on leaving the host, and must land on its destination with a 200; `/services?modal`, which once redirected to itself, must answer 200 on any host serving the Aegean build (on a pre-Aegean build its answer is recorded, never failed).

## alias

Build served: pre-Aegean build (no data-ground on <html>).

`/services?modal` on this pre-Aegean build (recorded, not asserted): 307 -> /services?modal.

Probe photograph: `/media/mdGEOR3108.jpg` (og:image of the home page).

| Probe | Path | Status | Content-Type | X-Robots-Tag | noindex | `<html data-ground>` | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| home | `/` | 200 | text/html | noindex, nofollow | ok | (none) | ok |
| venues | `/venues/thalasses` | 200 | text/html | noindex, nofollow | ok | (none) | ok |
| events | `/events/sunset-by-the-pool` | 200 | text/html | noindex, nofollow | ok | (none) | ok |
| services | `/services` | 200 | text/html | noindex, nofollow | ok | (none) | ok |
| wedding-guide | `/wedding-guide` | 200 | text/html | noindex, nofollow | ok | (none) | ok |
| about | `/about` | 200 | text/html | noindex, nofollow | ok | (none) | ok |
| contact | `/contact` | 200 | text/html | noindex, nofollow | ok | (none) | ok |
| sitemap | `/sitemap.xml` | 200 | application/xml | noindex, nofollow | ok | n/a | ok |
| not-found | `/seal-matrix-no-such-page` | 404 | text/html | noindex, nofollow | ok | (none) | ok |
| next-image | `/_next/image?url=%2Fmedia%2FmdGEOR3108.jpg&w=640&q=75` | 200 | image/jpeg | noindex, nofollow | ok | n/a | ok |
| media | `/media/mdGEOR3108.jpg` | 200 | image/jpeg | noindex, nofollow | ok | n/a | ok |
| robots | `/robots.txt` | 200 | text/plain | noindex, nofollow | ok | n/a | ok |

### robots.txt

- `User-Agent: *` line: yes
- a line that is exactly `Disallow: /` in that group: yes
- an `Allow: /` line: none

```text
User-Agent: *
Disallow: /
```

### Legacy path rows: loop guard

| From | Expected | Chain | Hops | Result |
| --- | --- | --- | --- | --- |
| `/index.html` | `/` | /index.html (308) -> / (200) | 1 | ok |
| `/events/party-dance` | `/events/sunset-by-the-pool` | /events/party-dance (308) -> /events/sunset-by-the-pool (200) | 1 | ok |
| `/venues/villa-aetos` | `/venues` | /venues/villa-aetos (308) -> /venues (200) | 1 | ok |

## preview

Build served: Aegean light build (<html data-ground="light">).

Probe photograph: `/media/mdGEOR3108.jpg` (og:image of the home page).

| Probe | Path | Status | Content-Type | X-Robots-Tag | noindex | `<html data-ground>` | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| home | `/` | 200 | text/html | noindex, nofollow | ok | light | ok |
| venues | `/venues/thalasses` | 200 | text/html | noindex, nofollow | ok | light | ok |
| events | `/events/sunset-by-the-pool` | 200 | text/html | noindex, nofollow | ok | light | ok |
| services | `/services` | 200 | text/html | noindex, nofollow | ok | light | ok |
| wedding-guide | `/wedding-guide` | 200 | text/html | noindex, nofollow | ok | light | ok |
| about | `/about` | 200 | text/html | noindex, nofollow | ok | light | ok |
| contact | `/contact` | 200 | text/html | noindex, nofollow | ok | light | ok |
| services-modal | `/services?modal` | 200 | text/html | noindex, nofollow | ok | light | ok |
| sitemap | `/sitemap.xml` | 200 | application/xml | noindex, nofollow | ok | n/a | ok |
| not-found | `/seal-matrix-no-such-page` | 404 | text/html | noindex, nofollow | ok | light | ok |
| next-image | `/_next/image?url=%2Fmedia%2FmdGEOR3108.jpg&w=640&q=75` | 200 | image/jpeg | noindex, nofollow | ok | n/a | ok |
| media | `/media/mdGEOR3108.jpg` | 200 | image/jpeg | noindex, nofollow | ok | n/a | ok |
| robots | `/robots.txt` | 200 | text/plain | noindex, nofollow | ok | n/a | ok |

### robots.txt

- `User-Agent: *` line: yes
- a line that is exactly `Disallow: /` in that group: yes
- an `Allow: /` line: none

```text
User-Agent: *
Disallow: /
```

### Legacy path rows: loop guard

| From | Expected | Chain | Hops | Result |
| --- | --- | --- | --- | --- |
| `/index.html` | `/` | /index.html (308) -> / (200) | 1 | ok |
| `/events/party-dance` | `/events/sunset-by-the-pool` | /events/party-dance (308) -> /events/sunset-by-the-pool (200) | 1 | ok |
| `/venues/villa-aetos` | `/venues` | /venues/villa-aetos (308) -> /venues (200) | 1 | ok |

## Not asserted

- /services?modal on a pre-Aegean build (the alias until the merge): main still carries the rule that redirects it to itself, so its answer is recorded, not asserted. On the Aegean build it must answer 200.

## Failures

None.

Regenerate with `node scripts/seal-matrix.mjs` (and `SEAL_PREVIEW` for the branch preview).
