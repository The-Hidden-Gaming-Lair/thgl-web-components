import { expect, test, type Page } from "@playwright/test";
import {
  APP_BASE_URL,
  CLAY,
  CLAY_NODE_ID,
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

test("overlay: the Cycle Filter Presets hotkey applies the saved presets in order", async ({
  page,
}) => {
  await openOverlay(page);
  await page.evaluate((clay) => {
    const settings = (window as any).__thgl.useSettingsStore.getState();
    settings.addPreset("E2E Clay", { filters: [clay] });
    settings.addPreset("E2E Empty", { filters: [] });
  }, CLAY.id);
  const filters = () =>
    page.evaluate(() => (window as any).__thgl.userStore.getState().filters);
  const press = () =>
    emitWebviewMessage(page, {
      action: "hotkey",
      payload: { key: "SHIFT+F8", action: "cycle_filter_preset" },
    });

  await press();
  await expect.poll(filters).toEqual([CLAY.id]);
  await expect(page.getByText("Applied: E2E Clay").first()).toBeVisible();
  await press();
  await expect.poll(filters).toEqual([]);
  await expect(page.getByText("Applied: E2E Empty").first()).toBeVisible();
  // Wraps around to the first preset.
  await press();
  await expect.poll(filters).toEqual([CLAY.id]);
});

test("overlay: Discover Nearest Node toggles, Undiscover reaches hidden nodes", async ({
  page,
}) => {
  await openOverlay(page);
  await page.evaluate((clay) => {
    const t = (window as any).__thgl;
    t.userStore.getState().setFilters([clay]);
    // Predicted mode plots the (non-static) clay spawns.
    t.useSettingsStore.getState().setLiveMode("predicted");
    t.useSettingsStore.getState().setDiscoveredNodes([]);
  }, CLAY.id);
  const isDiscovered = () =>
    page.evaluate(
      (id) =>
        (window as any).__thgl.useSettingsStore.getState().isDiscoveredNode(id),
      CLAY_NODE_ID,
    );
  const press = async (action: "discover_node" | "undiscover_node") => {
    await emitWebviewMessage(page, {
      action: "hotkey",
      payload: { key: "F10", action },
    });
    // The hotkeys share a 500 ms cooldown against key repeat.
    await page.waitForTimeout(600);
  };

  // The player stands on the clay node: discover toggles it on and off.
  await press("discover_node");
  await expect.poll(isDiscovered).toBe(true);
  await press("discover_node");
  await expect.poll(isDiscovered).toBe(false);
  await expect(page.getByText("Undiscovered Clay").first()).toBeVisible();
  await press("discover_node");
  await expect.poll(isDiscovered).toBe(true);

  // With "hide discovered nodes" on, discover skips the hidden node (it can't
  // be seen), but undiscover still finds it.
  await page.evaluate(() => {
    const s = (window as any).__thgl.useSettingsStore.getState();
    if (!s.hideDiscoveredNodes) s.toggleHideDiscoveredNodes();
  });
  await press("discover_node");
  await expect.poll(isDiscovered).toBe(true);
  await press("undiscover_node");
  await expect.poll(isDiscovered).toBe(false);
  await expect(page.getByText("Undiscovered Clay").first()).toBeVisible();
});

test("overlay: a discovered resource node resets when it respawns", async ({
  page,
}) => {
  await openOverlay(page);
  await page.evaluate(() => {
    (window as any).__thgl.useSettingsStore.getState().setDiscoveredNodes([]);
  });
  const isDiscovered = () =>
    page.evaluate(
      (id) =>
        (window as any).__thgl.useSettingsStore.getState().isDiscoveredNode(id),
      CLAY_NODE_ID,
    );
  const setDiscovered = (discovered: boolean) =>
    page.evaluate(
      ([id, d]) =>
        (window as any).__thgl.useSettingsStore
          .getState()
          .setDiscoverNode(id, d),
      [CLAY_NODE_ID, discovered] as const,
    );
  const clayActor = (hidden: boolean) =>
    emitWebviewMessage(page, {
      action: "staticActors",
      payload: [
        {
          address: "7001",
          type: CLAY.actorClass,
          x: CLAY.spawn.lat,
          y: CLAY.spawn.lng,
          z: 0,
          r: 0,
          mapName: MAPS.kilima.key,
          hidden,
        },
      ],
    });

  // Discovered while the node is still standing: no respawn, stays discovered.
  await clayActor(false);
  await setDiscovered(true);
  await clayActor(false);
  await page.waitForTimeout(300);
  expect(await isDiscovered()).toBe(true);

  // Harvested (depleted), then it comes back: reset.
  await clayActor(true);
  await page.waitForTimeout(300);
  expect(await isDiscovered()).toBe(true);
  await clayActor(false);
  await expect.poll(isDiscovered).toBe(false);

  // With the setting off a respawn keeps the node discovered.
  await page.evaluate(() => {
    (window as any).__thgl.useSettingsStore
      .getState()
      .setAutoResetRespawned(false);
  });
  await setDiscovered(true);
  await clayActor(true);
  await page.waitForTimeout(300);
  await clayActor(false);
  await page.waitForTimeout(300);
  expect(await isDiscovered()).toBe(true);
});
