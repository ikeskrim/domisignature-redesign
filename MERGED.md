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

## Rollback is git

The owner's decision, 2026-09-19: **rollback lives in git**, and nothing serving
pre-strip media stays reachable. `61pms10qu` — the last production deployment of
the old `main` (`1757bbe`), and the last place still serving photographs with GPS
and camera serials — was deleted with the CLI that day, after the alias was
confirmed to point at the new production build (`1co1gmsat`). It answers 404, and
the alias still serves the Aegean light build. One production deployment remains,
and every live deployment now serves stripped media.

So the way back is to rebuild, not to promote:

1. `1757bbe` is still in the repository, and so is every commit before it. Check
   one out, and Vercel builds it like any other.
2. To put it back on `main`: one snapshot of that tree on top of the current tip,
   built the way this merge was built. The guard allows that shape, and only that
   shape; it never allows a force-push, and it never allows history to be rewritten
   to hide what shipped.

The trade the owner took: no instant promote-back, in exchange for no reachable
copy of the unstripped photographs.

## What is still open

- **The security headers**, in the owner's order (2026-09-19): the static set
  first, as its own commit on `main`; then the Content Security Policy in
  Report-Only, with the harness proving zero violations on the alias; HSTS without
  `includeSubDomains` while `webmail`, `ftp` and `mail` resolve to the old host.
  Enforcing the policy waits for the owner's word, after a week of clean reports.
- **Next 16** is open on branch `next16` (`design-review/NEXT16.md`): it builds on
  Turbopack, the gate is 20 of 21 and `npm audit --omit=dev` reports 0
  vulnerabilities. The red is 13 React Hooks findings in the motion and hydration
  layer, kept for a dedicated session with the gate, the hero states and INP behind
  each, before 15.x support ends on 21 October 2026.
- **A figures audit** is in the gate since 2026-09-19 (`npm run audit:figures`, the
  twenty-first check): no number the site renders is typed into a component.
- **The history rewrite** (earlier `origin/aegean` snapshots still carry pre-strip
  files) is deferred until the repository is private — the owner's.
- **Deployment Protection** is the owner's.

The report the merge rested on is `design-review/MERGE-REPORT.md`; the stage log is
`design-review/INVERSION-PLAN.md`; where the work stands is
`design-review/HANDOFF-AEGEAN.md`.
