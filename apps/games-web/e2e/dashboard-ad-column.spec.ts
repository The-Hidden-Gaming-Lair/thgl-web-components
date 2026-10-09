import { expect, test, type Page } from "@playwright/test";
import { APP_BASE_URL } from "./fixtures";

/**
 * Companion App dashboard ad column (data-forge inbox #982). The 360px column
 * on the right only exists while ads are shown; without ads (supporters,
 * Overwolf, localhost without SHOW_DEMO_ADS) it is not rendered, so a normal
 * window keeps its full width for the page instead of an empty black strip.
 * localhost takes the same "no ads" branch as an ad-free supporter.
 */
const WINDOW = { width: 1015, height: 700 };

const widths = (page: Page) =>
  page.evaluate(() => {
    const column = [...document.querySelectorAll("div")].find((d) =>
      d.className.includes("w-[360px]"),
    );
    return {
      column: column ? column.getBoundingClientRect().width : 0,
      content: document
        .querySelector(".flex-1.min-w-0.flex-col")!
        .getBoundingClientRect().width,
    };
  });

test("no ads → no dashboard ad column, content gets the full width", async ({
  page,
}) => {
  await page.setViewportSize(WINDOW);
  await page.goto(`${APP_BASE_URL}/dashboard`);
  await expect(page.locator(".flex-1.min-w-0.flex-col").first()).toBeVisible();
  await expect.poll(async () => (await widths(page)).column).toBe(0);
  expect((await widths(page)).content).toBeGreaterThan(700);
});

test("with ads → the 360px column stays", async ({ page }) => {
  await page.setViewportSize(WINDOW);
  await page.addInitScript(() => localStorage.setItem("SHOW_DEMO_ADS", "true"));
  await page.goto(`${APP_BASE_URL}/dashboard`);
  await expect.poll(async () => (await widths(page)).column).toBe(360);
});
