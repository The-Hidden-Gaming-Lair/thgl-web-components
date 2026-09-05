import { resolveAppConfig } from "@repo/lib";

/**
 * Multi-tenant AppConfig for "The Blood of Dawnwalker".
 *
 * Links to canonical game metadata in `@repo/lib/games.ts` by `name: "dawnwalker"`.
 * Core properties (title, domain, marker options) are resolved automatically.
 */
export const dawnwalker = resolveAppConfig({
  name: "dawnwalker",
  supportedLocales: ["en"],
  appUrl: "https://www.th.gl/companion-app",
  keywords: [
    "Sanctum Citadel",
    "Valley Heart",
    "Cyan Delta",
    "Blood Ridge",
    "Umbral Chasm",
    "Amber Slopes",
    "Frostcrag Peaks",
    "Azure Basin",
    "Sylvan Reach",
    "Sunridge Foothills",
    "West High Plateau",
  ],
  topFilters: ["shrine", "settlement", "main_quest", "side_quest", "treasure"],
});
