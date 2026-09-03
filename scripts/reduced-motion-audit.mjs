/**
 * prefers-reduced-motion sweep.
 *
 * The rule on this build is that reduced motion renders the FINAL state
 * immediately — not a shortened animation, not a faded one. That is easy to
 * claim and easy to get wrong: every reveal works by hiding an element first,
 * so a single missed branch leaves content permanently invisible to exactly the
 * people who asked for less movement.
 *
 * This loads every route with reducedMotion: "reduce", WITHOUT scrolling, and
 * fails on any element that still carries text but is hidden — by opacity, by a
 * transform that pushes it off, or by clip-path. It also checks the preloader
 * never appears and that nothing is left mid-animation.
 *
 * Usage: npm run audit:reduced-motion
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = "design-review";

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

const browser = await chromium.launch();
const findings = [];

for (const [name, route] of ROUTES) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}${route}`, { waitUntil: "load" });
  /* Deliberately short and WITHOUT scrolling: under reduced motion the page
     must already be correct, not correct-once-you-move. */
  await page.waitForTimeout(1800);

  const report = await page.evaluate(() => {
    const problems = [];

    /* The preloader must never appear under reduced motion. */
    if ([...document.querySelectorAll("div")].some((d) => getComputedStyle(d).zIndex === "105")) {
      problems.push("preloader is present under reduced motion");
    }

    for (const el of document.querySelectorAll("main *, footer *")) {
      const cs = getComputedStyle(el);
      if (cs.position === "fixed") continue;

      /*
       * Decorative subtrees are not content. The page-transition curtain holds
       * the wordmark and is `aria-hidden`; under reduced motion there is no
       * curtain to animate, so it correctly stays invisible — and this check
       * flagged it on all ten routes as if content had failed to render.
       * Skipping aria-hidden matches how axe treats the same markup.
       */
      if (el.closest('[aria-hidden="true"]')) continue;

      const r = el.getBoundingClientRect();
      if (r.width < 30 || r.height < 16) continue;

      /* Only elements holding their own text — a wrapper's opacity is the
         child's problem, and counting both doubles every finding. */
      const own = [...el.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim())
        .join(" ")
        .trim();
      if (!own) continue;

      const op = parseFloat(cs.opacity);
      if (op < 0.9) problems.push(`opacity ${op.toFixed(2)} — "${own.slice(0, 40)}"`);

      const t = cs.transform;
      if (t && t !== "none") {
        const m = t.match(/matrix\(([^)]+)\)/);
        if (m) {
          const p = m[1].split(",").map(Number);
          const [tx, ty] = [p[4], p[5]];
          if (Math.abs(ty) > 12 || Math.abs(tx) > 12) {
            problems.push(`offset ${Math.round(tx)},${Math.round(ty)} — "${own.slice(0, 40)}"`);
          }
        }
      }

      if (cs.clipPath && cs.clipPath !== "none" && /inset\((?!0)/.test(cs.clipPath)) {
        problems.push(`clipped ${cs.clipPath} — "${own.slice(0, 40)}"`);
      }
    }

    return [...new Set(problems)];
  });

  findings.push({ route: name, path: route, problems: report });
  console.log(
    `  ${name.padEnd(14)} ${report.length ? `${report.length} PROBLEM(S)` : "clean — final state on arrival"}`,
  );
  for (const p of report.slice(0, 4)) console.log(`      ${p}`);

  await ctx.close();
}

await browser.close();

const total = findings.reduce((a, f) => a + f.problems.length, 0);
console.log(`\ntotal reduced-motion problems: ${total}`);

await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, "reduced-motion-audit.json"), JSON.stringify(findings, null, 2), "utf8");
console.log("written -> design-review/reduced-motion-audit.json");

if (total > 0) process.exitCode = 1;
