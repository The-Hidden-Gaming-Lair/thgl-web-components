import { expect, test } from "@playwright/test";
import { BASE_URL, CLAY, MAPS } from "./fixtures";

/**
 * Embeddable maps (inbox #287): `/embed/maps/<Map>` is the map without the
 * site chrome, for other sites' iframes. Guards:
 *
 *  - no header / filter panel, the "Open full map" link points at the game site;
 *  - `types` picks the shown marker types, and the embed never writes into the
 *    visitor's own map state (its own local storage key);
 *  - the copies stay out of search results.
 */
const EMBED_URL = `${BASE_URL}/embed/maps/${encodeURIComponent(MAPS.kilima.title)}`;

test("embed renders the map without chrome and with the requested types", async ({
  page,
  request,
}) => {
  const res = await request.get(EMBED_URL);
  expect(res.status()).toBe(200);
  expect(res.headers()["x-robots-tag"]).toBe("noindex");

  await page.goto(`${EMBED_URL}?types=${CLAY.id},landmark&zoom=1`);
  const fullMap = page.getByRole("link", { name: /Open full map/ });
  await expect(fullMap).toBeVisible();
  await expect(fullMap).toHaveAttribute(
    "href",
    /\/maps\/Kilima%20Village\?zoom=1&types=/,
  );
  await expect(page.locator("header")).toHaveCount(0);
  await expect(page.getByPlaceholder(/Type to search/)).toHaveCount(0);

  const state = await page.waitForFunction(() => {
    const w = window as unknown as {
      __thgl?: {
        userStore: { getState: () => { filters: string[]; mapName: string } };
      };
    };
    const s = w.__thgl?.userStore.getState();
    return s && { filters: s.filters, mapName: s.mapName };
  });
  const { filters, mapName } = (await state.jsonValue()) as {
    filters: string[];
    mapName: string;
  };
  expect(mapName).toBe(MAPS.kilima.key);
  expect([...filters].sort()).toEqual([CLAY.id, "landmark"].sort());

  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toContain("thgl-embed-coordinates");
  expect(keys).not.toContain("coordinates");
});
