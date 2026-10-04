import { expect, test } from "@playwright/test";
import { BASE_URL } from "./fixtures";

/**
 * Header navigation + game switcher (inbox #289). Guards:
 *
 *  - the grouped header (Home | Maps ▾ | Database ▾ | Guides | Tools ▾) with
 *    the active group highlighted, and every menu link present in the
 *    SERVER-rendered HTML (crawlers never open menus);
 *  - the game switcher's search and its cross-game "Recent" row;
 *  - the site footer on content pages, and none on the full-screen map.
 *
 * Runs against palia (named maps, a database, guides and four tools).
 */

test("header groups render server-side and the active group is highlighted", async ({
  page,
  request,
}) => {
  const html = await (await request.get(`${BASE_URL}/db/fish`)).text();
  // Menu links are in the SSR HTML even though the menus are closed.
  for (const href of [
    "/maps/Elderwood",
    "/db/bugs",
    "/rummage-pile",
    "/guides",
  ]) {
    expect(html).toContain(`href="${href}"`);
  }

  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(`${BASE_URL}/db/fish`);
  const header = page.locator("header");
  const database = header.getByRole("button", { name: /^Database/ });
  await expect(database).toHaveClass(/text-amber-400/);
  await expect(header.getByRole("button", { name: /^Maps/ })).toBeVisible();
  await expect(header.getByRole("button", { name: /^Tools/ })).toBeVisible();
  await expect(
    header.getByRole("link", { name: "Guides", exact: true }),
  ).toBeVisible();

  await database.click();
  const fish = header.getByRole("link", { name: "Fish", exact: true });
  await expect(fish).toBeVisible();
  await expect(fish).toHaveClass(/text-amber-400/);
  await expect(
    header.getByRole("link", { name: "All Categories" }),
  ).toBeVisible();
});

test("game switcher searches and remembers recent games", async ({
  page,
  context,
}) => {
  // Another game visited earlier (the cookie is shared across *.th.gl).
  await context.addCookies([
    { name: "thgl_recent", value: "palworld", url: BASE_URL },
  ]);
  await page.goto(`${BASE_URL}/`);
  await page.getByRole("button", { name: "Switch game" }).click();

  const popover = page.locator("[data-radix-popper-content-wrapper]");
  await expect(popover.getByText("Recent", { exact: true })).toBeVisible();
  await expect(popover.getByTitle("Palworld").first()).toBeVisible();

  const search = popover.getByRole("searchbox");
  await expect(search).toBeFocused();
  await search.fill("crafter");
  await expect(popover.locator("a[title]")).toHaveCount(1);
  await expect(popover.getByTitle("The Planet Crafter")).toBeVisible();

  // The current game was recorded for the other sites' switchers.
  const cookies = await context.cookies(BASE_URL);
  expect(cookies.find((c) => c.name === "thgl_recent")?.value).toMatch(
    /^palia\./,
  );
});

test("footer on content pages, not on the map", async ({ page }) => {
  await page.goto(`${BASE_URL}/db/fish`);
  const footer = page.locator("footer");
  await expect(footer).toHaveCount(1);
  await expect(footer.getByRole("link", { name: "Weekly Wants" })).toHaveCount(
    1,
  );

  await page.goto(`${BASE_URL}/maps/Elderwood`);
  await expect(page.locator("header")).toBeVisible();
  await expect(page.locator("footer")).toHaveCount(0);
});
