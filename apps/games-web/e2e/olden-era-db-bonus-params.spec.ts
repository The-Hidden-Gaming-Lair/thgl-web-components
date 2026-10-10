import { expect, test } from "@playwright/test";
import { BASE_URL } from "./fixtures";

/**
 * Olden Era DB pages render bonuses that carry no `params`.
 *
 * Regression (data-forge #1117): the game ships two bonuses without params
 * (`itemRandomRewardBonus` on the Golden Goose Egg, `anyLandEqualNativeLandBonus`
 * on an Unfrozen faction law). ItemView iterated `b.params` and the artifact
 * page answered 500 "params is not iterable" in every locale.
 *
 * Runs on Olden Era (subdomain `oldenera`, games.ts `web:`) against the same
 * dev server as the rest of the suite (port from E2E_BASE_URL).
 */
const base = new URL(BASE_URL);
const OE_URL = `${base.protocol}//oldenera-dev.localhost${base.port ? `:${base.port}` : ""}`;

test.describe("Olden Era DB bonuses without params", () => {
  for (const locale of ["en", "ko"]) {
    test(`artifact page renders (${locale})`, async ({ page }) => {
      const res = await page.goto(
        `${OE_URL}/${locale}/db/artifacts/golden_goose_egg_artifact`,
      );
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
    });
  }

  test("faction page with a param-less law renders", async ({ page }) => {
    const res = await page.goto(`${OE_URL}/en/db/factions/unfrozen`);
    expect(res?.status()).toBe(200);
  });

  test("entity tooltip for the artifact renders", async ({ request }) => {
    const res = await request.get(
      `${OE_URL}/api/db/entity-tooltip?id=golden_goose_egg_artifact&locale=en`,
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.bonuses).toEqual(["Item Random Reward Bonus"]);
  });
});
