import { expect, test } from "@playwright/test";
import { APP_BASE_URL } from "./fixtures";

/**
 * The companion app's auto-update gate on app.th.gl: version.txt, the
 * installer and manifest.bin (the signed driver allowlist) must flip together
 * on a release. If one of them rides the day-long page cache, the edge keeps
 * the previous release's copy after the deploy purge — a stale manifest.bin
 * made the driver reject the new app build (inbox #661/#662).
 */
for (const path of ["/version.txt", "/manifest.bin", "/THGL_Installer.exe"]) {
  test(`${path} is edge-cached for seconds, not a day`, async ({ request }) => {
    const res = await request.head(`${APP_BASE_URL}${path}`);
    expect(res.status()).toBe(200);
    expect(res.headers()["cdn-cache-control"]).toBe(
      "public, s-maxage=30, stale-while-revalidate=30",
    );
    expect(res.headers()["cache-control"]).toContain("s-maxage=30");
  });
}
