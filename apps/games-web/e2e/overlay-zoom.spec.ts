import { expect, test, type Page } from "@playwright/test";
import {
  APP_BASE_URL,
  CLAY,
  GAME,
  MAPS,
  emitWebviewMessage,
  installFakeWebviewBridge,
  waitForAppMapReady,
} from "./fixtures";

/**
 * The in-game overlay minimap remembers its OWN zoom per map.
 *
 * Regression (suggestion "Map overlay remembers last Zoom amount"): the
 * overlay and the desktop window shared one saved view per map, so zooming
 * the desktop window on the second monitor reset the overlay's zoom and it
 * had to be re-zoomed to line up with the game's minimap every session.
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

const openOverlay = async (page: Page) => {
  await page.goto(`${APP_BASE_URL}/apps/${GAME}/overlay`);
  // The overlay auto-hides until the host reports a player map.
  await expect
    .poll(
      async () => {
        await emitWebviewMessage(page, {
          action: "player",
          payload: {
            x: CLAY.spawn.lat,
            y: CLAY.spawn.lng,
            z: 0,
            r: 0,
            mapName: MAPS.kilima.key,
          },
        });
        return page.evaluate(
          () => !!(window as any).__thgl?.useMapStore.getState().map,
        );
      },
      { timeout: 30_000 },
    )
    .toBe(true);
  await waitForAppMapReady(page);
};

test("overlay: keeps its own zoom when the desktop window zooms", async ({
  context,
}) => {
  const overlay = await context.newPage();
  await installFakeWebviewBridge(overlay);
  await openOverlay(overlay);
  const overlayZoom = (await getZoom(overlay)) + 1.5;
  await setZoom(overlay, overlayZoom);
  await expect.poll(() => getZoom(overlay)).toBeCloseTo(overlayZoom, 3);

  // The desktop window on the other monitor zooms somewhere else and saves
  // its view (debounced) — after the overlay, so it is the last writer.
  const desktop = await context.newPage();
  await installFakeWebviewBridge(desktop);
  await desktop.goto(`${APP_BASE_URL}/apps/${GAME}`);
  await waitForAppMapReady(desktop);
  await emitWebviewMessage(desktop, {
    action: "player",
    payload: {
      x: CLAY.spawn.lat,
      y: CLAY.spawn.lng,
      z: 0,
      r: 0,
      mapName: MAPS.kilima.key,
    },
  });
  await expect
    .poll(() =>
      desktop.evaluate(
        () => (window as any).__thgl.userStore.getState().mapName,
      ),
    )
    .toBe(MAPS.kilima.key);
  const desktopZoom = (await getZoom(desktop)) + 0.75;
  await setZoom(desktop, desktopZoom);
  await expect
    .poll(
      () =>
        desktop.evaluate(
          (key) =>
            (window as any).__thgl.userStore.getState().viewByMap[key]?.zoom,
          MAPS.kilima.key,
        ),
      { timeout: 10_000 },
    )
    .toBeCloseTo(desktopZoom, 3);
  expect(desktopZoom).not.toBeCloseTo(overlayZoom, 1);
  await overlay.close();
  await desktop.close();

  // Next session: the overlay comes back at the zoom it was left at.
  const next = await context.newPage();
  await installFakeWebviewBridge(next);
  await openOverlay(next);
  await expect.poll(() => getZoom(next)).toBeCloseTo(overlayZoom, 3);
});
