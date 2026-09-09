import { expect, test } from "@playwright/test";
import {
  APP_BASE_URL,
  CLAY,
  GAME,
  MAPS,
  emitWebviewMessage,
  installFakeWebviewBridge,
  liveMarkers,
  toggleFilter,
  userState,
  waitForAppMapReady,
} from "./fixtures";

/**
 * The companion app surface (`/apps/<game>` on app.localhost, rendered inside
 * THGLApp's WebView2). This is where the live regressions were reported from,
 * so drive it the way the C++ host does: a fake bridge + real `player` /
 * `actors` messages, not store setters.
 *
 * Regressions this guards:
 *  - ed5a7d42a "map zoomed out + not tracking after first login": the map
 *    must follow the player's mapName and place the player marker.
 *  - 85560d573 / be8e61b1b: live actors delivered through the message path
 *    render on the live layer and go away with their map.
 */
const player = (map: string, x: number, y: number) => ({
  action: "player",
  payload: { x, y, z: 0, r: 0, mapName: map },
});
const actors = (map: string, x: number, y: number) => ({
  action: "actors",
  payload: [0, 1].map((i) => ({
    address: String(5000 + i),
    type: CLAY.actorClass,
    x: x + i * 400,
    y: y + i * 400,
    z: 0,
    r: 0,
    mapName: map,
    hidden: false,
  })),
});

const nonPlayerLive = (page: Parameters<typeof liveMarkers>[0]) =>
  liveMarkers(page).then((m) => m.filter((i) => i.id !== "player"));

test.describe("companion surface", () => {
  test("follows the player across maps and renders host-delivered actors", async ({
    page,
  }) => {
    await installFakeWebviewBridge(page);
    await page.goto(`${APP_BASE_URL}/apps/${GAME}`);
    const initial = await waitForAppMapReady(page);
    expect(
      await page.evaluate(() => (window as any).chrome.webview.__emit({})),
      "the app registered its webview message listener",
    ).toBeGreaterThan(0);

    // Pick whichever fixture map the app did NOT start on, so the follow is
    // an actual switch.
    const first = initial === MAPS.bahari.key ? MAPS.kilima : MAPS.bahari;
    const second = first === MAPS.kilima ? MAPS.bahari : MAPS.kilima;

    await emitWebviewMessage(
      page,
      player(first.key, CLAY.spawn.lat, CLAY.spawn.lng),
    );
    await expect
      .poll(() => userState(page, "mapName"), { timeout: 15_000 })
      .toBe(first.key);
    await expect
      .poll(() =>
        liveMarkers(page).then((m) => m.some((i) => i.id === "player")),
      )
      .toBe(true);

    // Actors on the player's map draw on the live layer (message path, not
    // the store setter).
    await toggleFilter(page, CLAY.id);
    await page.evaluate(() => {
      const settings = (window as any).__thgl.useSettingsStore;
      settings.setState({ autoLiveModeWithMe: false });
      settings.getState().setLiveMode("live");
    });
    await emitWebviewMessage(
      page,
      actors(first.key, CLAY.spawn.lat, CLAY.spawn.lng),
    );
    await expect.poll(() => nonPlayerLive(page).then((m) => m.length)).toBe(2);
    for (const m of await nonPlayerLive(page)) expect(m.key).toBe(CLAY.id);

    // The player moves to another map: the map follows and the previous
    // map's actors are no longer drawn.
    await emitWebviewMessage(
      page,
      player(second.key, CLAY.spawn.lat, CLAY.spawn.lng),
    );
    await expect
      .poll(() => userState(page, "mapName"), { timeout: 15_000 })
      .toBe(second.key);
    await expect.poll(() => nonPlayerLive(page).then((m) => m.length)).toBe(0);
    await expect
      .poll(() =>
        liveMarkers(page).then((m) => m.some((i) => i.id === "player")),
      )
      .toBe(true);
  });
});
