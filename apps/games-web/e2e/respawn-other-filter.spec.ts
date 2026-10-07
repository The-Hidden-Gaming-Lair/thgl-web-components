import { expect, test, type Page } from "@playwright/test";
import { MAPS, openMap } from "./fixtures";

/**
 * The respawn reset ("Reset discovered nodes when they respawn", on by
 * default) unticks only the node whose actor came back, never a tick of
 * another filter on the same spot.
 *
 * Regression (web, fix/discover-all-same-spot): the filter-type gate only
 * knew the loaded map's static types, so a live-only variant filter (Palia
 * star-quality forage, no static spawns) passed it. A star mushroom actor
 * standing on a ticked ginger spot counted as "this ginger respawned" and
 * the respawn reset deleted the user's ginger tick.
 *
 * Actors are injected straight into useGameState (what the THGLApp message
 * handler calls); the respawn pass runs in every live mode.
 */
const GINGER = "bp_gatherable_ginger@5188.900000000001:42019.9";
const SPOT = { x: 5188.9, y: 42019.9 };

const actor = (address: number, type: string) => ({
  address,
  type,
  mapName: MAPS.kilima.key,
  x: SPOT.x,
  y: SPOT.y,
  z: 0,
  r: 0,
  hidden: false,
  discovered: false,
});

const discoveredNodes = (page: Page) =>
  page.evaluate(
    () =>
      (window as any).__thgl.useSettingsStore.getState()
        .discoveredNodes as string[],
  );

test("a star mushroom actor on a ticked ginger spot keeps the ginger tick", async ({
  page,
}) => {
  await openMap(page, MAPS.kilima);
  await page.evaluate((id) => {
    const s = (window as any).__thgl.useSettingsStore;
    s.setState({ autoResetRespawned: true });
    s.getState().setDiscoveredNodes([]);
    s.getState().setDiscoverNode(id, true);
  }, GINGER);
  expect(await discoveredNodes(page)).toEqual([GINGER]);

  // Another filter's live-only variant appears on the ginger spot.
  await page.evaluate(
    (actors) =>
      (window as any).__thgl.useGameState.getState().setActors(actors),
    [actor(7001, "BP_Gatherable_MushroomR_C_Variant.StarQuality")],
  );
  // Give the live pass time to run, then the tick must still be there.
  await page.waitForTimeout(1500);
  expect(await discoveredNodes(page)).toEqual([GINGER]);

  // Control: a ginger (star) actor coming back on that spot does reset it,
  // so the pass above did run.
  await page.evaluate(
    (actors) =>
      (window as any).__thgl.useGameState.getState().setActors(actors),
    [
      actor(7001, "BP_Gatherable_MushroomR_C_Variant.StarQuality"),
      actor(7002, "BP_Gatherable_Ginger_C_Variant.StarQuality"),
    ],
  );
  await expect.poll(() => discoveredNodes(page)).toEqual([]);
});
