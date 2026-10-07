// node --test apps/games-web/scripts/purge-plan.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildGraph } from "./import-graph.mjs";
import { plan, routeTag, tenantOf } from "./purge-plan.mjs";

const L = "apps/games-web/src/app/g/[game]/[surface]/[locale]";
// A tiny fake monorepo: a lib barrel with two modules, a ui barrel, routes.
const repo = {
  "packages/lib/src/games.ts":
    'export const games = [\n  {\n    id: "palia",\n    web: "https://palia.th.gl",\n  },\n];',
  "packages/lib/src/index.ts":
    'export * from "./config";\nexport * from "./maps";',
  "packages/lib/src/config.ts":
    "export function getConfig() {}\nexport const SITE = 1;",
  "packages/lib/src/maps.ts": "export function tileUrl() {}",
  "packages/ui/src/components/(header)/index.tsx":
    'export { Header } from "./header";\nexport { MapLegend } from "./legend";',
  "packages/ui/src/components/(header)/header.tsx":
    'import { getConfig } from "@repo/lib";\nexport function Header() {}',
  "packages/ui/src/components/(header)/legend.tsx":
    'import { tileUrl } from "@repo/lib";\nexport function MapLegend() {}',
  [`${L}/layout.tsx`]:
    'import { Header } from "@repo/ui/header";\nexport default function Layout() {}',
  [`${L}/maps/page.tsx`]:
    'import { MapLegend } from "@repo/ui/header";\nexport default function Page() {}',
  [`${L}/db/page.tsx`]:
    'import { SITE } from "@repo/lib";\nexport default function Page() {}',
  "apps/games-web/src/lib/unused.ts": "export const x = 1;",
  "apps/games-web/src/configs/thgl-web.ts":
    'export const thglWeb = {\n  name: "thgl-web",\n  domain: "www",\n};',
};
const read = (p) => repo[p] ?? null;
const graph = buildGraph({ files: Object.keys(repo), read });
const run = (...paths) =>
  plan(
    paths.map((p) => ({ path: p, status: "M" })),
    read,
    graph,
  );

test("routeTag / tenantOf", () => {
  assert.equal(routeTag(`${L}/db/[section]/[id]/page.tsx`), "r-db");
  assert.equal(routeTag(`${L}/page.tsx`), "r-home");
  assert.equal(routeTag(`${L}/layout.tsx`), "g");
  assert.equal(
    routeTag("apps/games-web/src/app/www/stats/page.tsx"),
    "t-thgl-web",
  );
  assert.equal(
    routeTag("apps/games-web/src/app/(app)/[locale]/dashboard/page.tsx"),
    "t-thgl-app",
  );
  assert.equal(routeTag("apps/games-web/src/app/api/status/route.ts"), "none");
  assert.equal(routeTag("packages/lib/src/config.ts"), null);
  assert.equal(tenantOf("apps/games-web/src/configs/palia.ts"), "palia");
  assert.equal(tenantOf("apps/games-web/src/configs/index.ts"), null);
  assert.equal(tenantOf("packages/ui/src/dicts/palia.de.json"), "palia");
});

test("a header component used by the layout purges every game page (tag g)", () => {
  const p = run("packages/ui/src/components/(header)/header.tsx");
  assert.equal(p.mode, "purge");
  assert.deepEqual(p.tags, ["g"]);
});

test("barrel resolved per name: a maps-only lib change purges only r-maps", () => {
  // maps/page imports MapLegend from the same barrel as Header; MapLegend
  // uses tileUrl from the same lib barrel as getConfig.
  assert.deepEqual(run("packages/lib/src/maps.ts").tags, ["r-maps"]);
});

test("route file purges its own section", () => {
  assert.deepEqual(run(`${L}/db/page.tsx`).tags, ["r-db"]);
});

test("file reached by no route purges nothing", () => {
  assert.equal(run("apps/games-web/src/lib/unused.ts").mode, "none");
});

test("server-only and other-app files purge nothing", () => {
  assert.equal(
    run(
      "apps/games-web/src/app/api/status/route.ts",
      "apps/palia-overwolf/manifest.json",
    ).mode,
    "none",
  );
});

test("site files purge that host + its tag", () => {
  const p = run("apps/games-web/src/configs/palia.ts");
  assert.deepEqual(p.urls, ["https://palia.th.gl/*"]);
  assert.deepEqual(p.tags, ["t-palia"]);
  assert.deepEqual(run("apps/games-web/src/configs/thgl-web.ts").urls, [
    "https://www.th.gl/*",
  ]);
});

test("routing, build and global CSS changes are full purges", () => {
  assert.equal(run("apps/games-web/src/proxy.ts").mode, "full");
  assert.equal(run("apps/games-web/next.config.js").mode, "full");
  assert.equal(run("packages/ui/src/styles/globals.css").mode, "full");
  const pub = (status) =>
    plan(
      [{ path: "apps/games-web/public/global_icons/palia.webp", status }],
      read,
      graph,
    ).mode;
  assert.equal(pub("M"), "full");
  assert.equal(pub("A"), "none");
});
