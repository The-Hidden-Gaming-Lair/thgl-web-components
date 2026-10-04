import { expect, test } from "@playwright/test";
import { BASE_URL } from "./fixtures";

/**
 * Localized guide URLs that carry the ENGLISH guide name must 308 to the
 * translated slug, never 404. Google indexes `/de/guides/<English name>`
 * whenever a locale dict had no real translation yet; once the translation
 * lands (Palworld `Chromite` → `Chromit`, 2026-09) the old URL 404'd and lost
 * its clicks (4,077 in 28 days across 33 URLs) until this redirect existed.
 *
 * Palia: `Coral` is `Koralle` in the German dict and has spawns. Plain HTTP,
 * no browser — the redirect is decided on the server.
 */
test.describe("guide locale redirects", () => {
  test("English slug under a locale prefix 308s to the translated slug", async ({
    request,
  }) => {
    const res = await request.get(`${BASE_URL}/de/guides/Coral`, {
      maxRedirects: 0,
    });
    expect(res.status()).toBe(308);
    expect(new URL(res.headers()["location"], BASE_URL).pathname).toBe(
      "/de/guides/Koralle",
    );

    const target = await request.get(`${BASE_URL}/de/guides/Koralle`, {
      maxRedirects: 0,
    });
    expect(target.status()).toBe(200);
  });

  test("an unknown guide still 404s under a locale prefix", async ({
    request,
  }) => {
    const res = await request.get(`${BASE_URL}/de/guides/NoSuchGuideXyz`, {
      maxRedirects: 0,
    });
    expect(res.status()).toBe(404);
  });
});
