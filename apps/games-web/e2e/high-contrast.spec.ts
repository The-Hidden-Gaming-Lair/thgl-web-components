import { expect, test } from "@playwright/test";
import { MAPS, openMap } from "./fixtures";

/**
 * Windows High Contrast (`forced-colors: active`) replaces every author
 * colour with the system palette. The Switch thumb was `bg-background` on a
 * `bg-input` track - both forced to Canvas - so the Audio Alert toggle (and
 * every other switch) became a black dot on a black track: on and off looked
 * identical. The UI primitives now paint system colours in forced-colors mode.
 *
 * Guards: the thumb differs from the track in both states, and the checked
 * track differs from the unchecked one.
 */
test("switches stay readable in forced-colors mode", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await openMap(page, MAPS.kilima);

  await page.getByRole("button", { name: "Filter settings" }).first().click();
  const sw = page.locator("[role=switch][data-state]").first();
  await expect(sw).toBeVisible();

  const colours = () =>
    sw.evaluate((el) => ({
      state: (el as HTMLElement).dataset.state,
      track: getComputedStyle(el).backgroundColor,
      thumb: getComputedStyle(el.firstElementChild!).backgroundColor,
    }));

  const before = await colours();
  expect(before.thumb).not.toBe(before.track);

  await sw.click();
  await expect(sw).not.toHaveAttribute("data-state", before.state!);
  const after = await colours();
  expect(after.thumb).not.toBe(after.track);
  expect(after.track).not.toBe(before.track);

  await sw.click();
});
