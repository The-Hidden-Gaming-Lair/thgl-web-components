#!/usr/bin/env node
// @ts-check
/**
 * Decide what a games-web deploy has to purge from the Bunny edge (pull zone
 * 5829962, every *.th.gl tenant), so a deploy shows its changes immediately
 * without emptying the whole zone.
 *
 * Why: every deploy used to run a FULL purge. At 18-30 deploys a day the edge
 * cache never warmed up (hit rate 65% -> 36%, 2026-10-04..06). Pages are safe
 * to keep: old builds' chunks stay on static.th.gl, so older cached HTML works.
 *
 * Every page response carries a Bunny `CDN-Tag` header (src/proxy.ts):
 *   g             every game page (website, Companion App content, embeds)
 *   t-<app>       one app's pages (t-palia, t-thgl-web = www, t-thgl-app)
 *   r-<section>   one route section on every site (r-db, r-maps, r-home, ...)
 * and one tag purge evicts every cached copy zone-wide.
 *
 * For each file changed between the live build and the new one:
 *   - server-only files (API routes, instrumentation, scripts, tests, docs): nothing
 *   - a site's own files (configs/<app>.ts, games/<app>/**, dicts/<app>.*.json,
 *     public/games/<app>/**): that site (host wildcard + tag t-<app>)
 *   - route files under src/app: the tag of their route (r-db, g for the game
 *     layout, t-thgl-web for www, t-thgl-app for the Companion App's own pages)
 *   - any other source file: the routes whose files import it, via the static
 *     import graph (import-graph.mjs, barrels resolved per imported name).
 *     Reached by no route = nothing to purge.
 *   - routing/build-wide files (proxy, next.config, package manifests, global
 *     CSS/Tailwind, changed public assets) or anything unmappable: FULL purge.
 *
 * Usage (CI): node apps/games-web/scripts/purge-plan.mjs <prevSha> <newSha>
 * prints {mode: "none"|"purge"|"full", reason, urls, tags, files}.
 * The graph is built from the checked-out tree (= newSha in CI).
 */
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildGraph, fsReader, listSourceFiles } from "./import-graph.mjs";

const ROOT = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "..",
  "..",
);

const NONE = [
  /^apps\/games-web\/src\/app\/api\//,
  /^apps\/games-web\/src\/app\/www\/api\//,
  /^apps\/games-web\/src\/app\/(robots\.ts|sitemap|sitemap\.xml|llms\.txt)\b/,
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
  // Other apps in the monorepo (Overwolf apps, desktop): not served by games-web.
  /^apps\/(?!games-web\/)/,
  /^turbo\.json$/,
  /^packages\/config-(typescript|eslint)\//,
  /(^|\/)(tsconfig[^/]*\.json|eslint\.config\.[cm]?js|\.prettierrc[^/]*)$/,
];

/** Files whose change affects every page: full purge. */
const FULL = [
  /^apps\/games-web\/src\/proxy\.ts$/,
  /^apps\/games-web\/next\.config\.js$/,
  /(^|\/)package\.json$/,
  /^bun\.lock$/,
  /^apps\/games-web\/(tailwind|postcss)\.config\.[cm]?[jt]s$/,
  /^packages\/config-tailwind\//,
  /\.css$/,
];

/**
 * Tenant-owned files (not traced through the graph: configs/index.ts imports
 * every config, so the graph would wrongly reach every route).
 * @param {string} file
 * @returns {string | null}
 */
export function tenantOf(file) {
  let m = file.match(/^apps\/games-web\/src\/configs\/([^/]+)\.ts$/);
  if (m && m[1] !== "index") return m[1];
  m = file.match(/^apps\/games-web\/src\/games\/([^/]+)\//);
  if (m) return m[1];
  m = file.match(/^packages\/ui\/src\/dicts\/([a-z0-9-]+)\.[A-Za-z-]+\.json$/);
  if (m) return m[1];
  m = file.match(/^apps\/games-web\/public\/games\/([^/]+)\//);
  if (m) return m[1];
  return null;
}

const LOCALE_ROOT = "apps/games-web/src/app/g/[game]/[surface]/[locale]/";

/**
 * The purge tag of a route file under src/app (what src/proxy.ts tags its
 * responses with), "none" for non-page routes, "full" when unknown.
 * @param {string} file
 * @returns {string | null} null = not a route file
 */
export function routeTag(file) {
  if (!file.startsWith("apps/games-web/src/app/")) return null;
  const rel = file.slice("apps/games-web/src/app/".length);
  if (
    /^(api|www\/api)\//.test(rel) ||
    /^(robots\.ts|sitemap|llms\.txt)/.test(rel)
  )
    return "none";
  if (file.startsWith(LOCALE_ROOT)) {
    const rest = file.slice(LOCALE_ROOT.length);
    if (!rest.includes("/"))
      return /^(page|opengraph-image|twitter-image)\./.test(rest)
        ? "r-home"
        : "g";
    return `r-${rest.split("/")[0]}`;
  }
  if (rel.startsWith("g/")) return "g";
  if (rel.startsWith("www/")) return "t-thgl-web";
  if (rel.startsWith("(app)/")) return "t-thgl-app";
  return "full";
}

/**
 * App id -> public origin. games.ts `web:` for games; `domain:` in the app's
 * config for the non-game tenants (www, app).
 * @param {(path: string) => string | null} read
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
 * @param {{ path: string, status: string }[]} changes git name-status (A/M/D/R...)
 * @param {(path: string) => string | null} read file at the new commit
 * @param {{ reachedFrom: (f: string) => Set<string> }} graph
 */
export function plan(changes, read, graph) {
  const files = changes.map((c) => c.path);
  const tags = new Set();
  const apps = new Set();
  /** @type {string[]} */
  const fullBecause = [];
  const traced = [];
  for (const { path, status } of changes) {
    if (NONE.some((re) => re.test(path))) continue;
    if (FULL.some((re) => re.test(path))) {
      fullBecause.push(path);
      continue;
    }
    const app = tenantOf(path);
    if (app) {
      apps.add(app);
      continue;
    }
    if (path.startsWith("apps/games-web/public/")) {
      // A new public file is never cached yet; a changed one is served on every host.
      if (status !== "A") fullBecause.push(path);
      continue;
    }
    const own = routeTag(path);
    if (own) {
      if (own === "full") fullBecause.push(path);
      else if (own !== "none") tags.add(own);
      continue;
    }
    if (!/^(apps\/games-web\/src|packages\/(ui|lib)\/src)\//.test(path)) {
      fullBecause.push(path); // outside every known area: be safe
      continue;
    }
    if (status === "D") continue; // its importers changed too and are traced
    traced.push(path);
    for (const f of graph.reachedFrom(path)) {
      const t = routeTag(f);
      if (t === "full") fullBecause.push(`${path} (via ${f})`);
      else if (t && t !== "none") tags.add(t);
    }
  }
  if (fullBecause.length) {
    return {
      mode: "full",
      reason: `affects every page: ${fullBecause.slice(0, 3).join(", ")}${fullBecause.length > 3 ? ", ..." : ""}`,
      urls: [],
      tags: [],
      files,
    };
  }
  const hosts = tenantHosts(read);
  const urls = [];
  for (const app of apps) {
    let host = hosts.get(app);
    if (!host) {
      const cfg = read(`apps/games-web/src/configs/${app}.ts`) ?? "";
      const d = cfg.match(/^\s*domain:\s*"([a-z0-9-]+)"/m);
      if (d) host = `https://${d[1]}.th.gl`;
    }
    if (!host)
      return {
        mode: "full",
        reason: `unmapped tenant: ${app}`,
        urls: [],
        tags: [],
        files,
      };
    urls.push(`${host}/*`); // pages cached before CDN-Tag existed
    tags.add(`t-${app}`); // its Companion App / embed copies
  }
  // The `g` tag covers every r-* section.
  const tagList = tags.has("g")
    ? ["g", ...[...tags].filter((t) => !t.startsWith("r-") && t !== "g")]
    : [...tags];
  const reason = [
    apps.size ? `site files: ${[...apps].join(", ")}` : null,
    tagList.length ? `tags: ${tagList.sort().join(", ")}` : null,
    traced.length && !tags.size && !apps.size
      ? `${traced.length} shared file(s) reached no page route`
      : null,
  ]
    .filter(Boolean)
    .join("; ");
  return {
    mode: urls.length || tagList.length ? "purge" : "none",
    reason: reason || "only server-side files changed",
    urls: urls.sort(),
    tags: tagList.sort(),
    purgeTags: tagList.flatMap(purgePatterns).sort(),
    files,
  };
}

/**
 * Bunny stores a CDN-Tag header value as ONE tag (no comma splitting: a purge of
 * "r-db" leaves "g,t-palia,r-db" cached - verified 2026-10-07), but CacheTag
 * purges accept `*` wildcards. Game pages carry "g,t-<app>,r-<section>"; www and
 * the Companion App's own pages carry a single "t-<app>".
 * @param {string} tag
 * @returns {string[]}
 */
export function purgePatterns(tag) {
  if (tag === "g") return ["g,*"];
  if (tag.startsWith("r-")) return [`*,${tag}`];
  if (tag.startsWith("t-")) return [`*,${tag},*`, tag];
  return [tag];
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
      stdio: ["ignore", "pipe", "ignore"],
    });
  const out = (/** @type {object} */ o) => console.log(JSON.stringify(o));
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
      tags: [],
      files: [],
    });
  } else {
    const changes = git(
      "diff",
      "--name-status",
      "--no-renames",
      `${prev}..${next}`,
    )
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        const [status, path] = l.split("\t");
        return { status: status[0], path };
      });
    const read = fsReader(ROOT);
    const graph = buildGraph({ files: listSourceFiles(ROOT), read });
    out(plan(changes, read, graph));
  }
}
