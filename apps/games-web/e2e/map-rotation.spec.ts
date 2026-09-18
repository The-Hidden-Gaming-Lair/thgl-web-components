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

/**
 * Ctrl + left-drag rotates/tilts the map (like a middle-button drag) only
 * while the "Rotate map with Ctrl + drag" setting is on. Off, the same drag
 * pans like a plain drag - Ctrl doubles as push-to-talk for many players and
 * kept knocking the map off north. Middle-button drag rotates either way.
 */
test.describe("ctrl + drag rotation toggle", () => {
  type Page = import("@playwright/test").Page;
  type Pt = { x: number; y: number };

  const view = (page: Page) =>
    page.evaluate(() => {
      const map = (window as any).__thgl.useMapStore.getState().map;
      const [lat, lng] = map.getCenterLatLng() as [number, number];
      return {
        bearing: map.getBearing() as number,
        pitch: map.getPitch() as number,
        lat,
        lng,
      };
    });

  const settle = (page: Page) =>
    page.evaluate(
      () =>
        new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
    );

  /** Drag by (dx, dy) px from `from`, optionally with Ctrl held. A negative
   *  dy (upwards) tilts when the gesture rotates, so both axes are exercised. */
  const drag = async (
    page: Page,
    from: Pt,
    dx: number,
    dy: number,
    opts: { ctrl?: boolean; button?: "left" | "middle" } = {},
  ) => {
    const button = opts.button ?? "left";
    if (opts.ctrl) await page.keyboard.down("Control");
    await page.mouse.move(from.x, from.y);
    await page.mouse.down({ button });
    for (let i = 1; i <= 8; i++) {
      await page.mouse.move(from.x + (dx * i) / 8, from.y + (dy * i) / 8);
    }
    await page.mouse.up({ button });
    if (opts.ctrl) await page.keyboard.up("Control");
    await settle(page);
  };

  const northUp = (page: Page) =>
    page.evaluate(() => {
      const map = (window as any).__thgl.useMapStore.getState().map;
      map.setBearing(0);
      map.setPitch(0);
    });

  test("ctrl + drag rotates while on, pans while off; middle drag always rotates", async ({
    page,
  }) => {
    await openMap(page, MAPS.kilima);
    await page.evaluate(() =>
      (window as any).__thgl.useSettingsStore.setState({
        followPlayer: false,
        rotateMapWithPlayer: false,
        rotateMapWithCtrlDrag: true,
      }),
    );
    const box = (await page.locator("canvas").first().boundingBox())!;
    const c = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

    // On (default): ctrl + drag turns AND tilts the map.
    const before = await view(page);
    await drag(page, c, 120, -60, { ctrl: true });
    const rotated = await view(page);
    expect(Math.abs(rotated.bearing - before.bearing)).toBeGreaterThan(0.1);
    expect(rotated.pitch).toBeGreaterThan(before.pitch + 0.05);

    // Off: the same drag pans and leaves bearing/pitch alone.
    await northUp(page);
    await page.evaluate(() =>
      (window as any).__thgl.useSettingsStore
        .getState()
        .setRotateMapWithCtrlDrag(false),
    );
    // The setting reaches the WebMap through a React effect - let it flush.
    await settle(page);
    const level = await view(page);
    await drag(page, c, 120, -60, { ctrl: true });
    const panned = await view(page);
    expect(panned.bearing).toBeCloseTo(level.bearing, 6);
    expect(panned.pitch).toBeCloseTo(level.pitch, 6);
    expect(
      Math.abs(panned.lat - level.lat) + Math.abs(panned.lng - level.lng),
    ).toBeGreaterThan(0);

    // Middle-button drag still rotates with the setting off.
    await drag(page, c, 120, -60, { button: "middle" });
    const middle = await view(page);
    expect(Math.abs(middle.bearing - panned.bearing)).toBeGreaterThan(0.1);

    expect(
      await page.evaluate(
        () =>
          (window as any).__thgl.useSettingsStore.getState()
            .rotateMapWithCtrlDrag,
      ),
    ).toBe(false);
  });
});
