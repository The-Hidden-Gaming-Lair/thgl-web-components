import { expect, test } from "@playwright/test";

/**
 * Home page map cards on a translated locale (inbox #765). Map URLs carry the
 * English map name, so the home page must match its internalLinks against the
 * English name, not the localized one, or on /ja every hand-picked map card
 * loses its location count and comes back a second time as an auto card
 * ("16 マップ" vs "10 Maps").
 *
 * Runs against Infinity Nikki: all its main maps are internalLinks and their
 * names are translated in Japanese (Wanxiang Realm → 万相境). Palia's map names
 * aren't translated.
 */
const BASE =
  process.env.E2E_NIKKI_URL ?? "http://infinitynikki-dev.localhost:3100";

function mapStat(html: string): string | undefined {
  return /tabular-nums">(\d+)<\/div><div class="text-xs uppercase tracking-wider">/.exec(
    html,
  )?.[1];
}

test("translated home keeps map card counts and the English map count", async ({
  request,
}) => {
  const [en, ja] = await Promise.all(
    ["/", "/ja"].map(async (path) =>
      (await request.get(`${BASE}${path}`)).text(),
    ),
  );
  expect(mapStat(en)).toBeTruthy();
  expect(mapStat(ja)).toBe(mapStat(en));
  // The Wanxiang Realm internalLinks card: localized name + location count.
  expect(ja).toMatch(/>万相境マップ<\/span><span[^>]*>[\d,]+か所/);
  // Map links use the English name on every locale.
  expect(ja).toContain('href="/ja/maps/Wanxiang%20Realm"');
  expect(ja).not.toMatch(/href="\/ja\/maps\/%E/);
});
