# Session report — The Launch Session

**QUEUE COMPLETE — stopped cleanly at the DNS boundary.**

Every section that does not require the registrar is finished, verified and
pushed. The six-hour watch window elapsed with the apex unchanged, so this run
stopped as briefed. See [`WAITING-FOR-DNS.md`](WAITING-FOR-DNS.md) for the one
remaining action and everything that resumes automatically once it is taken.

The watch ran its full window. `domisignature.com` still resolves to
`31.22.115.30` and is still served by Microsoft-IIS/10.0, so §3 and §4 are
deferred rather than unfinished — both are armed and run on one command the
moment the records change.

**Rollback, always available:** at aspx.gr restore `A @ 31.22.115.30` and
`A www 31.22.115.30`. Nothing else. Keep the old hosting paid for a month.

Detail: [`design-review/launch/`](design-review/launch/).

---

## Queue

| § | Task | Status |
| --- | --- | --- |
| 0 | Preconditions — decisions recorded, tree clean, CI green, audits green, privacy gate vs remote tree, alias sealed, runbook read | **DONE** |
| 1.1 | Archive the live old site — served HTML and response headers | **DONE** |
| 1.2 | Record every existing DNS record; publish the rollback table | **DONE** |
| 1.3 | Re-run the full launch rehearsal and redirect map locally | **DONE** — 46/46, gate 11/11 |
| 1.4 | Fresh preview deploy | **DONE** |
| 2A | Firefox gate | **WAIVED by the owner** — moved to item 1 of the first-24-hours watch |
| 2B | Vercel side — production branch, both domains, www→apex, production deploy | **DONE by CLI** |
| 2B | Registrar entry at aspx.gr | **NOT DONE — the owner's hands only** |
| 3 | Post-cutover battery against the live domain | **DEFERRED** — armed as `npm run verify:launch`; the six-hour window elapsed with no DNS change |
| 4 | `LAUNCH-REPORT.md` | **DEFERRED on §3** — superseded for now by `WAITING-FOR-DNS.md` |

## What is done and verified

**Vercel**, by CLI rather than dashboard clicks:

- `domisignature.com` added, **verified**, attached to the project.
- `www.domisignature.com` added and attached.
- Production Branch is `main` — proven, not assumed: a push produced a
  deployment with `target: production`.
- Production deployments build automatically from every push and reach `Ready`.
- `www → apex` is a 308 in `src/middleware.ts`, in the repository where it is
  reviewable and asserted by a test, rather than a dashboard setting that drifts.
- The `vercel.app` alias remains host-sealed: `Disallow: /` and
  `X-Robots-Tag: noindex`.

**Pre-flight snapshots:**

- `design-review/launch/old-site/` — the old site's HTML and headers. It has no
  `robots.txt` and no `sitemap.xml`, and `/index.html` 404s. Served by
  Microsoft-IIS/10.0 on OrchardCore.
- `design-review/launch/dns-before.md` — every record, from a public resolver.
  This is the rollback plan.
- `design-review/launch/dns-cutover.md` — the single copy-paste block for the
  registrar.
- `design-review/launch/first-week.md` — the watch list, Firefox first.

**Four DNS findings that changed the plan**, none of which were in anyone's head
before this session:

1. Email is **not** on Gmail — the runbook said it was, from an inference, and
   was wrong. The domain runs its own mail. Delivery survives the cutover
   because `mail` is an independent `A` record, a fact I checked.
2. `webmail` and `ftp` are `CNAME`s to the apex and would have followed it to
   Vercel. Two extra `A` records pin them where they already point.
3. SPF survives on its `mx` mechanism alone. Had the record been
   `v=spf1 a -all`, this launch would have broken outbound mail.
4. Vercel's current apex IPs are `216.198.79.1` and `64.29.17.1` — not the
   `76.76.21.21` the runbook documented months ago.

**Two bugs in my own launch tooling**, both found by dry-running it against the
pre-cutover domain instead of assuming it worked:

1. The sentinel matched `"Rethymno"`, which appears in **both** sites — same
   business, same town. It would have declared the cutover complete the moment
   DNS moved, before the new site served a byte. Now it requires an
   `x-vercel-id` header and `/venues` returning 200.
2. Every `process.exit()` tripped a libuv assertion on Windows and killed the
   process with code **127 after printing correctly** — which is what killed two
   background watchers, looking exactly like a missing command.

## Tooling added this session

| Command | What it does |
| --- | --- |
| `npm run verify:launch` | The whole live-domain battery — indexability from outside, all 21 legacy redirects, full crawl, TLS, mixed content, iframes. Re-runnable daily. |
| `npm run watch:dns` | Polls the apex in re-armable chunks with a cumulative six-hour timer in a state file. |
| `node scripts/archive-old-site.mjs` | The pre-cutover archive. |
| `LH_NAME=…` | Lets a production Lighthouse run write beside, not over, the local-build baseline. |

## The one remaining action

At **aspx.gr** — five lines change, everything else untouched. The exact block is
in [`dns-cutover.md`](design-review/launch/dns-cutover.md).

```
A       @         216.198.79.1                            TTL 300
A       @         64.29.17.1                              TTL 300
CNAME   www       6994f780d349dc94.vercel-dns-017.com.    TTL 300
A       webmail   31.22.115.30                            TTL 300
A       ftp       31.22.115.30                            TTL 300
```

`MX`, `TXT`/SPF, `NS` and `mail` are touched by no one.
