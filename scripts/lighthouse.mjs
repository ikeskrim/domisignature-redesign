/**
 * Lighthouse, mobile and desktop presets, against the PRODUCTION build.
 *
 * Writes design-review/lighthouse.md and the raw JSON alongside it.
 *
 * Usage: node scripts/lighthouse.mjs            (all routes, both presets)
 *        node scripts/lighthouse.mjs mobile     (one preset)
 */

import lighthouse from "lighthouse";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = path.join(ROOT, "design-review");
const ONLY_PRESET = process.argv[2] ?? null;

const ROUTES = [
  ["/", "Home"],
  ["/venues", "Venues"],
  ["/venues/thalasses", "Venue detail"],
  ["/events", "Signature Events"],
  ["/wedding-guide", "Wedding Guide"],
  ["/contact", "Contact"],
];

const PRESETS = ["mobile", "desktop"];
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

const pct = (score) => (score === null || score === undefined ? null : Math.round(score * 100));

async function main() {
  await mkdir(OUT, { recursive: true });

  /*
   * Launch Chromium through Playwright rather than chrome-launcher: this
   * sandbox refuses chrome-launcher's spawn (errno -4094 UNKNOWN), but
   * Playwright's own launcher works. Lighthouse then attaches over CDP on the
   * fixed remote-debugging port.
   */
  const PORT = 9222;
  const browser = await chromium.launch({
    args: [`--remote-debugging-port=${PORT}`, "--no-sandbox", "--disable-gpu"],
  });
  const chrome = { port: PORT, kill: async () => browser.close() };

  const presets = ONLY_PRESET ? PRESETS.filter((p) => p === ONLY_PRESET) : PRESETS;
  const rows = [];

  for (const preset of presets) {
    for (const [route, label] of ROUTES) {
      const url = `${BASE}${route}`;
      try {
        const result = await lighthouse(
          url,
          { port: chrome.port, output: "json", logLevel: "error" },
          preset === "desktop"
            ? { extends: "lighthouse:default", settings: { formFactor: "desktop", screenEmulation: { disabled: true }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } }
            : undefined,
        );

        const c = result.lhr.categories;
        const a = result.lhr.audits;

        rows.push({
          preset,
          label,
          route,
          performance: pct(c.performance?.score),
          accessibility: pct(c.accessibility?.score),
          bestPractices: pct(c["best-practices"]?.score),
          seo: pct(c.seo?.score),
          lcp: a["largest-contentful-paint"]?.displayValue ?? "—",
          cls: a["cumulative-layout-shift"]?.displayValue ?? "—",
          tbt: a["total-blocking-time"]?.displayValue ?? "—",
          /*
           * The LCP element lives at a different depth depending on the
           * Lighthouse version — sometimes items[0].node, sometimes nested one
           * table deeper. Reading only the deep path produced a column of "—"
           * for every page, which is worse than no column: it looked like the
           * data was collected and empty rather than never found.
           */
          lcpElement:
            a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node?.snippet?.slice(0, 110) ??
            a["largest-contentful-paint-element"]?.details?.items?.[0]?.node?.snippet?.slice(0, 110) ??
            "—",
          /* The actual reasons a score is what it is — otherwise this report
             says a page is slow without ever saying why. */
          failing: Object.entries(a)
            .filter(([, x]) => typeof x.score === "number" && x.score < 0.9)
            .sort((x, y) => x[1].score - y[1].score)
            .slice(0, 12)
            .map(([id, x]) => `${id}${x.displayValue ? ` (${x.displayValue})` : ""}`),
        });

        const r = rows[rows.length - 1];
        console.log(
          `  ${preset.padEnd(8)} ${label.padEnd(18)} P${r.performance} A${r.accessibility} BP${r.bestPractices} SEO${r.seo}  LCP ${r.lcp}  CLS ${r.cls}`,
        );
      } catch (err) {
        rows.push({ preset, label, route, error: err.message.split("\n")[0] });
        console.log(`  ${preset.padEnd(8)} ${label.padEnd(18)} ERROR`);
      }
    }
  }

  await chrome.kill();

  await writeFile(path.join(OUT, "lighthouse.json"), JSON.stringify(rows, null, 2), "utf8");

  const flag = (n) => (n === null ? "—" : n >= 90 ? `**${n}**` : `${n} ⚠️`);
  const table = (preset) =>
    [
      `| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |`,
      `|---|---|---|---|---|---|---|---|`,
      ...rows
        .filter((r) => r.preset === preset)
        .map((r) =>
          r.error
            ? `| ${r.label} | ERROR | — | — | — | — | — | — |`
            : `| ${r.label} | ${flag(r.performance)} | ${flag(r.accessibility)} | ${flag(r.bestPractices)} | ${flag(r.seo)} | ${r.lcp} | ${r.cls} | ${r.tbt} |`,
        ),
    ].join("\n");

  const md = `# Lighthouse

Run against the **production build** (\`npm run build\` + \`next start -p 3004\`),
using Playwright's bundled Chromium. Bold = meets the ≥ 90 target.

## Mobile

${table("mobile")}

## Desktop

${table("desktop")}

## LCP element per page (mobile)

| Page | LCP element |
|---|---|
${rows
  .filter((r) => r.preset === "mobile" && !r.error)
  .map((r) => `| ${r.label} | \`${r.lcpElement.replace(/\|/g, "\\|")}\` |`)
  .join("\n")}

Raw output: \`design-review/lighthouse.json\`.
`;

  await writeFile(path.join(OUT, "lighthouse.md"), md, "utf8");
  console.log("\nwritten -> design-review/lighthouse.md");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
