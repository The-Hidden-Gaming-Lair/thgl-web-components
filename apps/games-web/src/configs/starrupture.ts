import { resolveAppConfig } from "@repo/lib";

export const starrupture = resolveAppConfig({
  name: "starrupture",
  // 12 locales — the data pipeline emits dicts/<locale>.json for each of these
  // (verified against public/starrupture/dicts). Use the EXACT data-forge locale
  // codes (pt-BR, zh-Hans, zh-Hant), which are the dict filenames the frontend fetches.
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
    "th",
    "zh-Hans",
    "zh-Hant",
  ],
  appUrl: null,
  // No manual "/maps/..." internalLink — the home page auto-generates a richer
  // map card (preview + live location count) for the single map (Arcadia-7 /
  // ChimeraMain), and that auto-card is shadowed by a manual /maps link.
  // The DB section internalLinks below use display-name-safe /db/<slug> hrefs.
  internalLinks: [
    {
      title: "Items",
      description:
        "Every item in Star Rupture — resources, consumables, blueprints and valuables — with crafting recipes and where to find them.",
      href: "/db/inventory",
      iconName: "BookOpen",
      linkText: "Browse Items",
    },
    {
      title: "Recipes",
      description:
        "The full crafting graph — inputs, outputs, the station that makes each recipe, and what unlocks it.",
      href: "/db/recipes",
      iconName: "Axe",
      linkText: "Browse Recipes",
    },
    {
      title: "Buildings",
      description:
        "Every structure you can build on Arcadia-7 — extractors, factories, power, storage and defenses — with build cost and the recipes they produce.",
      href: "/db/stations",
      iconName: "Grid",
      linkText: "Browse Buildings",
    },
    {
      title: "Corporations",
      description:
        "The corporate tech trees — each level's Data Point cost and the buildings and items it unlocks.",
      href: "/db/corporations",
      iconName: "Bug",
      linkText: "Browse Corporations",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "Resource Nodes",
    "Salvage & Loot",
    "Gatherables",
    "Points of Interest",
    "Collectibles",
  ],
  topFilters: ["res_titanium", "found_drone", "loc_monolith"],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items, recipes, buildings, LEMs…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "📦",
        description:
          "Every resource, consumable, blueprint and valuable — with recipes and locations.",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleFallback: "Recipes",
        icon: "⚙️",
        description:
          "The crafting graph — inputs, outputs, station and unlock cost.",
      },
      {
        href: "/db/stations",
        type: "stations",
        titleFallback: "Buildings",
        icon: "🏭",
        description:
          "Extractors, factories, power, storage and defenses — cost, corp unlock and recipes produced.",
      },
      {
        href: "/db/corporations",
        type: "corporations",
        titleFallback: "Corporations",
        icon: "🏢",
        description:
          "Corporate tech trees — Data Point cost per level and what each level unlocks.",
      },
      {
        href: "/db/lems",
        type: "lems",
        titleFallback: "LEMs",
        icon: "🔷",
        description: "Combat & Survival LEM mods — effect, magnitude and tier.",
      },
      {
        href: "/db/aliens",
        type: "aliens",
        titleFallback: "Aliens & Fauna",
        icon: "👾",
        description: "Creatures and fauna native to Arcadia-7.",
      },
      {
        href: "/db/audiologs",
        type: "audiologs",
        titleFallback: "Audiologs",
        icon: "🎙️",
        description: "Recovered audio logs and the story they tell.",
      },
      {
        href: "/db/datapads",
        type: "datapads",
        titleFallback: "Data Pads",
        icon: "💾",
        description: "Collectible data pads scattered across the map.",
      },
      {
        href: "/db/lore",
        type: "lore",
        titleFallback: "Lore",
        icon: "📖",
        description: "World lore, locations and characters of Arcadia-7.",
      },
    ],
    typeLabels: {
      inventory: "Items",
      recipes: "Recipes",
      stations: "Buildings",
      corporations: "Corporations",
      lems: "LEMs",
      aliens: "Aliens & Fauna",
      audiologs: "Audiologs",
      datapads: "Data Pads",
      lore: "Lore",
    },
  },
});
