/**
 * The whole quality gate, in one command, on any platform.
 *
 * `npm run qa` runs everything that can fail this site: the static audits that
 * read the source, then a real production server with the browser-driven audits
 * pointed at it. It starts the server itself and stops it again, because half
 * these checks need one and remembering to start it by hand is how a green run
 * turns out to have measured nothing.
 *
 * This replaces `scripts/with-server.ps1` for anything that has to run in CI —
 * that script is PowerShell and GitHub Actions runs Linux. The PowerShell one
 * stays for ad-hoc local use with a single audit.
 *
 * Lighthouse is deliberately NOT here. It needs a stable machine to produce
 * comparable numbers and takes several minutes; it stays a local, deliberate
 * measurement (`npm run audit:lighthouse`). INP is not here either, for the
 * same reason: a 4x CPU throttle on top of this machine's own speed is not a
 * number two machines agree on (`npm run audit:inp`).
 *
 * Usage: npm run qa              — everything
 *        npm run qa -- --static  — only the checks that need no server
 */

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = Number(process.env.PORT ?? 3004);
/* Loopback, not localhost: the server below binds 127.0.0.1 only, and
   "localhost" can resolve to ::1 first. */
const BASE = `http://127.0.0.1:${PORT}`;
const STATIC_ONLY = process.argv.includes("--static");

/** Audits that read the repository. No server, no browser. */
const STATIC_CHECKS = [
  ["typecheck", ["node_modules/typescript/bin/tsc", "--noEmit"], "TypeScript compiles"],
  ["lint", ["node_modules/eslint/bin/eslint.js", "."], "ESLint is clean"],
  /* Stage 4's completion test: a count that has to be zero. */
  ["palette", ["scripts/palette-literals.mjs"], "zero palette literals outside the token definitions"],
  ["claims", ["scripts/claims-audit.mjs"], "no claim on the site is unsupported by content/"],
  ["prose", ["scripts/prose-audit.mjs"], "no placeholder, no lorem, no double space"],
  ["media", ["scripts/media-audit.mjs"], "every image and video referenced actually exists"],
  ["manifest", ["scripts/publish-manifest.mjs"], "no withheld frame is referenced anywhere"],
  /* Owner decision 2026-09-14: no published file may carry GPS, a camera serial
     or an embedded thumbnail, ever again. Reads every git-tracked image, video
     and PDF by magic bytes; photographer credit is kept and never fails. */
  ["metadata", ["scripts/metadata-audit.mjs"], "no file carries GPS, a camera serial or a hidden thumbnail"],
  ["ingest", ["scripts/ingest-guard.mjs"], "no gallery is half-published with unfilled TODOs"],
];

/** Audits that drive a browser against a running production build. */
const SERVED_CHECKS = [
  ["assets", ["scripts/asset-check.mjs"], "every asset the rendered pages request returns 200"],
  ["a11y", ["scripts/a11y.mjs"], "axe-core finds zero violations"],
  /*
   * This slot used to hold the graffiti check, which asked whether a rock stayed
   * hidden inside the ink band. The ink band is gone from the arrival, so the
   * question it guarded no longer exists; the live risk on a light ground is the
   * opposite one. Swapped rather than dropped, so coverage never shrinks.
   */
  ["arrival", ["scripts/arrival-legibility.mjs"], "the arrival type holds over the photograph it sits on"],
  /* Stage 4 depended on these three; they are the light system's own guards. */
  ["ground", ["scripts/ground-verify.mjs"], "every role resolves on its ground; all text on its own ladder"],
  ["focus", ["scripts/focus-ring.mjs"], "every focus indicator changes the page by 3:1, all round"],
  ["paper", ["scripts/paper-legibility.mjs"], "all text on paper clears its bar on the worst pixel"],
  ["launch", ["scripts/launch-check.mjs"], "SEO flips, sitemap and all 21 legacy redirects"],
  /* Stage 6, motion on paper. All three are deterministic: they read states,
     computed styles and pixels at fixed moments, not timings that vary with
     the machine (INP does, which is why it stays out — see the header). */
  ["motion-tier", ["scripts/motion-tier.mjs"], "the drop switch applies its prefix at 390, nothing at 1440"],
  ["focus-motion", ["scripts/focus-motion.mjs"], "a focused element is never hidden, clipped or covered"],
  ["typeset-clip", ["scripts/typeset-clip.mjs"], "no TextReveal line clips its own ink"],
];

const results = [];
/* The name column fits the longest name, so a new check never breaks the table. */
const NAME_WIDTH = Math.max(...[...STATIC_CHECKS, ...SERVED_CHECKS].map(([name]) => name.length)) + 1;

function run(args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, ...env },
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    /*
     * Report the signal, not just the code. A check killed from outside — the
     * OS reclaiming memory while several Chromium instances are alive at once,
     * a terminal closing the pipe — exits with a null code and a signal, and
     * reporting that as a plain failure sends you looking for a bug in the site
     * that is not there. It has cost real time on this machine more than once.
     */
    child.on("close", (code, signal) => resolve({ code, signal, out }));
  });
}

async function section(title, checks, env) {
  console.log(`\n${title}`);
  for (const [name, args, what] of checks) {
    process.stdout.write(`  ${name.padEnd(NAME_WIDTH)} ${what.padEnd(58)}`);
    const { code, signal, out } = await run(args, env);
    const ok = code === 0;
    results.push({ name, ok, signal, out });
    console.log(ok ? "ok" : signal ? `KILLED (${signal})` : "FAIL");
    if (!ok) {
      if (signal) {
        console.log(`      killed by ${signal} — this is the machine, not the site.`);
        console.log(`      re-run it on its own: node ${args[0]}`);
      }
      console.log(out.split("\n").slice(-25).map((l) => `      ${l}`).join("\n"));
    }
  }
}

console.log(`QA GATE  ${new Date().toISOString().slice(0, 16).replace("T", " ")}`);

await section("static — reads the repository", STATIC_CHECKS);

let server = null;
if (!STATIC_ONLY) {
  /*
   * Refuse to run if something is already on the port.
   *
   * Otherwise this happily measures a server it did not start — a stale build,
   * or a leftover from an interrupted run — and returns a verdict about the
   * wrong bytes. That is worse than not running at all, because it is green.
   * It cost one confusing failure already.
   */
  let occupied = true;
  try {
    await fetch(BASE, { redirect: "manual" });
  } catch {
    occupied = false;
  }
  if (occupied) {
    console.log(`\nsomething is already serving ${BASE}.`);
    console.log("stop it first — this has to measure the build it starts itself.");
    process.exit(1);
  }

  console.log(`\nstarting a production server on ${PORT}`);
  /* Loopback only. Without -H, next start listens on every interface, and a
     build of a vulnerable next (GHSA-p293-qw3h-jr36 / CVE-2026-75604 is an RCE
     on Windows-hosted servers) would be reachable from the network while the
     gate runs. The gate only ever needs this machine to reach it. */
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORT), "-H", "127.0.0.1"], {
    stdio: "ignore",
    env: { ...process.env, NODE_ENV: "production" },
  });

  let ready = false;
  for (let i = 0; i < 60 && !ready; i++) {
    await sleep(1000);
    try {
      ready = (await fetch(BASE, { redirect: "manual" })).status < 500;
    } catch {
      /* not up yet */
    }
  }
  if (!ready) {
    console.log("  the server never came up — run `npm run build` first");
    server.kill();
    process.exit(1);
  }
  console.log("  ready");

  await section("served — drives a browser against that server", SERVED_CHECKS, { SHOTS_BASE: BASE });
  server.kill();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${"-".repeat(72)}`);
console.log(`${results.length - failed.length}/${results.length} green`);
if (failed.length) {
  console.log(`failed: ${failed.map((f) => f.name).join(", ")}`);
  process.exit(1);
}
console.log("the gate is green.");
