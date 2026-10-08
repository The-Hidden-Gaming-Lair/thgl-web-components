import { expect, test } from "@playwright/test";

/**
 * A written guide's `::map` embed for a marker type that mixes several codex
 * entries (`mixedDbEntries`, inbox #801): Palia's Recipe: Fish Stew / Sashimi
 * markers mix Bahari ocean and river spots, so the Fish Stew guide shows each
 * recipe's Where to Catch table instead of that map. The spice and garlic maps
 * further down stay maps.
 */
const URL = "http://palia.localhost:3100/guides/how-to-make-fish-stew";

test("a mixed marker type shows each entry's table instead of the map", async ({
  page,
}) => {
  await page.goto(URL);
  const main = page.locator("main");
  await expect(main.locator("table")).toHaveCount(2, { timeout: 30_000 });
  await expect(main).toContainText("Bahari Bay Ocean");
  await expect(main).toContainText("Bahari Bay River");
  await expect
    .poll(
      async () => ((await main.innerText()).match(/Show Full/g) ?? []).length,
    )
    .toBe(2);
});
