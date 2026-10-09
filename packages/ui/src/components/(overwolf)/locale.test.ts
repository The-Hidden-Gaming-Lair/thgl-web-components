import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { globalDictionaries } from "../../dicts/global";
import { LOCALE_LABELS } from "../(controls)/locale-labels";

// An Overwolf app's language picker must offer the same languages as the
// game's website (inbox #931: Chinese was on the site but not in the app), and
// every offered locale needs a global dict + a label in the picker.
const apps = join(__dirname, "../../../../../apps");
const localesIn = (file: string): string[] | null => {
  const match = readFileSync(file, "utf8").match(
    /supportedLocales:\s*\[([^\]]*)\]/,
  );
  return match ? [...match[1]!.matchAll(/"([^"]+)"/g)].map((m) => m[1]!) : null;
};

const overwolfApps = readdirSync(apps)
  .filter((dir) => dir.endsWith("-overwolf"))
  .map((dir) => ({ dir, locales: localesIn(join(apps, dir, "src/config.ts")) }))
  .filter((app) => app.locales !== null);

it.each(overwolfApps)("$dir offers the website's languages", (app) => {
  const name = app.dir.replace(/-overwolf$/, "");
  const webConfig = join(apps, "games-web/src/configs", `${name}.ts`);
  expect(existsSync(webConfig)).toBe(true);
  expect(app.locales).toEqual(localesIn(webConfig));
  for (const locale of app.locales!) {
    expect(globalDictionaries).toHaveProperty([locale]);
    expect(LOCALE_LABELS).toHaveProperty([locale]);
  }
});
