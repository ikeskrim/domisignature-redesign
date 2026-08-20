# Launch runbook — pointing domisignature.com at the new site

Everything needed to take this live, written so it can be followed by someone
who did not build it.

**Nothing in this document has been executed.** No deployment has been promoted
to production, no domain has been added, and no DNS record has been touched.
The site has only ever been deployed as a preview, and previews are `noindex` in
both the platform and the application. Promotion is the owner's decision and the
owner's action.

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
stays a preview — which is the current, intentional state.

## 2. Pre-flight — before the domain, not after

Run against the real production build, because the environment flips are decided
at **build** time, not at request time. A preview build serves `noindex` from a
production URL, and no amount of checking afterwards will undo a day of Google
seeing that.

```bash
npm run launch:check
```

That builds with `VERCEL=1 VERCEL_ENV=production`, starts the server, and asserts
42 things: `robots.txt` allows crawling and declares the sitemap and host; all 17
pages carry `index, follow`; every canonical is absolute and matches its own
path; every `og:image` and `twitter:image` is an absolute URL that resolves;
every sitemap URL returns 200; the study and direction routes are still
`noindex`; and every legacy URL and fragment from the old site lands where
`design-review/redirect-map.md` says it does.

Then the standing quality gate:

```bash
npm run qa
```

Both must be green. If either is not, stop — do not point the domain at a build
that fails its own checks.

## 3. Deploy to production

```bash
npx vercel deploy --prod
```

Or promote the latest preview from the Vercel dashboard. Either way, open the
`*.vercel.app` production URL and confirm before touching DNS:

- the hero film plays,
- `/robots.txt` says `Allow: /` and names the sitemap,
- `/sitemap.xml` lists 17 URLs,
- view-source on any page shows `<meta name="robots" content="index, follow">`.

That last one is the whole ballgame. If it still says `noindex`, the deploy is
not a production deploy — check the production branch setting in step 1 and
redeploy. **Do not proceed to DNS until it reads `index, follow`.**

## 4. Add the domain in Vercel

**Vercel → Project → Settings → Domains → Add**

Add `domisignature.com`. Vercel will offer to also add `www.domisignature.com`
redirecting to the apex — accept it. Then add nothing else; extra domains are
extra things to get wrong.

Vercel now shows the exact DNS records to create. **Use the values Vercel shows
you, not the values below.** These are correct at the time of writing and are
here so you know what to expect, but Vercel's published IPs have changed before
and the dashboard is the authority:

| Type | Name | Value |
| --- | --- | --- |
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

## 5. Change DNS

**Lower the TTL first.** At your DNS host, set the TTL on the existing `A` and
`www` records to 300 seconds and save. Wait for the *old* TTL to expire — if it
was 24 hours, that is a day. This is the step that makes rollback take five
minutes instead of a day, and it is the step everyone skips.

Then, on launch day:

1. Replace the apex `A` record with Vercel's value.
2. Replace or create the `www` `CNAME` with Vercel's value.
3. Leave **everything else alone.** In particular do not touch `MX`, `TXT`
   (SPF/DKIM/verification), or `CAA` records. Deleting an `MX` record is how a
   website launch turns into a business losing its email.

   An earlier draft of this document claimed the domain's mail was on Gmail and
   therefore unaffected. That was an inference from the published contact
   address and it was **wrong**. The domain runs its own mail: `MX` points at
   `mail.domisignature.com`, which has its own `A` record on the old host. Mail
   delivery survives this cutover because `mail` is an independent `A` record
   and not a `CNAME` to the apex — a fact, not an assumption. The full verified
   picture, including two subdomains that *do* follow the apex, is in
   [`design-review/launch/dns-before.md`](design-review/launch/dns-before.md).
   Read it before changing anything.
4. Save, and wait. Propagation is usually minutes with a low TTL. Vercel issues
   the TLS certificate automatically once it sees the records; the domain shows
   "Invalid Configuration" until then, which is normal and not an error.

Check from outside your own network — your machine caches DNS and will lie to
you:

```bash
dig +short domisignature.com A
```

## 6. Confirm the switch

Once `https://domisignature.com` serves the new site:

```bash
SHOTS_BASE=https://domisignature.com node scripts/launch-check.mjs
```

Every check should pass against the live domain, including all 21 legacy
redirects. If the fragment rows fail here but passed locally, the site is being
served from cache — wait, then re-run.

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
   `www` record. Write those two values down **before** step 5 — a screenshot of
   the DNS panel before you change anything is the cheapest insurance in this
   document.
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
