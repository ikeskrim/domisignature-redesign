# DNS state before the cutover — domisignature.com

Captured 2026-08-20 from Google Public DNS (8.8.8.8), not from a local resolver.

**This table is the rollback plan.** If the launch has to be undone, restoring
the two web records below returns the site to the old host. Nothing else in this
table should ever be touched.

## Every record

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| `A` | `domisignature.com` | **`31.22.115.30`** | 3600 |
| `A` | `www.domisignature.com` | **`31.22.115.30`** | 3600 |
| `A` | `mail.domisignature.com` | `31.22.115.30` | 3600 |
| `CNAME` | `ftp.domisignature.com` | `domisignature.com` | 3600 |
| `CNAME` | `webmail.domisignature.com` | `domisignature.com` | 3600 |
| `MX` | `domisignature.com` | `10 mail.domisignature.com` | 3600 |
| `TXT` | `domisignature.com` | `v=spf1 a mx -all` | 3600 |
| `NS` | `domisignature.com` | `ns17.aspx.gr`, `ns18.aspx.gr` | 3600 |
| `SOA` | `domisignature.com` | primary `ns17.aspx.gr` | 3600 |
| `AAAA` | — | none | — |
| `CAA` | — | **none** | — |

The old host is `Microsoft-IIS/10.0` running `OrchardCore, ASP.NET`, per the
archived response headers in `old-site/`.

## What the cutover changes

**Two records only.**

| Record | Before | After |
| --- | --- | --- |
| `A` `@` | `31.22.115.30` | Vercel's value |
| `www` | `A → 31.22.115.30` | Vercel's value (`CNAME`) |

Everything else in the table above stays exactly as it is.

## Four things this snapshot changed about the plan

**1. Email is NOT on Gmail.** The runbook said it was; that was an inference
from the published contact address and it was wrong. The domain has its own
`MX` pointing at `mail.domisignature.com`, which has **its own `A` record** at
`31.22.115.30`. Because `mail` is an independent `A` record rather than a
`CNAME` to the apex, changing the apex does not move it — **mail delivery
survives the cutover untouched.** But the reason it survives is that fact, not
the assumption in the runbook, and if `mail` had been a `CNAME` to the apex this
launch would have taken the owner's email down with it.

**2. `webmail` and `ftp` are `CNAME`s to the apex — they WILL follow it.**
`webmail.domisignature.com` and `ftp.domisignature.com` both resolve through
`domisignature.com`, so the moment the apex points at Vercel, both point at
Vercel and stop working. Vercel will serve the site (or a 404) at those names
instead of the old host's webmail and FTP.

This does not affect email *delivery* — that is `MX` → `mail`, which is
unaffected — but it does affect reading mail in a browser at
`webmail.domisignature.com`, and any FTP client using `ftp.domisignature.com`.

**The fix is one extra record, and it is the owner's call:** before the cutover,
change `webmail` and `ftp` from `CNAME → domisignature.com` to `A →
31.22.115.30`. That pins them to the old host explicitly, which is where they
already point today, so nothing changes for anyone — it only stops them
following the apex when the apex moves. If the owner never uses webmail or FTP,
this can be skipped and the names simply stop resolving usefully.

**3. SPF survives, but only because of one word.** The record is
`v=spf1 a mx -all`. The `a` mechanism authorises whatever IP the **apex** points
at — after the cutover that becomes a Vercel IP, which never sends this domain's
mail. The `mx` mechanism authorises the `MX` host's IP, which remains
`31.22.115.30`. So outbound mail stays authorised **through `mx`**, and the `a`
mechanism quietly becomes meaningless rather than harmful. Nothing needs
changing. It is worth knowing that if the record had been `v=spf1 a -all`, the
cutover would have broken outbound email authentication.

**4. TTL is 3600 everywhere, and DNS is at aspx.gr, not the registrar.**
Rollback takes up to an hour at this TTL. The runbook's "lower the TTL to 300
first, then wait an hour" step is what turns that into five minutes, and at 3600
the wait before cutting over is one hour, not a day. The nameservers are
`ns17/ns18.aspx.gr`, so the records are managed wherever that account lives —
which may not be the same login as the domain registrar.

## Rollback, verbatim

Restore these two records at the DNS host:

```
A      @      31.22.115.30
A      www    31.22.115.30
```

Change nothing else. With the TTL at 300 this takes about five minutes; at the
original 3600 it takes up to an hour.

Leave the old hosting account active and paid for at least a month — it is the
thing being rolled back to.
