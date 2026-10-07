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
 * The overlay says how to leave the fullscreen minimap, but people who toggle
 * fullscreen a lot (planning a route) had it covering the top buttons every
 * time (inbox #702). It shows only the first 3 times, at the bottom, closable,
 * with "Don't show again". The overlay currently mounts two Toasters (the
 * stacks overlap), hence `.first()` / `.last()` (the top one gets the click).
 */
const HINT = "The map is fullscreen.";

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
  await page.evaluate(() => {
    localStorage.removeItem("thgl:overlay-fullscreen-hint-shown");
    const s = (window as any).__thgl.useSettingsStore.getState();
    if (s.overlayFullscreen) s.toggleOverlayFullscreen();
  });
};

const toggleFullscreen = (page: Page) =>
  page.evaluate(() =>
    (window as any).__thgl.useSettingsStore
      .getState()
      .toggleOverlayFullscreen(),
  );

test("overlay: fullscreen hint shows only the first 3 times, at the bottom", async ({
  page,
}) => {
  await openOverlay(page);
  const hint = page.getByText(HINT).first();

  for (let i = 0; i < 3; i++) {
    await toggleFullscreen(page);
    await expect(hint).toBeVisible();
    // Bottom half of the window: it must not cover the toolbar at the top.
    const box = (await hint.boundingBox())!;
    expect(box.y).toBeGreaterThan(450);
    await page.getByRole("button", { name: "Close toast" }).last().click();
    await expect(hint).toBeHidden();
    await toggleFullscreen(page);
  }

  await toggleFullscreen(page);
  await page.waitForTimeout(1000);
  await expect(hint).toBeHidden();
});

test("overlay: fullscreen hint 'Don't show again' stops it", async ({
  page,
}) => {
  await openOverlay(page);
  const hint = page.getByText(HINT).first();

  await toggleFullscreen(page);
  await expect(hint).toBeVisible();
  await page.getByRole("button", { name: "Don't show again" }).last().click();
  await expect(hint).toBeHidden();

  await toggleFullscreen(page);
  await toggleFullscreen(page);
  await page.waitForTimeout(1000);
  await expect(hint).toBeHidden();
});
