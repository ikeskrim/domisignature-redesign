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
 * measurement (`npm run audit:lighthouse`).
 *
 * Usage: npm run qa              — everything
 *        npm run qa -- --static  — only the checks that need no server
 */

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = Number(process.env.PORT ?? 3004);
const BASE = `http://localhost:${PORT}`;
const STATIC_ONLY = process.argv.includes("--static");

/** Audits that read the repository. No server, no browser. */
const STATIC_CHECKS = [
  ["typecheck", ["node_modules/typescript/bin/tsc", "--noEmit"], "TypeScript compiles"],
  ["lint", ["node_modules/eslint/bin/eslint.js", "."], "ESLint is clean"],
  ["claims", ["scripts/claims-audit.mjs"], "no claim on the site is unsupported by content/"],
  ["prose", ["scripts/prose-audit.mjs"], "no placeholder, no lorem, no double space"],
  ["media", ["scripts/media-audit.mjs"], "every image and video referenced actually exists"],
  ["manifest", ["scripts/publish-manifest.mjs"], "no withheld frame is referenced anywhere"],
  ["ingest", ["scripts/ingest-guard.mjs"], "no gallery is half-published with unfilled TODOs"],
];

/** Audits that drive a browser against a running production build. */
const SERVED_CHECKS = [
  ["assets", ["scripts/asset-check.mjs"], "every asset the rendered pages request returns 200"],
  ["a11y", ["scripts/a11y.mjs"], "axe-core finds zero violations"],
  ["graffiti", ["scripts/graffiti-check.mjs"], "the graffiti rock stays inside the ink band"],
  ["launch", ["scripts/launch-check.mjs"], "SEO flips, sitemap and all 21 legacy redirects"],
];

const results = [];

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
    process.stdout.write(`  ${name.padEnd(10)} ${what.padEnd(58)}`);
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
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)], {
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
