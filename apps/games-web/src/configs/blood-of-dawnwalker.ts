import { resolveAppConfig } from "@repo/lib";

/**
 * The Blood of Dawnwalker — interactive map of Vale Sangora (one open world).
 * Subdomain: bloodofdawnwalker.th.gl (derived from games.ts `web`).
 *
 * THGLApp companion support (detector `bloodofdawnwalker_detector`) is built but not
 * yet in a public app release: `appUrl` (the "In-Game App" CTA) stays null until then.
 * Live mode stays enabled so the typeIDs map (`version.typesIdMap`) reaches the map
 * page for the Debug app / the future release.
 * No manual "/maps/..." internalLink — the home page auto-generates the richer
 * map card (preview + counts) for the single map.
 */
export const bloodOfDawnwalker = resolveAppConfig({
  name: "blood-of-dawnwalker",
  supportedLocales: ["en"],
  // No "In-Game App" CTA until a public THGLApp build ships the Dawnwalker detector
  // (companion block is inDevelopment in games.ts). Set to "https://www.th.gl/companion-app" then.
  appUrl: null,
  internalLinks: [],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "Shrines",
    "Destroyed Shrines",
    "Towers",
    "Bandit Camps",
    "Monster Lairs",
    "Ancient Circles",
    "Vendors",
    "Chests",
    "Hidden Caches",
  ],
  topFilters: ["shrine", "tower", "monster_lair", "bandit_camp"],
});
