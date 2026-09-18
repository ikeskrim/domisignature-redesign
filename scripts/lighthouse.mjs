/**
 * Lighthouse, mobile and desktop presets, against the PRODUCTION build.
 *
 * Writes design-review/lighthouse.md and the raw JSON alongside it.
 *
 * Usage: node scripts/lighthouse.mjs            (all routes, both presets)
 *        node scripts/lighthouse.mjs mobile     (one preset)
 *
 * Stage 6 options, all off by default (without them the output and the file
 * names are exactly what they were):
 *   LH_RUNS=N         run each route N times; report the median and the worst
 *                     performance and the median LCP (one run is not a number
 *                     this machine repeats)
 *   LH_DROP=N         append ?drop=N (0-4) to every route, for the drop-level
 *                     matrix (src/lib/motion-tier.ts); the basename becomes
 *                     lighthouse-dropN unless LH_NAME is set
 *   LH_THROTTLE=devtools  real devtools throttling instead of the simulated
 *                     default; information only, never the gate's number
 *   LH_SOURCE=text    what was measured ("local build", "preview"), for the label
 * With any of them set the report is labelled with its options, its source and
 * the framework version.
 */

import lighthouse from "lighthouse";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.SHOTS_BASE ?? "http://localhost:3004";
const OUT = path.join(ROOT, "design-review");

const DROP = process.env.LH_DROP ?? null;
if (DROP !== null && !/^[0-4]$/.test(DROP)) {
  console.error(`LH_DROP must be 0-4, got "${DROP}"`);
  process.exit(2);
}
const RUNS = Number(process.env.LH_RUNS ?? 1);
if (!Number.isInteger(RUNS) || RUNS < 1) {
  console.error(`LH_RUNS must be a whole number of at least 1, got "${process.env.LH_RUNS}"`);
  process.exit(2);
}
const THROTTLE = process.env.LH_THROTTLE ?? null;
if (THROTTLE !== null && THROTTLE !== "devtools" && THROTTLE !== "simulate") {
  console.error(`LH_THROTTLE must be "devtools" (or "simulate", the default), got "${THROTTLE}"`);
  process.exit(2);
}
const DEVTOOLS = THROTTLE === "devtools";
const SOURCE = process.env.LH_SOURCE ?? null;
const LABELLED = DROP !== null || RUNS > 1 || DEVTOOLS || SOURCE !== null;

/* A run against the live domain must not overwrite the local-build numbers:
   they measure different things and the report cites both. LH_NAME picks the
   output basename; a drop-level run gets its own by default, so the matrix
   never overwrites the reference. */
const NAME = process.env.LH_NAME ?? (DROP !== null ? `lighthouse-drop${DROP}` : "lighthouse");
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

const withDrop = (route) => (DROP === null ? route : `${route}${route.includes("?") ? "&" : "?"}drop=${DROP}`);

/**
 * The LCP element's snippet.
 *
 * It lives at a different depth depending on the Lighthouse version — sometimes
 * items[0].node, sometimes nested one table deeper — and Lighthouse 13 removed
 * the audit altogether: `lcp-breakdown-insight` replaces it, with a list whose
 * items are the subparts table and a node item. Its shape is read defensively
 * (the first node item with a snippet, at any depth), because reading only one
 * path produced a column of "—" for every page, which is worse than no column:
 * it looked like the data was collected and empty rather than never found.
 */
function lcpElementOf(audits) {
  const old =
    audits["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node?.snippet ??
    audits["largest-contentful-paint-element"]?.details?.items?.[0]?.node?.snippet;
  if (old) return old.slice(0, 110);
  const find = (v, depth = 0) => {
    if (!v || typeof v !== "object" || depth > 6) return null;
    if (v.type === "node" && typeof v.snippet === "string") return v.snippet;
    for (const child of Array.isArray(v) ? v : Object.values(v)) {
      const hit = find(child, depth + 1);
      if (hit) return hit;
    }
    return null;
  };
  return find(audits["lcp-breakdown-insight"]?.details)?.slice(0, 110) ?? "—";
}

const median = (xs) => {
  const s = [...xs].sort((x, y) => x - y);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

async function main() {
  await mkdir(OUT, { recursive: true });

  /* The version is read from the checkout running this script. When it measures
     another build (the published site, served from its own worktree), pass that
     build's version in LH_FRAMEWORK, or the label names the wrong one. */
  let framework = "unknown";
  try {
    framework = process.env.LH_FRAMEWORK ?? JSON.parse(await readFile(path.join(ROOT, "node_modules", "next", "package.json"), "utf8")).version;
  } catch {
    /* labelled as unknown rather than guessed */
  }

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

  const once = async (preset, route, label) => {
    const url = `${BASE}${withDrop(route)}`;
    try {
      /* The desktop throttling is Lighthouse's desktopDense4G in full. The three
         devtools keys are zero ("unset") there; left out, the settings merge
         would inherit the mobile slow-4G values for them, and an
         LH_THROTTLE=devtools desktop run would be network-throttled like a
         phone. The simulated default reads only the first three. */
      const result = await lighthouse(
        url,
        { port: chrome.port, output: "json", logLevel: "error", ...(DEVTOOLS ? { throttlingMethod: "devtools" } : {}) },
        preset === "desktop"
          ? {
              extends: "lighthouse:default",
              settings: {
                formFactor: "desktop",
                screenEmulation: { disabled: true },
                throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 },
              },
            }
          : undefined,
      );

      const c = result.lhr.categories;
      const a = result.lhr.audits;

      return {
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
        lcpMs: a["largest-contentful-paint"]?.numericValue ?? null,
        clsValue: a["cumulative-layout-shift"]?.numericValue ?? null,
        tbtMs: a["total-blocking-time"]?.numericValue ?? null,
        lcpElement: lcpElementOf(a),
        /* The actual reasons a score is what it is — otherwise this report
           says a page is slow without ever saying why. */
        failing: Object.entries(a)
          .filter(([, x]) => typeof x.score === "number" && x.score < 0.9)
          .sort((x, y) => x[1].score - y[1].score)
          .slice(0, 12)
          .map(([id, x]) => `${id}${x.displayValue ? ` (${x.displayValue})` : ""}`),
      };
    } catch (err) {
      return { preset, label, route, error: err.message.split("\n")[0] };
    }
  };

  for (const preset of presets) {
    for (const [route, label] of ROUTES) {
      if (RUNS === 1) {
        const r = await once(preset, route, label);
        if (r.error) {
          rows.push({ preset, label, route, error: r.error });
          console.log(`  ${preset.padEnd(8)} ${label.padEnd(18)} ERROR`);
          continue;
        }
        /* One run keeps today's row exactly: the numeric fields are only for medians. */
        const row = { ...r };
        delete row.lcpMs;
        delete row.clsValue;
        delete row.tbtMs;
        rows.push(row);
        console.log(
          `  ${preset.padEnd(8)} ${label.padEnd(18)} P${r.performance} A${r.accessibility} BP${r.bestPractices} SEO${r.seo}  LCP ${r.lcp}  CLS ${r.cls}`,
        );
        continue;
      }

      /* Several runs: the median is the reading, the worst is the floor. */
      const runs = [];
      for (let n = 0; n < RUNS; n++) runs.push(await once(preset, route, label));
      const ok = runs.filter((r) => !r.error);
      if (!ok.length) {
        rows.push({ preset, label, route, error: runs[0].error, runs: runs.map((r) => ({ error: r.error })) });
        console.log(`  ${preset.padEnd(8)} ${label.padEnd(18)} ERROR (all ${RUNS} runs)`);
        continue;
      }
      const perf = ok.map((r) => r.performance).filter((x) => x !== null);
      const med = (key) => {
        const m = median(ok.map((r) => r[key]).filter((x) => x !== null));
        return m === null ? null : Math.round(m);
      };
      const performance = perf.length ? Math.round(median(perf)) : null;
      /* The run whose score sits at the median supplies the LCP element and the
         failing audits, so they describe a typical run, not an outlier. */
      const typical = [...ok].sort((x, y) => Math.abs(x.performance - performance) - Math.abs(y.performance - performance))[0];
      const lcpMed = median(ok.map((r) => r.lcpMs).filter((x) => x !== null));
      const clsMed = median(ok.map((r) => r.clsValue).filter((x) => x !== null));
      const tbtMed = median(ok.map((r) => r.tbtMs).filter((x) => x !== null));
      const row = {
        preset,
        label,
        route,
        performance,
        performanceWorst: perf.length ? Math.min(...perf) : null,
        accessibility: med("accessibility"),
        bestPractices: med("bestPractices"),
        seo: med("seo"),
        lcp: lcpMed === null ? "—" : `${(lcpMed / 1000).toFixed(1)} s`,
        cls: clsMed === null ? "—" : clsMed.toFixed(3),
        tbt: tbtMed === null ? "—" : `${Math.round(tbtMed)} ms`,
        lcpElement: typical.lcpElement,
        failing: typical.failing,
        runs: runs.map((r) => (r.error ? { error: r.error } : { performance: r.performance, lcp: r.lcp, cls: r.cls, tbt: r.tbt, lcpElement: r.lcpElement })),
      };
      rows.push(row);
      console.log(
        `  ${preset.padEnd(8)} ${label.padEnd(18)} P${row.performance} (worst ${row.performanceWorst}, ${ok.length}/${RUNS} runs) A${row.accessibility} BP${row.bestPractices} SEO${row.seo}  LCP ${row.lcp} (median)  CLS ${row.cls}`,
      );
    }
  }

  await chrome.kill();

  const json = LABELLED
    ? { label: { source: SOURCE ?? "local build", framework: `next ${framework}`, runs: RUNS, drop: DROP === null ? null : Number(DROP), throttling: DEVTOOLS ? "devtools" : "simulate" }, rows }
    : rows;
  await writeFile(path.join(OUT, `${NAME}.json`), JSON.stringify(json, null, 2), "utf8");

  const flag = (n) => (n === null ? "—" : n >= 90 ? `**${n}**` : `${n} ⚠️`);
  const table = (preset) =>
    RUNS === 1
      ? [
          `| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |`,
          `|---|---|---|---|---|---|---|---|`,
          ...rows
            .filter((r) => r.preset === preset)
            .map((r) =>
              r.error
                ? `| ${r.label} | ERROR | — | — | — | — | — | — |`
                : `| ${r.label} | ${flag(r.performance)} | ${flag(r.accessibility)} | ${flag(r.bestPractices)} | ${flag(r.seo)} | ${r.lcp} | ${r.cls} | ${r.tbt} |`,
            ),
        ].join("\n")
      : [
          `| Page | Performance (median) | Performance (worst) | Accessibility | Best practices | SEO | LCP (median) | CLS | TBT |`,
          `|---|---|---|---|---|---|---|---|---|`,
          ...rows
            .filter((r) => r.preset === preset)
            .map((r) =>
              r.error
                ? `| ${r.label} | ERROR | — | — | — | — | — | — | — |`
                : `| ${r.label} | ${flag(r.performance)} | ${flag(r.performanceWorst)} | ${flag(r.accessibility)} | ${flag(r.bestPractices)} | ${flag(r.seo)} | ${r.lcp} | ${r.cls} | ${r.tbt} |`,
            ),
        ].join("\n");

  const labelBlock = LABELLED
    ? `
Source: ${SOURCE ?? "local build"}. Framework: next ${framework}.
Runs per route: ${RUNS}${RUNS > 1 ? " (median reported; worst performance beside it; CLS and TBT are medians)" : ""}.
Drop level: ${DROP === null ? "none requested" : `?drop=${DROP} on every route (applies at phone widths only)`}.
Throttling: ${DEVTOOLS ? "devtools (information only — the gate reads simulated throttling)" : "simulated (the default)"}.
`
    : "";

  const md = `# Lighthouse

Run against the **production build** (\`npm run build\` + \`next start -p 3004\`),
using Playwright's bundled Chromium. Bold = meets the ≥ 90 target.
${labelBlock}
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

Raw output: \`design-review/${NAME}.json\`.
`;

  await writeFile(path.join(OUT, `${NAME}.md`), md, "utf8");
  console.log(`\nwritten -> design-review/${NAME}.md`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
