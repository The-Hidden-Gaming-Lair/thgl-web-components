import { expect, test } from "@playwright/test";
import { MAPS, canvasInkRatio, markerCount, openMap } from "./fixtures";

test.describe("map page loads", () => {
  test("renders the WebMap with markers and tiles", async ({ page }) => {
    const failedTiles: string[] = [];
    const errors: string[] = [];
    page.on("response", (r) => {
      if (r.status() >= 400 && /\/map-tiles\//.test(r.url())) {
        failedTiles.push(`${r.status()} ${r.url()}`);
      }
    });
    page.on("pageerror", (e) => errors.push(e.message));

    await openMap(page, MAPS.kilima);

    // The default-on filters draw hundreds of markers on Kilima.
    expect(await markerCount(page)).toBeGreaterThan(50);
    // Tiles come through the local data-forge proxy; a broken proxy or a
    // stale tile hash shows up here, not as a JS error.
    expect(failedTiles, "tile requests that failed").toEqual([]);
    expect(errors, "uncaught page errors").toEqual([]);
    // A pure-black canvas with no errors is the classic lost-GL-context /
    // broken-tile-pipeline symptom. Kilima fills well over half the viewport.
    await expect
      .poll(() => canvasInkRatio(page), { timeout: 20_000 })
      .toBeGreaterThan(0.3);
  });
});
