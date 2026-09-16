import { resolveAppConfig } from "@repo/lib";

export const aniimo = resolveAppConfig({
  name: "aniimo",
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "id",
    "ja",
    "ko",
    "pt",
    "ru",
    "th",
    "vi",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: null,
  internalLinks: [],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "Aniimo Spawns",
    "Chests",
    "Lumin Amber",
    "Transporters",
    "Sanctums",
    "Alpha & Omega",
  ],
  topFilters: [
    "transporter",
    "sanctum",
    "alpha",
    "chest_advanced",
    "lumin_amber",
  ],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search Aniimo and items…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/aniimo",
        type: "aniimo",
        titleFallback: "Aniimo",
        icon: "🐾",
        description:
          "Every Aniimo species with element, stage, traversal and base stats.",
      },
      {
        href: "/db/items",
        type: "items",
        titleFallback: "Items",
        icon: "🎒",
        description: "Items, materials and consumables by rarity.",
      },
    ],
  },
});
