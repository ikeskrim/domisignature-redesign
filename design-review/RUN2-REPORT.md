# Run 2 — from done to launch-ready

**Preview:** https://domisignature-redesign-9tuc93jyr-domisi.vercel.app

Verified after deploying: 200, target `preview`, `X-Robots-Tag: noindex`, and
its `robots.txt` says `Disallow: /`. Nothing was promoted to production and no
DNS record was touched.

**Repository:** https://github.com/ikeskrim/domisignature-redesign
**CI:** [green, 10/10, 3 min 33 s](https://github.com/ikeskrim/domisignature-redesign/actions/runs/32160316624)
— [`.github/workflows/qa.yml`](../.github/workflows/qa.yml) runs on every push, so
the workflow's latest run is always the authority.

---

## Read this part first

**There was a fully indexable second copy of the site on the internet, and I put
it there.**

`https://domisignature-redesign.vercel.app` returned 200, carried no
`X-Robots-Tag` header, and served `<meta name="robots" content="index, follow">`.
Google could have crawled it and it could have competed with domisignature.com
for its own content — the classic duplicate-content own goal, on a site whose
entire SEO case is that it keeps the old site's ranking.

How it happened: the repository is connected to Vercel and `main` is the
production branch, so **every push to `main` — the ordinary act of publishing
the source — built a *production* deployment.** `VERCEL_ENV` said `production`,
so the app declared itself indexable, exactly as I had designed it to. Vercel
adds `X-Robots-Tag: noindex` to the hashed deployment URLs but **not** to the
project's production alias, so nothing caught it.

The bug was in the predicate, not the plumbing. *"Is this a production
deployment"* is not the question. The question is *"is this the live site"*, and
only the request host can answer that. A build cannot know where it will be
served; a request always knows where it came from.

[`src/middleware.ts`](../src/middleware.ts) now decides by host. Anything that is
not `domisignature.com` gets `X-Robots-Tag: noindex` and a disallow-all
`robots.txt`. Google applies the most restrictive directive when a header and a
meta tag disagree, so it beats the prerendered `index, follow`. Localhost is
exempt so the audits keep measuring what production will actually serve.

**Verified live after the fix:**

```
$ curl -sI https://domisignature-redesign.vercel.app/
X-Robots-Tag: noindex, nofollow

$ curl -s https://domisignature-redesign.vercel.app/robots.txt
User-Agent: *
Disallow: /
```

This is now also a permanent test, and the test is the interesting half: every
check I had ever written asked only for `localhost`, which is precisely why none
of them saw this. `launch-check.mjs` now sends a non-canonical `Host` header
using raw `node:http`, because `fetch` refuses to set `Host` and `Host` is the
entire subject of the test.

**Nothing you need to do.** No domain was ever attached, so no visitor and no
search result was affected in the window it was open. It is sealed. If you want
belt and braces, you can also set the Vercel project's production branch to
something unused until launch — but the code no longer depends on that.

---

## The four decisions, as demonstrations

Each is now a thing you can look at, with numbers. **One word answers each.**

### 1. Enquiry form — Monday embed, or native? → **"embed"** or **"native"**

**Demonstration:** [`/study/enquiry`](https://domisignature-redesign-9tuc93jyr-domisi.vercel.app/study/enquiry)
— both forms side by side, same fields, same order, same ground. `noindex`,
excluded from the sitemap, and not linked from the site.
Captures: [`design-review/study/`](study/) at 1440 and 390, plus the prototype's
validation and success states.

**The prototype is not connected and says so on its face.** Submitting shows a
stub. Nothing is sent anywhere, there is no mail provider and no key.

**The numbers.**

| | Monday embed | Native form |
| --- | --- | --- |
| Third-party requests once loaded | **139** | 0 |
| Third-party bytes once loaded | **18,260 KB** | 0 |
| Contact page, mobile, no scroll | 0 requests / 919 KB | same |
| Desktop Best Practices | **100** | would also be 100 |

**This decision changed while I was measuring it, and in the embed's favour.**
Last report it was "desktop Best Practices 54, accept the miss". While building
the comparison I found my own facade was broken — an 800px observer margin fired
before the visitor had scrolled at all, because the form sits 535px below the
fold, so the contact page was still pulling **34 third-party requests and 6.7 MB
on arrival**. It was deferring the embed past Lighthouse's measurement window
and almost nothing else. That is exactly the flattering-number risk I flagged
last time, and it was real. At 200px it waits for a genuine scroll: **0
third-party requests, 919 KB**, and desktop Best Practices went **54 → 100**.

**Recommendation: embed.** Every page now meets every bar, so the native form is
an opportunity rather than a defect. It is worth doing one day — it would be
faster, on our typography, with validation in our voice, and it could pre-fill
the venue a visitor arrived from so enquiries land already attached to a venue.
But it needs a server route, a provider or the Monday API, a key in Vercel's
environment variables, and it takes on spam handling, the file upload and the
searchable record that the embed does for free. It also changes a habit: today
your team edits the form in Monday; afterwards that is a code change and a
deploy. Say **"native"** and I will build it properly as its own piece of work.

### 2. Firefox → **"skip"** or **"I checked"**

**Demonstration:** it genuinely cannot run here — see below. The five-minute
manual checklist is in the report §4 and repeated at the end of this document.

**Recommendation: do the five-minute pass yourself** on the preview URL before
launch. Chromium and WebKit are both verified, including the hero autoplay
contract; Firefox is the one gap and it is cheap to close by hand.

### 3. `spire2.png` origin → **"generated"**, **"licensed"**, or **"drop it"**

**Demonstration:** the sweep, re-confirmed. Two exact byte matches, both
withheld; no third copy anywhere in the repository; not inside any served
container; not in the Wedding Brochure — all 21 embedded JPEGs extracted and
compared, closest 67/256 against a 24 threshold. Verified again this run against
the **remote** tree by exact path: absent.

**Recommendation: no action needed for the website.** It is withdrawn either
way. The question only matters for your own records, because the brochure,
social posts and ads live outside this repository. Answer it whenever suits you.

### 4. Production deploy → **"go"** when you are ready

**Demonstration:** [`LAUNCH-RUNBOOK.md`](../LAUNCH-RUNBOOK.md) — the whole
switch written out: production branch, domain, DNS records, pre-flight, Search
Console, the first week, and the rollback. Its first line is that nothing in it
has been executed.

**Recommendation: launch, after the Firefox pass.** The rehearsal passed 45 of
45 checks. Promotion and DNS stay yours — they are the two actions here that are
hard to reverse and that affect something you own rather than something this
repository owns.

---

## Firefox — one real attempt, and the honest outcome

Reinstalled (`npx playwright install firefox`), then ran the binary directly to
get the real error instead of Playwright's wrapper:

> The application has failed to start because its side-by-side configuration is
> incorrect.

A Windows side-by-side manifest failure inside Playwright's own Firefox build.
The VC++ runtimes it names all resolve (`vcruntime140`, `msvcp140`), and there is
no branded Firefox installed to fall back to with `channel: "firefox"`. The one
workaround left is installing system runtimes machine-wide, which I will not do
unattended on your machine.

**Your five-minute pass**, on the preview URL:

1. **Home** — the hero film plays automatically, muted, and loops.
2. **Home, scrolling** — the arrival sequence and the journey rail pin and
   release cleanly; nothing juddering or stuck.
3. **Any page, keyboard** — `Tab` reaches the menu, focus is visible, `Esc`
   closes it and focus returns to the button that opened it.
4. **Contact** — scroll down; the enquiry form loads as you approach it, and the
   phone/WhatsApp/email links are visible immediately without waiting.
5. **Any gallery** — open an image, arrow left and right, `Esc` closes it.

If all five behave, Firefox is fine.

---

## Launch rehearsal — 45 of 45

Run against real builds, because the SEO flips are decided at **build** time,
not per request. So I built twice and measured each.

| Check | `VERCEL_ENV=production` | `VERCEL_ENV=preview` |
| --- | --- | --- |
| `robots.txt` | `Allow: /`, `Disallow: /direction/`, sitemap + host declared | `Disallow: /` |
| Page robots meta, all 17 | `index, follow` | `noindex, nofollow, nocache` |
| Canonical | absolute, matches its own path, all 17 | same |
| `og:image` / `twitter:image` | absolute and resolving, 15 distinct cards across 17 pages | same |
| `sitemap.xml` | 17 URLs, all 200, no study or direction route | same |
| `/study/*`, `/direction/*` | `noindex` | `noindex` |
| Non-canonical host | `noindex` + disallow-all | `noindex` + disallow-all |

Reproduce with `npm run launch:check` against a running build.

### The legacy redirect map

[`design-review/redirect-map.md`](redirect-map.md) — **21 URLs, every one
executed against the running build.** Three server redirects, two unchanged
asset paths, sixteen fragments. Compiled from `scripts/source.html`, the
archived original, rather than from memory.

Two things there are worth your eye because they look wrong and are right:

- **`#about` lands on `/wedding-guide`, and `#team` lands on `/about`.** The old
  anchors were named for their place in the nav, not their contents — `#about`
  held *"Your Wedding Journey with Domisignature"* and `#team` held *"Our
  Amazing Team"*. I built a second component this run that mapped them by name
  and had it backwards; the shipped `LegacyAnchorRedirect` was already right. My
  duplicate is deleted and the map now carries a warning so nobody "corrects"
  those two rows into breakage later.
- **The seven event galleries were matched by photo set, not title.** The old
  titles were "Party", "Party", "Party", "Wedding", "Dinner", "Party",
  "Wedding". Each modal's image prefix is what identifies it.

Fragments are handled in the browser because **no server-side rule can redirect
them** — a fragment is never transmitted in an HTTP request, so Next, Vercel and
nginx are all structurally incapable of seeing `#portfolioModal2`.

---

## Lighthouse — every cell now meets its bar

| | Perf | A11y | BP | SEO | LCP | CLS |
| --- | --- | --- | --- | --- | --- | --- |
| Mobile — Home | 82 | 100 | 100 | 100 | 4.1 s | 0 |
| Mobile — Venues | 92 | 98 | 100 | 100 | 3.1 s | 0 |
| Mobile — Venue detail | 86 | 100 | 100 | 100 | 3.8 s | 0.001 |
| Mobile — Signature Events | 93 | 100 | 100 | 100 | 2.9 s | 0 |
| Mobile — Wedding Guide | 92 | 98 | 100 | 100 | 3.1 s | 0 |
| Mobile — Contact | 93 | 100 | 100 | 100 | 2.9 s | 0 |
| Desktop — Home | 98 | 100 | 100 | 100 | 0.8 s | 0 |
| Desktop — Venues | 99 | 98 | 100 | 100 | 0.6 s | 0 |
| Desktop — Venue detail | 98 | 100 | 100 | 100 | 0.8 s | 0.001 |
| Desktop — Signature Events | 99 | 100 | 100 | 100 | 0.6 s | 0 |
| Desktop — Wedding Guide | 99 | 98 | 100 | 100 | 0.6 s | 0 |
| Desktop — Contact | 99 | 100 | 100 | 100 | 0.6 s | 0 |

Bars: desktop ≥90 everywhere; mobile ≥90 for A11y/BP/SEO with a performance
floor of 80. **Nothing is below its bar.** axe-core reports zero violations.

---

## The quality system is now permanent

[`QA-TOOLKIT.md`](../QA-TOOLKIT.md) explains each of the ten checks in one line.

```bash
npm run qa
```

Ten checks, one command, any platform — it starts and stops its own production
server, and now refuses to run if something else is already on the port rather
than measuring a build it did not start.

[`.github/workflows/qa.yml`](../.github/workflows/qa.yml) runs the same command
on every push and pull request: install, production-mode build, all ten checks.
**Green, 10/10, 3 min 33 s** against a fifteen-minute ceiling. Lighthouse stays
out on purpose — it needs a quiet machine for comparable numbers, and a
performance gate that flaps gets ignored within a week.

It took three runs to be sure of that, and the middle one is worth recording.
The first was green in 4 min 53 s. The second hit the job ceiling and was
cancelled: `playwright install --with-deps` spent fourteen minutes watching
apt-get retry `azure.archive.ubuntu.com` and get nothing back. The browser
binary is cached; apt is not and cannot be, and GitHub's image already ships the
libraries Chromium needs — so that step was the only thing in the workflow whose
success depended on Ubuntu's package mirrors, for no benefit. Removed, with a
five-minute ceiling on the step so a network stall can never eat the budget
again.

Then a fourth run went red on a **documentation-only** commit: the asset audit
timed out because it waited for `load`, and `load` waits for the hero film to
finish downloading — comfortably inside the limit on this machine, not on a CI
runner. It now waits for `domcontentloaded` and lets the scroll walk force the
lazy requests, which is what it was actually measuring all along. Nothing was
wrong with the site either time. A gate that fails for reasons unrelated to the
code is a gate people learn to ignore, so both flakes were worth fixing rather
than re-running.

Two of the ten are worth knowing by name:

- **`claims`** enforces *no invented facts* — every figure on the site must
  trace to `content/`, so nobody can hard-code "3 venues" and let it drift.
- **`manifest`** is the privacy gate — it fails if any of the seven withheld
  photographs is referenced from anywhere, so a withheld frame cannot return
  through an innocent edit.

### Privacy gate — re-verified against the remote tree

Checked by **exact path** against `origin/main` as it stands on GitHub, not
against the local index:

- All seven withheld frames: **absent**.
- `posterimage.png`: **absent**.
- All seven raw camera masters: **absent**.
- Any `.env` file: **none**.
- Largest committed file: 23.0 MB (`wedding-rituals-olive-1.mp4`), well under the
  95 MB limit.

---

## Commits this run

| | |
| --- | --- |
| `9038ef3` | Firefox: real diagnosis and a five-minute manual checklist |
| `139792b` | Decisions become demonstrations: native-form study, and the facade now works |
| `730c6ad` | Launch rehearsal: prove the production flips, and test every legacy URL |
| `d60f22a` | Make the quality system permanent: one command, and CI on every push |
| `c93539f` | Only the real domain may be indexed — the env check was not enough |
| `ceed367` | RUN2-REPORT.md: the four decisions answerable in one word each |
| `fc92b63` | CI: drop `--with-deps`, which hung on apt for 14 minutes |
| `c4b43b8` | RUN2-REPORT.md: final CI numbers, and why it took three runs |
| `d0298bf` | Asset audit: stop waiting for the hero film to finish downloading |

---

## What I would still improve — described only, not started

1. **The enquiry form is still a third-party embed.** A native form would be
   faster and on-brand, but it needs a delivery path and changes where
   submissions land. See decision 1.
2. **Mobile Home at 82 and Venue detail at 86.** Both clear the floor but sit
   below the 90 the desktop pages reach. The lever is the hero film and the
   full-bleed venue photography — a smaller mobile-specific hero encode would
   likely buy several points.
3. **The events strip has no visible affordance that it scrolls.** The cursor
   says "Drag" on desktop, but a touch visitor has only the cards running off
   the edge. A progress rail or a peeking next card would say it without words.
4. **Alt text is descriptive but not yet consistent in voice.** Some frames read
   as captions, others as literal descriptions. A single pass would make screen
   reader output feel authored rather than assembled.
5. **The journey rail is CSS sticky, not a GSAP pin.** That was the right call
   for the bleeding image layout, but it means the two pinned scenes on the site
   are built differently. Worth unifying if the motion layer is ever revisited.

*(Item 2's figures updated to this run's measurements — 81/85 last time, 82/86
now. The list is otherwise unchanged; a duplicated sentence in item 2 has been
removed.)*
