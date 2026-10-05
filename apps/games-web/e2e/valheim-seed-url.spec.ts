import { expect, test } from "@playwright/test";

/**
 * Valheim "World Seed" panel: a shared ?seed= link must open that seed, over
 * whatever seed the player had stored. A link without ?wgv= means the current
 * world generation - Number(null) is 0, which used to pick Legacy (v0) and
 * draw the wrong terrain for hand-written links (inbox #357).
 */
const VALHEIM_URL = "http://valheim-dev.localhost:3100";

const storedState = () =>
  JSON.parse(localStorage.getItem("thgl-valheim-seed") ?? "null")?.state;

test.describe("valheim seed url", () => {
  test.beforeEach(async ({ page }) => {
    // A returning player with another seed on a legacy generation.
    await page.addInitScript(() => {
      if (sessionStorage.getItem("seeded")) return;
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem(
        "thgl-valheim-seed",
        JSON.stringify({
          state: { seed: "OtherSeed1", worldGenVersion: 0 },
          version: 0,
        }),
      );
    });
  });

  test("?seed= without wgv fills the input and uses the current generation", async ({
    page,
  }) => {
    await page.goto(`${VALHEIM_URL}/maps/World?seed=pringdew`);
    await expect(page.getByPlaceholder(/HiddenLair/)).toHaveValue("pringdew", {
      timeout: 30_000,
    });
    await expect
      .poll(() => page.evaluate(storedState))
      .toEqual({ seed: "pringdew", worldGenVersion: 2 });
    await expect(page.getByRole("combobox")).toHaveText("Current");
  });

  test("?wgv= picks the legacy generation", async ({ page }) => {
    await page.goto(`${VALHEIM_URL}/maps/World?seed=pringdew&wgv=1`);
    await expect(page.getByPlaceholder(/HiddenLair/)).toHaveValue("pringdew", {
      timeout: 30_000,
    });
    await expect
      .poll(() => page.evaluate(storedState))
      .toEqual({ seed: "pringdew", worldGenVersion: 1 });
    await expect(page.getByRole("combobox")).toHaveText("Legacy (v1)");
  });
});
