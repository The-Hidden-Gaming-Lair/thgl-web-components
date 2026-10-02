import { expect, test, type Page } from "@playwright/test";
import {
  CLAY,
  CLAY_NODE_ID,
  MAPS,
  openMap,
  toggleFilter,
  userState,
} from "./fixtures";

/**
 * Regressions this guards (Crimson Desert forum report, 2026-03):
 *  - the player arrow sat on top of a marker and swallowed the click, so the
 *    marker underneath could not be selected (the arrow is now noHitTest).
 *  - the hover tooltip closed the instant the mouse left the narrow
 *    marker→tooltip corridor, before "Discovered" could be clicked (it now
 *    waits a short grace period).
 */

/** Center the map on the Clay spawn without animation; returns its client point. */
async function centerOnClay(page: Page) {
  await page.evaluate((ll) => {
    const map = (window as any).__thgl.useMapStore.getState().map;
    map.setView([ll.lat, ll.lng], map.getMaxZoom(), false);
  }, CLAY.spawn);
  const box = (await page.locator("canvas").first().boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function openClay(page: Page) {
  await openMap(page, MAPS.kilima);
  await toggleFilter(page, CLAY.id);
  await expect
    .poll(() =>
      page.evaluate((id) => {
        const map = (window as any).__thgl.useMapStore.getState().map;
        return (map.markerLayer.getInstances().filter(Boolean) as any[]).some(
          (i) => i.id === id,
        );
      }, CLAY_NODE_ID),
    )
    .toBe(true);
}

test.describe("marker hover + click", () => {
  test("a marker under the player arrow can still be clicked", async ({
    page,
  }) => {
    await openClay(page);
    await page.evaluate(
      ({ key, ll }) =>
        (window as any).__thgl.useGameState.getState().setPlayer({
          address: 1,
          type: "Player",
          mapName: key,
          x: ll.lat,
          y: ll.lng,
          z: 0,
          r: 0,
        }),
      { key: MAPS.kilima.key, ll: CLAY.spawn },
    );
    // The arrow must really be drawn on top of the Clay spawn.
    await expect
      .poll(() =>
        page.evaluate((ll) => {
          const map = (window as any).__thgl.useMapStore.getState().map;
          const layer = map.liveMarkerLayer ?? map.markerLayer;
          const p = (layer.getInstances().filter(Boolean) as any[]).find(
            (i) => i.id === "player",
          );
          if (!p) return "no player";
          const d = Math.hypot(p.latLng[0] - ll.lat, p.latLng[1] - ll.lng);
          return d < 1 ? "on marker" : `off by ${d}`;
        }, CLAY.spawn),
      )
      .toBe("on marker");

    const pt = await centerOnClay(page);
    await page.mouse.click(pt.x, pt.y);
    await expect
      .poll(() => userState<string | null>(page, "selectedNodeId"))
      .toBe(CLAY_NODE_ID);
  });

  test("the hover tooltip survives a curved path into it", async ({ page }) => {
    await openClay(page);
    const pt = await centerOnClay(page);
    await page.mouse.move(pt.x, pt.y);
    // The tooltip title (the filter list is collapsed, so the only exact match).
    const tooltip = page.getByText(CLAY.label, { exact: true }).first();
    await expect(tooltip).toBeVisible();

    // Step sideways out of the marker→tooltip corridor first (a natural,
    // slightly diagonal hand movement), then onto the tooltip's title. Moves
    // over the tooltip don't bubble to the document, so this also guards the
    // pending close being cancelled there.
    await page.mouse.move(pt.x + 60, pt.y - 10, { steps: 3 });
    const box = (await tooltip.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
      steps: 3,
    });
    await page.waitForTimeout(500);
    await expect(tooltip).toBeVisible();

    // Leaving for good still closes it.
    await page.mouse.move(pt.x + 300, pt.y + 300, { steps: 3 });
    await expect(tooltip).toBeHidden();
  });
});
