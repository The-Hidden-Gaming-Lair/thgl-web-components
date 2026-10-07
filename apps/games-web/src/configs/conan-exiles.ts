import { resolveAppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

export const conanExiles = resolveAppConfig({
  name: "conan-exiles",
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "it",
    "ja",
    "ko",
    "pl",
    "pt",
    "ru",
    "zh-Hans",
    "zh-Hant",
  ],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      title: "Exiled Lands Map",
      description:
        "Navigate the Exiled Lands in Conan Exiles Enhanced (UE5). Find camps, dungeons, caves, vistas, wildlife, NPC factions, iron ore deposits, and more.",
      href: "/maps/Exiled%20Lands",
      iconName: "Map",
      // Inlined getPreviewImageUrl("conan-exiles", "ExiledLands", "2"):
      // middleware imports configs, so any helper from @repo/lib would
      // drag cbor-x into Edge Runtime (forbidden — uses dynamic eval).
      bgImage: `${DATA_FORGE_CDN_URL}/conan-exiles/map-tiles/ExiledLands/preview.webp?v=2`,
      linkText: "Explore the Exiled Lands",
    },
    {
      title: "Isle of Siptah Map",
      description:
        "Explore the Isle of Siptah in Conan Exiles Enhanced. Find vaults, surge altars, camps, wildlife, and resource clusters.",
      href: "/maps/Isle%20of%20Siptah",
      iconName: "Map",
      bgImage: `${DATA_FORGE_CDN_URL}/conan-exiles/map-tiles/IsleOfSiptah/preview.webp?v=2`,
      linkText: "Explore the Isle of Siptah",
    },
  ],
  promoLinks: [],
  externalLinks: [
    {
      href: "https://conanexiles.gaming.tools/",
      title: "Database",
    },
  ],
  // Keywords used in <meta name="keywords">, page descriptions, and OG tags.
  // The app title is interpolated separately, so don't repeat "Conan Exiles
  // Enhanced" here.
  keywords: [
    "Exiled Lands",
    "Isle of Siptah",
    "Camps",
    "Dungeons",
    "Caves",
    "Vaults",
    "Surge Altars",
    "Wildlife",
    "Bosses",
    "Thralls",
    "NPCs",
    "Chests",
    "Iron Ore",
    "Resources",
    "Brimstone",
    "Crystal",
    "Map Markers",
    "Emotes",
    "Recipes",
  ],
  topFilters: [
    "cave",
    "dungeon",
    "ruins",
    "chest_metal",
    "wildlife_boss",
    "res_iron_ore",
    "res_crystal",
  ],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items, knowledge, emotes…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "⚔️",
        description:
          "Weapons, armor, tools, consumables and building pieces with stats, recipes and crafting stations.",
      },
      {
        href: "/db/knowledge",
        type: "knowledge",
        titleFallback: "Knowledge",
        icon: "📜",
        description:
          "Every feat with its level, knowledge points, prerequisites and the recipes it unlocks.",
      },
      {
        href: "/db/journeys",
        type: "journeys",
        titleFallback: "Journeys",
        icon: "🧭",
        description:
          "Journey steps, XP and rewards for the Exiled Lands and the Isle of Siptah.",
      },
      {
        href: "/db/perks",
        type: "perks",
        titleFallback: "Perks",
        icon: "💪",
        description: "Attribute perks and the points needed to unlock them.",
      },
      {
        href: "/db/emotes",
        type: "emotes",
        titleFallback: "Emotes",
        icon: "🎭",
        description:
          "All emotes by category and where to find the emote pickups on the map.",
      },
    ],
    // Section labels come from the per-locale dict terms (inventory, knowledge, …).
  },
});
