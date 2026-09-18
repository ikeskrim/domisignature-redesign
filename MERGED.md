# Merged

The Aegean Bone light inversion is on `main`.

**Commit `0d08790`** — "Aegean Bone: the light inversion merged into main (stage 8,
owner-approved)", pushed 2026-09-18 on the owner's word. One commit, one parent
(`1757bbe`, the previous `main`), and its tree is exactly the tree stage 8 measured
and the owner approved: `origin/aegean`'s last snapshot, `d1d1bc1`. Local branch
history never left this machine — it holds withheld frames and camera masters —
so the merge is a snapshot, the only shape `scripts/hooks/pre-push` allows for
`main` (and only with `DOMI_OWNER_PUSH_MAIN=1`, which the owner's instruction set).

## What went through the guard

The same checks as every other push, before anything was sent:

- withheld frames absent by path and by content under any name (8 entries, 0 in
  the tree); no `.env`, key or `.vercel` file; no withheld name; no secret
  pattern; the metadata audit clean.
- the `/media` pixel rule, against `main` rather than the branch: **149 modified
  files under `public/`, all 149 metadata-only** — the same pixels, the same ICC
  profile, the same photographer credit, with GPS, camera serials and embedded
  thumbnails gone (the privacy strip of `c40de6c`). Nothing published different
  pixels under an existing name; one file was added.
- ancestry: single parent, no second parent, tree equal to `HEAD`'s.

## Verified after the merge

Vercel rebuilt production from `main` on the push (deployment `1co1gmsat`).

| | |
| --- | --- |
| The alias serves | the Aegean light build (`<html data-ground="light">`) |
| Sealed | `X-Robots-Tag: noindex, nofollow`; `robots.txt` holds `User-Agent: *` and `Disallow: /` |
| Media | post-strip: four sampled `/media` photographs fetched from the alias hash to their stripped blobs, not the originals |
| Seal matrix | **103 checks, 0 failures — sealed** (`npm run audit:seal`, alias and the stage-8 preview) |
| `/services?modal` | 200 on both hosts; the self-redirect that looped on `main` is gone, so the matrix now asserts it there too |
| Legacy redirects | all three path rows land in one hop with a 200, on both hosts |
| CI on `main` | green: install, build and the full twenty-check gate |
| Gate before the push | 20/20 green on the merged tree |

The launch is **still parked**. `WAITING-FOR-DNS.md` governs it and is unchanged:
`domisignature.com` and `www` still resolve to the old host, so the public domain
serves none of this yet. Nothing here touched DNS, domains or Vercel settings.

## Rollback, if it is ever wanted

`main`'s previous commit is `1757bbe` and its production deployment
(`61pms10qu`) is still there — it is the one production deployment stage 8 kept,
and it serves pre-strip media, which is why it is the owner's call whether it
stays. Two ways back, in the owner's hands:

1. Vercel: promote `61pms10qu` again (instant, and production promotion is the
   owner's alone).
2. Git: one snapshot of `1757bbe`'s tree on top of the current tip, built the way
   this merge was built. The guard allows that shape; it never allows a force-push.

## What is still open

- **The old production deployment `61pms10qu`** serves pre-strip media on its own
  URL. Deleting it removes the last rollback target.
- **Next 16** on its own branch before 15.x support ends on 21 October 2026: the
  one advisory left (`next` through its bundled `postcss`). The `wordmark` gate
  check must be taught Turbopack's CSS layout on that branch.
- **A figures audit** joins the gate: no number rendered on the site that does not
  trace to `content/`. The `claims` check never covered figures.
- **The history rewrite** (earlier `origin/aegean` snapshots still carry pre-strip
  files) is deferred until the repository is private — the owner's.
- **Deployment Protection** is the owner's.

The report the merge rested on is `design-review/MERGE-REPORT.md`; the stage log is
`design-review/INVERSION-PLAN.md`; where the work stands is
`design-review/HANDOFF-AEGEAN.md`.
