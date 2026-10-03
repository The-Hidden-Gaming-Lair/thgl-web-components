import { expect, test } from "@playwright/test";
import { MAPS, openMap } from "./fixtures";

/**
 * "Player icon color": by default the player icon keeps the game's own colors
 * (Palia: a teal arrow). Picking a color recolors the icon so its brightest
 * part becomes exactly that color; clearing it restores the original.
 */
const player = {
  address: 1,
  type: "Player",
  mapName: MAPS.kilima.key,
  x: 33245,
  y: 10565,
  z: 0,
  r: 0,
};

// The brightest opaque pixel of the player sheet the marker layer draws.
const brightestPixel = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const map = (window as any).__thgl.useMapStore.getState().map;
    const sheet = map.liveMarkerLayer?.sheetImages?.get("player-player") as
      | HTMLCanvasElement
      | undefined;
    if (!sheet) return null;
    const ctx = sheet.getContext("2d")!;
    const { data } = ctx.getImageData(0, 0, sheet.width, sheet.height);
    let best: number[] | null = null;
    let bestLum = -1;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 250) continue;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum > bestLum) {
        bestLum = lum;
        best = [data[i], data[i + 1], data[i + 2]];
      }
    }
    return best;
  });

test.describe("player icon color", () => {
  test("picking a color recolors the player icon and clearing restores it", async ({
    page,
  }) => {
    await openMap(page, MAPS.kilima);

    await page.evaluate((p) => {
      const t = (window as any).__thgl;
      t.useSettingsStore.setState({
        playerIconColor: "",
        playerBelowMarkers: false,
        colorBlindMode: "none",
      });
      t.useGameState.getState().setPlayer(p);
    }, player);

    // Original Palia icon: teal (green and blue well above red).
    await expect.poll(() => brightestPixel(page)).not.toBeNull();
    const original = (await brightestPixel(page))!;
    expect(original[1]).toBeGreaterThan(original[0] + 100);

    await page.evaluate(() =>
      (window as any).__thgl.useSettingsStore
        .getState()
        .setPlayerIconColor("#ff0000"),
    );
    await expect.poll(() => brightestPixel(page)).toEqual([255, 0, 0]);

    await page.evaluate(() =>
      (window as any).__thgl.useSettingsStore.getState().setPlayerIconColor(""),
    );
    await expect.poll(() => brightestPixel(page)).toEqual(original);
  });
});
