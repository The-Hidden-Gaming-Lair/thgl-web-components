import { resolveAppConfig } from "@repo/lib";

export const graveyardKeeper2 = resolveAppConfig({
  name: "graveyard-keeper-2",
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "ja",
    "ko",
    "pl",
    "pt-BR",
    "ru",
    "tr",
    "zh-CN",
  ],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "Milestones",
    "Battles",
    "Iron Ore",
    "Marble",
    "Fishing Spots",
    "Town Restoration",
    "Tech Tree",
    "Recipes",
    "Traders",
  ],
  topFilters: [
    "fast_travel",
    "battle",
    "iron_ore_node",
    "fishing",
    "restoration",
  ],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items, recipes, techs, quests…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/items",
        type: "items",
        titleFallback: "Items",
        icon: "🎒",
        description:
          "Every item — materials, food, body parts, fish, tools and weapons — with recipes, workstations, traders and where to gather it.",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleFallback: "Recipes",
        icon: "🔨",
        description:
          "Crafting recipes by workstation: ingredients, output, duration, energy and the tech that unlocks them.",
      },
      {
        href: "/db/techs",
        type: "techs",
        titleFallback: "Tech Tree",
        icon: "📜",
        description:
          "All six Tech Tree branches with red/green/blue point costs, prerequisites and everything each tech unlocks.",
      },
      {
        href: "/db/buildings",
        type: "buildings",
        titleFallback: "Buildings",
        icon: "🏗️",
        description:
          "Workstations and constructions per work zone — build costs, what they craft and how to unlock them.",
      },
      {
        href: "/db/skills",
        type: "skills",
        titleFallback: "Masteries",
        icon: "⭐",
        description:
          "The five mastery trees — Building, Farming, Smithing, Book writing and Anatomy — node by node.",
      },
      {
        href: "/db/perks",
        type: "perks",
        titleFallback: "Perks",
        icon: "🧟",
        description:
          "Keeper perks, zombie perks and church blessings — which mastery unlocks them and what they affect.",
      },
      {
        href: "/db/traders",
        type: "traders",
        titleFallback: "Traders",
        icon: "💰",
        description:
          "Village merchants and town shops with their stock per tier and the orders they place.",
      },
      {
        href: "/db/quests",
        type: "quests",
        titleFallback: "Quests",
        icon: "❗",
        description:
          "Quests by character, with their story text and the quest chains they belong to.",
      },
      {
        href: "/db/battles",
        type: "battles",
        titleFallback: "Battles",
        icon: "⚔️",
        description:
          "Every battle: squads, required defense power, rewards and the camp where it starts.",
      },
      {
        href: "/db/alchemy",
        type: "alchemy",
        titleFallback: "Alchemy",
        icon: "⚗️",
        description:
          "Alchemy formulas with their red, green and blue rune requirements.",
      },
      {
        href: "/db/sermons",
        type: "sermons",
        titleFallback: "Sermons",
        icon: "⛪",
        description:
          "Church sermons: parishioners needed, difficulty and blessings per level.",
      },
      {
        href: "/db/inspirations",
        type: "inspirations",
        titleFallback: "Inspirations",
        icon: "💡",
        description:
          "Inspiration challenges for every mastery, with goals and required techs.",
      },
      {
        href: "/db/achievements",
        type: "achievements",
        titleFallback: "Achievements",
        icon: "🏆",
        description: "All achievements and what unlocks them.",
      },
    ],
    typeLabels: {
      items: "Items",
      recipes: "Recipes",
      techs: "Tech Tree",
      buildings: "Buildings",
      skills: "Masteries",
      traders: "Traders",
      quests: "Quests",
      battles: "Battles",
      alchemy: "Alchemy",
      sermons: "Sermons",
      inspirations: "Inspirations",
      achievements: "Achievements",
      perks: "Perks",
    },
  },
});
