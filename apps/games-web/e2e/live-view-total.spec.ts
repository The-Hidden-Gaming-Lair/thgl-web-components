import { expect, test } from "@playwright/test";
import { CLAY, MAPS, markerCount, openMap, toggleFilter } from "./fixtures";

/**
 * A filter's settings popover counts every known spot of the map, also in
 * Live view, where the predicted spots are not plotted.
 *
 * Regression (data-forge inbox #1090): in Live view the popover showed
 * "Total 0 · Discovered 0" and "Discover all 0/0" for a live-tracked filter,
 * so a player read it as "this data is missing" (Aniimo Lumin Amber, 102
 * spots on the website). The popover now keeps the total and says why the
 * map shows fewer.
 */
test("Live view keeps the filter total and explains the hidden spots", async ({
  page,
}) => {
  await openMap(page, MAPS.kilima);
  await toggleFilter(page, CLAY.id);
  await expect.poll(() => markerCount(page, `${CLAY.id}@`)).toBeGreaterThan(0);
  const total = await markerCount(page, `${CLAY.id}@`);

  // Live-capable session (Peer Link stand-in) in Live view. With "Auto Live
  // Mode" on the streaming receiver forces the mode back to Predicted while no
  // Peer Link "Me" sender is connected, so opt out first.
  await page.evaluate(() => {
    const t = (window as any).__thgl;
    t.useSettingsStore.setState({ autoLiveModeWithMe: false });
    t.useGameState.setState({ peerLiveConnected: true });
    t.useSettingsStore.getState().setLiveMode("live");
  });
  // The predicted Clay spots are no longer plotted.
  await expect.poll(() => markerCount(page, `${CLAY.id}@`)).toBe(0);

  await page.getByPlaceholder("Type to search...").fill(CLAY.label);
  const valueButton = page.getByRole("button", {
    name: CLAY.label,
    exact: true,
  });
  await expect(valueButton).toHaveCount(1);
  await valueButton
    .locator("xpath=..")
    .getByRole("button", { name: "Filter settings" })
    .click();
  const popover = page.getByRole("dialog");

  await expect(popover).toContainText(`Total: ${total}`);
  await expect(popover).toContainText(
    "Live view only shows spots detected near you.",
  );
  await expect(
    popover.getByRole("button", { name: /^Discover all/ }),
  ).toContainText(`0/${total}`);
});
