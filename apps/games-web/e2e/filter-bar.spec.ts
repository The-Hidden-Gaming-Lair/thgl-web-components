import { expect, test } from "@playwright/test";
import { MAPS, openMap } from "./fixtures";

/**
 * Game widgets beside the floating "Filters" pill (Game.filterBarComponents).
 * Palia's clock pill opens the event timetable with the filter panel hidden,
 * and a click keeps it open while the map is used.
 */
test.describe("filter bar", () => {
  test("Palia timetable stays reachable and pinned with filters hidden", async ({
    page,
  }) => {
    await openMap(page, MAPS.kilima);
    await page.evaluate(() => {
      const s = (window as any).__thgl.useSettingsStore.getState();
      if (s.showFilters) s.toggleShowFilters();
    });

    const bar = page.getByTestId("filter-bar");
    const clock = bar.locator("button").nth(1);
    await expect(clock).toBeVisible();
    await expect(clock).toHaveText(/\d{1,2}:\d{2} (AM|PM)/);

    const popover = page.locator("[data-radix-popper-content-wrapper]");
    await clock.click();
    await expect(popover).toBeVisible();

    // A click on the map must not close the pinned timetable.
    const vp = page.viewportSize()!;
    await page.mouse.click(vp.width * 0.8, vp.height * 0.8);
    await page.mouse.move(vp.width * 0.8, vp.height * 0.4);
    await page.waitForTimeout(500);
    await expect(popover).toBeVisible();

    // A second click on the clock closes it.
    await clock.click();
    await expect(popover).toHaveCount(0);

    // Opening the filter panel removes the filter-bar widgets.
    await page.evaluate(() =>
      (window as any).__thgl.useSettingsStore.getState().toggleShowFilters(),
    );
    await expect(bar.locator("button")).toHaveCount(1);
  });
});
