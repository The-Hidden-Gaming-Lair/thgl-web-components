import { resolveAppConfig } from "@repo/lib";

export const palworld = resolveAppConfig({
  name: "palworld",
  // Matches the locales the data-mining script emits (dicts/*.json) from the
  // extracted L10N cultures (extractor.jsonc → Pal/Content/L10N). Palworld ships
  // no Japanese.
  supportedLocales: [
    "en",
    "de",
    "es",
    "es-MX",
    "fr",
    "id",
    "it",
    "ko",
    "pl",
    "pt",
    "ru",
    "th",
    "tr",
    "vi",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: "https://www.th.gl/companion-app",
  // No "/maps/..." internalLink: Palpagos Island and any future map auto-generate
  // from version.data.tiles (the auto-card is richer and is suppressed by a manual
  // same-target link). The links below point at the database (codex) sections.
  internalLinks: [
    {
      title: "Paldeck",
      description:
        "Every Pal with its elements, rarity, base stats and item drops — the full Paldeck.",
      href: "/db/paldeck",
      iconName: "Bug",
      linkText: "Browse the Paldeck",
    },
    {
      title: "Items",
      description:
        "Browse every Palworld item by category — materials, food, gear and consumables — with stats, weight, price and recipes.",
      href: "/db/inventory",
      iconName: "Gift",
      linkText: "Open the Items database",
    },
    {
      title: "Recipes",
      description:
        "Every crafting recipe with its ingredients and work amount, cross-linked to each item.",
      href: "/db/recipes",
      iconName: "BookOpen",
      linkText: "Browse Recipes",
    },
    {
      title: "Technology",
      description:
        "The technology tree — every unlock with its tier, point cost and what it grants.",
      href: "/db/technology",
      iconName: "Grid",
      linkText: "Browse Technology",
    },
  ],
  externalLinks: [],
  keywords: ["Tides of Terraria", "Feybreak", "Predator & Alpha Pals"],
  topFilters: [
    "lifmunk_effigy",
    "dungeon_random",
    "coal",
    "junk_yard",
    "boss_thunderbird",
    "predator_sifudog",
    "fasttravel",
    "skill_fruit",
  ],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search Pals, items…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/paldeck",
        type: "paldeck",
        titleFallback: "Paldeck",
        icon: "🐾",
        description: "Every Pal — elements, stats and drops.",
      },
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "🎒",
        description: "Materials, food, gear and consumables.",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleFallback: "Recipes",
        icon: "📜",
        description: "Crafting recipes with ingredients and work amount.",
      },
      {
        href: "/db/technology",
        type: "technology",
        titleFallback: "Technology",
        icon: "🔧",
        description: "The tech tree — tiers, costs and unlocks.",
      },
    ],
    typeLabels: {
      paldeck: "Pal",
      inventory: "Items",
      recipes: "Recipe",
      technology: "Technology",
    },
  },
});
