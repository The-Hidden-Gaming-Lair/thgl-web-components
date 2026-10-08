import { expect, test } from "@playwright/test";

/**
 * A written guide's `::map` embed for a marker type that mixes several codex
 * entries (`mixedDbEntries`, inbox #801): Palia's Recipe: Fish Stew / Sashimi
 * markers mix Bahari ocean and river spots, so the Fish Stew guide shows the
 * Where to Catch table of the entry it is about (Recipe: Fish Stew) instead of
 * that map - no Sashimi table, no "map would mix" intro. The spice and garlic
 * maps further down stay maps.
 */
const URL = "http://palia.localhost:3100/guides/how-to-make-fish-stew";

test("a mixed marker type shows only the guide's own entry table instead of the map", async ({
  page,
}) => {
  await page.goto(URL);
  const main = page.locator("main");
  await expect(main.locator("table")).toHaveCount(1, { timeout: 30_000 });
  await expect(main).toContainText("Bahari Bay Ocean");
  await expect(main).not.toContainText("Bahari Bay River");
  await expect(main).not.toContainText("Recipe: Sashimi");
  await expect(main).not.toContainText("would mix their spots");
  await expect
    .poll(
      async () => ((await main.innerText()).match(/Show Full/g) ?? []).length,
    )
    .toBe(2);
});
