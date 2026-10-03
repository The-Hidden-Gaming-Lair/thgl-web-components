import { expect, test, type Page } from "@playwright/test";
import {
  APP_BASE_URL,
  CLAY,
  MAPS,
  emitWebviewMessage,
  installFakeWebviewBridge,
  waitForAppMapReady,
} from "./fixtures";

/**
 * Following the player onto another map keeps that map's remembered zoom,
 * even when the switch arrives with a position outside the target map.
 *
 * Regression (suggestion "Aniimo: Egg Heist map opens fully zoomed out every
 * time"): while the game loads into a new map, the first report can carry the
 * PREVIOUS map's position. The saved view's center then failed the bounds
 * check and the saved zoom was thrown away with it, so every round started at
 * the fit-the-whole-map zoom.
 */
const getZoom = (page: Page) =>
  page.evaluate(() =>
    (window as any).__thgl.useMapStore.getState().map.getZoom(),
  );

const setZoom = (page: Page, zoom: number) =>
  page.evaluate(
    (z) => (window as any).__thgl.useMapStore.getState().map.setZoom(z),
    zoom,
  );

const mapName = (page: Page) =>
  page.evaluate(() => (window as any).__thgl.userStore.getState().mapName);

const reportPlayer = (page: Page, map: string, x: number, y: number) =>
  emitWebviewMessage(page, {
    action: "player",
    payload: { x, y, z: 0, r: 0, mapName: map },
  });

// A spot inside Bahari Bay; the Kilima clay spawn lies outside Bahari's bounds.
const BAHARI_SPOT = { x: -50000, y: 110000 };

test("map-follow: a stale position on the switch keeps the remembered zoom", async ({
  page,
}) => {
  await installFakeWebviewBridge(page);
  await page.goto(`${APP_BASE_URL}/apps/palia`);
  await waitForAppMapReady(page);

  await reportPlayer(page, MAPS.kilima.key, CLAY.spawn.lat, CLAY.spawn.lng);
  await expect.poll(() => mapName(page)).toBe(MAPS.kilima.key);

  // First visit to Bahari: zoom in and let the view persist.
  await reportPlayer(page, MAPS.bahari.key, BAHARI_SPOT.x, BAHARI_SPOT.y);
  await expect.poll(() => mapName(page)).toBe(MAPS.bahari.key);
  const target = (await getZoom(page)) + 2;
  await setZoom(page, target);
  await expect.poll(() => getZoom(page)).toBeCloseTo(target, 3);

  await reportPlayer(page, MAPS.kilima.key, CLAY.spawn.lat, CLAY.spawn.lng);
  await expect.poll(() => mapName(page)).toBe(MAPS.kilima.key);

  // Back to Bahari, but the switch still carries the Kilima position.
  await reportPlayer(page, MAPS.bahari.key, CLAY.spawn.lat, CLAY.spawn.lng);
  await expect.poll(() => mapName(page)).toBe(MAPS.bahari.key);
  await expect
    .poll(() => getZoom(page), { timeout: 10_000 })
    .toBeCloseTo(target, 3);
});
