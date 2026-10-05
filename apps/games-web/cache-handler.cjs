// @ts-check
/**
 * Page cache for the cached game routes (src/app/g/..., e.g. /db/*).
 *
 * Why a custom handler: Next's default cache writes every ISR page to disk
 * (.next/server/app) with no eviction. Crawlers touch ~600k distinct /db paths
 * a day, which would fill the pods' 10 GB ephemeral storage. This keeps game
 * pages in memory instead: gzip-compressed, LRU-evicted by total size
 * (PAGE_CACHE_MAX_MB, default 1024). Everything else (fetch cache, tags used by
 * palia's leaderboard pages, non-/g routes) is delegated to Next's own
 * FileSystemCache, unchanged.
 *
 * Freshness: every cached page is stamped with the data version (version.json
 * `id`) of its game at the moment the page was looked up and missed — i.e. a
 * version no newer than the data the render then used. When the game's data
 * changes (data-forge sync), the stamp no longer matches and the page is
 * re-rendered on its next request — on every pod independently, no cross-pod
 * messaging. The current version comes from the app's own version.json loads
 * (@repo/lib fetchVersion → setVersionObserver, registered in
 * src/lib/route-params.ts); when no render has looked at a game for
 * VERSION_REFRESH_MS, a lookup triggers a background refresh. The pages' own
 * `revalidate` stays as a backstop.
 */
const { gzipSync, gunzipSync } = require("node:zlib");
const FileSystemCache =
  require("next/dist/server/lib/incremental-cache/file-system-cache").default;

const MAX_BYTES = (Number(process.env.PAGE_CACHE_MAX_MB) || 1024) * 1048576;
const VERSION_REFRESH_MS = 30_000;
const GAME_KEY = /^\/g\/([^/]+)\//;
const STATS_INTERVAL_MS = 60_000;

/** @type {Map<string, { id: string, at: number }>} game → last observed data version */
const versions = (globalThis.__thglDataVersions ??= new Map());

/**
 * @typedef {{ lastModified: number, stored: any, bytes: number, stamp: string | undefined, tags: string[] }} Entry
 * @type {Map<string, Entry>} insertion order = LRU order (oldest first)
 */
const entries = new Map();
/** @type {Map<string, { stamp: string | undefined, at: number }>} key → version at miss time */
const pending = new Map();
let totalBytes = 0;
const stats = { hits: 0, misses: 0, stale: 0, evicted: 0, sets: 0 };

function currentVersion(game) {
  const v = versions.get(game);
  if (!v || Date.now() - v.at > VERSION_REFRESH_MS) {
    const refresh = globalThis.__thglRefreshDataVersion;
    if (typeof refresh === "function") {
      // Background: a cache lookup never waits on the CDN.
      Promise.resolve()
        .then(() => refresh(game))
        .catch(() => {});
    }
  }
  return v?.id;
}

function drop(key) {
  const e = entries.get(key);
  if (!e) return;
  entries.delete(key);
  totalBytes -= e.bytes;
}

const pack = (v) =>
  typeof v === "string"
    ? { t: "s", b: gzipSync(Buffer.from(v), { level: 1 }) }
    : Buffer.isBuffer(v)
      ? { t: "b", b: gzipSync(v, { level: 1 }) }
      : { t: "r", v };
const unpack = (p) =>
  p.t === "s"
    ? gunzipSync(p.b).toString()
    : p.t === "b"
      ? gunzipSync(p.b)
      : p.v;
const packedBytes = (p) => (p.t === "r" ? 0 : p.b.length);

function store(data) {
  if (data && data.kind === "APP_PAGE") {
    const html = pack(data.html);
    const rscData = data.rscData ? pack(data.rscData) : undefined;
    const segments = data.segmentData
      ? [...data.segmentData].map(([k, v]) => [k, pack(v)])
      : undefined;
    const bytes =
      packedBytes(html) +
      (rscData ? packedBytes(rscData) : 0) +
      (segments ? segments.reduce((a, [, p]) => a + packedBytes(p), 0) : 0) +
      512;
    return { stored: { ...data, html, rscData, segmentData: segments }, bytes };
  }
  return { stored: { raw: data }, bytes: 4096 };
}

function load(stored) {
  if (stored.raw !== undefined) return stored.raw;
  return {
    ...stored,
    html: unpack(stored.html),
    rscData: stored.rscData ? unpack(stored.rscData) : undefined,
    segmentData: stored.segmentData
      ? new Map(stored.segmentData.map(([k, p]) => [k, unpack(p)]))
      : undefined,
  };
}

function tagsOf(data) {
  const raw = data?.headers?.["x-next-cache-tags"];
  return typeof raw === "string" ? raw.split(",") : [];
}

let statsTimer = null;

module.exports = class PageCacheHandler {
  constructor(ctx) {
    this.fs = new FileSystemCache(ctx);
    if (!statsTimer && !ctx.dev) {
      statsTimer = setInterval(() => {
        // Next loads the handler in more than one place; only the instance
        // that actually serves pages has anything to report.
        if (entries.size || stats.hits || stats.misses || stats.sets) {
          console.log(
            `[page-cache] ${JSON.stringify({
              entries: entries.size,
              mb: Math.round(totalBytes / 1048576),
              ...stats,
            })}`,
          );
        }
        for (const k of Object.keys(stats)) stats[k] = 0;
        // Misses whose render never completed (errors) — don't keep stamps forever.
        const cutoff = Date.now() - 10 * 60_000;
        for (const [k, p] of pending) if (p.at < cutoff) pending.delete(k);
      }, STATS_INTERVAL_MS);
      statsTimer.unref?.();
    }
  }

  async get(key, ctx) {
    const m = GAME_KEY.exec(key);
    if (!m) return this.fs.get(key, ctx);
    const version = currentVersion(m[1]);
    const e = entries.get(key);
    // Valid while the stamp matches the game's current data version. Unknown
    // current version (fresh pod, before the first version.json load) keeps the
    // entry; an entry stamped "unknown" is re-rendered once a version is known.
    if (e && (version === undefined || e.stamp === version)) {
      entries.delete(key);
      entries.set(key, e); // LRU touch
      stats.hits++;
      return { lastModified: e.lastModified, value: load(e.stored) };
    }
    if (e) {
      drop(key);
      stats.stale++;
    } else {
      stats.misses++;
    }
    pending.set(key, { stamp: version, at: Date.now() });
    return null;
  }

  async set(key, data, ctx) {
    const m = GAME_KEY.exec(key);
    if (!m) return this.fs.set(key, data, ctx);
    drop(key);
    if (!data) return;
    const p = pending.get(key);
    pending.delete(key);
    const stamp = p ? (p.stamp ?? currentVersion(m[1])) : currentVersion(m[1]);
    const { stored, bytes } = store(data);
    if (bytes > MAX_BYTES / 10) return; // never let one page flush the cache
    entries.set(key, {
      lastModified: Date.now(),
      stored,
      bytes,
      stamp,
      tags: tagsOf(data),
    });
    totalBytes += bytes;
    stats.sets++;
    for (const k of entries.keys()) {
      if (totalBytes <= MAX_BYTES) break;
      drop(k);
      stats.evicted++;
    }
  }

  async revalidateTag(tags, durations) {
    const list = typeof tags === "string" ? [tags] : tags;
    for (const [k, e] of entries) {
      if (e.tags.some((t) => list.includes(t))) drop(k);
    }
    return this.fs.revalidateTag(tags, durations);
  }

  resetRequestCache() {
    this.fs.resetRequestCache();
  }
};
