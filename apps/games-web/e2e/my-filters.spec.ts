import { expect, test } from "@playwright/test";
import {
  CLAY,
  MAPS,
  filterEnabled,
  markerIds,
  openMap,
  toggleFilter,
  waitForMapReady,
} from "./fixtures";

/**
 * Regressions this guards (2026-09, signed-out / local-only path):
 *  - a090b34cb "custom filters no longer vanish after saving/reopening"
 *  - d8a03fd16 "close the three regressions the rehydrate union introduced"
 *  - e30a203f4 "reset now really deletes; mutation cores extracted and tested"
 * The persist `merge` reconcile and the node-removal write-back now live in
 * packages/lib (settings-rehydrate.ts, filters-mutations.ts); this drives the
 * real store + localStorage round trip through a page reload.
 */
const FILTER_NAME = "my_e2e_custom";
const NODE_ID = "e2e-node-1";

const customFilter = () => ({
  name: FILTER_NAME,
  nodes: [
    {
      id: NODE_ID,
      name: "E2E node",
      icon: null,
      radius: 8,
      color: "#ff00ff",
      p: [CLAY.spawn.lat, CLAY.spawn.lng],
      mapName: MAPS.kilima.key,
    },
  ],
});

const myFilterNames = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    ((window as any).__thgl.useSettingsStore.getState().myFilters as any[]).map(
      (f) => f.name,
    ),
  );

const nodeCountIn = (page: import("@playwright/test").Page, name: string) =>
  page.evaluate(
    (n) =>
      (
        (window as any).__thgl.useSettingsStore.getState().myFilters as any[]
      ).find((f) => f.name === n)?.nodes?.length ?? -1,
    name,
  );

test.describe("my filters", () => {
  test("a custom filter survives a reload, and removing its node sticks", async ({
    page,
  }) => {
    await openMap(page, MAPS.kilima);
    expect(await myFilterNames(page)).not.toContain(FILTER_NAME);

    await page.evaluate(
      (f) => (window as any).__thgl.useSettingsStore.getState().addMyFilter(f),
      customFilter(),
    );
    await expect.poll(() => myFilterNames(page)).toContain(FILTER_NAME);
    // A custom filter is a filter type like any other: the sidebar enables it
    // after creating it, so do the same (the enabled set persists too).
    if (!(await filterEnabled(page, FILTER_NAME))) {
      await toggleFilter(page, FILTER_NAME);
    }
    await expect
      .poll(async () =>
        (await markerIds(page)).some((id) => id.includes(NODE_ID)),
      )
      .toBe(true);

    // Reload: persist → rehydrate → reconcile. The filter must come back.
    await page.reload();
    await waitForMapReady(page, MAPS.kilima.key);
    expect(await myFilterNames(page)).toContain(FILTER_NAME);
    expect(await nodeCountIn(page, FILTER_NAME)).toBe(1);
    await expect
      .poll(async () =>
        (await markerIds(page)).some((id) => id.includes(NODE_ID)),
      )
      .toBe(true);

    // Remove the node, reload, it must stay gone (and the filter must stay).
    await page.evaluate(
      (id) =>
        (window as any).__thgl.useSettingsStore.getState().removeMyNode(id),
      NODE_ID,
    );
    await expect.poll(() => nodeCountIn(page, FILTER_NAME)).toBe(0);
    await page.reload();
    await waitForMapReady(page, MAPS.kilima.key);
    expect(await nodeCountIn(page, FILTER_NAME)).toBe(0);
    expect((await markerIds(page)).some((id) => id.includes(NODE_ID))).toBe(
      false,
    );
  });
});
