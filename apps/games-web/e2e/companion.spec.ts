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
 *  - d0480826 "game-reported collected marks follow the current character":
 *    a `characterData.collectedNodeSets` set replaces the game-reported marks
 *    of that set (an owned id goes after two reports without it), never
 *    touches a hand-made mark, and ignores the legacy `collectedNodeIds` sent
 *    alongside it; a legacy-only payload (Aniimo) still adds as before.
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

  test("game-reported collected sets follow the character, hand marks and the legacy path stay", async ({
    page,
  }) => {
    await installFakeWebviewBridge(page);
    await page.goto(`${APP_BASE_URL}/apps/${GAME}`);
    await waitForAppMapReady(page);

    const settings = () =>
      page.evaluate(() => {
        const s = (window as any).__thgl.useSettingsStore.getState();
        const profile = s.profiles.find(
          (p: any) => p.id === s.currentProfileId,
        );
        return {
          discoveredNodes: s.discoveredNodes as string[],
          autoDiscoveredNodes: s.autoDiscoveredNodes as string[],
          gameReportedNodes: s.gameReportedNodes as Record<string, string[]>,
          profileGameReportedNodes: profile?.settings.gameReportedNodes as
            | Record<string, string[]>
            | undefined,
        };
      });
    const characterData = (payload: Record<string, unknown>) =>
      emitWebviewMessage(page, { action: "characterData", payload });
    const HAND_MARK = "e2e_trace_1@100:200";

    // (a) Auto-discovery on, and a hand-made mark on a trace pin.
    await page.evaluate((handMark) => {
      const s = (window as any).__thgl.useSettingsStore.getState();
      if (!s.autoDiscoverCollected) s.setAutoDiscoverCollected(true);
      s.toggleDiscoveredNode(handMark);
    }, HAND_MARK);
    await expect
      .poll(() => settings().then((s) => s.discoveredNodes))
      .toContain(HAND_MARK);

    // (b) A complete set for the current character. The legacy
    // collectedNodeIds sent alongside it is ignored.
    await characterData({
      collectedNodeIds: ["e2e_legacy"],
      collectedNodeSets: { empyrean_traces: ["e2e_trace_1", "e2e_trace_2"] },
    });
    await expect
      .poll(() => settings().then((s) => s.gameReportedNodes.empyrean_traces))
      .toEqual(["e2e_trace_1", "e2e_trace_2"]);
    let snap = await settings();
    expect(snap.discoveredNodes).toEqual(
      expect.arrayContaining(["e2e_trace_1", "e2e_trace_2"]),
    );
    expect(snap.autoDiscoveredNodes).toEqual(
      expect.arrayContaining(["e2e_trace_1", "e2e_trace_2"]),
    );
    expect(snap.discoveredNodes).not.toContain("e2e_legacy");
    expect(snap.profileGameReportedNodes).toEqual(snap.gameReportedNodes);

    // (c) Another character's set, first report: e2e_trace_1 is missing
    // once, which is not enough to remove it; e2e_trace_3 is added.
    const otherCharacter = {
      collectedNodeSets: { empyrean_traces: ["e2e_trace_2", "e2e_trace_3"] },
    };
    await characterData(otherCharacter);
    await expect
      .poll(() => settings().then((s) => s.discoveredNodes))
      .toContain("e2e_trace_3");
    expect((await settings()).discoveredNodes).toContain("e2e_trace_1");

    // (d) Second report without it: e2e_trace_1 goes, the hand mark stays.
    await characterData(otherCharacter);
    await expect
      .poll(() => settings().then((s) => s.discoveredNodes))
      .not.toContain("e2e_trace_1");
    snap = await settings();
    expect(snap.autoDiscoveredNodes).not.toContain("e2e_trace_1");
    expect(snap.gameReportedNodes.empyrean_traces).not.toContain("e2e_trace_1");
    expect(snap.discoveredNodes).toContain(HAND_MARK);

    // (e) A legacy-only payload (Aniimo) still adds through the old path.
    await characterData({ collectedNodeIds: ["e2e_legacy"] });
    await expect
      .poll(() => settings().then((s) => s.discoveredNodes))
      .toContain("e2e_legacy");
  });
});
