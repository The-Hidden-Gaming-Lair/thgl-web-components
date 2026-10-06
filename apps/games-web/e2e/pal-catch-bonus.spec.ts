import { expect, test, type Page } from "@playwright/test";

/**
 * Palworld catch bonus (inbox #112): with the per-species capture counts the
 * Companion App reads (characterData.palCaptureCounts), Pal markers carry an
 * "x/5" badge and "Only Pals caught fewer than 5 times" hides species caught
 * 5+ times - static spawns and live actors alike.
 */
const PALWORLD_URL = "http://palworld-dev.localhost:3100";
const MAP_KEY = "default";

// Alpha catches count for their species: ChickenPal = 4 + 1 = 5 (done).
const COUNTS = { SheepBall: 2, ChickenPal: 4, BOSS_ChickenPal: 1, PinkCat: 0 };
const TYPES = ["sheepball", "chickenpal", "pinkcat"];

async function openPalworld(page: Page) {
  await page.goto(`${PALWORLD_URL}/maps/Palpagos%20Island`);
  await page.waitForFunction(
    (key) => {
      const t = (window as any).__thgl;
      if (!t?.userStore || !t.useMapStore) return false;
      const u = t.userStore.getState();
      const map = t.useMapStore.getState().map;
      return (
        u._hasHydrated &&
        t.useSettingsStore.getState()._hasHydrated &&
        u.mapName === key &&
        !!map?.markerLayer &&
        !!map?.liveMarkerLayer
      );
    },
    MAP_KEY,
    { timeout: 30_000 },
  );
}

/** Capture count per static marker type (undefined = no badge). */
function staticBadges(page: Page) {
  return page.evaluate(() => {
    const map = (window as any).__thgl.useMapStore.getState().map;
    const byType: Record<string, { n: number; badges: number[] }> = {};
    for (const i of map.markerLayer.getInstances().filter(Boolean) as any[]) {
      const e = (byType[i.key] ??= { n: 0, badges: [] });
      e.n++;
      if (i.captureCount !== undefined && !e.badges.includes(i.captureCount))
        e.badges.push(i.captureCount);
    }
    return byType;
  });
}

test.describe("palworld catch bonus", () => {
  test("x/5 badges and the only-fewer-than-5 filter", async ({ page }) => {
    await openPalworld(page);
    await page.evaluate(
      ({ counts, types }) => {
        const t = (window as any).__thgl;
        t.userStore.getState().setFilters(types);
        const s = t.useSettingsStore.getState();
        s.setPalCaptureOnlyIncomplete(false);
        s.setPalCaptureBadges(true);
        s.setPalCaptureCounts(counts);
      },
      { counts: COUNTS, types: TYPES },
    );

    await expect
      .poll(async () => {
        const b = await staticBadges(page);
        return {
          sheepball: b.sheepball?.badges,
          pinkcat: b.pinkcat?.badges,
          chickenpal: b.chickenpal?.badges,
          chickenpalShown: (b.chickenpal?.n ?? 0) > 0,
        };
      })
      .toEqual({
        sheepball: [2],
        pinkcat: [0],
        chickenpal: [],
        chickenpalShown: true,
      });

    // Filter on: the completed species disappears, the rest stay.
    await page.evaluate(() =>
      (window as any).__thgl.useSettingsStore
        .getState()
        .setPalCaptureOnlyIncomplete(true),
    );
    await expect
      .poll(async () => {
        const b = await staticBadges(page);
        return [!!b.sheepball?.n, !!b.pinkcat?.n, !!b.chickenpal?.n];
      })
      .toEqual([true, true, false]);

    // Live actors follow the same rules.
    await page.evaluate((key) => {
      const t = (window as any).__thgl;
      t.useSettingsStore.setState({ autoLiveModeWithMe: false });
      t.useSettingsStore.getState().setLiveMode("live");
      const base = { z: 0, r: 0, mapName: key };
      t.useGameState.getState().setActors([
        { ...base, type: "BP_PinkCat_C", x: -330000, y: 280000, address: 101 },
        {
          ...base,
          type: "BP_ChickenPal_C",
          x: -320000,
          y: 280000,
          address: 102,
        },
        {
          ...base,
          type: "BP_SheepBall_C",
          x: -325170,
          y: 285000,
          address: 103,
        },
      ]);
    }, MAP_KEY);
    const live = () =>
      page.evaluate(() => {
        const map = (window as any).__thgl.useMapStore.getState().map;
        return Object.fromEntries(
          (map.liveMarkerLayer.getInstances().filter(Boolean) as any[])
            .filter((i) => i.key)
            .map((i) => [i.key, i.captureCount ?? null]),
        );
      });
    await expect.poll(live).toEqual({ pinkcat: 0, sheepball: 2 });

    // Badges off + filter off: Chikipi is back, no badges anywhere.
    await page.evaluate(() => {
      const s = (window as any).__thgl.useSettingsStore.getState();
      s.setPalCaptureOnlyIncomplete(false);
      s.setPalCaptureBadges(false);
    });
    await expect
      .poll(live)
      .toEqual({ pinkcat: null, sheepball: null, chickenpal: null });
  });
});
