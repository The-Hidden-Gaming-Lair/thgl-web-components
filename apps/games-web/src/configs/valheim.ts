import { resolveAppConfig } from "@repo/lib";

export const valheim = resolveAppConfig({
  name: "valheim",
  supportedLocales: [
    "en",
    "cs",
    "de",
    "es",
    "fr",
    "hu",
    "it",
    "ja",
    "ko",
    "pl",
    "pt-BR",
    "ru",
    "th",
    "tr",
    "uk",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: null,
  internalLinks: [],
  promoLinks: [],
  // Partner link — keep it next to our own /db (gaming.tools is our most important partner).
  externalLinks: [
    {
      href: "https://valheim.gaming.tools",
      title: "Gaming Tools",
    },
  ],
  keywords: [
    "Seed Map",
    "World Seed",
    "Boss Locations",
    "Haldor",
    "Hildir",
    "Bog Witch",
    "Burial Chambers",
    "Troll Cave",
    "Sunken Crypts",
    "Infested Mine",
    "Runestones",
    "Biomes",
  ],
  topFilters: [
    "eikthyr",
    "haldor",
    "burial_chambers",
    "troll_cave",
    "runestone",
  ],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items, creatures, pieces, locations…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "🎒",
        description:
          "Every weapon, armor piece, food, material and trophy — stats, recipes, crafting stations, who drops it and where to find it.",
      },
      {
        href: "/db/bestiary",
        type: "bestiary",
        titleFallback: "Bestiary",
        icon: "🐺",
        description:
          "Creatures and the Forsaken — health, damage weaknesses and resistances, drops, biomes and the locations they guard.",
      },
      {
        href: "/db/building",
        type: "building",
        titleFallback: "Building",
        icon: "🔨",
        description:
          "Build pieces, furniture and crafting stations with their material costs and comfort.",
      },
      {
        href: "/db/locations",
        type: "locations",
        titleFallback: "Locations",
        icon: "🗺️",
        description:
          "Boss altars, traders, dungeons, runestones and ruins — what each holds and how many every world has.",
      },
      {
        href: "/db/biomes",
        type: "biomes",
        titleFallback: "Biomes",
        icon: "🌲",
        description:
          "The nine biomes with the creatures that spawn there and the locations you will find.",
      },
      {
        href: "/db/skills",
        type: "skills",
        titleFallback: "Skills",
        icon: "⚔️",
        description:
          "Every skill — what it improves, which weapons and tools train it and which gear boosts it.",
      },
      {
        href: "/db/lore",
        type: "lore",
        titleFallback: "Lore",
        icon: "📜",
        description:
          "Every runestone text, by biome, and the ruins and landmarks where you can read it.",
      },
    ],
    typeLabels: {
      inventory: "Items",
      bestiary: "Bestiary",
      building: "Building",
      locations: "Locations",
      biomes: "Biomes",
      skills: "Skills",
      lore: "Lore",
    },
  },
});
