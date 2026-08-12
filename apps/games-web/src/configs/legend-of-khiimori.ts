import { resolveAppConfig } from "@repo/lib";

export const legendOfKhiimori = resolveAppConfig({
  name: "legend-of-khiimori",
  // Subdomain: khiimori.th.gl (set via games.ts `web`, matched by middleware).
  // 14 locales — the data pipeline emits dicts/<locale>.json for each (all present
  // in packages/ui globalDictionaries, so /{locale} routes resolve).
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "it",
    "ja",
    "ko",
    "pl",
    "pt-BR",
    "ru",
    "tr",
    "uk",
    "zh-Hans",
    "zh-Hant",
  ],
  appUrl: "https://www.th.gl/companion-app",
  // No manual "/maps/..." internalLink — the home page auto-generates the richer
  // map card (preview + counts) for the single open world. DB links below.
  internalLinks: [
    {
      title: "Items",
      description:
        "Every item in The Legend of Khiimori — cargo, resources, herbs, food and gear — with weights, prices and crafting uses.",
      href: "/db/items",
      iconName: "BookOpen",
      linkText: "Browse Items",
    },
    {
      title: "Recipes",
      description:
        "All crafting and cooking recipes — ingredients, outputs and how they unlock.",
      href: "/db/recipes",
      iconName: "Axe",
      linkText: "Browse Recipes",
    },
    {
      title: "Horse Breeding",
      description:
        "Breeds, coat phenotypes and the genetics behind them — plan pairings to chase pure breeds and rare coats.",
      href: "/db/horses",
      iconName: "Grid",
      linkText: "Browse Breeding",
    },
    {
      title: "Horse Traits",
      description:
        "Every permanent and temporary horse trait and what it does to your mount.",
      href: "/db/traits",
      iconName: "Bug",
      linkText: "Browse Traits",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "Ovoos",
    "Stone Turtles",
    "Bridge Projects",
    "Corruption Rifts",
    "Wild Horse Herds",
    "Yam Stations",
    "Gatherables",
    "Horse Breeding",
  ],
  topFilters: ["ovoo", "stone_turtle_blue", "wild_horse", "yam_station"],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items, recipes, breeds, traits…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/items",
        type: "items",
        titleFallback: "Items",
        icon: "📦",
        description:
          "Cargo, resources, herbs, food and gear — weights, prices and crafting uses.",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleFallback: "Recipes",
        icon: "⚙️",
        description: "Crafting and cooking — ingredients, outputs and unlocks.",
      },
      {
        href: "/db/horses",
        type: "horses",
        titleFallback: "Horse Breeding",
        icon: "🐎",
        description: "Breeds, coat phenotypes and the genes that produce them.",
      },
      {
        href: "/db/traits",
        type: "traits",
        titleFallback: "Horse Traits",
        icon: "✨",
        description: "Permanent and temporary traits and their effects.",
      },
    ],
    typeLabels: {
      items: "Items",
      recipes: "Recipes",
      horses: "Horse Breeding",
      traits: "Horse Traits",
    },
  },
});
