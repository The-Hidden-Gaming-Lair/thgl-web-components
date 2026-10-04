import { expect, test, type Page } from "@playwright/test";
import {
  APP_BASE_URL,
  CLAY,
  GAME,
  MAPS,
  emitWebviewMessage,
  installFakeWebviewBridge,
  waitForAppMapReady,
} from "./fixtures";

/**
 * The overlay's "Widgets Only" mode (games.ts `compactOverlay`, Elite preview
 * — local dev bypasses the account gate): the minimap toolbar button swaps
 * the map for a small widget panel, its "Show Map" button / the hotkey swap
 * back. Palia's panel: zone, grid square, Palia time, Weekly Wants.
 */
const openOverlay = async (page: Page) => {
  await installFakeWebviewBridge(page);
  await page.goto(`${APP_BASE_URL}/apps/${GAME}/overlay`);
  await expect
    .poll(
      async () => {
        await emitWebviewMessage(page, {
          action: "player",
          payload: {
            x: CLAY.spawn.lat,
            y: CLAY.spawn.lng,
            z: 0,
            r: 0,
            mapName: MAPS.kilima.key,
          },
        });
        return page.evaluate(
          () => !!(window as any).__thgl?.useMapStore.getState().map,
        );
      },
      { timeout: 30_000 },
    )
    .toBe(true);
  await waitForAppMapReady(page);
};

test("overlay: Widgets Only replaces the map with the widget panel and back", async ({
  page,
}) => {
  test.skip(GAME !== "palia", "Palia's widget set");
  await openOverlay(page);
  const panel = page.getByTestId("compact-overlay");

  await page.getByRole("button", { name: "Widgets Only" }).click();
  await expect(panel).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(panel).toContainText(MAPS.kilima.title);
  // Kilima has only area labels (no borders): nearest label to the spawn.
  await expect(panel).toContainText("near Remembrance Beach");
  // Same label scheme as the map grid (villageGrid bounds, 10 divisions).
  await expect(panel).toContainText(/Grid\s*F9/);
  await expect(panel).toContainText(/Palia Time\s*\d{1,2}:\d{2} [AP]M/);
  await expect(
    panel.getByRole("button", { name: /Weekly Wants/ }),
  ).toBeVisible();

  // Locked window: no header, click-through panel.
  await page.evaluate(() =>
    (window as any).__thgl.useSettingsStore.getState().toggleLockedWindow(),
  );
  await expect(panel.getByRole("button", { name: /Show Map/ })).toHaveCount(0);
  await page.evaluate(() =>
    (window as any).__thgl.useSettingsStore.getState().toggleLockedWindow(),
  );

  await panel.getByRole("button", { name: /Show Map/ }).click();
  await expect(panel).toHaveCount(0);
  await expect(page.locator("canvas").first()).toBeVisible();

  // The hotkey toggles it too.
  await emitWebviewMessage(page, {
    action: "hotkey",
    payload: { key: "", action: "toggle_compact_overlay" },
  });
  await expect(panel).toBeVisible();
  await emitWebviewMessage(page, {
    action: "hotkey",
    payload: { key: "", action: "toggle_compact_overlay" },
  });
  await expect(panel).toHaveCount(0);
});
