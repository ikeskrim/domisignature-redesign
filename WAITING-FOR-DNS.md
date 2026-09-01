# Waiting for DNS

The launch is prepared, verified and paused at exactly one step: the DNS records
at aspx.gr. The six-hour watch window elapsed with `domisignature.com` still
resolving to `31.22.115.30` (Microsoft-IIS/10.0, the old host), so this run
stopped cleanly as briefed.

**Nothing is half-done.** No deployment was promoted by accident, no DNS record
was touched by anyone, and the old site is still serving normally. The new site
is live and healthy on Vercel, sealed against search engines, waiting for the
domain to be pointed at it.

---

## Rollback — before anything, and always

If the records are entered and something goes wrong, restore these two lines and
the old site returns:

```
A      @      31.22.115.30
A      www    31.22.115.30
```

Nothing else is ever needed. Keep the old hosting account paid for at least a
month after the switch.

---

## The one remaining action

At **aspx.gr** (nameservers `ns17.aspx.gr` / `ns18.aspx.gr`). Five lines change.

```
# ── CHANGE THESE ────────────────────────────────────────────────
A       @         216.198.79.1                            TTL 300
A       @         64.29.17.1                              TTL 300
CNAME   www       6994f780d349dc94.vercel-dns-017.com.    TTL 300
A       webmail   31.22.115.30                            TTL 300
A       ftp       31.22.115.30                            TTL 300

# ── DO NOT TOUCH ────────────────────────────────────────────────
MX      @         10 mail.domisignature.com
TXT     @         v=spf1 a mx -all
A       mail      31.22.115.30
NS      @         ns17.aspx.gr
NS      @         ns18.aspx.gr
```

Three things that will otherwise bite:

1. **Delete the existing `A www` first.** Most panels refuse a `CNAME` on a name
   that already has an `A` record.
2. **Both apex `A` records**, read from Vercel's API during this session. They
   are *not* the `76.76.21.21` an older draft of the runbook documented. If the
   panel accepts only one apex `A`, Vercel's documented fallback is
   `76.76.21.21` alone.
3. **`webmail` and `ftp` are the reason for lines 4 and 5.** They are currently
   `CNAME`s to the apex, so without pinning they would follow it to Vercel and
   stop working. These lines point them where they already resolve today, so
   nothing changes for anyone.

If the panel will not let you set TTL, enter the records anyway. Rollback then
takes up to an hour instead of five minutes; it is not worth delaying for.

---

## What is already done and verified

**Vercel** — done by CLI, not by dashboard clicks:

| | |
| --- | --- |
| `domisignature.com` | added, **verified**, attached to the project |
| `www.domisignature.com` | added, attached |
| Production Branch | `main` — proven, not assumed: a push produced `target: production` |
| Production deployment | **Ready**, rebuilt automatically on every push |
| `www → apex` redirect | 308, in `src/middleware.ts`, asserted by test |
| Host seal | the `vercel.app` alias serves `Disallow: /` and `X-Robots-Tag: noindex` |

**Pre-flight** — all committed under `design-review/launch/`:

- `old-site/` — the old site's served HTML and response headers, archived before
  any change. It has no `robots.txt` and no `sitemap.xml`, and `/index.html`
  404s. Served by Microsoft-IIS/10.0 on OrchardCore.
- `dns-before.md` — every DNS record, from a public resolver. The rollback plan.
- `dns-cutover.md` — the block above, with the reasoning per line.
- `first-week.md` — the watch list, Firefox first.

**Gate:** 11/11 green. **Launch rehearsal:** 46/46 including all 21 legacy
redirect rows and the new `www → apex` assertion. **Privacy gate:** 15/15
withheld paths absent from the remote tree. **CI:** green on HEAD.

---

## What happens when the records are entered

```bash
npm run watch:dns      # polls the apex, exits when the site answers
npm run verify:launch  # the whole live-domain battery
```

`verify:launch` checks indexability from outside (including that the
`vercel.app` alias stays sealed), re-executes the complete legacy redirect map
against the live domain, and crawls every route for dead assets, mixed content
and TLS validity. It exits non-zero and prints the rollback line if anything
fails, so it is safe to run unattended or on a schedule.

Then, from `first-week.md`: the five-minute Firefox pass on the live domain, the
sixty-second phone check of the two third-party iframes, and Search Console —
**add** a `TXT` record for verification, never edit the existing SPF one.

---

## Two findings from this session worth keeping

**The runbook was wrong about email, and I only found out by checking.** It said
the domain's mail was on Gmail — an inference from the published contact address.
The domain runs its own mail. Delivery survives the cutover because `mail` is an
independent `A` record rather than a `CNAME` to the apex, which is a fact, not a
guess. Had it been a `CNAME`, this launch would have taken the owner's email down
with it.

**SPF survives on one word.** The record is `v=spf1 a mx -all`. After the cutover
the `a` mechanism authorises a Vercel IP that never sends this domain's mail; the
`mx` mechanism still authorises the real mail server. Had the record been
`v=spf1 a -all`, outbound mail authentication would have broken at the moment of
the switch.
