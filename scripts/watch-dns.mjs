/**
 * Watch for the DNS cutover, patiently, in re-armable chunks.
 *
 * Polls the apex A record from a public resolver (never a local cache) and the
 * live site itself. Prints only when something changes, plus a heartbeat, so
 * silence is never ambiguous.
 *
 * THE SENTINEL. "Rethymno" appears in the HTML of BOTH sites — it is the same
 * business — so matching it would have declared victory the moment DNS moved,
 * before the new site had served a single byte. A dry run caught that. The
 * discriminating pair is:
 *
 *   - an `x-vercel-id` response header, which only Vercel sets, and
 *   - `/venues` returning 200, which the old one-page site 404s.
 *
 * Exit codes: 0 live, 2 six hours elapsed with no change, 3 this chunk ended
 * with nothing to report (re-arm me). Cumulative elapsed time is kept in a
 * state file so the six-hour rule survives being re-armed.
 *
 * Usage: node scripts/watch-dns.mjs [--max-minutes=9]
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const VERCEL_IPS = ["216.198.79.1", "64.29.17.1", "76.76.21.21"];
const LIVE = "https://domisignature.com";
const POLL_MS = 45_000;
const GIVE_UP_MIN = 360;

const STATE_DIR = process.env.WATCH_STATE_DIR ?? path.join(process.cwd(), ".dns-watch");
const STATE = path.join(STATE_DIR, "state.json");

const maxMinutes = Number(
  (process.argv.find((a) => a.startsWith("--max-minutes=")) ?? "--max-minutes=9").split("=")[1],
);

/*
 * Exiting on Windows while a fetch socket is still closing trips a libuv
 * assertion — "!(handle->flags & UV_HANDLE_CLOSING)" — and the process dies
 * with code 127 AFTER printing everything correctly. That looked like a
 * missing command and killed two background watchers before the assertion
 * text gave it away. Letting the loop turn a few times first lets undici's
 * keep-alive sockets close cleanly.
 */
async function bail(code) {
  await new Promise((r) => setTimeout(r, 400));
  process.exit(code);
}

let state = { elapsedMin: 0, lastA: null, beats: 0 };
try {
  state = { ...state, ...JSON.parse(await readFile(STATE, "utf8")) };
} catch {
  /* first run */
}

const chunkStart = Date.now();
const chunkMin = () => Math.floor((Date.now() - chunkStart) / 60000);
const totalMin = () => state.elapsedMin + chunkMin();
const say = (m) => console.log(`[${String(totalMin()).padStart(3)}m] ${m}`);

async function save() {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE, JSON.stringify({ ...state, elapsedMin: totalMin() }), "utf8");
}

async function apexA() {
  try {
    const r = await fetch("https://dns.google/resolve?name=domisignature.com&type=A", {
      headers: { accept: "application/dns-json" },
      signal: AbortSignal.timeout(15000),
    });
    const j = await r.json();
    return (j.Answer ?? []).filter((a) => a.type === 1).map((a) => a.data).sort().join(", ") || "(none)";
  } catch {
    return "(resolver error)";
  }
}

/** Both conditions, because either alone is a lie. */
async function servesNewBuild() {
  try {
    const home = await fetch(`${LIVE}/`, { signal: AbortSignal.timeout(20000) });
    const vercel = home.headers.get("x-vercel-id");
    if (!vercel) return { ok: false, why: `no x-vercel-id (server: ${home.headers.get("server") ?? "?"})` };
    const venues = await fetch(`${LIVE}/venues`, { signal: AbortSignal.timeout(20000) });
    if (venues.status !== 200) return { ok: false, why: `/venues -> ${venues.status}` };
    return { ok: true, vercel };
  } catch (e) {
    return { ok: false, why: String(e).slice(0, 70) };
  }
}

if (state.lastA === null) {
  say(`watching domisignature.com — expecting the apex to move to one of ${VERCEL_IPS.join(" / ")}`);
}

for (;;) {
  if (totalMin() >= GIVE_UP_MIN) {
    say("SIX HOURS elapsed with no DNS change — stopping cleanly.");
    await save();
    await bail(2);
  }

  const a = await apexA();

  if (a !== state.lastA && a !== "(resolver error)") {
    if (state.lastA !== null) say(`apex A changed:  ${state.lastA}  ->  ${a}`);
    else say(`apex A is currently ${a}`);
    state.lastA = a;
    await save();
  }

  if (VERCEL_IPS.some((ip) => a.includes(ip))) {
    say("apex now points at Vercel — waiting for TLS and the first good response");
    for (let i = 0; i < 60; i++) {
      const s = await servesNewBuild();
      if (s.ok) {
        say(`LIVE — domisignature.com is served by Vercel and /venues returns 200 (${s.vercel})`);
        await save();
        await bail(0);
      }
      if (i === 0 || i === 15 || i === 40) say(`  not yet: ${s.why}`);
      await new Promise((r) => setTimeout(r, 20000));
    }
    say("DNS moved but the site has not answered for 20 minutes — still watching");
  }

  if (chunkMin() >= maxMinutes) {
    await save();
    await bail(3);
  }

  await new Promise((r) => setTimeout(r, POLL_MS));
}
