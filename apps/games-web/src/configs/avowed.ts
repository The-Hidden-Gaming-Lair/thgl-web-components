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
      title: "Items",
      description:
        "Browse every Avowed item by category — weapons, armor, accessories, food, consumables, ingredients and more — with descriptions and cooking recipes.",
      href: "/db/inventory",
      iconName: "Gift",
      linkText: "Open the Items database",
    },
    {
      title: "Recipes",
      description:
        "Every cooking recipe in Avowed — ingredients cross-linked to each item, with yields.",
      href: "/db/recipes",
      iconName: "ScrollText",
      linkText: "Browse Recipes",
    },
  ],
  externalLinks: [],
  keywords: ["God Totems", "Unique Weapons"],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "🗡️",
        description:
          "Weapons, armor, accessories, food, consumables and materials.",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleFallback: "Recipes",
        icon: "📜",
        description: "Cooking recipes with ingredients and yields.",
      },
    ],
    typeLabels: {
      inventory: "Items",
      recipes: "Recipe",
    },
  },
});
