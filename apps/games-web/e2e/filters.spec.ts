import { expect, test } from "@playwright/test";
import {
  CLAY,
  MAPS,
  filterEnabled,
  markerCount,
  openMap,
  toggleFilter,
} from "./fixtures";

test.describe("filters", () => {
  test("toggling a filter adds and removes its markers", async ({ page }) => {
    await openMap(page, MAPS.kilima);
    const prefix = `${CLAY.id}@`;

    expect(await filterEnabled(page, CLAY.id)).toBe(false);
    expect(await markerCount(page, prefix)).toBe(0);

    // Store path (what the sidebar button calls).
    await toggleFilter(page, CLAY.id);
    await expect.poll(() => markerCount(page, prefix)).toBeGreaterThan(0);

    // DOM path: expand the category, then the (same-named) sub-group, click
    // the value button — proves the sidebar is wired to the same store, then
    // it must go back to zero.
    const groupButtons = page.locator(`button[title="${CLAY.groupLabel}"]`);
    await groupButtons.first().click();
    const valueButton = page
      .getByRole("button", { name: CLAY.label, exact: true })
      .first();
    if (!(await valueButton.isVisible())) await groupButtons.last().click();
    await valueButton.click();
    await expect.poll(() => filterEnabled(page, CLAY.id)).toBe(false);
    await expect.poll(() => markerCount(page, prefix)).toBe(0);
  });
});
