# Launch runbook — pointing domisignature.com at the new site

Everything needed to take this live, written so it can be followed by someone
who did not build it.

**Where this stands.** Steps 1 and 4 have been done on the Vercel side, and
production builds from `main`. `WAITING-FOR-DNS.md` records exactly what is done
and verified, and it is the authority on the DNS records. No DNS record has been
touched: the domain still resolves to the old host. Every address other than
`domisignature.com` is sealed from search engines by `src/middleware.ts`.
Pointing the domain at the new site is the owner's decision and the owner's
action.

**Time:** about 30 minutes of work, then up to a few hours of waiting for DNS.
**Reversible:** yes, in minutes — see [Rollback](#rollback). Do the TTL step first
and it stays that cheap.

---

## 0. Before you start

| | |
| --- | --- |
| Vercel project | `domisignature-redesign` (`prj_X56Pyj9JDl6efCC7oVHp3yaAqFuG`) |
| Repository | https://github.com/ikeskrim/domisignature-redesign |
| Target domain | `domisignature.com` and `www.domisignature.com` |
| Environment variables required | **none** |

You need: the Vercel account that owns the project, and login to whoever holds
DNS for `domisignature.com` — the registrar, or Cloudflare/other DNS host if it
has been delegated. Find out which **before** launch day; discovering that the
nameservers point somewhere nobody has the password for is the single most
common way this goes wrong.

### Environment variables

The site needs none. It reads no secrets, calls no APIs and holds no keys. This
is deliberate and worth protecting: the enquiry form is a Monday.com embed, so
there is no credential in this system to leak or rotate.

If the native form in `/study/enquiry` is ever adopted, that changes. It would
need a delivery key — a mail provider, or Monday's API — and that key goes in
**Vercel → Settings → Environment Variables**, scoped to Production, and never
in the repository. The repository is public.

`VERCEL_ENV` is set by Vercel itself. Do not create it by hand: the site reads
it to decide whether it may be indexed, and a hand-set value on a preview would
invite Google into a staging site.

---

## 1. Set the production branch

**Vercel → Project → Settings → Git → Production Branch**

Set it to `main`. This is the branch the public repository publishes to.

Until this is set, "Production" has no meaning for the project and every deploy
stays a preview. It is set: `WAITING-FOR-DNS.md` records `main`, proven by a
push that produced a production deployment.

## 2. Pre-flight — before the domain, not after

Run against the real production build, because the environment flips are decided
at **build** time, not at request time. A preview build serves `noindex` from a
production URL, and no amount of checking afterwards will undo a day of Google
seeing that.

```bash
VERCEL=1 VERCEL_ENV=production npm run build
npm run qa
```

The first line makes a production build, the way CI does. `npm run qa` then
serves that build itself on 127.0.0.1 and runs the standing quality gate. Its
launch check (`scripts/launch-check.mjs`) asserts 46 things: `robots.txt` allows
crawling and declares the sitemap and host; all 17 pages carry `index, follow`;
every canonical is absolute and matches its own path; every `og:image` and
`twitter:image` is an absolute URL that resolves; every sitemap URL returns 200;
the study and direction routes are still `noindex`; a non-canonical host is
sealed and `www` redirects to the apex; and every legacy URL and fragment from
the old site lands where `design-review/redirect-map.md` says it does. Run on
its own, `npm run launch:check` builds nothing and starts no server: it measures
a build that is already serving.

The gate must be green. If it is not, stop — do not point the domain at a build
that fails its own checks.

## 3. Deploy to production

Production builds from git: with the production branch set to `main`, every
push to `main` builds a production deployment (`WAITING-FOR-DNS.md` records it
Ready). You can also promote a git-built preview from the Vercel dashboard.
Deploy from git only, never with `npx vercel deploy --prod` from a local folder:
a local working copy holds ignored raw camera masters that must never be
published, and `.vercelignore` does not list them
(`design-review/BRIEF-AUDIT.md` §3). Either way, open the `*.vercel.app`
production URL and confirm before touching DNS:

- the hero film plays,
- `/sitemap.xml` lists 17 URLs,
- view-source on any page shows `<meta name="robots" content="index, follow">`.

That last one is the whole ballgame. If it still says `noindex`, the deploy is
not a production deploy — check the production branch setting in step 1 and
redeploy. **Do not proceed to DNS until it reads `index, follow`.**

On this address `/robots.txt` says `Disallow: /` and every page carries
`X-Robots-Tag: noindex`, even on a correct production build. That is the host
seal in `src/middleware.ts`, not a fault: only `domisignature.com` is served the
permissive `robots.txt`, and step 6 checks it there.

## 4. Add the domain in Vercel

**Vercel → Project → Settings → Domains → Add**

Done: `WAITING-FOR-DNS.md` records `domisignature.com` added, verified and
attached, and `www.domisignature.com` added and attached. If it is ever redone,
add those two and nothing else; extra domains are extra things to get wrong.
The `www` → apex redirect is a 308 served by the site's own code
(`src/middleware.ts`) and tested by the launch check, so it does not depend on a
dashboard redirect setting; that setting is the owner's.

The records to create were read from Vercel's API for this project and are
written out in `WAITING-FOR-DNS.md`, which is the authority. An older draft of
this table gave a single `A @ 76.76.21.21` and `CNAME www cname.vercel-dns.com`;
those were generic values, not the records Vercel issued for this project:

| Type | Name | Value |
| --- | --- | --- |
| `A` | `@` | `216.198.79.1` |
| `A` | `@` | `64.29.17.1` |
| `CNAME` | `www` | `6994f780d349dc94.vercel-dns-017.com.` |
| `A` | `webmail` | `31.22.115.30` |
| `A` | `ftp` | `31.22.115.30` |

If the panel accepts only one apex `A`, Vercel's documented fallback is
`76.76.21.21` alone; if it rejects the long `www` value, `cname.vercel-dns.com.`
also works (`design-review/launch/dns-cutover.md`).

## 5. Change DNS

**Lower the TTL first.** At your DNS host (aspx.gr, nameservers `ns17.aspx.gr`
/ `ns18.aspx.gr`), set the TTL on the existing `A` and `www` records to 300
seconds and save. Wait for the *old* TTL to expire — it is 3600 seconds today
(`design-review/launch/dns-before.md`), so that is an hour. This is the step
that makes rollback take five minutes instead of an hour, and it is the step
everyone skips. Enter the new records with TTL 300 as well. If the panel will
not let you set TTL, enter the records anyway; rollback then takes up to an
hour, which is not worth delaying the launch for.

Then, on launch day:

1. Replace the apex `A` record with Vercel's two `A` records.
2. Delete the existing `A www` record first — most panels refuse a `CNAME` on a
   name that already has an `A` — then create the `www` `CNAME`.
3. Change `webmail` and `ftp` from `CNAME`s to the apex into `A` records
   pointing at `31.22.115.30`, where they already resolve. Without this they
   follow the apex to Vercel and stop working.
4. Leave **everything else alone.** In particular do not touch `MX`, `TXT`
   (SPF/DKIM/verification), `NS`, the `mail` `A` record, or `CAA` records.
   Deleting an `MX` record is how a website launch turns into a business losing
   its email.

   An earlier draft of this document claimed the domain's mail was on Gmail and
   therefore unaffected. That was an inference from the published contact
   address and it was **wrong**. The domain runs its own mail: `MX` points at
   `mail.domisignature.com`, which has its own `A` record on the old host. Mail
   delivery survives this cutover because `mail` is an independent `A` record
   and not a `CNAME` to the apex — a fact, not an assumption. The full verified
   picture, including two subdomains that *do* follow the apex, is in
   [`design-review/launch/dns-before.md`](design-review/launch/dns-before.md).
   Read it before changing anything.
5. Save, and wait. Propagation is usually minutes with a low TTL. Vercel issues
   the TLS certificate automatically once it sees the records; the domain shows
   "Invalid Configuration" until then, which is normal and not an error.

Check from outside your own network — your machine caches DNS and will lie to
you:

```bash
dig +short domisignature.com A
```

## 6. Confirm the switch

Once the records are saved:

```bash
npm run watch:dns      # polls the apex; exits 0 when the new site answers, 3 to be re-run
npm run verify:launch  # the whole live-domain battery
```

`verify:launch` checks indexability from outside (including that the
`vercel.app` alias stays sealed), re-executes the legacy redirect map against the
live domain, and crawls every route for dead assets, mixed content and TLS
validity. Every check should pass; if anything fails it exits non-zero and
prints the rollback line. If the fragment rows fail here but passed locally, the
site is being served from cache — wait, then re-run.

Do not point `scripts/launch-check.mjs` at the live domain. It is the local
rehearsal: its host rows speak plain HTTP to port 80, which Vercel answers with a
redirect to HTTPS rather than the page, so they fail on a healthy site, and it
rewrites `design-review/redirect-map.md` with whatever it saw.

Then by hand, in a browser:

- `https://domisignature.com` — hero film plays, no console errors.
- `https://domisignature.com/#portfolioModal2` — lands on Thalasses.
- `https://domisignature.com/assets/files/Weddingbrochure.pdf` — downloads.
- `https://www.domisignature.com` — redirects to the apex.

---

## 7. After launch

**Immediately**

1. **Google Search Console** → add `domisignature.com` if it is not already
   there, and verify by DNS `TXT` record (the one record you *do* add).
2. **Submit the sitemap:** Search Console → Sitemaps → `sitemap.xml`.
3. **Request indexing** for the homepage via URL Inspection. This is the fastest
   way to get Google to re-crawl and notice the new structure.
4. **Bing Webmaster Tools** — same two steps. Two minutes, and it imports
   straight from Search Console.

**Every day for the first week**

5. **Search Console → Pages → Not indexed.** Watch for `404`s. The old site's
   URLs are all covered by `design-review/redirect-map.md`, so anything showing
   up here is a URL nobody knew about — add a redirect to `next.config.ts` for
   the paths, or to `LegacyAnchorRedirect.tsx` for the fragments.
6. **Vercel → Project → Logs**, filtered to `404`. Same purpose, but it sees
   real visitors immediately rather than waiting for a crawl.
7. **Search Console → Core Web Vitals.** Lab numbers are in
   `design-review/lighthouse.md`; this is the field data from real phones on
   real networks, which is the number that actually counts. Expect it to be
   empty for the first two to three weeks — it needs traffic before it reports.

**In the first month**

8. Watch the queries in Search Console. Rankings usually dip for one to two
   weeks after a restructure and recover past the previous level. Do not react
   to week one.
9. Update the link in the Instagram, Facebook and TikTok bios if any of them
   points at a fragment URL rather than the bare domain.

---

## Rollback

If something is wrong and it cannot be fixed forward in a few minutes, put the
old site back. **DNS is the rollback**, and with the TTL already at 300 seconds
it takes effect in about five minutes.

1. At the DNS host, restore the previous `A` record for `@` and the previous
   `www` record: `A @ 31.22.115.30` and `A www 31.22.115.30`, removing Vercel's
   two apex `A` records and the `www` `CNAME` as you do (`WAITING-FOR-DNS.md`;
   every earlier record is in `design-review/launch/dns-before.md`). Nothing
   else is needed: the `webmail` and `ftp` pins already point at the old host.
   A screenshot of the DNS panel before you change anything is still the
   cheapest insurance in this document.
2. Leave the old hosting account active and paid until the new site has been
   live and healthy for a full month. Cancelling it on launch day removes the
   thing you would roll back to.
3. Removing the domain from Vercel is not necessary and not urgent. Vercel
   serving a domain that no longer points at it is harmless.

For a bad deploy rather than a bad launch, the rollback is smaller and does not
involve DNS: **Vercel → Deployments →** the previous good deployment **→
Promote to Production.** Seconds, no propagation.

---

## What is deliberately not automated

Production promotion and DNS are the two actions in this project that are hard
to reverse and affect something the owner owns rather than something this
repository owns. They stay manual on purpose. Everything up to and including a
fully verified production build is automated and repeatable; the last step is a
person deciding it is time.
