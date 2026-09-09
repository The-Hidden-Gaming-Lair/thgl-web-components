import { expect, test } from "@playwright/test";
import {
  CLAY,
  CLAY_NODE_ID,
  MAPS,
  openMap,
  selectNode,
  toggleFilter,
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

  test("an unknown node id shows 'Node not found' instead of a broken panel", async ({
    page,
  }) => {
    await openMap(page, MAPS.kilima);
    await selectNode(page, "no.such.type@1:2");
    await expect(page.getByText("Node not found").first()).toBeVisible();
  });
});
