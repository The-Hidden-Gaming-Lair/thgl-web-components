import { expect, test } from "@playwright/test";
import { BASE_URL, MAPS, mapUrl } from "./fixtures";

/**
 * SSR renders in UTC; a client component that formats a date in the
 * visitor's time zone mismatches on hydration (React #418) whenever the two
 * calendar days differ. UTC+14 and UTC-11 together guarantee that at least
 * one of them is on a different day than UTC at any hour.
 */
const TIME_ZONES = ["Pacific/Kiritimati", "Pacific/Pago_Pago"];

const PAGES = [
  { name: "home", url: `${BASE_URL}/` },
  { name: "map", url: mapUrl(MAPS.kilima.title) },
];

for (const timezoneId of TIME_ZONES) {
  test.describe(`hydration in ${timezoneId}`, () => {
    test.use({ timezoneId });

    for (const { name, url } of PAGES) {
      test(`${name} page hydrates without a text mismatch`, async ({
        page,
      }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => {
          if (/hydrat|#418/i.test(e.message)) errors.push(e.message);
        });
        await page.goto(url, { waitUntil: "load" });
        // Hydration errors surface shortly after load.
        await page.waitForTimeout(3_000);
        expect(errors, "hydration errors").toEqual([]);
      });
    }
  });
}
