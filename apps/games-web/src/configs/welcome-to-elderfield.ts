import { resolveAppConfig } from "@repo/lib";

export const welcomeToElderfield = resolveAppConfig({
  name: "welcome-to-elderfield",
  // Matches the dicts the data-mining script emits from the game's Hendrix
  // Localization CSV (en + the 6 shipped translations).
  supportedLocales: ["en", "de", "es", "fr", "pt-BR", "ru", "zh-CN"],
  appUrl: null,
  withoutLiveMode: true,
  // No manual "/maps/..." internalLinks — the home page auto-generates the map
  // cards from version.data.tiles. The links below point at the database.
  internalLinks: [
    {
      title: "Villagers",
      description:
        "All nine villagers you can befriend and marry — the gifts they love, like and hate, and where to find them on each day.",
      href: "/db/villagers",
      iconName: "Heart",
      linkText: "Browse Villagers",
    },
    {
      title: "Items",
      description:
        "Every item in Welcome to Elderfield — food, materials, seeds, potions, decor and key items, with recipes, shops and pickup spots.",
      href: "/db/items",
      iconName: "Gift",
      linkText: "Open the Items database",
    },
    {
      title: "Equipment",
      description:
        "All weapons and armor by slot and tier, with stats and where to get them.",
      href: "/db/equipment",
      iconName: "Shield",
      linkText: "Browse Equipment",
    },
    {
      title: "Recipes",
      description:
        "Every crafting recipe — cooking, forging, potions and furniture — with ingredients and station.",
      href: "/db/recipes",
      iconName: "BookOpen",
      linkText: "Browse Recipes",
    },
    {
      title: "Fish",
      description:
        "Every fish, where it bites, in which season and time of day, and which bait helps.",
      href: "/db/fish",
      iconName: "Fish",
      linkText: "Browse Fish",
    },
    {
      title: "Bestiary",
      description:
        "The monsters of Elderfield with their stats, weaknesses and drops.",
      href: "/db/bestiary",
      iconName: "Bug",
      linkText: "Browse the Bestiary",
    },
  ],
  externalLinks: [],
  keywords: ["Mysteries", "Villager Gifts", "Fishing", "Doors & Exits"],
  topFilters: [
    "door",
    "mystery",
    "god_shrine",
    "treasure_dig",
    "villager_sam",
    "shop",
  ],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items, villagers, fish…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/villagers",
        type: "villagers",
        titleFallback: "Villagers",
        icon: "💕",
        description: "Gift preferences and schedule spots for every villager.",
      },
      {
        href: "/db/items",
        type: "items",
        titleFallback: "Items",
        icon: "🎒",
        description: "Food, materials, seeds, potions, decor and key items.",
      },
      {
        href: "/db/equipment",
        type: "equipment",
        titleFallback: "Equipment",
        icon: "🗡️",
        description: "Weapons and armor by slot and tier.",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleFallback: "Recipes",
        icon: "🍲",
        description: "Crafting recipes with ingredients and stations.",
      },
      {
        href: "/db/fish",
        type: "fish",
        titleFallback: "Fish",
        icon: "🐟",
        description: "Where, when and with which bait each fish bites.",
      },
      {
        href: "/db/bestiary",
        type: "bestiary",
        titleFallback: "Bestiary",
        icon: "👹",
        description: "Monsters with stats, weaknesses and drops.",
      },
      {
        href: "/db/quests",
        type: "quests",
        titleFallback: "Tasks",
        icon: "📜",
        description: "Tasks with their givers, objectives and rewards.",
      },
      {
        href: "/db/shops",
        type: "shops",
        titleFallback: "Shops",
        icon: "🛒",
        description: "Every shop and what it sells.",
      },
      {
        href: "/db/skills",
        type: "skills",
        titleFallback: "Skills & Rituals",
        icon: "✨",
        description:
          "Combat skills and rituals, and the tomes that teach them.",
      },
      {
        href: "/db/states",
        type: "states",
        titleFallback: "Blessings & Curses",
        icon: "🌀",
        description: "Status effects — blessings, curses and ailments.",
      },
      {
        href: "/db/locations",
        type: "locations",
        titleFallback: "Locations",
        icon: "🗺️",
        description: "Every place in Elderfield and how the areas connect.",
      },
    ],
    typeLabels: {
      villagers: "Villager",
      items: "Item",
      equipment: "Equipment",
      recipes: "Recipe",
      fish: "Fish",
      bestiary: "Monster",
      quests: "Task",
      shops: "Shop",
      skills: "Skill",
      states: "Status Effect",
      locations: "Location",
    },
  },
});
