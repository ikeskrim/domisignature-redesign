# The DNS cutover — authoritative record list for aspx.gr

Everything on the Vercel side is done and verified. This is the one act that
needs the owner's hands.

Nameservers are `ns17.aspx.gr` / `ns18.aspx.gr`, so these records are edited
wherever that account lives.

---

## Rollback, first — before you change anything

```
A      @        31.22.115.30
A      www      31.22.115.30
```

Those two lines restore the old site. Nothing else is ever needed. Keep the old
hosting account paid for at least a month.

---

## The complete final state

Five lines change. Everything below the divider is untouched.

```
# ── CHANGE THESE ────────────────────────────────────────────────
A       @         216.198.79.1        TTL 300
A       @         64.29.17.1          TTL 300
CNAME   www       6994f780d349dc94.vercel-dns-017.com.   TTL 300
A       webmail   31.22.115.30        TTL 300
A       ftp       31.22.115.30        TTL 300

# ── DO NOT TOUCH ────────────────────────────────────────────────
MX      @         10 mail.domisignature.com
TXT     @         v=spf1 a mx -all
A       mail      31.22.115.30
NS      @         ns17.aspx.gr
NS      @         ns18.aspx.gr
```

---

## What each line is doing

**The two apex `A` records** are Vercel's, read from `vercel domains verify`
today. They replace the single `A @ 31.22.115.30`. Two addresses, not one, for
redundancy — enter both. If the panel only accepts a single apex `A`, Vercel's
documented fallback is `76.76.21.21` on its own.

**The `www` `CNAME`** replaces the existing `A www 31.22.115.30`. Delete the `A`
first: most panels refuse a `CNAME` on a name that already has an `A`. The value
is the project-specific one Vercel issued; `cname.vercel-dns.com.` also works if
the panel rejects the long form. `www` then redirects to the apex — that
redirect lives in the site's own code, not in a dashboard setting.

**`webmail` and `ftp` become `A` records** pointing where they already resolve
today. They are currently `CNAME`s to the apex, so without this they would
follow the apex to Vercel and stop working. Pinning them changes nothing for
anyone — it only stops them moving.

**The `TTL 300`** makes rollback take about five minutes instead of an hour. If
the panel will not let you set TTL, everything still works; rollback just takes
up to an hour. Do not wait on this.

**`MX`, `TXT`/SPF, `NS` and `mail` are untouched by anyone.** Mail delivery
rides on `MX → mail.domisignature.com`, which has its own `A` record and does not
follow the apex. SPF stays valid through its `mx` mechanism.

---

## What happens after you save

Vercel sees the records, issues a TLS certificate automatically, and the domain
stops showing "Invalid Configuration". That usually takes minutes. Until the
certificate is issued the domain may briefly show a TLS warning — normal, and
not a reason to roll back.

Everything after that is automated: propagation and TLS are polled, then the
full post-cutover battery runs against the live domain.
