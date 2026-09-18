import { expect, test, type Page } from "@playwright/test";
import { MAPS, openMap, userState, waitForMapReady } from "./fixtures";

/**
 * The sidebar search-results block collapses like a filter group (Discord
 * thread "live search toggle drop down"): a broad live query used to produce
 * dozens of two-line rows and push the filter toggles off the bottom of the
 * panel.
 *
 * What this guards:
 *  - the section defaults to OPEN (it only exists while a query is typed, so
 *    it is the direct answer to something the user just did),
 *  - the header carries the row count, so a collapsed section still says
 *    whether anything matched,
 *  - the live list is capped at 6 rows behind the existing "Show all" expander,
 *    exactly like the historical list already was,
 *  - the user's collapse is persisted per scope in the per-game user store and
 *    survives a reload, and a new query does NOT re-open it.
 *
 * Actors are injected straight into useGameState (what the THGLApp message
 * handler calls) via the dev-only `window.__thgl` seam, like live-markers.spec.
 */

/** Cap in markers-search-live-results.tsx (COLLAPSED_RESULT_LIMIT). */
const COLLAPSED_RESULT_LIMIT = 6;

/**
 * Eight Palia classes that resolve to eight DISTINCT display types whose names
 * all contain "Infected" (verified against
 * data-forge public/palia/config/types_id_map.json + dicts/en.json).
 * Eight > the 6-row cap, so the expander is exercised too.
 */
const INFECTED_CLASSES = [
  "BP_BatterflyBeans_C_Variant.AmberEcho_Variant.EchoInfected",
  "BP_Bug_AZ2_Batterfly_Cotton_C_Variant.AmberEcho_Variant.EchoInfected",
  "BP_Bug_AZ2_Batterfly_Day_C_Variant.AmberEcho_Variant.EchoInfected",
  "BP_Bug_AZ2_Batterfly_Night_C_Variant.AmberEcho_Variant.EchoInfected",
  "BP_Bug_AZ2_Beetle_Blood_C_Variant.AmberEcho_Variant.EchoInfected",
  "BP_Bug_AZ2_Beetle_Draugr_C_Variant.AmberEcho_Variant.EchoInfected",
  "BP_Bug_AZ2_Piksii_Forest_C_Variant.AmberEcho_Variant.EchoInfected",
  "BP_Bug_AZ2_Piksii_Stair_C_Variant.AmberEcho_Variant.EchoInfected",
];
const ROW_COUNT = INFECTED_CLASSES.length;

const ACTORS = INFECTED_CLASSES.map((type, i) => ({
  address: 9000 + i,
  type,
  mapName: MAPS.kilima.key,
  x: 33245 + i * 400,
  y: 10565 + i * 400,
  z: 0,
  r: 0,
}));

/**
 * Make the session look live-capable and feed it the fake actors.
 * `liveCapable = isCompanionApp || peerLiveConnected` (coordinates-provider);
 * on a plain tab both are false, so the list would render "needs the app".
 * The global live MODE is irrelevant here - the search scope is independent.
 */
async function goLive(page: Page) {
  await page.evaluate((actors) => {
    const t = (window as any).__thgl;
    t.useGameState.setState({ peerLiveConnected: true });
    t.useGameState.getState().setActors(actors);
    t.userStore.getState().setSearchScope("live");
  }, ACTORS);
}

const section = (page: Page) => page.getByTestId("search-results-section");

const liveTrigger = (page: Page) =>
  section(page).getByRole("button", { name: /Live results/ });

/** Result rows only - the filter list below has same-named buttons. */
const rows = (page: Page) =>
  section(page).getByRole("button", { name: /Infected/ });

async function search(page: Page, q: string) {
  await page.getByPlaceholder("Type to search...").fill(q);
  // The query is debounced 300ms into the persisted store.
  await expect.poll(() => userState<string>(page, "search")).toBe(q);
}

test.describe("search results collapsible", () => {
  test("live results cap at 6, collapse, survive a reload, and re-open", async ({
    page,
  }) => {
    await openMap(page, MAPS.kilima);
    await goLive(page);
    await search(page, "infected");

    // Default OPEN: you just typed the query, the answer must be visible.
    await expect(liveTrigger(page)).toHaveAttribute("aria-expanded", "true");
    await expect.poll(() => rows(page).count()).toBe(COLLAPSED_RESULT_LIMIT);
    // The header counts ALL matching rows, not just the visible ones.
    await expect(liveTrigger(page)).toContainText(`(${ROW_COUNT})`);

    // The expander lifts the cap, and folds it back.
    const showAll = section(page).getByRole("button", {
      name: `Show all ${ROW_COUNT} results`,
    });
    await showAll.click();
    await expect.poll(() => rows(page).count()).toBe(ROW_COUNT);
    await section(page).getByRole("button", { name: "Show fewer" }).click();
    await expect.poll(() => rows(page).count()).toBe(COLLAPSED_RESULT_LIMIT);

    // Collapse: the rows go away and the choice is written to the store.
    await liveTrigger(page).click();
    await expect(liveTrigger(page)).toHaveAttribute("aria-expanded", "false");
    await expect.poll(() => rows(page).count()).toBe(0);
    expect(await userState<string[]>(page, "collapsedSearchScopes")).toContain(
      "live",
    );

    // A NEW query must not re-open it - that is the reporter's whole workflow.
    await search(page, "beetle");
    await expect(liveTrigger(page)).toHaveAttribute("aria-expanded", "false");
    await search(page, "infected");
    await expect(liveTrigger(page)).toHaveAttribute("aria-expanded", "false");

    // Persisted: reload, restore the live session, search again - still shut.
    await page.reload();
    await waitForMapReady(page, MAPS.kilima.key);
    await goLive(page);
    await search(page, "infected");
    await expect(liveTrigger(page)).toHaveAttribute("aria-expanded", "false");
    await expect.poll(() => rows(page).count()).toBe(0);

    // The historical scope is remembered separately - still open.
    await page.evaluate(() =>
      (window as any).__thgl.userStore.getState().setSearchScope("historical"),
    );
    await expect(
      section(page).getByRole("button", { name: /Locations/ }),
    ).toHaveAttribute("aria-expanded", "true");

    // And the live section re-opens on click.
    await page.evaluate(() =>
      (window as any).__thgl.userStore.getState().setSearchScope("live"),
    );
    await liveTrigger(page).click();
    await expect.poll(() => rows(page).count()).toBeGreaterThan(0);
    expect(
      await userState<string[]>(page, "collapsedSearchScopes"),
    ).not.toContain("live");
  });
});
