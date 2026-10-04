import { expect, test } from "@playwright/test";
import {
  APP_BASE_URL,
  GAME,
  MAPS,
  installFakeWebviewBridge,
  userState,
  waitForAppMapReady,
} from "./fixtures";

/**
 * The game's codex / guides / tools inside the companion app (inbox #288):
 * `app.th.gl/apps/<game>/<page>` renders the game site's page with the app
 * title bar, and every link stays under `/apps/<game>` (the app tenant has no
 * bare `/db` routes — they 404). Guards:
 *
 *  - the app copy renders (app chrome, noindex) and soft navigation keeps the
 *    `/apps/<game>` prefix;
 *  - a link that escaped the prefix is re-prefixed by Referer, never cached;
 *  - a codex "show on map" link opens the APP map on that map + marker.
 */

test("codex renders inside the app and links keep the /apps prefix", async ({
  page,
  request,
}) => {
  const res = await request.get(`${APP_BASE_URL}/apps/${GAME}/db`);
  expect(res.status()).toBe(200);
  expect(res.headers()["x-robots-tag"]).toBe("noindex");
  const html = await res.text();
  expect(html).toContain('data-thgl-surface="app"');
  expect(html).toContain(`href="/apps/${GAME}/guides"`);

  await installFakeWebviewBridge(page);
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(`${APP_BASE_URL}/apps/${GAME}/db`);
  const header = page.locator("header");
  await expect(header.getByRole("button", { name: /^Database/ })).toHaveClass(
    /text-amber-400/,
  );
  await expect(
    header.getByRole("link", { name: /Interactive Map/ }),
  ).toHaveAttribute("href", `/apps/${GAME}`);

  // A page-content link is a bare /db/… path; the shell keeps it in the app.
  await page.locator('main a[href="/db/fish"]').first().click();
  await page.waitForURL(`${APP_BASE_URL}/apps/${GAME}/db/fish`);
  await expect(page.locator("h1").first()).toBeVisible();
});

test("an escaped game link is re-prefixed from the Referer, uncached", async ({
  request,
}) => {
  const res = await request.get(`${APP_BASE_URL}/de/db/fish`, {
    headers: { referer: `${APP_BASE_URL}/de/apps/${GAME}/db` },
    maxRedirects: 0,
  });
  expect(res.status()).toBe(307);
  expect(res.headers()["location"]).toBe(`/de/apps/${GAME}/db/fish`);
  expect(res.headers()["cache-control"]).toBe("private, no-store");

  // Without an app page as Referer nothing is guessed (the app tenant 404s).
  const plain = await request.get(`${APP_BASE_URL}/db/fish`, {
    maxRedirects: 0,
  });
  expect(plain.status()).toBe(404);
});

test("a map link from the app codex opens the app map on its marker", async ({
  page,
}) => {
  await installFakeWebviewBridge(page);
  // A FIXED Kilima marker (the stables sign): the app boots in Live mode,
  // where live-tracked predictions (e.g. Clay) are hidden and can't be opened.
  const nodeId =
    "BP_Stables_Sign_UAID_6C02E03F65D9936101_1437950312@11970.499:9880.846";
  await page.goto(
    `${APP_BASE_URL}/apps/${GAME}/maps/${encodeURIComponent(MAPS.kilima.title)}/stable/x?id=${encodeURIComponent(nodeId)}`,
  );
  await page.waitForURL(new RegExp(`/apps/${GAME}\\?`));
  await waitForAppMapReady(page);
  await expect
    .poll(() => userState<string>(page, "mapName"))
    .toBe(MAPS.kilima.key);
  await expect
    .poll(() => userState<string>(page, "selectedNodeId"))
    .toBe(nodeId);
  // The map selector shows the map from the URL, not the server's default.
  await expect(
    page.getByRole("combobox", { name: /Select map/ }).first(),
  ).toContainText(MAPS.kilima.title);
});
