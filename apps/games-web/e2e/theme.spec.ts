import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, MAPS, openMap } from "./fixtures";

/**
 * Colour theme (Settings > Accessibility > Theme, @repo/lib theme.ts). Dark
 * stays the default; a stored choice is applied before paint by the root
 * layout's ThemeScript and remaps the palette (@repo/ui styles/themes.css).
 *
 * Guards: no choice = dark page; picking Light in Settings turns the page
 * light at once and survives a reload (cookie); Black darkens it again.
 */
const bodyLightness = (page: Page) =>
  page.evaluate(() => {
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return (r + g + b) / 3;
  });

test("theme setting switches and persists", async ({ page }) => {
  await openMap(page, MAPS.kilima);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-theme",
    /light|black/,
  );
  expect(await bodyLightness(page)).toBeLessThan(60);

  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("#theme").click();
  await page.getByRole("option", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await bodyLightness(page)).toBeGreaterThan(200);

  await page.goto(BASE_URL);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await bodyLightness(page)).toBeGreaterThan(200);

  await page.evaluate(() => {
    document.cookie = "thgl-theme=black; path=/";
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "black");
  expect(await bodyLightness(page)).toBeLessThan(10);
});

// www has no Settings dialog: the header Theme select sets the same cookie.
const WWW_BASE_URL = "http://www-dev.localhost:3100";

test("www header theme select switches and persists", async ({ page }) => {
  await page.goto(WWW_BASE_URL);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-theme",
    /light|black/,
  );

  await page.getByRole("combobox", { name: "Theme" }).click();
  await page.getByRole("option", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await bodyLightness(page)).toBeGreaterThan(200);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
