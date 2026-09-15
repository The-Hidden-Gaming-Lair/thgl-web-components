import { expect, test } from "@playwright/test";
import { MAPS, openMap } from "./fixtures";

/**
 * "Rotate map with player" (heading-up mode): while following the player, the
 * camera bearing tracks the player's facing direction so the direction they
 * face is at the top of the screen, like a rotating minimap. Guards:
 *  - bearing == heading + the icon's forward angle (Palia's arrow points right,
 *    `playerIconForward: 90` in games.ts; no tiles rotation offset), including
 *    headings wrapping across the ±180° seam;
 *  - the mode is inert while Follow Player is off and turning either off
 *    puts north back on top.
 *
 * The player is injected straight into useGameState (what the app/plugin
 * transport calls); the bearing is read from the WebMap via the dev seam.
 */
const player = (r: number) => ({
  address: 1,
  type: "Player",
  mapName: MAPS.kilima.key,
  x: 33245,
  y: 10565,
  z: 0,
  r,
});

/** games.ts palia markerOptions.playerIconForward (the icon points right). */
const ICON_FORWARD = 90;

const bearingDeg = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const map = (window as any).__thgl.useMapStore.getState().map;
    return (map.getBearing() * 180) / Math.PI;
  });

/** Poll until the smoothed bearing settled on `deg` (shortest-arc, ±0.5°). */
const expectBearing = async (
  page: import("@playwright/test").Page,
  deg: number,
) => {
  await expect
    .poll(
      async () => {
        const d = await bearingDeg(page);
        const diff = ((((d - deg) % 360) + 540) % 360) - 180;
        return Math.abs(diff) < 0.5 ? "settled" : `bearing ${d.toFixed(2)}`;
      },
      { timeout: 5_000 },
    )
    .toBe("settled");
};

test.describe("rotate map with player", () => {
  test("bearing follows the player's heading and resets to north when off", async ({
    page,
  }) => {
    await openMap(page, MAPS.kilima);
    await page.evaluate((p) => {
      const t = (window as any).__thgl;
      t.useSettingsStore.setState({
        followPlayer: true,
        rotateMapWithPlayer: false,
      });
      t.useGameState.getState().setPlayer(p);
    }, player(90));
    await expectBearing(page, 0);

    await page.evaluate(() =>
      (window as any).__thgl.useSettingsStore
        .getState()
        .setRotateMapWithPlayer(true, "desktop"),
    );
    await expectBearing(page, 90 + ICON_FORWARD);

    await page.evaluate(
      (p) => (window as any).__thgl.useGameState.getState().setPlayer(p),
      player(180),
    );
    await expectBearing(page, 180 + ICON_FORWARD);

    // Across the ±180° seam: -90° is a 90° turn, not a 270° spin.
    await page.evaluate(
      (p) => (window as any).__thgl.useGameState.getState().setPlayer(p),
      player(-90),
    );
    await expectBearing(page, -90 + ICON_FORWARD);

    // Follow off → inert (north up); follow back on → heading-up resumes.
    await page.evaluate(() =>
      (window as any).__thgl.useSettingsStore.getState().toggleFollowPlayer(),
    );
    await page.evaluate(
      (p) => (window as any).__thgl.useGameState.getState().setPlayer(p),
      player(45),
    );
    await expectBearing(page, 0);
    await page.evaluate(() =>
      (window as any).__thgl.useSettingsStore.getState().toggleFollowPlayer(),
    );
    await expectBearing(page, 45 + ICON_FORWARD);

    // Setting off → north up, and the setting itself is off.
    await page.evaluate(() =>
      (window as any).__thgl.useSettingsStore
        .getState()
        .setRotateMapWithPlayer(false, "desktop"),
    );
    await expectBearing(page, 0);
    expect(
      await page.evaluate(
        () =>
          (window as any).__thgl.useSettingsStore.getState()
            .rotateMapWithPlayer,
      ),
    ).toBe(false);
  });
});
