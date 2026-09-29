import { resolveAppConfig } from "@repo/lib";

export const crimsonDesert = resolveAppConfig({
  name: "crimson-desert",
  supportedLocales: [
    "en",
    "ko",
    "ja",
    "fr",
    "de",
    "it",
    "pl",
    "pt-BR",
    "ru",
    "es",
    "tr",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: "https://www.th.gl/companion-app",
  // Partner link (gaming.tools) — keep even with our own /db below.
  externalLinks: [
    {
      href: "https://crimsondesert.gaming.tools/",
      title: "Database",
    },
  ],
  // No internalLinks: map cards are auto-generated from version.data.tiles
  // (Pywel + Abyss). Header "Maps" link now derives from hasMap in layout.
  keywords: [
    "Pywel",
    "Abyss Cresset",
    "Sealed Artifact",
    "Treasure Chest",
    "Stronghold",
    "Fast Travel",
    "Bonfire",
    "Mining",
    "Gathering",
    "Iron Ore",
    "Copper Ore",
    "Faction Quest",
    "Hernand",
    "Delesyia",
    "Demeniss",
  ],
  topFilters: [
    "abyss_gate",
    "treasure_box",
    "faction_quest",
    "memory_fragment",
    "bonfire",
    "camp",
    "mine_copper",
    "chest",
  ],
  // Database (codex): sections mirror data-forge `config/database.<type>.json`
  // (data-mining/src/crimson-desert/database.ts). Slugs avoid the static /db/<folder>
  // routes (items, weapons, creatures, …) and the map's filter-group keys.
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder:
      "Search equipment, materials, recipes, vendors, creatures…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/equipment",
        type: "equipment",
        titleFallback: "Equipment",
        icon: "🗡️",
        description:
          "Weapons, armor, cloaks, accessories, packs, tools and mount gear with base stats, refinement levels and materials, prices, vendors, recipes and where to find them.",
      },
      {
        href: "/db/consumables",
        type: "consumables",
        titleFallback: "Consumables",
        icon: "🍲",
        description:
          "Provisions and alchemy results with their recipes, ingredients, prices and the vendors that sell them.",
      },
      {
        href: "/db/materials",
        type: "materials",
        titleFallback: "Materials",
        icon: "🪨",
        description:
          "Cooking ingredients, alchemy and crafting materials: which creatures drop them, who sells them and what they craft.",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleFallback: "Recipes",
        icon: "🔨",
        description:
          "Every cooking, alchemy, smithing, witchcraft, sewing and carpentry recipe with its ingredients, products and station.",
      },
      {
        href: "/db/vendors",
        type: "vendors",
        titleFallback: "Vendors",
        icon: "🏪",
        description:
          "Provisioners, equipment vendors, street vendors, farm owners and trade managers with their full stock and prices.",
      },
      {
        href: "/db/bestiary",
        type: "bestiary",
        titleFallback: "Bestiary",
        icon: "🐺",
        description:
          "Creatures, bosses and mounts from the in-game Knowledge tabs with their lore, drops, equipment and map locations.",
      },
      {
        href: "/db/documents",
        type: "documents",
        titleFallback: "Documents",
        icon: "📜",
        description:
          "Books, letters, posters, bounty notices, treasure maps and crafting manuals, with prices and where they are found.",
      },
      {
        href: "/db/miscellaneous",
        type: "miscellaneous",
        titleFallback: "Other Items",
        icon: "📦",
        description:
          "Furniture, keepsakes, abyss gear, keys, projectiles, currencies, trade goods and every other item in the inventory.",
      },
    ],
    typeLabels: {
      equipment: "Equipment",
      consumables: "Consumables",
      materials: "Materials",
      recipes: "Recipes",
      vendors: "Vendors",
      bestiary: "Bestiary",
      documents: "Documents",
      miscellaneous: "Other Items",
    },
  },
});
