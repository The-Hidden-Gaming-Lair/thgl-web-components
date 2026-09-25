import { expect, test, type Page } from "@playwright/test";
import { APP_BASE_URL, installFakeWebviewBridge } from "./fixtures";

/**
 * The THGLApp dashboard sidebar games list (`/dashboard/*` on app.localhost,
 * rendered inside THGLApp's WebView2). Guards the order contract:
 *
 *  - the default is still "recent" — recently played first, then registry
 *    order. That was the behaviour before the sort control existed and a
 *    regression here silently re-orders the list for everyone.
 *  - "A-Z" sorts by the title as printed, with a locale-aware collator.
 *  - a starred game moves into the FAVORITES section and both the sort and
 *    the star survive a reload (they live in the persisted `thgl-app` store,
 *    which is what makes them survive an app restart too).
 *
 * Driven on `/dashboard/settings`: it is a pure client page, while
 * `/dashboard` does server-side Discord fetches. The sidebar is mounted in the
 * shared dashboard layout, so it renders on both.
 */
const DASHBOARD_URL = `${APP_BASE_URL}/dashboard/settings`;

/**
 * Seed the persisted app store BEFORE the page boots. `version: 3` matches
 * `useTHGLAppState`'s persist config — a mismatch makes zustand drop the
 * payload, so the test would silently assert the defaults.
 *
 * Seeds ONCE per tab: `addInitScript` runs again on every navigation,
 * `page.reload()` included, and an unguarded seed would overwrite whatever
 * the app persisted in between — turning every "survives a reload" assertion
 * into a check of the seed. `sessionStorage` survives a reload but each test
 * gets a fresh browser context, so the guard never leaks between tests.
 */
const seedAppState = (page: Page, state: Record<string, unknown>) =>
  page.addInitScript((s) => {
    if (window.sessionStorage.getItem("e2e-thgl-app-seeded")) return;
    window.sessionStorage.setItem("e2e-thgl-app-seeded", "1");
    window.localStorage.setItem(
      "thgl-app",
      JSON.stringify({ state: s, version: 3 }),
    );
  }, state);

/**
 * Companion rows only. Web-only games link to the same `/dashboard/games/<id>`
 * path but have no star, so they are not inside a `companion-row` wrapper.
 * DOM order = favourites section first, then the main list.
 */
const ROW = 'aside [data-testid="companion-row"]';

const companionRows = (page: Page) =>
  page.locator(`${ROW} a[href*="/dashboard/games/"]`);

const companionIds = (page: Page) =>
  companionRows(page).evaluateAll((els) =>
    els.map((el) => el.getAttribute("href")!.split("/").pop()!),
  );

const companionTitles = (page: Page) =>
  companionRows(page).evaluateAll((els) =>
    els.map((el) => el.textContent!.trim()),
  );

const starFor = (page: Page, gameId: string) =>
  page.locator(`${ROW}:has(a[href$="/dashboard/games/${gameId}"]) button`);

/** One of the two sort toggles (`aria-pressed` says which is active). */
const sortButton = (page: Page, name: "Recent" | "A-Z") =>
  page.getByRole("group", { name: "Sort games" }).getByRole("button", { name });

const waitForList = async (page: Page) => {
  await expect(companionRows(page).first()).toBeVisible();
  // The list re-orders once the persisted store rehydrates; wait for a stable
  // count before reading order.
  await expect
    .poll(() => companionIds(page).then((ids) => ids.length))
    .toBeGreaterThan(3);
};

test.describe("dashboard games list", () => {
  test("defaults to the recently played order", async ({ page }) => {
    await installFakeWebviewBridge(page);
    await seedAppState(page, {
      sidebarExpanded: true,
      lastPlayed: { palia: Date.now() },
    });
    await page.goto(DASHBOARD_URL);
    await waitForList(page);

    // The last-played bump still wins by default: no sort was chosen, so
    // `gamesSort` falls back to "recent".
    await expect
      .poll(() => companionIds(page).then((ids) => ids[0]))
      .toBe("palia");
    await expect(sortButton(page, "Recent")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("A-Z sorts by title and is remembered across a reload", async ({
    page,
  }) => {
    await installFakeWebviewBridge(page);
    await seedAppState(page, {
      sidebarExpanded: true,
      lastPlayed: { palia: Date.now() },
    });
    await page.goto(DASHBOARD_URL);
    await waitForList(page);
    const recentOrder = await companionTitles(page);

    await sortButton(page, "A-Z").click();
    await expect(sortButton(page, "A-Z")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(sortButton(page, "Recent")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    const collator = new Intl.Collator("en", {
      sensitivity: "base",
      numeric: true,
    });
    const alphaOrder = await companionTitles(page);
    expect(alphaOrder).toEqual([...alphaOrder].sort(collator.compare));
    // Sanity: the fixture registry is not already alphabetical, so the click
    // really changed something.
    expect(alphaOrder).not.toEqual(recentOrder);

    await page.reload();
    await waitForList(page);
    await expect(sortButton(page, "A-Z")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(await companionTitles(page)).toEqual(alphaOrder);
  });

  test("starring a game moves it to the favorites section and it stays there", async ({
    page,
  }) => {
    await installFakeWebviewBridge(page);
    await seedAppState(page, { sidebarExpanded: true, lastPlayed: {} });
    await page.goto(DASHBOARD_URL);
    await waitForList(page);

    const initial = await companionIds(page);
    // Pick a game that is NOT already first, so "it moved to the top" means
    // the favourites section and not a coincidence.
    const target = initial[initial.length - 1];
    expect(target).not.toBe(initial[0]);
    await expect(page.getByText("Favorites", { exact: true })).toHaveCount(0);

    const star = starFor(page, target);
    await star.hover();
    await star.click();

    await expect(page.getByText("Favorites", { exact: true })).toBeVisible();
    await expect(star).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() => companionIds(page).then((ids) => ids[0]))
      .toBe(target);
    // No duplicate row: the game left the main list when it joined favourites.
    expect(
      (await companionIds(page)).filter((id) => id === target),
    ).toHaveLength(1);

    await page.reload();
    await waitForList(page);
    await expect
      .poll(() => companionIds(page).then((ids) => ids[0]))
      .toBe(target);

    // Un-starring drops it back into the main list and removes the section.
    await starFor(page, target).click();
    await expect(page.getByText("Favorites", { exact: true })).toHaveCount(0);
    await expect.poll(() => companionIds(page)).toEqual(initial);
  });

  test("with every game starred, the sort control moves into the favorites caption", async ({
    page,
  }) => {
    await installFakeWebviewBridge(page);
    await seedAppState(page, { sidebarExpanded: true, lastPlayed: {} });
    await page.goto(DASHBOARD_URL);
    await waitForList(page);
    const aside = page.locator("aside");

    const all = await companionIds(page);
    for (const id of all) {
      const star = starFor(page, id);
      await star.hover();
      await star.click();
      await expect(star).toHaveAttribute("aria-pressed", "true");
    }
    // Nothing left for the GAMES section, so its caption must not render
    // above zero rows — but the sort control has to stay reachable.
    await expect(aside.getByText("Games", { exact: true })).toHaveCount(0);
    const sortGroup = page.getByRole("group", { name: "Sort games" });
    await expect(sortGroup).toHaveCount(1);
    await expect(
      sortGroup.locator("..").getByText("Favorites", { exact: true }),
    ).toBeVisible();
    // Every game is still listed exactly once, in the active (recent) order.
    expect(await companionIds(page)).toEqual(all);

    // And the relocated control still sorts the favourites.
    await sortButton(page, "A-Z").click();
    const collator = new Intl.Collator("en", {
      sensitivity: "base",
      numeric: true,
    });
    await expect
      .poll(async () => {
        const titles = await companionTitles(page);
        return (
          titles.join("|") === [...titles].sort(collator.compare).join("|")
        );
      })
      .toBe(true);
  });
});
