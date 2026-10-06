import { expect, test } from "@playwright/test";
import { BASE_URL } from "./fixtures";

/**
 * Guide mini-maps must draw from the content-hashed sprite
 * (`version.more.icons`), never the plain `/icons/icons.webp`. The unhashed
 * file is cached `immutable` for a year but overwritten on every
 * re-extraction, so browsers that loaded an older one kept it and every guide
 * marker showed some other item's sprite cell (Palia guides, inbox #612),
 * while the full map, which used the hashed path, looked fine.
 */
test("guide map loads the hashed icon sprite, not icons.webp", async ({
  page,
}) => {
  const sprites: string[] = [];
  page.on("request", (req) => {
    const path = new URL(req.url()).pathname;
    if (/\/icons\/icons(\.[0-9a-f]+)?\.webp$/.test(path)) sprites.push(path);
  });
  await page.goto(`${BASE_URL}/guides/how-to-make-leather`);
  await expect
    .poll(() => sprites.some((p) => /icons\.[0-9a-f]{32}\.webp$/.test(p)), {
      timeout: 30_000,
    })
    .toBe(true);
  expect(sprites.filter((p) => p.endsWith("/icons/icons.webp"))).toEqual([]);
});
