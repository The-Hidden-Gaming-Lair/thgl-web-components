import { expect, test } from "@playwright/test";

/**
 * Written guides on a multi-map game (inbox #469). Guards:
 *
 *  - every `::map` embed opens on the map its markers are on (the data-forge
 *    build ships `maps` per block, most spawns first), not the game's first map;
 *  - a map tab switches only its own embed, and a stray `?map=` in the URL
 *    neither forces every embed onto one map nor gets rewritten.
 *
 * Runs against The Planet Crafter (six planets): Blazar Quartz is mostly on
 * Prime, Selenium only on Selenea.
 */
const URL =
  "http://planetcrafter-dev.localhost:3100/guides/how-to-make-blazar-quartz";

const trackerMaps = async (page: import("@playwright/test").Page) =>
  (await page.locator("main").innerText())
    .split("\n")
    .flatMap((l) => l.match(/^(\w+) Progress Tracker$/)?.[1] ?? []);

test("each guide map opens on its own planet and switches independently", async ({
  page,
}) => {
  await page.goto(`${URL}?map=Humble`);
  await expect
    .poll(() => trackerMaps(page), { timeout: 30_000 })
    .toHaveLength(5);
  const before = await trackerMaps(page);
  expect(before[0]).toBe("Prime"); // Blazar Quartz
  expect(before[1]).toBe("Selenea"); // Selenium
  expect(page.url()).toContain("?map=Humble");

  const firstTabs = page.getByRole("tablist").first();
  await firstTabs.getByRole("tab", { name: "Toxicity" }).click();
  await expect
    .poll(() => trackerMaps(page))
    .toEqual(["Toxicity", ...before.slice(1)]);
  expect(page.url()).toContain("?map=Humble");
});
