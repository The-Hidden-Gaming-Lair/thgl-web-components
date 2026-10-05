import { expect, test } from "@playwright/test";

/**
 * "Import from another site": a ghzs666.com (光环助手) export — the point-id
 * array its console snippet downloads — is translated by data-forge's
 * /api/import (local forge via the -dev tenant) and marked discovered here
 * (inbox #367). Two Jinzhou points from their map that we match, plus one id
 * that is not theirs, so the dialog must say "2 of 3" and skip the third.
 */
const WUWA_URL = "http://wuthering-dev.localhost:3100";
const GHZS_EXPORT = JSON.stringify([
  "667ec1bc0ade7d00014ddca1",
  "667ec17e3a84450001d7afbc",
  "000000000000000000000000",
]);
const MATCHED_NODE = "136904117@332138.06:307898";

test("ghzs666.com progress imports as discovered nodes", async ({ page }) => {
  await page.goto(`${WUWA_URL}/maps/Overworld`);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Import from another site" })
    .click({ timeout: 30_000 });

  const dialog = page.getByRole("dialog", {
    name: "Import progress from another site",
  });
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: /ghzs666\.com/ }).click();
  await dialog
    .getByRole("textbox", { name: /Upload thgl-map-progress/ })
    .fill(GHZS_EXPORT);
  await dialog.getByRole("button", { name: "Import", exact: true }).click();

  await expect(dialog.getByText("2 of 3 markers matched")).toBeVisible({
    timeout: 30_000,
  });
  await dialog.getByRole("button", { name: /^Merge/ }).click();

  await expect(page.getByText("You discovered 2 nodes")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        (id) => (localStorage.getItem("settings-storage") ?? "").includes(id),
        MATCHED_NODE,
      ),
    )
    .toBe(true);
});

/**
 * The ghzs666.com snippet must find marks from BOTH of its front ends: the
 * international www.ghzs666.com/wutheringwaves-map keeps them under
 * `wuthering-leafsIds…`, the Chinese static-web.ghzs.com page under
 * `mc-leafsIds…`. The first version only read `mc-` and found nothing on the
 * international site (inbox #367 reopen).
 */
test("ghzs666.com snippet reads both storage prefixes", async ({ page }) => {
  await page.goto(`${WUWA_URL}/maps/Overworld`);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Import from another site" })
    .click({ timeout: 30_000 });
  const dialog = page.getByRole("dialog", {
    name: "Import progress from another site",
  });
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: /ghzs666\.com/ }).click();
  await dialog.getByText(/How to export from/).click();
  // the snippet exactly as the player copies it from the dialog
  const snippet = (await dialog.locator("pre").textContent()) ?? "";
  expect(snippet).toContain("leafsIds");

  const result = await page.evaluate(async (code) => {
    localStorage.setItem(
      "wuthering-leafsIdsuser1",
      JSON.stringify(["667ec1bc0ade7d00014ddca1"]),
    );
    localStorage.setItem(
      "mc-leafsIds",
      JSON.stringify(["667ec17e3a84450001d7afbc"]),
    );
    const alerts: string[] = [];
    const logs: string[] = [];
    window.alert = (m?: unknown) => void alerts.push(String(m));
    const log = console.log;
    console.log = (...a: unknown[]) => void logs.push(a.join(" "));
    try {
      await (0, eval)(code);
    } finally {
      console.log = log;
    }
    return { alerts, payload: logs[logs.length - 1] };
  }, snippet);

  expect(result.alerts[0]).toContain("Found 2 markers");
  expect(JSON.parse(result.payload).sort()).toEqual([
    "667ec17e3a84450001d7afbc",
    "667ec1bc0ade7d00014ddca1",
  ]);
});
