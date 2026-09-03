# The first 24 hours, and the first week

One command covers most of it:

```bash
npm run verify:launch
```

It re-runs the three post-cutover checks against the live domain — indexability
from outside, the whole legacy redirect map, and a full crawl. Run it now, run it
tomorrow, run it next week. It exits non-zero if anything breaks, so it can front
a scheduled job.

**Rollback, if it is ever needed:** at aspx.gr restore `A @ 31.22.115.30` and
`A www 31.22.115.30`. Nothing else. Keep the old hosting paid for a month.

---

## First 24 hours

**1. Firefox — five minutes, on the live domain.** This moved here from the
pre-launch gate, which was waived. It is the one browser that could not be
verified automatically: its Playwright build will not start on the build machine
(a Windows side-by-side manifest failure), so nothing has driven Firefox at any
point in this project. Chromium and WebKit are both fully verified.

On `https://domisignature.com` in Firefox:

- **Home** — the hero film plays automatically, muted, and loops.
- **Home, scrolling** — the arrival sequence and journey rail pin and release
  cleanly; nothing juddering or stuck.
- **Any page, keyboard** — `Tab` reaches the menu, focus is visible, `Esc`
  closes it and focus returns to the button that opened it.
- **Contact** — scroll down; the form loads as you approach it, and
  phone/WhatsApp/email are visible immediately without waiting.
- **Any gallery** — open an image, arrow left and right, `Esc` closes it.

If all five behave, Firefox is closed as a question.

**2. The 60-second phone check.** Two things only paint for human eyes, because
they are third-party iframes that screenshots cannot render. On a real phone, on
the live domain:

- `/contact` — the enquiry form appears as you scroll to it, and the three maps
  under "Find our venues" show actual maps.
- Send one test enquiry through the form and confirm it lands on the Monday
  board the team watches.

**3. Google Search Console** — your login, your clicks:

1. https://search.google.com/search-console → **Add property** →
   **Domain** → `domisignature.com`.
2. Verify by **DNS TXT record**. Google gives you one `TXT` value; add it at
   aspx.gr alongside the existing SPF record. **Adding a second TXT record is
   safe — do not replace or edit `v=spf1 a mx -all`.**
3. **Sitemaps** → submit `sitemap.xml`.
4. **URL Inspection** → paste `https://domisignature.com` → **Request
   indexing**. Fastest way to get the new structure crawled.
5. If a property for the old site already exists, keep it — it is the record of
   what the site used to rank for.

**Bing Webmaster Tools** takes two minutes and imports straight from Search
Console. Worth doing while you are there.

---

## Every day for the first week

**404 watch.** Vercel → Project → **Logs**, filter status `404`. This sees real
visitors immediately, rather than waiting for a crawl. Every URL the old site
published is covered by `design-review/redirect-map.md`, so anything appearing
here is a URL nobody knew about. A path gets a redirect in `next.config.ts`; a
`#fragment` gets one in `LegacyAnchorRedirect.tsx`.

**Search Console → Pages → Not indexed.** The same watch from Google's side,
slower but more complete.

**Form deliveries.** Confirm enquiries are still arriving on the Monday board.
The form is a third-party embed, so nothing in this repository can tell you it
has stopped — only the board can.

**`npm run verify:launch`** once a day. Thirty seconds, and it re-proves that
nothing has quietly regressed.

---

## The first month

**Core Web Vitals** — Search Console. Lab numbers are in
`design-review/lighthouse.md`; this is field data from real phones on real
networks, which is the number that actually counts. Expect it to be empty for
two to three weeks: it needs traffic before it reports.

**Rankings.** They usually dip for one to two weeks after a restructure and then
recover past the previous level. **Do not react to week one.** Every old URL
redirects permanently (308), which is what passes the old ranking to the new
address.

**Social bios.** Update the link in Instagram, Facebook and TikTok if any of them
points at a fragment URL (`domisignature.com/#portfolio`) rather than the bare
domain. The fragments still work — they redirect — but a clean link is better.

**Keep the old hosting paid** until the site has been live and healthy for a full
month. It is the thing a rollback rolls back to.
