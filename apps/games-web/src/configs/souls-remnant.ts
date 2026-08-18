import { resolveAppConfig } from "@repo/lib";

export const soulsRemnant = resolveAppConfig({
  name: "souls-remnant",
  supportedLocales: [
    "en",
    "de",
    "es",
    "es-MX",
    "fr",
    "id",
    "it",
    "ja",
    "ko",
    "pl",
    "pt-BR",
    "ru",
    "th",
    "tr",
    "vi",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: null,
  // No manual "/maps/..." internalLinks — the home page auto-generates richer
  // map cards (preview + live counts) for the Surface and Caves maps.
  internalLinks: [
    {
      title: "Items",
      description:
        "Every item in Soul's Remnant — gathering materials, crafting materials, weapons and more, with descriptions and icons.",
      href: "/db/items",
      iconName: "Gift",
      linkText: "Open the Items database",
    },
    {
      title: "Equipment",
      description:
        "All wearable gear — armor, capes, cosmetics and life-skill sets, cross-linked to their items.",
      href: "/db/equipment",
      iconName: "Shield",
      linkText: "Browse Equipment",
    },
    {
      title: "Monsters",
      description:
        "Every monster roaming the world's maps and caves, with sprites straight from the game.",
      href: "/db/monsters",
      iconName: "Bug",
      linkText: "Browse Monsters",
    },
    {
      title: "Skills",
      description:
        "All player skills with in-game descriptions — combat, movement and utility.",
      href: "/db/skills",
      iconName: "Sparkles",
      linkText: "Browse Skills",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: ["World Map", "Monsters", "Items", "Equipment", "Skills"],
  topFilters: ["boss_arena", "hubs", "deep_caves"],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items, monsters, skills…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/items",
        type: "items",
        titleFallback: "Items",
        icon: "🎒",
        description:
          "Gathering materials, crafting materials, weapons and general items.",
      },
      {
        href: "/db/equipment",
        type: "equipment",
        titleFallback: "Equipment",
        icon: "🛡️",
        description: "Armor, capes, cosmetics and life-skill gear.",
      },
      {
        href: "/db/monsters",
        type: "monsters",
        titleFallback: "Monsters",
        icon: "👾",
        description: "Every monster in the world, with in-game sprites.",
      },
      {
        href: "/db/skills",
        type: "skills",
        titleFallback: "Skills",
        icon: "✨",
        description: "Player skills with full in-game descriptions.",
      },
      {
        href: "/db/buffs",
        type: "buffs",
        titleFallback: "Status Effects",
        icon: "🌀",
        description: "Buffs and debuffs and what they do.",
      },
      {
        href: "/db/maps",
        type: "maps",
        titleFallback: "Maps",
        icon: "🗺️",
        description:
          "Every area in the world — its level, the monsters that spawn there and the resources you can gather.",
      },
      {
        href: "/db/npcs",
        type: "npcs",
        titleFallback: "NPCs",
        icon: "🧑‍🌾",
        description:
          "The characters you meet — merchants, quest-givers and guides, and the daily gifts they accept.",
      },
      {
        href: "/db/dungeons",
        type: "dungeons",
        titleFallback: "Dungeons",
        icon: "🏰",
        description:
          "Instanced dungeons like Slime Garden — their difficulty tiers, recommended levels and the passes each one needs.",
      },
      {
        href: "/db/quests",
        type: "quests",
        titleFallback: "Quests",
        icon: "📜",
        description: "Quests with their objectives, rewards and givers.",
      },
      {
        href: "/db/game-modes",
        type: "game-modes",
        titleFallback: "Game Modes",
        icon: "🎮",
        description:
          "The Ironman challenge modes — self-found, hardcore permadeath and their group variants.",
      },
    ],
    typeLabels: {
      items: "Items",
      equipment: "Equipment",
      monsters: "Monsters",
      skills: "Skills",
      buffs: "Status Effects",
      maps: "Maps",
      npcs: "NPCs",
      dungeons: "Dungeons",
      quests: "Quests",
      "game-modes": "Game Modes",
    },
  },
});
