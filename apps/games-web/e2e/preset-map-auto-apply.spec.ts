import { expect, test, type Page } from "@playwright/test";
import {
  APP_BASE_URL,
  CLAY,
  GAME,
  MAPS,
  emitWebviewMessage,
  installFakeWebviewBridge,
  openMap,
  userState,
  waitForAppMapReady,
} from "./fixtures";

/**
 * Per-map preset auto-apply (inbox #62): a filter preset bound to a map is
 * applied, exactly like a manual selection, whenever the active map changes to
 * it. Both entry points are driven through the real UI: the Presets menu (map
 * pills per preset) and the per-map gear in the map selector (Select).
 */
const PRESET = "E2E Clay";
// Something the preset does NOT contain, to see whether it got replaced.
const OTHER_FILTERS = ["region_borders"];

const setFilters = (page: Page, filters: string[]) =>
  page.evaluate(
    (f) => (window as any).__thgl.userStore.getState().setFilters(f),
    filters,
  );

// Like fixtures' switchMapViaUi, minus its "static markers drawn" wait: a
// Clay-only filter set legitimately draws nothing on Bahari.
async function switchMap(page: Page, to: { key: string; title: string }) {
  await page.getByRole("combobox", { name: "Select map" }).click();
  await page.getByRole("option").filter({ hasText: to.title }).first().click();
  await expect.poll(() => userState(page, "mapName")).toBe(to.key);
}

// Stores hydrated on the given map (no marker wait, same reason as above).
const waitForHydrated = (page: Page, mapKey: string) =>
  page.waitForFunction(
    (key) => {
      const t = (window as any).__thgl;
      return (
        !!t?.userStore &&
        t.userStore.getState()._hasHydrated &&
        t.useSettingsStore.getState()._hasHydrated &&
        t.userStore.getState().mapName === key
      );
    },
    mapKey,
    { timeout: 30_000 },
  );

const presetByMap = (page: Page) =>
  page.evaluate(
    () => (window as any).__thgl.useSettingsStore.getState().presetByMap,
  );

test.describe("preset auto-apply per map", () => {
  test("binds in the Presets menu, applies on switch, persists, unbinds in the map gear", async ({
    page,
  }) => {
    await openMap(page, MAPS.kilima);

    // Save the preset from a known filter state through the Presets form.
    await setFilters(page, [CLAY.id]);
    await page.getByRole("button", { name: "Presets" }).click();
    await page.getByPlaceholder("Type a preset name...").fill(PRESET);
    await page.getByRole("button", { name: "Save Preset" }).click();

    // Bind it to Bahari Bay with the map pill under the preset.
    await page.getByRole("button", { name: "Auto-apply on maps" }).click();
    await page
      .locator('[role="menu"] button[aria-pressed]')
      .filter({ hasText: MAPS.bahari.title })
      .click();
    expect(await presetByMap(page)).toEqual({ [MAPS.bahari.key]: PRESET });
    await page.keyboard.press("Escape");

    // A -> B: the bound preset replaces the current filters.
    await setFilters(page, OTHER_FILTERS);
    await switchMap(page, MAPS.bahari);
    await expect.poll(() => userState(page, "filters")).toEqual([CLAY.id]);

    // B -> A: no binding on A, nothing changes.
    await setFilters(page, OTHER_FILTERS);
    await switchMap(page, MAPS.kilima);
    expect(await userState(page, "filters")).toEqual(OTHER_FILTERS);

    // The binding survives a reload (settings persistence, per game).
    await page.reload();
    await waitForHydrated(page, MAPS.kilima.key);
    expect(await presetByMap(page)).toEqual({ [MAPS.bahari.key]: PRESET });

    // Unbind from the map selector: the gear on Bahari's row -> "None".
    await page.getByRole("combobox", { name: "Select map" }).click();
    await page
      .getByRole("button", { name: `Map settings for ${MAPS.bahari.title}` })
      .click();
    const select = page.getByRole("combobox", { name: "Auto-apply preset" });
    await expect(select).toHaveText(PRESET);
    await select.click();
    await page.getByRole("option", { name: "None", exact: true }).click();
    expect(await presetByMap(page)).toEqual({});
    // Picking in the gear must not have switched the map.
    expect(await userState(page, "mapName")).toBe(MAPS.kilima.key);
    // Close the gear, then the map list, one layer at a time.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Unbound: switching to B leaves the filters alone.
    await setFilters(page, OTHER_FILTERS);
    await switchMap(page, MAPS.bahari);
    expect(await userState(page, "filters")).toEqual(OTHER_FILTERS);
  });

  test("companion app: applies when live mode follows the player to a bound map", async ({
    page,
  }) => {
    await installFakeWebviewBridge(page);
    await page.goto(`${APP_BASE_URL}/apps/${GAME}`);
    const initial = await waitForAppMapReady(page);
    const target = initial === MAPS.bahari.key ? MAPS.kilima : MAPS.bahari;

    await page.evaluate(
      ({ name, mapKey, filters }) => {
        const settings = (window as any).__thgl.useSettingsStore.getState();
        settings.addPreset(name, { filters });
        settings.setPresetForMap(mapKey, name);
      },
      { name: PRESET, mapKey: target.key, filters: [CLAY.id] },
    );
    await setFilters(page, OTHER_FILTERS);

    // The host reports the player on the bound map: the map follows and the
    // preset is applied on the way.
    await emitWebviewMessage(page, {
      action: "player",
      payload: {
        x: CLAY.spawn.lat,
        y: CLAY.spawn.lng,
        z: 0,
        r: 0,
        mapName: target.key,
      },
    });
    await expect
      .poll(() => userState(page, "mapName"), { timeout: 15_000 })
      .toBe(target.key);
    await expect.poll(() => userState(page, "filters")).toEqual([CLAY.id]);
  });
});
