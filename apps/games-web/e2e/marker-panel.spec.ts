import { expect, test } from "@playwright/test";
import {
  CLAY,
  CLAY_NODE_ID,
  MAPS,
  mapUrl,
  openMap,
  selectNode,
  toggleFilter,
  userState,
  waitForMapReady,
} from "./fixtures";

test.describe("marker panel", () => {
  test("selecting a node id opens its panel and syncs the URL", async ({
    page,
  }) => {
    await openMap(page, MAPS.kilima);
    await toggleFilter(page, CLAY.id);
    await selectNode(page, CLAY_NODE_ID);

    // SidePanel renders a desktop + mobile copy; assert on the visible one.
    const heading = page
      .getByRole("heading", { level: 2, name: CLAY.label })
      .first();
    await expect(heading).toBeVisible();
    await expect(page.getByText("Node not found")).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => decodeURIComponent(location.href)))
      .toContain(CLAY.id);
  });

  test("a deep link to a spot that is no marker centers the map there", async ({
    page,
  }) => {
    // Codex "Found at" pins can name places that plot no marker (a villager schedule spot, a
    // shop register): the map has nothing to select but must still open at that spot.
    const node = `codex.place@${CLAY.spawn.lat}:${CLAY.spawn.lng}`;
    await page.goto(
      `${mapUrl(MAPS.kilima.title)}/place/${encodeURIComponent(node)}?id=${encodeURIComponent(node)}`,
    );
    await waitForMapReady(page, MAPS.kilima.key);
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const map = (window as any).__thgl.useMapStore.getState().map;
            return map.getCenterLatLng() as [number, number];
          }),
        { timeout: 15_000 },
      )
      .toEqual([
        expect.closeTo(CLAY.spawn.lat, 0),
        expect.closeTo(CLAY.spawn.lng, 0),
      ]);
    expect(await userState(page, "selectedNodeId")).toBeFalsy();
  });

  test("an unknown node id shows 'Node not found' instead of a broken panel", async ({
    page,
  }) => {
    await openMap(page, MAPS.kilima);
    await selectNode(page, "no.such.type@1:2");
    await expect(page.getByText("Node not found").first()).toBeVisible();
  });
});
