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
 * The in-game overlay's Transparency setting (`mapFilter`). "Full
 * Transparency" draws no map tiles at all — the game world IS the map.
 *
 * Regression: switching Full → another mode → back to Full left the tiles of
 * the intermediate mode on the map (the tile effect returned early for "full"
 * without removing the existing layer), until the app was restarted.
 */
const tileLayerCount = (page: Page) =>
  page.evaluate(() => {
    const map = (window as any).__thgl.useMapStore.getState().map;
    return (map.layers as { layer: any }[]).filter(
      (l) => typeof l.layer.setFilter === "function",
    ).length;
  });

const setMapFilter = (page: Page, value: string) =>
  page.evaluate(
    (v) => (window as any).__thgl.useSettingsStore.getState().setMapFilter(v),
    value,
  );

const openOverlay = async (page: Page) => {
  await installFakeWebviewBridge(page);
  await page.goto(`${APP_BASE_URL}/apps/${GAME}/overlay`);
  // The overlay auto-hides until the host reports a player map.
  // Re-send until the app has registered its listener and the map is built.
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

const mapFilter = (page: Page) =>
  page.evaluate(
    () => (window as any).__thgl.useSettingsStore.getState().mapFilter,
  );

test("overlay: switching back to Full Transparency removes the map tiles", async ({
  page,
}) => {
  await openOverlay(page);

  await setMapFilter(page, "full");
  await expect.poll(() => tileLayerCount(page)).toBe(0);

  for (const mode of ["greyscale", "colorful", "none"]) {
    await setMapFilter(page, mode);
    await expect.poll(() => tileLayerCount(page)).toBe(1);

    await setMapFilter(page, "full");
    await expect.poll(() => tileLayerCount(page)).toBe(0);
  }
});

test("overlay: the Cycle Map Transparency hotkey steps through the modes", async ({
  page,
}) => {
  await openOverlay(page);
  await setMapFilter(page, "none");

  for (const mode of ["greyscale", "colorful", "full", "none"]) {
    await emitWebviewMessage(page, {
      action: "hotkey",
      payload: { key: "SHIFT+F7", action: "cycle_map_transparency" },
    });
    await expect.poll(() => mapFilter(page)).toBe(mode);
    await expect.poll(() => tileLayerCount(page)).toBe(mode === "full" ? 0 : 1);
  }
  // The app page mounts two <Toaster>s (layout + app), so the toast is in both.
  await expect(
    page.getByText("Map Transparency: No Transparency").first(),
  ).toBeVisible();
});
