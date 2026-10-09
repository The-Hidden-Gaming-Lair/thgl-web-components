import { expect, test } from "@playwright/test";
import { BASE_URL, MAPS } from "./fixtures";

/**
 * The Palia map sidebar tools (Weekly Wants, Palia Time, Show Grid, Label
 * Size) are frontend strings, not game dicts: on a localized page they must
 * come from the global UI dicts instead of rendering English (inbox #937).
 */
test("Palia sidebar tools are translated on /zh-CN", async ({ page }) => {
  await page.goto(
    `${BASE_URL}/zh-CN/maps/${encodeURIComponent(MAPS.kilima.title)}`,
  );

  const weeklyWants = page.getByRole("button", { name: /每周心愿/ });
  await expect(weeklyWants).toBeVisible({ timeout: 30_000 });
  await expect(weeklyWants).toContainText(/\d+ \/ \d+/);
  await expect(page.getByText("帕利亚时间").first()).toBeVisible();
  await expect(page.locator('label[for="show-grid"]')).toHaveText("显示网格");

  await page.locator("#show-grid").click();
  await expect(page.locator('label[for="grid-label-size"]')).toHaveText(
    "标签大小",
  );
  await page.locator("#show-grid").click();

  await weeklyWants.click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toContainText("村民的每周心愿");
  await expect(sheet).not.toContainText(/Weekly Wants|Last Update/);
});
