import { expect, test } from "@playwright/test";
import { MAPS, openMap } from "./fixtures";

/**
 * "Player icon below markers": by default the player icon is drawn above every
 * marker (live layer, alwaysOnTop). With the setting on it moves to its own
 * layer drawn BEFORE both marker layers, so markers right next to the player
 * (fish while fishing) stay readable. Toggling moves the existing marker
 * between layers in place and back again.
 */
const player = {
  address: 1,
  type: "Player",
  mapName: MAPS.kilima.key,
  x: 33245,
  y: 10565,
  z: 0,
  r: 0,
};

const playerPlacement = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const map = (window as any).__thgl.useMapStore.getState().map;
    const has = (layer: any) =>
      !!layer?.instances.some((i: any) => i.id === "player");
    return {
      live: has(map.liveMarkerLayer),
      under: has(map.playerUnderLayer),
    };
  });

test.describe("player icon below markers", () => {
  test("setting moves the player icon under the marker layers and back", async ({
    page,
  }) => {
    await openMap(page, MAPS.kilima);

    // The under-layer renders before both marker layers.
    const order = await page.evaluate(() => {
      const map = (window as any).__thgl.useMapStore.getState().map;
      const idx = (layer: any) =>
        map.layers.findIndex((l: any) => l.layer === layer);
      return {
        under: idx(map.playerUnderLayer),
        markers: idx(map.markerLayer),
        live: idx(map.liveMarkerLayer),
      };
    });
    expect(order.under).toBeGreaterThanOrEqual(0);
    expect(order.under).toBeLessThan(order.markers);
    expect(order.under).toBeLessThan(order.live);

    // Same zoom sizing as the live layer, else the player icon shrinks when
    // zoomed out (the layer default factor differs from the user setting).
    await expect
      .poll(() =>
        page.evaluate(() => {
          const map = (window as any).__thgl.useMapStore.getState().map;
          return (
            map.playerUnderLayer.dynamicSizeFactor ===
            map.liveMarkerLayer.dynamicSizeFactor
          );
        }),
      )
      .toBe(true);

    await page.evaluate((p) => {
      const t = (window as any).__thgl;
      t.useSettingsStore.setState({ playerBelowMarkers: false });
      t.useGameState.getState().setPlayer(p);
    }, player);
    await expect
      .poll(() => playerPlacement(page))
      .toEqual({ live: true, under: false });

    await page.evaluate(() =>
      (window as any).__thgl.useSettingsStore
        .getState()
        .togglePlayerBelowMarkers(),
    );
    await expect
      .poll(() => playerPlacement(page))
      .toEqual({ live: false, under: true });

    await page.evaluate(() =>
      (window as any).__thgl.useSettingsStore
        .getState()
        .togglePlayerBelowMarkers(),
    );
    await expect
      .poll(() => playerPlacement(page))
      .toEqual({ live: true, under: false });
  });
});
