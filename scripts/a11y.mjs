/**
 * Automated accessibility pass — axe-core over every route, at mobile and
 * desktop, against the PRODUCTION build.
 *
 * Writes design-review/a11y-axe.json for the report to summarise.
 *
 * Usage: node scripts/a11y.mjs
 */

import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = path.join(ROOT, "design-review");

const ROUTES = [
  ["home", "/"],
  ["venues", "/venues"],
  ["venue-detail", "/venues/thalasses"],
  ["events", "/events"],
  ["event-detail", "/events/villa-party"],
  ["services", "/services"],
  ["wedding-guide", "/wedding-guide"],
  ["about", "/about"],
  ["contact", "/contact"],
  ["404", "/no-such-page"],
];

const VIEWPORTS = [
  { tag: "mobile", width: 390, height: 844 },
  { tag: "desktop", width: 1440, height: 900 },
];

/** WCAG 2.1 A + AA only — that is the bar the brief sets. */
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      // Audit the state most visitors see; reduced motion is swept separately.
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    for (const [name, route] of ROUTES) {
      try {
        await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 60_000 });
        await page.waitForTimeout(900);

        const scan = await new AxeBuilder({ page })
          .withTags(TAGS)
          // The Monday.com and Google Maps iframes are third-party documents we
          // cannot fix; auditing them would only produce noise we cannot act on.
          .exclude("iframe")
          /*
           * The oversized footer wordmark is decorative brand text, hidden from
           * assistive technology and duplicated three other places on the page.
           * Approved as a WCAG 1.4.3 logotype/decorative exemption and recorded
           * in a11y.md, so it is excluded here rather than silently ignored.
           */
          .exclude("[data-a11y-exempt='decorative-logotype']")
          .analyze();

        results.push({
          route: name,
          path: route,
          viewport: vp.tag,
          violations: scan.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            help: v.help,
            nodes: v.nodes.length,
            targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
          })),
        });

        const count = scan.violations.length;
        console.log(`  ${vp.tag.padEnd(8)} ${name.padEnd(14)} ${count === 0 ? "clean" : `${count} violation(s)`}`);
      } catch (err) {
        results.push({ route: name, path: route, viewport: vp.tag, error: err.message.split("\n")[0] });
        console.log(`  ${vp.tag.padEnd(8)} ${name.padEnd(14)} ERROR`);
      }
    }

    await context.close();
  }

  await browser.close();
  await writeFile(path.join(OUT, "a11y-axe.json"), JSON.stringify(results, null, 2), "utf8");

  const total = results.reduce((n, r) => n + (r.violations?.length ?? 0), 0);
  console.log(`\ntotal violations: ${total}`);
  console.log("written -> design-review/a11y-axe.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
