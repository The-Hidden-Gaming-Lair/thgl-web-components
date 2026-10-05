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
 * The in-game minimap can be dragged flush against the top of the screen
 * (inbox #362 — it used to stop 24px short). While unlocked, the 32px app
 * header covers that strip, so the minimap toolbar (with the drag handle)
 * must move down below the header instead of hiding behind it.
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

test("overlay: minimap drags flush to the top, toolbar stays below the header", async ({
  page,
}) => {
  await openOverlay(page);
  await page.evaluate(() => {
    const s = (window as any).__thgl.useSettingsStore.getState();
    if (s.lockedWindow) s.toggleLockedWindow();
    if (s.overlayFullscreen) s.toggleOverlayFullscreen();
  });

  const handle = page.getByRole("button", { name: "Move minimap" });
  await expect(handle).toBeVisible();
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, -500, { steps: 15 });
  await page.mouse.up();

  const container = page.locator(".lock.z-11000");
  await expect.poll(async () => (await container.boundingBox())?.y).toBe(0);

  const header = (await page.locator("header").first().boundingBox())!;
  const handleAfter = (await handle.boundingBox())!;
  expect(handleAfter.y).toBeGreaterThanOrEqual(header.y + header.height);

  // The flush position is persisted for the locked overlay.
  expect(
    await page.evaluate(
      () =>
        (window as any).__thgl.useSettingsStore.getState().mapTransform
          .transform,
    ),
  ).toMatch(/translate\([^,]+,\s*0px\)/);
});
