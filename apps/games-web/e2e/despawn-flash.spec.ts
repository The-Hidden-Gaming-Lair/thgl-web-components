import { expect, test } from "@playwright/test";
import { CLAY, MAPS, openMap, toggleFilter } from "./fixtures";

/**
 * Despawn-warning blink (inbox #409): a live actor with a running despawn
 * countdown (`despawnAt`, unix ms, sent by THGLApp for Palia ore + forage)
 * flashes its marker in the last 30 s, like the game does. Outside that window
 * or with the setting off it stays steady.
 */
const actor = (i: number, despawnAt?: number) => ({
  address: 2000 + i,
  type: CLAY.actorClass,
  mapName: MAPS.kilima.key,
  x: CLAY.spawn.lat + i * 4000,
  y: CLAY.spawn.lng + i * 4000,
  z: 0,
  r: 0,
  ...(despawnAt ? { despawnAt } : {}),
});

/** Samples each live marker's muted state every 50 ms for `ms`. */
function sampleMuted(page: import("@playwright/test").Page, ms: number) {
  return page.evaluate(async (duration) => {
    const map = (window as any).__thgl.useMapStore.getState().map;
    const seen: Record<string, boolean[]> = {};
    const end = Date.now() + duration;
    while (Date.now() < end) {
      for (const i of map.liveMarkerLayer.getInstances().filter(Boolean)) {
        (seen[i.id] ??= []).push(!!i.isMuted);
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    return seen;
  }, ms);
}

test.describe("despawn flash", () => {
  test("live markers with a running despawn countdown blink", async ({
    page,
  }) => {
    await openMap(page, MAPS.kilima);
    await toggleFilter(page, CLAY.id);
    await page.evaluate(() => {
      const settings = (window as any).__thgl.useSettingsStore;
      settings.setState({ autoLiveModeWithMe: false });
      settings.getState().setLiveMode("live");
    });

    const now = Date.now();
    const actors = [
      actor(0), // no countdown
      actor(1, now + 20_000), // in the 30 s warning window
      actor(2, now + 5 * 60_000), // countdown running, not due yet
    ];
    await page.evaluate(
      (a) => (window as any).__thgl.useGameState.getState().setActors(a),
      actors,
    );
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as any).__thgl.useMapStore
              .getState()
              .map.liveMarkerLayer.getInstances()
              .filter(Boolean).length,
        ),
      )
      .toBe(3);

    const flips = (states: boolean[]) =>
      states.filter((s, i) => i > 0 && s !== states[i - 1]).length;
    const flipCounts = (seen: Record<string, boolean[]>) =>
      Object.values(seen)
        .map(flips)
        .sort((a, b) => a - b);

    // Only the due actor blinks (500 ms period → ~4 flips in 2 s); the one
    // without a countdown and the one not due yet stay steady.
    const [a, b, c] = flipCounts(await sampleMuted(page, 2000));
    expect(a, "no countdown: steady").toBe(0);
    expect(b, "not due yet: steady").toBe(0);
    expect(c, "due countdown: blinks").toBeGreaterThan(2);

    // Setting off → all steady again.
    await page.evaluate(() =>
      (window as any).__thgl.useSettingsStore
        .getState()
        .setFlashDespawningNodes(false),
    );
    expect(flipCounts(await sampleMuted(page, 1500))).toEqual([0, 0, 0]);
  });
});
