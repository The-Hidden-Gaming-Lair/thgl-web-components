import { expect, test, type Page } from "@playwright/test";
import { CLAY, MAPS, openMap } from "./fixtures";

/**
 * Map route planner (inbox #767): right-click → "Plan Route From Here" turns
 * the unfound markers on screen into a My Filters drawing, and markers
 * marked as found are left out.
 */
const routes = (page: Page) =>
  page.evaluate(() =>
    ((window as any).__thgl.useSettingsStore.getState().myFilters as any[])
      .filter((f) => f.name.startsWith("Route "))
      .map((f) => ({
        name: f.name as string,
        positions: f.drawing.polylines[0].positions as [number, number][],
      })),
  );

// An empty corner: a right-click on a marker opens the marker instead.
async function planRouteFromCorner(page: Page) {
  const canvas = page.locator("canvas").first();
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + box.width - 40, box.y + box.height - 40, {
    button: "right",
  });
  await page.getByText("Plan Route From Here").click();
}

test.describe("route planner", () => {
  test("plans a route through the markers on screen, skipping found ones", async ({
    page,
  }) => {
    await openMap(page, MAPS.kilima);
    // Only Clay: the default filters put more than the 1000-stop cap on screen.
    await page.evaluate(
      (id) => (window as any).__thgl.userStore.getState().setFilters([id]),
      CLAY.id,
    );

    await planRouteFromCorner(page);
    await expect
      .poll(async () => (await routes(page)).length, { timeout: 5000 })
      .toBe(1);
    const [route] = await routes(page);
    expect(route.name).toBe("Route 1");
    // Start point + at least one stop.
    expect(route.positions.length).toBeGreaterThan(1);
    const filters = await page.evaluate(
      () => (window as any).__thgl.userStore.getState().filters as string[],
    );
    expect(filters).toContain("Route 1");

    // Mark every stop found: the next plan has nothing left to visit.
    await page.evaluate((stops) => {
      (window as any).__thgl.useSettingsStore
        .getState()
        .setDiscoveredNodes(stops.map((p) => `x@${p[0]}:${p[1]}`));
    }, route.positions.slice(1));
    await planRouteFromCorner(page);
    await expect(
      page.getByText("No markers left to visit on screen"),
    ).toBeVisible();
    expect(await routes(page)).toHaveLength(1);
  });
});
