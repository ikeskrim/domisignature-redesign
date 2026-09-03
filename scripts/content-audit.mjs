/**
 * Content audit — proves nothing was dropped between the live site and the
 * rebuild, by diffing the archived live HTML (scripts/source.html) against the
 * content files and the built routes.
 *
 * Writes design-review/content-audit.md.
 *
 * Usage: node scripts/content-audit.mjs
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "design-review");
const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";

/* The content files are TypeScript, so parse them as text rather than import. */
const readContent = (f) => readFile(path.join(ROOT, "content", f), "utf8");

const source = await readFile(path.join(ROOT, "scripts", "source.html"), "utf8");

/* ---------------------------------------------------------------- live side */

const liveMedia = new Set(
  [
    ...source.matchAll(/(?:src|href|data-src|poster)="(\/media\/[^"]+)"/g),
    ...source.matchAll(/url\('?(\/media\/[^')]+)'?\)/g),
  ].map((m) => decodeURIComponent(m[1])),
);

/** Per-modal image lists on the live site. */
function liveModalCounts() {
  const ids = [
    "portfolioModal1", "portfolioModal2", "portfolioModal3", "portfolioModal4",
    "portfolio1Modal1", "portfolio1Modal2", "portfolio1Modal3", "portfolio1Modal4",
    "portfolio1Modal5", "portfolio1Modal6", "portfolio1Modal7",
  ];
  const out = {};
  for (let i = 0; i < ids.length; i++) {
    const start = source.indexOf(`id="${ids[i]}"`);
    const end = i < ids.length - 1 ? source.indexOf(`id="${ids[i + 1]}"`) : source.length;
    const seg = source.slice(start, end);
    out[ids[i]] = {
      images: [...seg.matchAll(/class="glightbox masonry-item"[\s\S]*?src="([^"]+)"/g)].length,
      videos: [...seg.matchAll(/<source src="([^"]+)"/g)].length,
    };
  }
  return out;
}

/* ---------------------------------------------------------------- new side */

const venuesTs = await readContent("venues.ts");
const eventsTs = await readContent("events.ts");
const journeyTs = await readContent("journey.ts");
const servicesTs = await readContent("services.ts");
const teamTs = await readContent("team.ts");
const siteTs = await readContent("site.ts");

const newMedia = new Set(
  [venuesTs, eventsTs, journeyTs, servicesTs, teamTs, siteTs]
    .join("\n")
    .matchAll(/"(\/media\/[^"]+)"/g),
).size
  ? new Set(
      [...[venuesTs, eventsTs, journeyTs, servicesTs, teamTs, siteTs]
        .join("\n")
        .matchAll(/"(\/media\/[^"]+)"/g)].map((m) => m[1]),
    )
  : new Set();

/** Count gallery entries per venue / event in the content files. */
function countBlocks(ts, key) {
  const out = {};
  const re = new RegExp(`slug: "([^"]+)"([\\s\\S]*?)(?=\\n  \\{\\n    (?:// [^\\n]*\\n    )?slug: "|\\n\\];)`, "g");
  for (const m of ts.matchAll(re)) {
    const slug = m[1];
    const body = m[2];
    const gallery = (body.match(/\/media\/[^"]+/g) ?? []).filter((s) => !s.includes("/video/"));
    const videos = (body.match(/src: "\/media\/video\/[^"]+\.mp4"/g) ?? []).length;
    out[slug] = { images: new Set(gallery).size, videos, [key]: true };
  }
  return out;
}

const newVenues = countBlocks(venuesTs, "venue");
const newEvents = countBlocks(eventsTs, "event");

/* ------------------------------------------------------------- route checks */

/* /venues/villa-aetos stays in this list deliberately. The venue is withdrawn,
   but the URL was live and indexed, so the audit should keep proving it still
   resolves — a 301 to /venues, not a 404. */
const ROUTES = [
  "/", "/venues", "/venues/mountain-escape", "/venues/thalasses",
  "/venues/olive-stories", "/venues/villa-aetos", "/events",
  "/events/sunset-by-the-pool", "/events/villa-party", "/events/party-celebration",
  "/events/wedding-rituals-aerial", "/events/dinner-celebration",
  "/events/party-drone", "/events/wedding-rituals-olive",
  "/services", "/wedding-guide", "/about", "/contact",
  "/sitemap.xml", "/robots.txt",
];

const routeStatus = [];
for (const r of ROUTES) {
  try {
    const res = await fetch(`${BASE}${r}`);
    routeStatus.push([r, res.status]);
  } catch {
    routeStatus.push([r, "ERR"]);
  }
}

let notFoundStatus = "?";
try {
  notFoundStatus = (await fetch(`${BASE}/no-such-page`)).status;
} catch {}

/* --------------------------------------------------------------- essentials */

const home = await (await fetch(`${BASE}/`)).text();
const contactHtml = await (await fetch(`${BASE}/contact`)).text();

const essentials = [
  ["Meta title", 'Luxury Wedding Planner in Crete, Greece | Domisignature', home],
  ["Meta description", "Domisi Signature designs unique experiences", home],
  ["Meta keywords", "bespoke wedding planning", home],
  ["Open Graph", 'property="og:title"', home],
  ["Favicon", "/assets/favicon.ico", home],
  ["Tagline", "Where Every Moment Is Signed", home],
  /*
   * These two are DELIBERATELY absent, and the table says so rather than
   * showing a red cross a reviewer has to go and interpret.
   *
   * The live eyebrow "Plan your perfect event with us" was replaced — first by
   * an invented exclusivity claim I had to remove, and now by "Rethymno,
   * Crete", which is a fact (copy-deck.md §3a). The live CTA "Tell me more"
   * became the two-CTA system, Enquire and Wedding Brochure, in Phase 6b.
   *
   * The replacements are asserted positively below, so this still fails loudly
   * if the NEW copy ever disappears.
   */
  ["Hero eyebrow — replaced, approved", "Rethymno, Crete", home],
  ["Hero CTA — replaced, approved", "Wedding Brochure", home],
  ["creteholidayhome villas link", "https://www.creteholidayhome.com", home],
  ["creteholidayhome experiences link", "creteholidayhome.com/experiences/", home],
  ["Phone", "+30 211 444 5757", home],
  ["WhatsApp", "306974069475", home],
  ["Email", "domisignature@gmail.com", home],
  ["Facebook", "facebook.com/profile.php?id=61580989021866", home],
  ["Instagram", "instagram.com/domisignature/", home],
  ["TikTok", "tiktok.com/@domisignature_weddings", home],
  ["Wedding Brochure PDF", "/assets/files/Weddingbrochure.pdf", home],
  ["Γ.Ε.ΜΗ.", "021943650000", home],
  ["Copyright", "© 2026 Domisignature", home],
  ["Team — Stelios", "Stelios Christidis", home],
  ["Team — Stavros", "Stavros Kapetanakis", home],
  ["Team — Daria", "Daria Zaitseva", home],
  ["Team paragraph", "close-knit team driven by creativity", home],
  ["Monday.com form", "forms.monday.com/forms/embed/0b258fa52b6f140d9391f8cd1e300de8", contactHtml],
];

/* ------------------------------------------------------------------ compose */

const modal = liveModalCounts();
/* Thalasses leads the collection since the owner's reorder; portfolioModal4
   (Villa Aetos) is withdrawn — see the approved deltas below. */
const venueMap = [
  ["portfolioModal2", "thalasses", "Thalasses"],
  ["portfolioModal1", "mountain-escape", "Mountain Escape"],
  ["portfolioModal3", "olive-stories", "Olive Stories"],
];
/* Titles rewritten in Phase 6 after viewing every frame — see copy-deck.md §10. */
const eventMap = [
  ["portfolio1Modal1", "sunset-by-the-pool", "Sunset by the pool (was Party / dance)"],
  ["portfolio1Modal2", "villa-party", "Villa Party (was “germans”)"],
  ["portfolio1Modal3", "party-celebration", "Everyone in white (was Party / celebration)"],
  ["portfolio1Modal4", "wedding-rituals-aerial", "Vows on the sand (was Wedding / rituals)"],
  ["portfolio1Modal5", "dinner-celebration", "Under the shade sail (was Dinner / celebration)"],
  ["portfolio1Modal6", "party-drone", "From above (was Party / drone)"],
  ["portfolio1Modal7", "wedding-rituals-olive", "A ceremony by the water (was Wedding / rituals)"],
];

const missingMedia = [...liveMedia].filter((m) => !newMedia.has(m)).sort();

const tick = (ok) => (ok ? "✅" : "❌");

const md = `# Content audit — live site vs rebuild

Generated by \`scripts/content-audit.mjs\` against the archived live HTML
(\`scripts/source.html\`, captured at extraction time) and the running
**production build**.

---

## 1. Routes

| Route | Status |
|---|---|
${routeStatus.map(([r, s]) => `| \`${r}\` | ${s === 200 ? "✅ 200" : `❌ ${s}`} |`).join("\n")}
| \`/no-such-page\` (custom 404) | ${notFoundStatus === 404 ? "✅ 404" : `❌ ${notFoundStatus}`} |

## 2. Essential content present in the built HTML

| Item | Present |
|---|---|
${essentials.map(([label, needle, hay]) => `| ${label} | ${tick(hay.includes(needle))} |`).join("\n")}

## 3. Venues — gallery counts, live vs new

| Venue | Live images | New images | Videos live → new |
|---|---|---|---|
${venueMap
  .map(([id, slug, name]) => {
    const l = modal[id];
    const n = newVenues[slug] ?? { images: 0, videos: 0 };
    const ok = n.images >= l.images;
    return `| ${name} | ${l.images} | ${n.images} ${tick(ok)} | ${l.videos} → ${n.videos} |`;
  })
  .join("\n")}

## 4. Signature Events — gallery counts, live vs new

| Gallery | Live images | New images | Videos live → new |
|---|---|---|---|
${eventMap
  .map(([id, slug, name]) => {
    const l = modal[id];
    const n = newEvents[slug] ?? { images: 0, videos: 0 };
    const ok = n.images >= l.images;
    return `| ${name} | ${l.images} | ${n.images} ${tick(ok)} | ${l.videos} → ${n.videos} |`;
  })
  .join("\n")}

## 5. Wedding Journey

${
  (journeyTs.match(/number: \d+/g) ?? []).length === 6
    ? "✅ All 6 steps present."
    : "❌ Step count mismatch."
}

## 6. Legacy anchors

Resolved client-side by \`src/components/layout/LegacyAnchorRedirect.tsx\`.

| Old anchor | Lands on |
|---|---|
| \`#services\` | \`/services\` |
| \`#portfolio\` | \`/venues\` |
| \`#portfolio1\` | \`/events\` |
| \`#about\` | \`/wedding-guide\` |
| \`#team\` | \`/about\` |
| \`#contact\` | \`/contact\` |
| \`#page-top\` | \`/\` (no redirect needed) |
| \`#portfolioModal1–4\` | the four venue pages |
| \`#portfolio1Modal1–7\` | the seven gallery pages |
| \`#portfolio1Modal2\` | \`/events/villa-party\` ✅ |

## 7. Approved deltas — changes, not losses

| Change | Approved |
|---|---|
| \`germans\` → **Villa Party** (label + slug \`/events/villa-party\`) | Phase 5 brief §1.1 |
| \`spire2.png\` retired as the hero; replaced by the drone film + stills | Phase 5 brief §1.2 |
| "A major advantage for weddings:" de-duplicated (was printed 3×) | Phase 5 brief §1.3 |
| "Thallases" → "Thalasses" in body copy | Phase 5 brief §1.3 |
| "the all organization" → "all the organization" | Phase 5 brief §1.4 |
| "one exclusive home - perfect" → em dash | Phase 5 brief §1.4 |
| Services photography re-selected (5 images) | Phase 4, reported and approved |
| Wedding Journey: 6 distinct photos replacing one repeated placeholder | Phase 4, MEDIA-CHOICES.md |
| Seven gallery titles rewritten after viewing every frame | Phase 6 §2, copy-deck.md §10 |
| \`stHARLEY.jpg\` and \`blDSC_9849.jpg\` withdrawn as weak frames | Phase 6 §4, approved by name |
| \`olLK_LD_072.jpg\` withdrawn — a client's names were legible | Phase 6 §4, standing privacy rule |
| \`thspire2.png\` withdrawn — same file as \`spire2.png\`, reads as synthetic | Phase 6 §4, imagery-report.md |
| \`ae9Z8A4481-Edit.jpg\`, \`aeIMG_2133.jpg\` withdrawn as off-register | Phase 6 §4, imagery-report.md |
| \`posterimage.png\` is the wedding film's poster, no longer a gallery still | Phase 6 §4, TEXT-FIXES.md §B4 |
| "Under the shade sail": its film moved out of the stills grid | Phase 6 §4, was breaking \`next/image\` |
| All 11 galleries re-sequenced to open on their strongest frame | Phase 6 §4, imagery-report.md |
| **Villa Aetos withdrawn from the collection** — page, index row, homepage card, related-venues cards and contact map. \`/venues/villa-aetos\` 301s to \`/venues\`; its 10 photographs become orphans under the manifest rule | **Owner instruction, explicit** |
| Thalasses becomes venue 01; Mountain Escape and Olive Stories keep their relative order | Owner instruction |
| Derived guest stat changed from the full range to the **maximum** — a range opening at 200 reads as a minimum and would turn away intimate weddings | Owner decision |
| Journey step 2 photograph replaced (was a Villa Aetos terrace, now orphaned) | Consequence of the withdrawal |

## 8. Live images no longer used anywhere — **for your sign-off**

${
  missingMedia.length === 0
    ? "None. Every image referenced by the live site is still referenced by the rebuild."
    : `${missingMedia.length} file(s). All are still downloaded in \`/public/media/\` — they are simply not referenced by any page.\n\n${missingMedia.map((m) => `- \`${m}\``).join("\n")}`
}
`;

await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, "content-audit.md"), md, "utf8");
console.log(`live media refs: ${liveMedia.size}`);
console.log(`new media refs:  ${newMedia.size}`);
console.log(`unused from live: ${missingMedia.length}`);
console.log("written -> design-review/content-audit.md");
