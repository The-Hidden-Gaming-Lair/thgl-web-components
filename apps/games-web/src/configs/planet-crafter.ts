import { resolveAppConfig } from "@repo/lib";

export const planetCrafter = resolveAppConfig({
  name: "planet-crafter",
  supportedLocales: [
    "en",
    "fr",
    "es",
    "pt",
    "de",
    "zh-CN",
    "zh-TW",
    "ja",
    "ko",
    "pl",
    "ru",
    "tr",
    "it",
  ],
  appUrl: null,
  internalLinks: [],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "Silicon",
    "Aluminum",
    "Ice",
    "Iridium",
    "Super Alloy",
    "Golden Crates",
    "Data Logs",
    "Resources",
  ],
  topFilters: ["Iridium", "Aluminium", "golden", "data_log", "fusion_reactor"],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items and buildings…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "🎒",
        description:
          "Resources, equipment, food, seeds, wildlife and fuses — with crafting recipes, unlock thresholds and trade values.",
      },
      {
        href: "/db/buildings",
        type: "buildings",
        titleFallback: "Buildings",
        icon: "🏭",
        description:
          "Machines, base building and furniture — with terraforming rates per second, energy use, recipes and tier upgrades.",
      },
    ],
    typeLabels: {
      inventory: "Items",
      buildings: "Buildings",
    },
  },
});
