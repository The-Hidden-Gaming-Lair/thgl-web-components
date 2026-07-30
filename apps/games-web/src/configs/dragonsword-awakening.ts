import { resolveAppConfig } from "@repo/lib";

export const dragonswordAwakening = resolveAppConfig({
  name: "dragonsword-awakening",
  // The game ships 11 languages in its server StringData catalog — real localized names
  // for every item/character/recipe (extracted from __GeneratedGameData__ XML).
  supportedLocales: [
    "en",
    "ja",
    "ko",
    "zh-CN",
    "zh-TW",
    "de",
    "fr",
    "es",
    "pt",
    "ru",
    "th",
  ],
  appUrl: "https://www.th.gl/companion-app",
  // No manual "/maps/Orbis" internalLink — the home page auto-generates a richer
  // map card (preview + live count), which a manual /maps link would shadow.
  internalLinks: [
    {
      title: "Characters",
      description:
        "Every hero and named character in DragonSword: Awakening, with portraits.",
      href: "/db/characters",
      iconName: "Users",
      linkText: "Browse Characters",
    },
    {
      title: "Cooking Recipes",
      description:
        "Every dish you can cook in Orbis — with icons, cross-linked to their ingredients.",
      href: "/db/recipes",
      iconName: "BookOpen",
      linkText: "Browse Recipes",
    },
    {
      title: "Mounts & Familiars",
      description:
        "Every mount and companion you can ride and collect across Orbis.",
      href: "/db/mounts",
      iconName: "Bug",
      linkText: "Browse Mounts",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "Chests",
    "Cooking Ingredients",
    "Crafting Materials",
    "World Bosses",
    "Heroes",
    "Mounts",
    "Familiars",
  ],
  topFilters: [
    "chests_dig",
    "ingredients_carrot",
    "materials_reminiscecrystal",
  ],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search the database…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/characters",
        type: "characters",
        titleFallback: "Characters",
        icon: "🦸",
        description: "Every hero and named character, with portraits.",
      },
      {
        href: "/db/monsters",
        type: "monsters",
        titleFallback: "Bestiary",
        icon: "🐉",
        description:
          "Every boss, elite and named monster with combat stats, resistances, loot and locations.",
      },
      {
        href: "/db/npcs",
        type: "npcs",
        titleFallback: "NPCs",
        icon: "🗣️",
        description:
          "Merchants, quest-givers and named NPCs with their roles and locations.",
      },
      {
        href: "/db/mounts",
        type: "mounts",
        titleFallback: "Mounts & Familiars",
        icon: "🐾",
        description: "Rideable mounts and collectible companions.",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleFallback: "Cooking Recipes",
        icon: "🍳",
        description: "Every dish you can cook in Orbis.",
      },
      {
        href: "/db/ingredients_db",
        type: "ingredients_db",
        titleFallback: "Ingredients",
        icon: "🥕",
        description: "Cooking ingredients you gather across the world.",
      },
      {
        href: "/db/equipment",
        type: "equipment",
        titleFallback: "Equipment",
        icon: "🛡️",
        description: "Armor and gear with slots, sets and stats.",
      },
      {
        href: "/db/materials_db",
        type: "materials_db",
        titleFallback: "Materials",
        icon: "💎",
        description: "Crystals, gems and crafting materials with lore.",
      },
      {
        href: "/db/costumes",
        type: "costumes",
        titleFallback: "Costumes",
        icon: "👗",
        description: "Hero costumes and unique skins.",
      },
    ],
    typeLabels: {
      characters: "Characters",
      monsters: "Monster",
      npcs: "NPC",
      mounts: "Mounts",
      recipes: "Recipe",
      ingredients_db: "Ingredients",
      equipment: "Equipment",
      materials_db: "Materials",
      costumes: "Costumes",
    },
  },
});
