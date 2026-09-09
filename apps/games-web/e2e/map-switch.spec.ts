import { expect, test } from "@playwright/test";
import {
  MAPS,
  getZoom,
  markerCount,
  markerIds,
  openMap,
  setZoom,
  staleRegionShapes,
  switchMapViaUi,
  userState,
} from "./fixtures";

/**
 * Regressions this guards (2026-08/09):
 *  - 070ffaba4 "map zoom reset on map switch + unpersisted programmatic camera
 *    moves": a programmatic setZoom did not persist, and coming back to a map
 *    reset its zoom.
 *  - bb5720dad "stale region borders when switching maps": overlays keyed on
 *    the map reference instead of the store's mapName kept the old map's
 *    shapes on screen.
 */
test.describe("map switch", () => {
  test("keeps the per-map zoom and swaps markers + regions", async ({
    page,
  }) => {
    await openMap(page, MAPS.kilima);

    const target = (await getZoom(page)) + 1;
    await setZoom(page, target);
    await expect.poll(() => getZoom(page)).toBeCloseTo(target, 1);
    // Programmatic camera moves must persist like user moves do.
    await expect
      .poll(async () => {
        const view = await userState(page, "viewByMap");
        return view?.[MAPS.kilima.key]?.zoom;
      })
      .toBeCloseTo(target, 1);

    const kilimaIds = (await markerIds(page)).slice(0, 50);

    await switchMapViaUi(page, MAPS.bahari);
    expect(await userState(page, "mapName")).toBe(MAPS.bahari.key);
    expect(await markerCount(page)).toBeGreaterThan(50);

    // No Kilima marker may survive on Bahari.
    const bahariIds = new Set(await markerIds(page));
    const leaked = kilimaIds.filter((id) => bahariIds.has(id));
    expect(leaked, "Kilima markers still drawn on Bahari").toEqual([]);

    // Every region shape must belong to the current map.
    expect(
      await staleRegionShapes(page, MAPS.bahari.key),
      "region shapes from the previous map",
    ).toEqual([]);

    // Back to Kilima: the zoom we set must come back, not the default.
    await switchMapViaUi(page, MAPS.kilima);
    await expect
      .poll(() => getZoom(page), { timeout: 10_000 })
      .toBeCloseTo(target, 1);
    expect(await staleRegionShapes(page, MAPS.kilima.key)).toEqual([]);
  });
});
