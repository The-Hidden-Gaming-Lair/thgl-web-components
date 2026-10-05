#!/usr/bin/env bun
/**
 * Route-parity crawler: request the same URLs (with their ORIGINAL Host
 * header, as Googlebot) from two local production builds and diff everything
 * that matters for users and SEO — status, Location, content type, cache /
 * robots headers, <title>, meta description + robots, canonical, hreflang,
 * OG/Twitter tags, JSON-LD, h1, visible-text hash, internal links.
 *
 * Used to prove the 2026-10 move of game pages onto /g/[game]/[surface]/[locale]
 * changed nothing for 1,889 real-traffic URLs. Use it for any routing/caching
 * refactor:
 *
 *   1. build both versions (`NODE_ENV=production bunx turbo run build
 *      --filter=games-web` in two git worktrees), copy public/ into each
 *      .next/standalone/apps/games-web/
 *   2. run each: `NODE_ENV=production PORT=3201 HOSTNAME=0.0.0.0 node
 *      apps/games-web/server.js` (old) and PORT=3202 (new). HOSTNAME must be
 *      0.0.0.0 like the Dockerfile — 127.0.0.1 makes middleware rewrites go
 *      out over HTTP and re-enter the proxy.
 *   3. bun scripts/route-parity.ts urls.txt out.json [concurrency]
 *      (urls.txt: one absolute URL per line — e.g. sampled from a Bunny
 *      access log). Run it twice and judge the second pass: the first one
 *      hits cold servers.
 */
const [file, out, conc = "6"] = process.argv.slice(2);
const A = "http://127.0.0.1:3201";
const B = "http://127.0.0.1:3202";
const urls = (await Bun.file(file).text()).trim().split("\n").filter(Boolean);

type Snap = Record<string, unknown>;

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
const all = (html: string, re: RegExp) =>
  [...html.matchAll(re)].map((m) => decode(m[1]));
const one = (html: string, re: RegExp) => decode(html.match(re)?.[1] ?? "");

async function hash(s: string) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
  return Buffer.from(buf).toString("hex").slice(0, 12);
}

async function snap(base: string, u: string): Promise<Snap> {
  const url = new URL(u);
  const res = await fetch(base + url.pathname + url.search, {
    headers: {
      Host: url.host,
      "Accept-Encoding": "identity",
      "User-Agent":
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
    redirect: "manual",
    signal: AbortSignal.timeout(90_000),
  });
  const h = (k: string) => res.headers.get(k) ?? "";
  const s: Snap = {
    status: res.status,
    location: h("location"),
    type: h("content-type").split(";")[0],
    cacheControl: h("cache-control"),
    cdnCacheControl: h("cdn-cache-control"),
    robotsHeader: h("x-robots-tag"),
  };
  const body = await res.text();
  if (s.type === "text/html") {
    const head = body.slice(0, body.indexOf("</head>") + 7);
    s.title = one(head, /<title>([^<]*)<\/title>/);
    s.description = one(head, /<meta name="description" content="([^"]*)"/);
    s.robots = one(head, /<meta name="robots" content="([^"]*)"/);
    s.canonical = one(head, /<link rel="canonical" href="([^"]*)"/);
    s.hreflang = all(
      head,
      /<link rel="alternate" hrefLang="([^"]*" href="[^"]*)"/g,
    )
      .sort()
      .join(" | ");
    s.og = all(head, /<meta property="og:([a-z:_]+" content="[^"]*)"/g)
      .sort()
      .join(" | ");
    s.twitter = all(head, /<meta name="twitter:([a-z:_]+" content="[^"]*)"/g)
      .sort()
      .join(" | ");
    s.jsonld = await hash(
      all(
        body,
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
      ).join("\n"),
    );
    s.h1 = one(body, /<h1[^>]*>([\s\S]*?)<\/h1>/)
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    s.lang = one(body, /<html lang="([^"]*)"/);
    // visible text: drop scripts/styles/tags, collapse whitespace
    const text = body
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z#0-9]+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    s.textLen = text.length;
    s.text = await hash(text);
    s.links = await hash(
      all(body, /<a [^>]*href="([^"]*)"/g)
        .sort()
        .join("\n"),
    );
    s.linkCount = all(body, /<a [^>]*href="([^"]*)"/g).length;
  } else {
    s.bodyLen = body.length;
    s.body = await hash(body);
  }
  return s;
}

const results: {
  url: string;
  a?: Snap;
  b?: Snap;
  diff: string[];
  err?: string;
}[] = [];
let i = 0;
async function worker() {
  while (i < urls.length) {
    const u = urls[i++];
    try {
      const [a, b] = await Promise.all([snap(A, u), snap(B, u)]);
      const diff = Object.keys({ ...a, ...b }).filter(
        (k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]),
      );
      results.push({ url: u, a, b, diff });
    } catch (e) {
      results.push({ url: u, diff: ["ERROR"], err: String(e) });
    }
    if (results.length % 100 === 0)
      process.stderr.write(`\r${results.length}/${urls.length}`);
  }
}
await Promise.all(Array.from({ length: Number(conc) }, worker));
process.stderr.write("\n");
await Bun.write(out, JSON.stringify(results, null, 1));
const byField = new Map<string, number>();
for (const r of results)
  for (const d of r.diff) byField.set(d, (byField.get(d) ?? 0) + 1);
console.log(
  `${results.length} urls, ${results.filter((r) => r.diff.length === 0).length} identical`,
);
console.log(
  [...byField]
    .sort((x, y) => y[1] - x[1])
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n"),
);
