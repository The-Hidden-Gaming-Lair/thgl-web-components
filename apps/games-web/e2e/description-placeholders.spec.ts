import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, waitForMapReady } from "./fixtures";

/**
 * The marker panel and the hover tooltip never show a `{{...}}` placeholder
 * the spawn cannot fill (withoutUnfilledPlaceholders, marker-description.ts).
 *
 * Regression (web, 3a25e433): Wuthering Waves descriptions are templates
 * (`<p>Monster Treasure (Respawns)</p><p>Spawns Daily</p><p>{{area}}</p>{{ctx}}`)
 * that only a spawn with `data` fills; a spawn without it showed the raw
 * `{{area}}{{ctx}}` text. The lines with a placeholder go, the heading lines
 * stay.
 *
 * Runs on Wuthering Waves (subdomain `wuthering`, games.ts `web:`) against
 * the same dev server as the rest of the suite (port from E2E_BASE_URL).
 */
const base = new URL(BASE_URL);
const WUWA_URL = `${base.protocol}//wuthering-dev.localhost${base.port ? `:${base.port}` : ""}`;
const MAP = { key: "AkiWorld_WP", title: "Overworld" };
// A real Overworld spawn without `data` whose own description is a template.
const SPAWN = {
  type: "exile_MTR",
  id: "exile_102001886",
  p: [175998.84, 2646.7] as const,
  heading: "Monster Treasure (Respawns)",
};
const NODE_ID = `${SPAWN.id}@${SPAWN.p[0]}:${SPAWN.p[1]}`;

/** The text the visible page shows (both panel copies and tooltips included). */
const visibleText = (page: Page) => page.locator("body").innerText();

test.describe("description placeholders (Wuthering Waves)", () => {
  test("the marker panel hides placeholders the spawn cannot fill", async ({
    page,
  }) => {
    await page.goto(
      `${WUWA_URL}/maps/${encodeURIComponent(MAP.title)}/${encodeURIComponent(SPAWN.type)}/${encodeURIComponent(NODE_ID)}`,
    );
    await waitForMapReady(page, MAP.key);
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as any).__thgl.userStore.getState().selectedNodeId,
        ),
      )
      .toBe(NODE_ID);
    await expect(page.getByText(SPAWN.heading).first()).toBeVisible();
    await expect(page.getByText("Node not found")).toHaveCount(0);
    expect(await visibleText(page)).not.toContain("{{");
  });

  test("the hover tooltip hides placeholders the spawn cannot fill", async ({
    page,
  }) => {
    await page.goto(`${WUWA_URL}/maps/${encodeURIComponent(MAP.title)}`);
    await waitForMapReady(page, MAP.key);
    await page.evaluate((type) => {
      const u = (window as any).__thgl.userStore.getState();
      if (!u.filters.includes(type)) u.toggleFilter(type);
    }, SPAWN.type);
    await expect
      .poll(() =>
        page.evaluate((id) => {
          const map = (window as any).__thgl.useMapStore.getState().map;
          return (map.markerLayer.getInstances().filter(Boolean) as any[]).some(
            (i) => i.id === id,
          );
        }, NODE_ID),
      )
      .toBe(true);
    await page.evaluate((p) => {
      const map = (window as any).__thgl.useMapStore.getState().map;
      map.setView([p[0], p[1]], map.getMaxZoom(), false);
    }, SPAWN.p);
    const box = (await page.locator("canvas").first().boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.getByText(SPAWN.heading).first()).toBeVisible();
    expect(await visibleText(page)).not.toContain("{{");
  });
});
