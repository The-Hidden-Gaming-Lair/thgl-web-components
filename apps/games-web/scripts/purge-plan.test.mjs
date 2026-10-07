// node --test apps/games-web/scripts/purge-plan.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { classify, plan } from "./purge-plan.mjs";

const files = {
  "packages/lib/src/games.ts": [
    "export const games = [",
    "  {",
    '    id: "palia",',
    '    title: "Palia",',
    '    web: "https://palia.th.gl",',
    "  },",
    "  {",
    '    id: "dune-awakening",',
    '    web: "https://duneawakening.th.gl",',
    "  },",
    "];",
  ].join("\n"),
  "apps/games-web/src/configs/thgl-web.ts":
    'export const thglWeb = {\n  name: "thgl-web",\n  domain: "www",\n};',
  "apps/games-web/src/configs/thgl-app.ts":
    'export const thglApp = resolveAppConfig({\n  name: "thgl-app",\n  domain: "app",\n});',
};
const read = (p) => files[p] ?? null;

test("classify", () => {
  assert.deepEqual(classify("apps/games-web/src/app/api/status/route.ts"), {
    kind: "none",
  });
  assert.deepEqual(classify("apps/games-web/src/lib/pod-health.ts"), {
    kind: "none",
  });
  assert.deepEqual(classify("apps/games-web/cache-handler.cjs"), {
    kind: "none",
  });
  assert.deepEqual(classify("packages/lib/src/config.test.ts"), {
    kind: "none",
  });
  assert.deepEqual(classify("apps/games-web/src/configs/palia.ts"), {
    kind: "tenant",
    app: "palia",
  });
  assert.deepEqual(
    classify("apps/games-web/src/games/palia/leaderboard-content.tsx"),
    { kind: "tenant", app: "palia" },
  );
  assert.deepEqual(classify("packages/ui/src/dicts/dune-awakening.de.json"), {
    kind: "tenant",
    app: "dune-awakening",
  });
  assert.deepEqual(classify("packages/ui/src/dicts/de.json"), {
    kind: "shared",
  });
  assert.deepEqual(classify("apps/games-web/src/configs/index.ts"), {
    kind: "shared",
  });
  assert.deepEqual(
    classify("packages/ui/src/components/(header)/status-banner.tsx"),
    { kind: "shared" },
  );
});

test("server-only change purges nothing", () => {
  const p = plan(
    [
      "apps/games-web/src/lib/status-document.ts",
      "apps/games-web/src/app/api/status/route.ts",
    ],
    read,
  );
  assert.equal(p.mode, "none");
  assert.deepEqual(p.urls, []);
});

test("tenant change purges that site; shared files purge only the Companion App", () => {
  const p = plan(
    [
      "apps/games-web/src/configs/palia.ts",
      "packages/ui/src/dicts/dune-awakening.en.json",
      "packages/ui/src/components/x.tsx",
    ],
    read,
  );
  assert.equal(p.mode, "tenants");
  assert.deepEqual(p.urls, [
    "https://app.th.gl/*",
    "https://duneawakening.th.gl/*",
    "https://palia.th.gl/*",
  ]);
  assert.match(p.reason, /tenant files for palia, dune-awakening/);
  assert.match(p.reason, /1 shared file/);
});

test("shared-only change purges the Companion App host (#704)", () => {
  const p = plan(["packages/ui/src/components/x.tsx"], read);
  assert.equal(p.mode, "tenants");
  assert.deepEqual(p.urls, ["https://app.th.gl/*"]);
});

test("non-game tenant maps via its config domain", () => {
  const p = plan(["apps/games-web/src/configs/thgl-web.ts"], read);
  assert.deepEqual(p.urls, ["https://www.th.gl/*"]);
});

test("unmappable tenant falls back to a full purge", () => {
  const p = plan(["apps/games-web/src/configs/brand-new-game.ts"], read);
  assert.equal(p.mode, "full");
});
