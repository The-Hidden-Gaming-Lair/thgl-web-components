import { expect, test } from "@playwright/test";
import { CLAY, MAPS, liveMarkers, openMap, toggleFilter } from "./fixtures";

/**
 * Regressions this guards:
 *  - be8e61b1b "live markers pulsing big/small while moving": the in-place
 *    update path dropped the sprite-padding size multiplier, so the first
 *    actor tick after creation shrank every marker.
 *  - 56d3d8d95 "fall back to base type for unmapped _Variant actors".
 *
 * Actors are injected straight into useGameState (what the THGLApp message
 * handler calls), bypassing the app/plugin transport.
 */
const actor = (i: number, type: string = CLAY.actorClass) => ({
  address: 1000 + i,
  type,
  mapName: MAPS.kilima.key,
  x: CLAY.spawn.lat + i * 400,
  y: CLAY.spawn.lng + i * 400,
  z: 0,
  r: 0,
});
const ACTORS = [
  actor(0),
  actor(1),
  actor(2, `${CLAY.actorClass}_Variant.NotInTypesIdMap`),
];

test.describe("live markers", () => {
  test("injected actors render and keep their size across position updates", async ({
    page,
  }) => {
    await openMap(page, MAPS.kilima);
    await toggleFilter(page, CLAY.id);
    // The web map starts in Predicted ("static") mode, and with "Auto Live
    // Mode" on the streaming receiver forces it back to static whenever no
    // Peer Link "Me" sender is connected. Opt out, then switch live reading on.
    await page.evaluate(() => {
      const settings = (window as any).__thgl.useSettingsStore;
      settings.setState({ autoLiveModeWithMe: false });
      settings.getState().setLiveMode("live");
    });
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as any).__thgl.useSettingsStore.getState().liveMode,
        ),
      )
      .toBe("live");
    expect(await liveMarkers(page)).toEqual([]);

    await page.evaluate(
      (actors) =>
        (window as any).__thgl.useGameState.getState().setActors(actors),
      ACTORS,
    );
    // A live marker must end up exactly as big as the static marker of the
    // same type. Right after injection it can briefly be the raw-sheet size
    // until the processed sprite is ready (then it is recreated), so poll
    // until all three settled on the static size.
    const staticSize = await page.evaluate((key) => {
      const map = (window as any).__thgl.useMapStore.getState().map;
      return (map.markerLayer.getInstances().filter(Boolean) as any[]).find(
        (i) => i.key === key,
      )?.size as number;
    }, CLAY.id);
    expect(staticSize).toBeGreaterThan(0);
    await expect
      .poll(async () => {
        const live = await liveMarkers(page);
        return live.length === 3 &&
          live.every((m) => Math.abs(m.size - staticSize) < 1e-3)
          ? "settled"
          : JSON.stringify(live);
      })
      .toBe("settled");
    const before = await liveMarkers(page);
    for (const m of before) expect(m.key).toBe(CLAY.id);

    // Move every actor a hair (stays in its cluster cell → in-place update).
    await page.evaluate((actors) => {
      (window as any).__thgl.useGameState.getState().applyActorsDelta(
        actors.map((a: any) => ({ ...a, x: a.x + 1, y: a.y + 1 })),
        [],
      );
    }, ACTORS);
    // Give the imperative pipeline a tick, then compare sizes 1:1 by id.
    await page.waitForTimeout(300);
    const after = await liveMarkers(page);
    expect(after.map((m) => m.id).sort()).toEqual(
      before.map((m) => m.id).sort(),
    );
    for (const m of after) {
      const prev = before.find((b) => b.id === m.id)!;
      expect(m.size, `marker ${m.id} changed size on update`).toBeCloseTo(
        prev.size,
        3,
      );
    }

    // Removal via delta clears them again.
    await page.evaluate(
      (ids) =>
        (window as any).__thgl.useGameState
          .getState()
          .applyActorsDelta([], ids),
      ACTORS.map((a) => String(a.address)),
    );
    await expect.poll(() => liveMarkers(page).then((m) => m.length)).toBe(0);
  });
});
