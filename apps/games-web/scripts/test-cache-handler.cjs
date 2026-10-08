// Unit test for cache-handler.cjs (the /db page cache). Run: node scripts/test-cache-handler.cjs
// Covers: compression round-trip, data-version invalidation, LRU size cap,
// delegation of non-game keys to Next's FileSystemCache.
process.env.PAGE_CACHE_MAX_MB = "1"; // tiny cap so eviction is exercised
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const os = require("node:os");
const Handler = require("../cache-handler.cjs");

const versions = (globalThis.__thglDataVersions ??= new Map());
const refreshed = [];
/** game → version id the next refresh "loads" ("hang" = never answers) */
const upstream = new Map();
globalThis.__thglRefreshDataVersion = (game) => {
  refreshed.push(game);
  const id = upstream.get(game);
  if (id === "hang") return new Promise(() => {});
  if (id) versions.set(game, { id, at: Date.now() });
};

const h = new Handler({
  dev: true, // no stats timer
  flushToDisk: false,
  serverDistDir: os.tmpdir(),
  revalidatedTags: [],
  _requestHeaders: {},
});
const ctx = { kind: "APP_PAGE", isRoutePPREnabled: false, isFallback: false };
const page = (html, n = 2000) => ({
  kind: "APP_PAGE",
  html,
  rscData: Buffer.from("rsc:" + html.slice(0, n)),
  headers: { "x-next-cache-tags": "_N_T_/layout" },
  status: 200,
  postponed: undefined,
  segmentData: new Map([["/_tree", Buffer.from("tree-" + html.length)]]),
});

(async () => {
  const key = "/g/palia/web/en/db/items/x";

  // 1. unknown version: miss, set, hit; exact round-trip
  versions.clear();
  assert.equal(await h.get(key, ctx), null);
  const v = page("<html>hello ü 🗺️</html>".repeat(50));
  await h.set(key, v, ctx);
  const got = await h.get(key, ctx);
  assert.ok(got, "hit after set");
  assert.equal(got.value.html, v.html);
  assert.deepEqual(got.value.rscData, v.rscData);
  assert.deepEqual([...got.value.segmentData], [...v.segmentData]);
  assert.equal(got.value.status, 200);
  assert.deepEqual(got.value.headers, v.headers);
  assert.ok(refreshed.includes("palia"), "lookup asks for a version refresh");

  // 2. version becomes known (v1): the unstamped entry is re-rendered once
  versions.set("palia", { id: "v1", at: Date.now() });
  assert.equal(
    await h.get(key, ctx),
    null,
    "unknown-stamp entry dropped once version known",
  );
  await h.set(key, v, ctx);
  assert.ok(await h.get(key, ctx), "hit while version v1");

  // 3. data update (v2): stale → miss → re-render is stamped v2
  versions.set("palia", { id: "v2", at: Date.now() });
  assert.equal(await h.get(key, ctx), null, "stale after version change");
  await h.set(key, v, ctx);
  assert.ok(await h.get(key, ctx), "hit after re-render under v2");
  // other games are independent
  const other = "/g/aniimo/web/de/db/x/y";
  versions.set("aniimo", { id: "a1", at: Date.now() });
  await h.get(other, ctx);
  await h.set(other, v, ctx);
  versions.set("palia", { id: "v3", at: Date.now() });
  assert.ok(await h.get(other, ctx), "aniimo unaffected by palia update");

  // 4. stamp is taken at MISS time: data changing mid-render must not pin old data
  const k2 = "/g/aniimo/web/en/db/a/b";
  assert.equal(await h.get(k2, ctx), null); // miss under a1
  versions.set("aniimo", { id: "a2", at: Date.now() }); // update lands during the render
  await h.set(k2, v, ctx); // stamped a1 (pre-render) → next lookup re-renders
  assert.equal(
    await h.get(k2, ctx),
    null,
    "render that straddled an update is re-done",
  );

  // 4b. idle pod (#846): the version was last observed long ago and the data
  // changed since - the lookup refreshes BEFORE comparing, so the old page is
  // not served as a hit (the edge would keep it for a day)
  const k3 = "/g/aniimo/web/ja/db/items/i";
  versions.set("aniimo", { id: "a2", at: Date.now() });
  await h.get(k3, ctx);
  await h.set(k3, v, ctx); // stamped a2
  versions.set("aniimo", { id: "a2", at: Date.now() - 10 * 60_000 }); // idle
  upstream.set("aniimo", "a3");
  assert.equal(await h.get(k3, ctx), null, "idle pod re-renders after update");
  await h.set(k3, v, ctx);
  assert.ok(await h.get(k3, ctx), "hit under the refreshed version");
  // a refresh that never answers falls back to the known version after the cap
  versions.set("aniimo", { id: "a3", at: Date.now() - 10 * 60_000 });
  upstream.set("aniimo", "hang");
  const t0 = Date.now();
  assert.ok(await h.get(k3, ctx), "hanging refresh: known version kept");
  assert.ok(Date.now() - t0 < 3000, "hanging refresh: lookup is capped");
  upstream.delete("aniimo");

  // 5. LRU cap (1 MB): incompressible pages evict the oldest first
  versions.set("palia", { id: "p", at: Date.now() });
  const big = () => page(randomBytes(45 * 1024).toString("base64"), 10); // ~60 KB gzipped
  for (let i = 0; i < 30; i++) {
    const k = `/g/palia/web/en/db/big/${i}`;
    await h.get(k, ctx);
    await h.set(k, big(), ctx);
  }
  assert.equal(
    await h.get("/g/palia/web/en/db/big/0", ctx),
    null,
    "oldest evicted",
  );
  assert.ok(await h.get("/g/palia/web/en/db/big/29", ctx), "newest kept");
  // a single page larger than a tenth of the cap is never stored
  await h.get("/g/palia/web/en/db/huge", ctx);
  await h.set(
    "/g/palia/web/en/db/huge",
    page(randomBytes(400 * 1024).toString("base64"), 10),
    ctx,
  );
  assert.equal(
    await h.get("/g/palia/web/en/db/huge", ctx),
    null,
    "oversized page not cached",
  );
  assert.ok(
    await h.get("/g/palia/web/en/db/big/29", ctx),
    "oversized page did not flush the cache",
  );

  // 6. non-game keys go to Next's FileSystemCache (in-memory here)
  await h.set("/api/something", null, { kind: "APP_ROUTE" });
  assert.equal(await h.get("fetch-key", { kind: "FETCH", tags: [] }), null);

  console.log("cache-handler: all checks passed");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
