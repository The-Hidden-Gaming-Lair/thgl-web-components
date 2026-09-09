/**
 * Shared helpers for the interactive-map smoke suite.
 *
 * Everything drives the page through the dev-only `window.__thgl` seam
 * (packages/ui/src/components/(providers)/coordinates-provider.tsx): the map
 * is WebGL, so marker counts, zoom and region shapes are only observable via
 * the live stores / WebMap object — never the DOM.
 *
 * Game under test: Palia on the local data-forge (`palia-dev.localhost:3100`
 * proxies to :33033). Palia has several maps that share nothing, default-on
 * and default-off filters, and typeIDs for live actors — one fixture covers
 * every scenario. Override with E2E_GAME / E2E_BASE_URL only if you also
 * adapt the map/filter constants below.
 */
import { expect, type Page } from "@playwright/test";
import { PNG } from "pngjs";

export const GAME = process.env.E2E_GAME ?? "palia";
export const BASE_URL =
  process.env.E2E_BASE_URL ?? `http://${GAME}-dev.localhost:3100`;

/** Map keys (userStore.mapName) → route title (URL segment = dict title). */
export const MAPS = {
  kilima: { key: "VillageWorld", title: "Kilima Village" },
  bahari: { key: "AdventureZoneWorld", title: "Bahari Bay" },
} as const;

/**
 * A default-OFF filter with a known, fixed number of spawns on Kilima, so a
 * toggle can be asserted as 0 → N → 0. `actorClass` is the game class the
 * memory reader emits (public/palia/config/types_id_map.json) for live tests.
 */
export const CLAY = {
  id: "Mining.Clay.Final",
  groupLabel: "Mining",
  label: "Clay",
  actorClass: "BP_Mining_Clay_MultiHarvest_C",
  // A real Kilima spawn (data-forge-tools sample_spawns) — position verbatim,
  // because the node id is `${type}@${p[0]}:${p[1]}` with unrounded numbers.
  spawn: { lat: 33245.200000000004, lng: 10565.300000000001 },
} as const;
export const CLAY_NODE_ID = `${CLAY.id}@${CLAY.spawn.lat}:${CLAY.spawn.lng}`;

type MapRef = { key: string; title: string };

export function mapUrl(title: string): string {
  return `${BASE_URL}/maps/${encodeURIComponent(title)}`;
}

/** Wait until the seam exists, the stores hydrated and the WebMap + layers are up. */
export async function waitForMapReady(page: Page, mapKey: string) {
  await page.waitForFunction(
    (key) => {
      const t = (window as any).__thgl;
      if (!t?.userStore || !t.useMapStore) return false;
      const u = t.userStore.getState();
      const s = t.useSettingsStore.getState();
      const map = t.useMapStore.getState().map;
      return (
        u._hasHydrated &&
        s._hasHydrated &&
        u.mapName === key &&
        !!map?.markerLayer &&
        !!map?.liveMarkerLayer
      );
    },
    mapKey,
    { timeout: 30_000 },
  );
  // The static marker pipeline fills the layer asynchronously (nodes fetch →
  // sprites → instances). Default-on filters guarantee at least one marker.
  await expect
    .poll(() => markerCount(page), {
      timeout: 30_000,
      message: "static markers drawn",
    })
    .toBeGreaterThan(0);
}

export async function openMap(page: Page, map: MapRef) {
  await page.goto(mapUrl(map.title));
  await waitForMapReady(page, map.key);
}

/** Number of live instances on the static marker layer (holes excluded). */
export function markerCount(page: Page, idPrefix?: string): Promise<number> {
  return page.evaluate((prefix) => {
    const map = (window as any).__thgl.useMapStore.getState().map;
    const all = map.markerLayer.getInstances().filter(Boolean) as {
      id: string;
    }[];
    return prefix
      ? all.filter((i) => i.id.startsWith(prefix)).length
      : all.length;
  }, idPrefix);
}

export function markerIds(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const map = (window as any).__thgl.useMapStore.getState().map;
    return (map.markerLayer.getInstances().filter(Boolean) as any[]).map(
      (i) => i.id as string,
    );
  });
}

export function liveMarkers(page: Page) {
  return page.evaluate(() => {
    const map = (window as any).__thgl.useMapStore.getState().map;
    return (map.liveMarkerLayer.getInstances().filter(Boolean) as any[]).map(
      (i) => ({
        id: i.id as string,
        size: i.size as number,
        key: i.key as string,
      }),
    );
  });
}

export function getZoom(page: Page): Promise<number> {
  return page.evaluate(() =>
    (window as any).__thgl.useMapStore.getState().map.getZoom(),
  );
}

export function setZoom(page: Page, zoom: number) {
  return page.evaluate((z) => {
    (window as any).__thgl.useMapStore.getState().map.setZoom(z);
  }, zoom);
}

/** Read one (JSON-serializable) field of the user store. */
export function userState<T = any>(page: Page, field: string): Promise<T> {
  return page.evaluate(
    (f) => (window as any).__thgl.userStore.getState()[f],
    field,
  );
}

export async function filterEnabled(page: Page, id: string): Promise<boolean> {
  const filters = await userState<string[]>(page, "filters");
  return filters.includes(id);
}

export function toggleFilter(page: Page, id: string) {
  return page.evaluate(
    (f) => (window as any).__thgl.userStore.getState().toggleFilter(f),
    id,
  );
}

export function selectNode(page: Page, nodeId: string) {
  return page.evaluate(
    (id) => (window as any).__thgl.userStore.getState().setSelectedNodeId(id),
    nodeId,
  );
}

/** Real map switch through the sidebar combobox (client-side pushState, no navigation). */
export async function switchMapViaUi(page: Page, to: MapRef) {
  await page.getByRole("combobox", { name: "Select map" }).click();
  // Each option also embeds a map-settings gear, so its accessible name is
  // longer than the title — match on text, not on the exact name.
  await page.getByRole("option").filter({ hasText: to.title }).first().click();
  await waitForMapReady(page, to.key);
  await expect
    .poll(() => page.evaluate(() => decodeURIComponent(location.pathname)))
    .toContain(`/maps/${to.title}`);
}

/**
 * Region shapes (ids `region_*`) on any drawing layer whose `mapName` is not
 * the given map — must be empty after a switch.
 */
export function staleRegionShapes(
  page: Page,
  mapKey: string,
): Promise<string[]> {
  return page.evaluate((key) => {
    const map = (window as any).__thgl.useMapStore.getState().map;
    const stale: string[] = [];
    for (const { layer } of map.layers as { layer: any }[]) {
      if (typeof layer.getAllShapes !== "function") continue;
      for (const shape of layer.getAllShapes()) {
        if (
          String(shape.id).startsWith("region_") &&
          shape.mapName &&
          shape.mapName !== key
        ) {
          stale.push(`${shape.id}:${shape.mapName}`);
        }
      }
    }
    return stale;
  }, mapKey);
}

/**
 * Share of clearly non-black pixels in the map canvas, 0..1. Guards the "map
 * is pure black with zero console errors" failure class (lost GL context,
 * broken tile pipeline). Uses a real compositor screenshot: reading the WebGL
 * canvas back via drawImage/readPixels returns zeros (no preserveDrawingBuffer).
 */
export async function canvasInkRatio(page: Page): Promise<number> {
  const png = await page.locator("canvas").first().screenshot({ type: "png" });
  const { width, height, data } = PNG.sync.read(png);
  let lit = 0;
  const total = width * height;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 24 || data[i + 1] > 24 || data[i + 2] > 24) lit++;
  }
  return lit / total;
}

/** Companion (THGLApp WebView2) surface — the `/apps/<game>` route on app.localhost. */
export const APP_BASE_URL =
  process.env.E2E_APP_BASE_URL ?? "http://app-dev.localhost:3100";

/**
 * Install a fake `window.chrome.webview` bridge BEFORE the page boots
 * (`initializeApp` only registers its message listener when the bridge
 * exists, and `isThglApp` is a module-load constant). `__emit(data)` delivers
 * a message the way the C++ host does: JSON text on `event.data`.
 */
export async function installFakeWebviewBridge(page: Page) {
  await page.addInitScript(() => {
    const listeners: ((e: { data: string }) => void)[] = [];
    const w = window as any;
    w.chrome = w.chrome || {};
    w.chrome.webview = {
      addEventListener: (t: string, fn: (e: { data: string }) => void) => {
        if (t === "message") listeners.push(fn);
      },
      removeEventListener: (t: string, fn: (e: { data: string }) => void) => {
        const i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      },
      postMessage: () => {},
      hostObjects: {},
      __emit: (data: unknown) => {
        for (const fn of listeners) fn({ data: JSON.stringify(data) });
        return listeners.length;
      },
    };
  });
}

/** Deliver one host→webview message (`{ action, payload }`). */
export function emitWebviewMessage(page: Page, message: unknown) {
  return page.evaluate(
    (m) => (window as any).chrome.webview.__emit(m) as number,
    message,
  );
}

/** Like waitForMapReady, but the companion picks its own initial map. */
export async function waitForAppMapReady(page: Page): Promise<string> {
  await page.waitForFunction(
    () => {
      const t = (window as any).__thgl;
      if (!t?.userStore || !t.useMapStore) return false;
      const u = t.userStore.getState();
      const map = t.useMapStore.getState().map;
      return (
        u._hasHydrated &&
        t.useSettingsStore.getState()._hasHydrated &&
        !!u.mapName &&
        !!map?.markerLayer &&
        !!map?.liveMarkerLayer
      );
    },
    null,
    { timeout: 30_000 },
  );
  // No "static markers drawn" wait here: the companion boots in Live mode,
  // where predicted (static:false) markers are muted until actors arrive.
  return userState<string>(page, "mapName");
}
