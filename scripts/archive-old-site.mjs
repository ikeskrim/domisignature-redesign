/**
 * Archive the live old site before the cutover.
 *
 * The photographs were mirrored in Phase 1. This preserves the other half — the
 * served HTML and, just as importantly, the response headers — so that after
 * DNS moves there is still a record of exactly what the old host was sending.
 * If a redirect or a header turns out to have mattered, this is the only place
 * that answer will still exist.
 *
 * Read-only. It fetches the owner's own live site and writes into
 * design-review/launch/old-site/. It downloads no media: images and video are
 * already mirrored, and re-pulling 100 MB to archive words would be silly.
 *
 * Usage: node scripts/archive-old-site.mjs [origin]
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = (process.argv[2] ?? "https://domisignature.com").replace(/\/$/, "");
const OUT = path.join(ROOT, "design-review", "launch", "old-site");

const MEDIA = /\.(jpe?g|png|gif|webp|avif|svg|ico|mp4|webm|mov|pdf|woff2?|ttf|eot)$/i;

await mkdir(OUT, { recursive: true });

const queue = ["/", "/index.html", "/robots.txt", "/sitemap.xml", "/css/styles.css", "/js/scripts.js", "/no-such-page-launch-probe"];
const seen = new Set();
const rows = [];

function slug(p) {
  const s = p.replace(/^\//, "").replace(/[^a-zA-Z0-9._-]/g, "_");
  return s === "" ? "index" : s;
}

while (queue.length) {
  const pathname = queue.shift();
  if (seen.has(pathname)) continue;
  seen.add(pathname);

  let res;
  try {
    res = await fetch(`${ORIGIN}${pathname}`, { redirect: "manual" });
  } catch (e) {
    rows.push({ pathname, status: "ERROR", note: String(e).slice(0, 80) });
    console.log(`  ERR   ${pathname}  ${String(e).slice(0, 60)}`);
    continue;
  }

  const headers = [...res.headers].map(([k, v]) => `${k}: ${v}`).sort().join("\n");
  const ct = res.headers.get("content-type") ?? "";
  const name = slug(pathname);

  await writeFile(path.join(OUT, `${name}.headers.txt`), `${res.status} ${res.statusText}\n\n${headers}\n`, "utf8");

  let bytes = 0;
  if (!MEDIA.test(pathname) && (ct.includes("text") || ct.includes("xml") || ct.includes("json") || ct === "")) {
    const body = await res.text();
    bytes = body.length;
    await writeFile(path.join(OUT, `${name}.html`), body, "utf8");

    /* Follow same-origin HTML links only. The old site is a one-pager, so this
       finds little — which is itself worth recording. */
    if (ct.includes("html")) {
      for (const m of body.matchAll(/href="([^"#]+)"/g)) {
        const href = m[1];
        if (/^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
        if (MEDIA.test(href)) continue;
        const p = href.startsWith("/") ? href : `/${href}`;
        if (!seen.has(p) && queue.length < 60) queue.push(p);
      }
    }
  }

  rows.push({
    pathname,
    status: res.status,
    location: res.headers.get("location") ?? "",
    ct: ct.split(";")[0],
    server: res.headers.get("server") ?? "",
    bytes,
  });
  console.log(`  ${String(res.status).padEnd(4)} ${pathname.padEnd(34)} ${ct.split(";")[0].padEnd(26)} ${bytes ? `${bytes} B` : ""}`);
}

const md = `# Old site archive — ${ORIGIN}

Captured before the DNS cutover. Served HTML and response headers only; the
photography was already mirrored in Phase 1.

| Path | Status | Content-Type | Server | Bytes | Location |
| --- | --- | --- | --- | --- | --- |
${rows.map((r) => `| \`${r.pathname}\` | ${r.status} | ${r.ct ?? ""} | ${r.server ?? ""} | ${r.bytes || ""} | ${r.location || ""} |`).join("\n")}

Each row has a \`.headers.txt\` beside it, and a \`.html\` where the response had a
body worth keeping.
`;
await writeFile(path.join(OUT, "README.md"), md, "utf8");

console.log(`\n${rows.length} responses archived -> design-review/launch/old-site/`);
