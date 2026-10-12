# Handoff

State of the project as of 2026-10-12. This is the orientation document: what is
done, what is open, why things are the way they are, and what to do next.

It does not replace the law documents. `design-review/HANDOFF-AEGEAN.md` remains
the detailed working record for the Aegean Bone inversion, `QA-TOOLKIT.md`
describes the gate, `WAITING-FOR-DNS.md` governs the launch independently, and
`CLAUDE.md` plus `.claude/skills/aegean-bone/SKILL.md` carry the working laws.
Where this file and a law document disagree, the law document wins.

## Where the branches are

| Ref | Commit | Meaning |
|-----|--------|---------|
| `origin/main` | `bff98d0` | Production. One squashed snapshot per promotion, on the owner's word only. |
| `origin/aegean` | `d3c682f` | The published working branch. One snapshot commit per boundary. |
| local `aegean` | `2561056` | Full local history. **Never pushed as-is** — see "How publishing works". |

`main` has carried the Aegean Bone light inversion since the stage-8 merge
(`0d08790`, 2026-09-18, recorded in `MERGED.md`). Rollback is git: any commit can
be rebuilt. No deployment serving pre-strip media is reachable any more.

## What is done

### The light inversion
Stages 1-8 are closed and merged. Accessibility reached **100 on every route, at
both presets, with no exemptions**. Lighthouse mobile performance: Home 85, Guide
90, Venues / Venue detail / Events 91, Contact 92; desktop 99. The gate is
**22 checks** (`scripts/qa.mjs` is the authoritative list — never hard-code the
count) and was last measured **22/22 green**.

### Post-merge security, complete and proved on the alias
Shipped in two owner-approved commits, each promoted to `main` as its own
snapshot:

- **Static headers** (`main` `4d494c8`). Everywhere: `X-Content-Type-Options:
  nosniff` and `Strict-Transport-Security: max-age=63072000`. Documents only:
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`.
  `poweredByHeader: false`.
- **Content-Security-Policy, Report-Only** (`main` `c458641`). It reports and
  blocks nothing.

Verified by direct measurement on the production alias, not asserted:

| Measurement | Result |
|---|---|
| CSP observe runs on the alias | **124 / 124 clean**, 0 unexpected violations |
| Positive controls fired | **124 / 124** — no run measured nothing |
| Served policy vs `SECURITY.CSP` | exact match; **1** distinct policy across all runs |
| Enforcing `Content-Security-Policy` | **absent** everywhere (deliberate) |
| HSTS on the alias | `max-age=63072000` — **no** `includeSubDomains`, **no** `preload` |
| Embeds under the policy | 24 checks; the Monday form and the maps all load |
| Seal matrix on `main` | **48 / 48, sealed** |

The gate grew two checks for this work: `headers` (the 22nd) asserts the headers
on a *running server* rather than trusting the config, and `figures` (the 21st)
asserts every rendered number derives from `content/`.

## Design decisions, and why

1. **HSTS carries neither `includeSubDomains` nor `preload`.** `webmail`, `ftp`
   and `mail` are independent DNS records still pointing at the old host
   (`WAITING-FOR-DNS.md`). A browser that has seen `includeSubDomains` refuses to
   reach them over plain HTTP, and the preload list is slow to leave. Two years on
   the apex, which is the part this project controls. **Measured:** Vercel's edge
   does *not* append its own `includeSubDomains; preload` on top — our config
   wins. This was verified on the alias, not assumed.

2. **The CSP ships Report-Only first.** Enforcing it is a separate commit on the
   owner's word, after **one week of real visitor reports following the launch** —
   not a synthetic week. The reason is coverage: in-app browsers (Instagram,
   Facebook) and older Safari behave differently from a headless Chromium, and
   they only show up in real traffic.

3. **`'unsafe-inline'` in `script-src` is deliberate and effectively permanent.**
   The App Router streams its RSC payload as inline `self.__next_f.push` scripts
   that differ per route and per build, so they cannot be hashed, and a nonce
   would force every page to render dynamically. `style-src` needs it for
   `next/image` fill positioning and the scrims. The policy is therefore about
   *origins*, not inline code: nothing loads from anywhere but this site and the
   two framed origins.

4. **One source of truth for the header values.** `next.config.ts` exports
   `SECURITY { HSTS_VALUE, DOCUMENTS, FRAME_ORIGINS, CSP }`. Both
   `scripts/headers-audit.mjs` and `scripts/csp-harness.mjs` read it, so the
   config and the checks cannot drift into separate truths.

5. **The CSP harness has two modes.** `CSP_OBSERVE=1` injects nothing and reads
   the header the server actually sends — this is what proves the alias. Injection
   mode (the default) stays for measuring a policy *before* it ships, as stage 7
   did over 248 runs. A run whose positive controls did not fire is a run that
   measured nothing, and the harness **fails** it rather than counting it clean.

6. **`vercel.live` is deliberately not in the policy.** Branch previews always
   request Vercel's feedback script, which `script-src` blocks, so previews report
   one violation on every run. Production serves it only behind a cookie, which is
   why all 124 alias runs are clean. Widening the policy would weaken what
   production ships to buy quiet on previews. Judge the CSP on the alias.

7. **Next's image optimiser sets its own enforcing sandbox CSP** on every
   optimised image (`script-src 'none'; frame-src 'none'; sandbox;`), locally and
   on Vercel alike. It is Next's header, not ours, and it is why the `DOCUMENTS`
   rule excludes `_next/image`. The audit asserts it is **present**, because
   clobbering it would be a real regression.

8. **How publishing works.** Local history contains withheld frames and camera
   masters, so a local branch is never pushed. Each boundary publishes a single
   `git commit-tree` snapshot whose one parent is the previous snapshot and whose
   tree equals local `HEAD`'s. The pre-push guard (`scripts/hooks/pre-push`) is
   fail-closed and enforces that shape plus the privacy checks; `--no-verify` is
   never used. A privacy gate runs before every push: withheld files absent by
   path and by content under any name, no env/key files, no withheld names, no
   secret patterns, metadata audit clean.

9. **The gate never shrinks**, and derived figures stay derived. Imagery is CSS
   over real photographs — grain, wash and emboss are never synthetic pixels, and
   there are no generated people, couples, weddings, venues or events anywhere.

## What is open

### 1. The CI stall — characterised, root cause still unknown
The QA gate intermittently fails exactly `focus`, `paper` and `typeset-clip` on
GitHub Actions. Every failure is a Playwright `page.goto` 60s timeout waiting for
`load` on an `/events` route. The server recovers between checks: `launch`,
`motion-tier` and `focus-motion` pass *after* the failures in the same run, and
`headers` passes in every run.

Record: `main` 3 pass / 4 fail, `aegean` 6 pass / 0 fail. `main` is **green at its
head** (`bff98d0`, 22/22). Two of the compared trees were byte-identical and ran
concurrently — one failed on `main`, one passed on `aegean`.

Eliminated with evidence — **do not re-litigate these**:

| Hypothesis | Why it is dead |
|---|---|
| Actions cache scoping | Keys are `hashFiles('package-lock.json')`, branch-independent. Cache **hit** on both failing `main` runs and the passing `aegean` run. |
| A warm Next image cache on one branch | `qa.yml` caches only `~/.cache/ms-playwright` plus npm. `.next/cache` is never cached. Both branches start cold. |
| Runner image rollout | Image `ubuntu-24.04 / 20260907.300.1` byte-identical across all 12 runs. |
| Concurrency / overlap | 50% of failures and 50% of passes overlapped another run. Two of four failures ran alone. |
| Third-party subresource on `/events` | No iframe, video, external font or external subresource of any kind on that page. |
| AVIF transcoding cost | The "166 optimiser requests" figure was srcset *candidates* — a ~15x overcount. `/events` has 11 `<img>`, of which only **2 are eager**; ~3 encodes block `load`. |
| Branch-dependent code | No `GITHUB_REF` / `VERCEL_GIT` / `refs/heads` logic anywhere in `scripts/`, `next.config.ts` or `src/middleware.ts`. Build env identical. |

What *is* now explained is the **selectivity**: the three failing checks have an
unguarded `page.goto`, while `a11y` wraps its navigation in `try/catch`. The stall
is general; those three are simply the checks that crash on it rather than hiding
it. Fisher one-sided on the branch split gives p ~ 0.049 — borderline, neither
dismissible nor proven.

Owner's constraints on the eventual fix: **not** a raised navigation timeout as
the primary remedy; prefer a shared content-keyed cache created on `main`, or
pre-optimised media so no transcoding happens at gate time; a per-check budget for
`/events` is acceptable only with the cause documented alongside it.

### 2. The `a11y` check cannot fail — enforcement hole
`scripts/a11y.mjs` has exactly one failure path: the `.catch()` for an uncaught
throw. There is **no** non-zero exit when axe finds violations, and
`scripts/qa.mjs` judges purely on exit code. Two consequences:

- Violations do not fail the check. It could print `total violations: 5` and the
  gate would still record `a11y ok`.
- A swallowed navigation timeout scores as clean: the catch records `{error}` with
  no `violations` key, so `r.violations?.length ?? 0` counts the unvisited route
  as **zero**. CI shows this firing — two swallowed a11y timeouts in one run, one
  in another. Axe never scanned those pages.

This contradicts the standing bar (*axe 0 on every route at 390 and 1440*) and the
principle the CSP harness states outright: **not measured is never a pass**.

**Caveat, and it matters:** accessibility was independently confirmed at 100 on
every route, both presets, no exemptions. The hole is in the *enforcement*, not
demonstrably in the outcome. Owner's decision (2026-10-12): **measure first** —
run axe with real enforcement and report the number before changing the gate.

### 3. Next 16 — on the clock
Next 15.x support ends **21 October 2026**. Branch `next16` exists with
`design-review/NEXT16.md`: the five upgrade breaks and their fixes are recorded,
and thirteen lint/hooks findings are characterised but not yet resolved. Each
needs the gate, the hero states and INP behind it. Owner's decision
(2026-10-12): **start this now**, with the stall diagnosis running in parallel.

### 4. Owner-only, not to be touched
Enforcing the CSP; the launch (parked — `WAITING-FOR-DNS.md` governs and keeps
working); production promotion; DNS, domains, the old host, Vercel settings,
repository visibility and credentials; history rewrite; Deployment Protection.
Never delete a production deployment.

## Next steps, in order

1. **Measure axe with real enforcement** on the current build and report the
   violation count and any swallowed-navigation rows. No gate change, no commit,
   until that number has been seen. (Decision 2, above.)
2. **Next 16 on its own branch**, against the 21 October deadline: work the
   thirteen hooks findings, each with the gate, hero states and INP behind it.
3. **Keep diagnosing the stall in parallel.** The search space has collapsed;
   the remaining question is why `next start` stalls on an `/events` navigation
   under CI conditions. Note that any fix must satisfy the constraints above.
4. **Then** the enforcing CSP — after the launch and one week of real visitor
   reports, on the owner's word.

Nothing lands on `main` until the stall is diagnosed, except a fix for it.

## Running things

- `npm run build` — tsc, then Next, then a freshness check.
- `npm run qa` — the gate on that build. `-- --static` for repository-only checks;
  `PORT` sets the port.
- `npm run check:alias` — after every push; must print `sealed.`
- `CSP_OBSERVE=1 SHOTS_BASE=<alias> node scripts/csp-harness.mjs` — prove the
  shipped policy.
- Bind local servers to `127.0.0.1` only. Never kill node processes by image name:
  other sessions share this machine. Check that no verification chain is running
  before binding a port.
