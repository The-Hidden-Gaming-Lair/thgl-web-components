import { expect, test } from "@playwright/test";
import { MAPS, openMap } from "./fixtures";

/**
 * The sidebar filter search also matches what a filter value drops / contains
 * (Discord suggestion "filter drops search"): its `_tags` term or a line of
 * its description. Such hits carry the matched line under the name, so the
 * player can tell why an unrelated-looking filter showed up.
 *
 * Palia data (verified against data-forge public/palia/dicts/en.json): the
 * Ancient Koi description lists "Recipe: Sushi"; nothing is NAMED sushi.
 */
test.describe("filter search matches drops", () => {
  test("a drop name finds the filter that yields it, with a hint", async ({
    page,
  }) => {
    await openMap(page, MAPS.kilima);
    await page.getByPlaceholder("Type to search...").fill("sushi");

    const koi = page.getByRole("button", { name: /Ancient Koi/ }).first();
    await expect(koi).toBeVisible();
    await expect(koi).toContainText("Recipe: Sushi");

    // Two letters stay name-only: descriptions would match nearly everything.
    await page.getByPlaceholder("Type to search...").fill("su");
    await expect(
      page.getByRole("button", { name: /Recipe: Sushi/ }),
    ).toHaveCount(0);
  });
});
