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
      title: "config.internalLinks.items.title",
      description: "config.internalLinks.items.description",
      href: "/db/items",
      iconName: "BookOpen",
      linkText: "config.internalLinks.items.linkText",
    },
    {
      title: "config.internalLinks.recipes.title",
      description: "config.internalLinks.recipes.description",
      href: "/db/recipes",
      iconName: "Axe",
      linkText: "config.internalLinks.recipes.linkText",
    },
    {
      title: "config.internalLinks.horses.title",
      description: "config.internalLinks.horses.description",
      href: "/db/horses",
      iconName: "Grid",
      linkText: "config.internalLinks.horses.linkText",
    },
    {
      title: "config.internalLinks.traits.title",
      description: "config.internalLinks.traits.description",
      href: "/db/traits",
      iconName: "Bug",
      linkText: "config.internalLinks.traits.linkText",
    },
    {
      title: "crafting.navTitle",
      description: "crafting.navDescription",
      href: "/crafting",
      iconName: "Hammer",
      linkText: "crafting.navLinkText",
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
    heroSubtitle: "config.db.heroSubtitle",
    searchPlaceholder: "config.db.searchPlaceholder",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/items",
        type: "items",
        titleKey: "config.internalLinks.items.title",
        titleFallback: "Items",
        icon: "📦",
        description: "config.db.items.description",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleKey: "config.internalLinks.recipes.title",
        titleFallback: "Recipes",
        icon: "⚙️",
        description: "config.db.recipes.description",
      },
      {
        href: "/db/horses",
        type: "horses",
        titleKey: "config.internalLinks.horses.title",
        titleFallback: "Horse Breeding",
        icon: "🐎",
        description: "config.db.horses.description",
      },
      {
        href: "/db/traits",
        type: "traits",
        titleKey: "config.internalLinks.traits.title",
        titleFallback: "Horse Traits",
        icon: "✨",
        description: "config.db.traits.description",
      },
    ],
    typeLabels: {
      items: "config.db.typeLabels.items",
      recipes: "config.db.typeLabels.recipes",
      horses: "config.db.typeLabels.horses",
      traits: "config.db.typeLabels.traits",
    },
  },
});
