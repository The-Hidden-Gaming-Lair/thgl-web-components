import { resolveAppConfig } from "@repo/lib";

export const avowed = resolveAppConfig({
  name: "avowed",
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "it",
    "ja",
    "ko",
    "pl",
    "pt",
    "ru",
    "zh-CN",
  ],
  appUrl: "https://www.th.gl/companion-app",
  // No manual "/maps/..." internalLink — the home page auto-generates a richer
  // map card (preview image + live location count) and suppresses it when an
  // internalLink targets the same /maps/<name>.
  internalLinks: [
    {
      title: "config.internalLinks.inventory.title",
      description: "config.internalLinks.inventory.description",
      href: "/db/inventory",
      iconName: "Gift",
      linkText: "config.internalLinks.inventory.linkText",
    },
    {
      title: "config.internalLinks.recipes.title",
      description: "config.internalLinks.recipes.description",
      href: "/db/recipes",
      iconName: "ScrollText",
      linkText: "config.internalLinks.recipes.linkText",
    },
  ],
  externalLinks: [],
  keywords: ["God Totems", "Unique Weapons"],
  db: {
    heroSubtitle: "config.db.heroSubtitle",
    searchPlaceholder: "config.db.searchPlaceholder",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleKey: "config.internalLinks.inventory.title",
        titleFallback: "Items",
        icon: "🗡️",
        description: "config.db.inventory.description",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleKey: "config.internalLinks.recipes.title",
        titleFallback: "Recipes",
        icon: "📜",
        description: "config.db.recipes.description",
      },
    ],
    typeLabels: {
      inventory: "config.db.typeLabels.inventory",
      recipes: "config.db.typeLabels.recipes",
    },
  },
});
