import { resolveAppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

const preview = (mapId: string) =>
  `${DATA_FORGE_CDN_URL}/palia/map-tiles/${mapId}/preview.webp`;

export const palia = resolveAppConfig({
  name: "palia",
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "it",
    "ja",
    "ko",
    "pt-BR",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      href: "/maps/Royal%20Highlands",
      title: "config.internalLinks.royalHighlands.title",
      description: "config.internalLinks.royalHighlands.description",
      linkText: "config.internalLinks.royalHighlands.linkText",
      iconName: "Map",
      bgImage: preview("AZ3_Root"),
    },
    {
      href: "/maps/Elderwood",
      title: "config.internalLinks.elderwood.title",
      description: "config.internalLinks.elderwood.description",
      linkText: "config.internalLinks.elderwood.linkText",
      iconName: "Map",
      bgImage: preview("AZ2_Root"),
    },
    {
      href: "/maps/Kilima%20Village",
      title: "config.internalLinks.kilima.title",
      description: "config.internalLinks.kilima.description",
      linkText: "config.internalLinks.kilima.linkText",
      iconName: "Map",
      bgImage: preview("VillageWorld"),
    },
    {
      href: "/maps/Bahari%20Bay",
      title: "config.internalLinks.bahari.title",
      description: "config.internalLinks.bahari.description",
      linkText: "config.internalLinks.bahari.linkText",
      iconName: "Map",
      bgImage: preview("AdventureZoneWorld"),
    },
    {
      href: "/maps/Fairgrounds",
      title: "config.internalLinks.fairgrounds.title",
      description: "config.internalLinks.fairgrounds.description",
      linkText: "config.internalLinks.fairgrounds.linkText",
      iconName: "Map",
      bgImage: preview("MajiMarket"),
    },
    {
      href: "/rummage-pile",
      title: "config.internalLinks.rummagePile.title",
      description: "config.internalLinks.rummagePile.description",
      linkText: "config.internalLinks.rummagePile.linkText",
      iconName: "MapPin",
      bgImage: "/games/thgl-web/tools/rummage-pile.webp",
    },
    {
      href: "/worlds",
      title: "config.internalLinks.activeWorlds.title",
      description: "config.internalLinks.activeWorlds.description",
      linkText: "config.internalLinks.activeWorlds.linkText",
      iconName: "Server",
      bgImage: "/games/thgl-web/tools/worlds.webp",
    },
    {
      href: "/leaderboard",
      title: "config.internalLinks.leaderboard.title",
      description: "config.internalLinks.leaderboard.description",
      linkText: "config.internalLinks.leaderboard.linkText",
      iconName: "Trophy",
      bgImage: "/games/thgl-web/tools/leaderboard.webp",
    },
    {
      href: "/weekly-wants",
      title: "config.internalLinks.weeklyWants.title",
      description: "config.internalLinks.weeklyWants.description",
      linkText: "config.internalLinks.weeklyWants.linkText",
      iconName: "Gift",
      bgImage: "/games/thgl-web/tools/weekly-wants.webp",
    },
    {
      title: "crafting.navTitle",
      description: "crafting.navDescription",
      href: "/crafting",
      iconName: "Hammer",
      linkText: "crafting.navLinkText",
    },
  ],
  keywords: ["Rummage Pile", "Plushies", "Elderwood"],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items, recipes, villagers, fish, bugs…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "🎒",
        description:
          "Materials, food, tools and quest items with sell prices, sources and uses.",
      },
      {
        href: "/db/furniture",
        type: "furniture",
        titleFallback: "Furniture & Decor",
        icon: "🪑",
        description:
          "Furniture, plushies, wallpaper and flooring with their recipes and stores.",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleFallback: "Recipes",
        icon: "📜",
        description:
          "Cooking, crafting and furniture recipes with ingredients and stations.",
      },
      {
        href: "/db/fish",
        type: "fish",
        titleFallback: "Fish",
        icon: "🐟",
        description:
          "Every fish with where to catch it, bait, time and weather.",
      },
      {
        href: "/db/bugs",
        type: "bugs",
        titleFallback: "Bugs",
        icon: "🐞",
        description:
          "Bugs with active times, weather and the maps they live on.",
      },
      {
        href: "/db/critters",
        type: "critters",
        titleFallback: "Creatures",
        icon: "🏹",
        description: "Huntable creatures by tier with their loot drops.",
      },
      {
        href: "/db/characters",
        type: "characters",
        titleFallback: "Villagers",
        icon: "🧑‍🌾",
        description:
          "Villagers with gift preferences, weekly wants, schedules and rewards.",
      },
      {
        href: "/db/shops",
        type: "shops",
        titleFallback: "Shops",
        icon: "🛒",
        description: "Stores and villager shops with everything they sell.",
      },
    ],
    typeLabels: {
      inventory: "Items",
      furniture: "Furniture & Decor",
      recipes: "Recipes",
      fish: "Fish",
      bugs: "Bugs",
      critters: "Creatures",
      characters: "Villagers",
      shops: "Shops",
    },
  },
});
