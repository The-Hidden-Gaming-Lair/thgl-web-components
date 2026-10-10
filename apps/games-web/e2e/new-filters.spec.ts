import { expect, test, type Page } from "@playwright/test";
import { MAPS, openMap, waitForMapReady } from "./fixtures";

/**
 * Filters new since the player's last visit (data-forge inbox #1107): a "New"
 * badge per filter row + a one-time map chip "N new filters: ...".
 *
 * Regression guarded: the badges were acknowledged the moment their group
 * opened (React StrictMode's mount → cleanup → mount ran the "group closed"
 * acknowledge), so the player never saw them.
 *
 * A returning player is simulated by removing two filter ids from the
 * persisted `knownFilters`, so they come back as `newFilters` on reload.
 */
const NEW = ["amber_bug", "amber_fishing"];

const userState = (page: Page) =>
  page.evaluate(() => {
    const s = (window as any).__thgl.userStore.getState();
    return {
      newFilters: s.newFilters as string[],
      filters: s.filters as string[],
    };
  });

async function forgetFilters(page: Page, ids: string[]) {
  await page.evaluate((ids) => {
    const key = Object.keys(localStorage).find((k) =>
      k.includes("coordinates"),
    )!;
    const v = JSON.parse(localStorage.getItem(key)!);
    v.state.knownFilters = v.state.knownFilters.filter(
      (id: string) => !ids.includes(id),
    );
    v.state.openGroups = [];
    v.state.announcedNewFilters = [];
    localStorage.setItem(key, JSON.stringify(v));
  }, ids);
  await page.reload();
  await waitForMapReady(page, MAPS.kilima.key);
}

test("new filters get a badge and a one-time chip that opens them", async ({
  page,
}) => {
  await openMap(page, MAPS.kilima);
  // A fresh visitor has nothing new.
  await expect(page.getByTestId("new-filters-chip")).toHaveCount(0);

  await forgetFilters(page, NEW);
  const chip = page.getByTestId("new-filters-chip");
  await expect(chip).toContainText("2 new filters");

  // The chip opens the panel on their group; the badges stay while it is open.
  await chip.getByRole("button").first().click();
  await expect(chip).toHaveCount(0);
  const rowBadge = page
    .getByRole("button", { name: /Bug Amber/ })
    .getByText("New", { exact: true });
  await expect(rowBadge).toBeVisible();
  await page.waitForTimeout(500);
  expect((await userState(page)).newFilters.sort()).toEqual([...NEW].sort());

  // Toggling a new filter acknowledges it (toggle twice: state unchanged).
  await page.getByRole("button", { name: /Bug Amber/ }).click();
  await page.getByRole("button", { name: /Bug Amber/ }).click();
  expect((await userState(page)).newFilters).toEqual(["amber_fishing"]);

  // Closing the open group acknowledges the rest.
  await page.getByRole("button", { name: "Amber Shells" }).click();
  await expect.poll(async () => (await userState(page)).newFilters).toEqual([]);
});

test("the chip shows once; the badges wait until the group was open", async ({
  page,
}) => {
  await openMap(page, MAPS.kilima);
  await forgetFilters(page, NEW);
  await expect(page.getByTestId("new-filters-chip")).toContainText(
    "2 new filters",
  );

  // Not clicked, group never opened: next visit no chip, filters still new.
  await page.reload();
  await waitForMapReady(page, MAPS.kilima.key);
  await page.waitForTimeout(500);
  await expect(page.getByTestId("new-filters-chip")).toHaveCount(0);
  expect((await userState(page)).newFilters.sort()).toEqual([...NEW].sort());
});
