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
      title: "checklist.navTitle",
      description: "checklist.navDescription",
      href: "/checklist",
      iconName: "SquareCheckBig",
      linkText: "checklist.navLinkText",
    },
    {
      title: "config.internalLinks.exiledLands.title",
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
      title: "config.internalLinks.isleOfSiptah.title",
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
      title: "database",
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
    // Collection checklists (/checklist, /checklist/<section>): every emote
    // (pickups link to the map) and every Journey.
    checklists: [
      { section: "emotes" },
      { section: "journeys", descriptions: true },
    ],
    heroSubtitle: "config.db.heroSubtitle",
    searchPlaceholder: "config.db.searchPlaceholder",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleKey: "inventory",
        titleFallback: "Items",
        icon: "⚔️",
        description: "config.db.inventory.description",
      },
      {
        href: "/db/knowledge",
        type: "knowledge",
        titleKey: "knowledge",
        titleFallback: "Knowledge",
        icon: "📜",
        description: "config.db.knowledge.description",
      },
      {
        href: "/db/journeys",
        type: "journeys",
        titleKey: "journeys",
        titleFallback: "Journeys",
        icon: "🧭",
        description: "config.db.journeys.description",
      },
      {
        href: "/db/perks",
        type: "perks",
        titleKey: "perks",
        titleFallback: "Perks",
        icon: "💪",
        description: "config.db.perks.description",
      },
      {
        href: "/db/emotes",
        type: "emotes",
        titleKey: "emotes",
        titleFallback: "Emotes",
        icon: "🎭",
        description: "config.db.emotes.description",
      },
      {
        href: "/db/creatures",
        type: "creatures",
        titleKey: "creatures",
        titleFallback: "Creatures & NPCs",
        icon: "🐺",
        description: "config.db.creatures.description",
      },
      {
        href: "/db/resources",
        type: "resources",
        titleKey: "resources",
        titleFallback: "Resources",
        icon: "🪨",
        description: "config.db.resources.description",
      },
    ],
    // Section labels come from the per-locale dict terms (inventory, knowledge, …).
  },
});
