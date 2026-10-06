#!/usr/bin/env node
// @ts-check
/**
 * Decide what a games-web deploy has to purge from the Bunny edge (pull zone
 * 5829962, every *.th.gl tenant) instead of emptying the whole zone.
 *
 * Why: every deploy used to run a FULL purge. At 18-30 deploys a day the edge
 * cache never warmed up: the hit rate fell from 65% to 36% in three days
 * (2026-10-04..06) and every purge sent the whole site's traffic to freshly
 * started pods. Pages are safe to keep: old builds' chunks stay on
 * static.th.gl, so cached HTML of an older build still works.
 *
 * Classification of the files changed between the live build and the new one:
 *   - none:   server-only code that never reaches page HTML (API routes,
 *             instrumentation, cache handler, tests, scripts, docs, the Docker
 *             image). Nothing to purge.
 *   - tenant: one site's own files (configs/<tenant>.ts, games/<game>/**,
 *             packages/ui/src/dicts/<app>.<locale>.json). Purge that site only
 *             (`https://<host>/*`, one wildcard per host).
 *   - shared: everything else that renders pages (packages/ui, packages/lib,
 *             layouts, shared routes, public assets). NOT purged: page edge
 *             TTL is 1 h with stale-while-revalidate (next.config.js), so
 *             shared changes reach every edge within ~1 h while the cache
 *             stays warm. `purge: full` on a manual run forces it.
 *
 * Usage (CI): node apps/games-web/scripts/purge-plan.mjs <prevSha> <newSha>
 * prints {mode: "none"|"tenants"|"full", reason, urls, files}.
 * Falls back to "full" when prevSha is unknown (first deploy, shallow clone).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "..",
  "..",
);

const NONE = [
  /^apps\/games-web\/src\/app\/api\//,
  /^apps\/games-web\/src\/app\/www\/api\//,
  /^apps\/games-web\/src\/instrumentation\.ts$/,
  /^apps\/games-web\/src\/lib\/pod-health\.ts$/,
  /^apps\/games-web\/src\/lib\/status-(document|checks|db)\.ts$/,
  /^apps\/games-web\/cache-handler\.cjs$/,
  /^apps\/games-web\/Dockerfile$/,
  // Companion-app update gate: own 30 s edge TTL (next.config.js updateGateCache).
  /^apps\/games-web\/public\/games\/thgl-app\/(version\.txt|manifest\.bin|THGL_Installer\.exe)$/,
  /^apps\/games-web\/(scripts|e2e)\//,
  /^apps\/games-web\/playwright\.config\.ts$/,
  /\.(test|spec)\.[cm]?[jt]sx?$/,
  /\.md$/,
  /^\.github\//,
];

/**
 * @param {string} file repo-relative path, forward slashes
 * @returns {{kind: "none"} | {kind: "tenant", app: string} | {kind: "shared"}}
 */
export function classify(file) {
  if (NONE.some((re) => re.test(file))) return { kind: "none" };
  let m = file.match(/^apps\/games-web\/src\/configs\/([^/]+)\.ts$/);
  if (m && m[1] !== "index") return { kind: "tenant", app: m[1] };
  m = file.match(/^apps\/games-web\/src\/games\/([^/]+)\//);
  if (m) return { kind: "tenant", app: m[1] };
  m = file.match(/^packages\/ui\/src\/dicts\/([a-z0-9-]+)\.[A-Za-z-]+\.json$/);
  if (m) return { kind: "tenant", app: m[1] };
  return { kind: "shared" };
}

/**
 * App id -> public origin. games.ts `web:` for games; `domain:` in the app's
 * config for the non-game tenants (www, app).
 * @param {(path: string) => string | null} read file content at the new commit
 * @returns {Map<string, string>}
 */
export function tenantHosts(read) {
  /** @type {Map<string, string>} */
  const hosts = new Map();
  const games = read("packages/lib/src/games.ts") ?? "";
  let id = null;
  for (const line of games.split("\n")) {
    const idm = line.match(/^ {4}id: "([^"]+)"/);
    if (idm) id = idm[1];
    const webm = line.match(/^ {4}web: "(https:\/\/[^"]+)"/);
    if (webm && id) hosts.set(id, webm[1].replace(/\/$/, ""));
  }
  return hosts;
}

/**
 * @param {string[]} files
 * @param {(path: string) => string | null} read
 */
export function plan(files, read) {
  const hosts = tenantHosts(read);
  const apps = new Set();
  const shared = [];
  for (const f of files) {
    const c = classify(f);
    if (c.kind === "tenant") apps.add(c.app);
    else if (c.kind === "shared") shared.push(f);
  }
  const urls = [];
  const unknown = [];
  for (const app of apps) {
    let host = hosts.get(app);
    if (!host) {
      const cfg = read(`apps/games-web/src/configs/${app}.ts`) ?? "";
      const d = cfg.match(/^\s*domain:\s*"([a-z0-9-]+)"/m);
      if (d) host = `https://${d[1]}.th.gl`;
    }
    if (host) urls.push(`${host}/*`);
    else unknown.push(app);
  }
  if (unknown.length) {
    // A tenant file we can't map to a host: purge everything rather than
    // leave that site stale for an hour.
    return {
      mode: "full",
      reason: `unmapped tenant(s): ${unknown.join(", ")}`,
      urls: [],
      files,
    };
  }
  const reason = [
    urls.length ? `tenant files for ${[...apps].join(", ")}` : null,
    shared.length
      ? `${shared.length} shared file(s) refresh via the 1 h edge TTL`
      : null,
  ]
    .filter(Boolean)
    .join("; ");
  return {
    mode: urls.length ? "tenants" : "none",
    reason: reason || "only server-side files changed",
    urls: urls.sort(),
    files,
  };
}

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [prev, next] = process.argv.slice(2);
  const git = (/** @type {string[]} */ ...args) =>
    execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 << 20,
    });
  const out = (o) => console.log(JSON.stringify(o));
  let known = false;
  try {
    known =
      Boolean(prev) &&
      /^[0-9a-f]{7,40}$/.test(prev) &&
      Boolean(git("cat-file", "-t", prev).trim());
  } catch {
    known = false;
  }
  if (!known) {
    out({
      mode: "full",
      reason: `previous build ${prev || "(none)"} not found in git`,
      urls: [],
      files: [],
    });
  } else {
    const files = git("diff", "--name-only", `${prev}..${next}`)
      .split("\n")
      .filter(Boolean);
    const read = (/** @type {string} */ p) => {
      try {
        return git("show", `${next}:${p}`);
      } catch {
        const abs = join(ROOT, p);
        return existsSync(abs) ? readFileSync(abs, "utf8") : null;
      }
    };
    out(plan(files, read));
  }
}
