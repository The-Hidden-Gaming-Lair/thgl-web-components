import { resolveAppConfig } from "@repo/lib";

export const witchspire = resolveAppConfig({
  name: "witchspire",
  // Only `en` — the data pipeline emits no other dicts for Witchspire yet (the
  // extractor doesn't pull Localization/*.locres). Advertising more locales
  // produced hreflang alternates + locale-switcher entries whose dict fetches
  // 404'd on the CDN. Re-add locales once dicts/<locale>.json actually ship.
  supportedLocales: ["en"],
  appUrl: "https://www.th.gl/companion-app",
  // No manual "/maps/..." internalLink: the home page auto-generates a richer
  // map card (preview image + live location count) per map, and that auto-card
  // is suppressed when an internalLink already targets the same /maps/<name>.
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
      iconName: "BookOpen",
      linkText: "config.internalLinks.recipes.linkText",
    },
    {
      title: "config.internalLinks.familiars.title",
      description: "config.internalLinks.familiars.description",
      href: "/db/familiars",
      iconName: "Bug",
      linkText: "config.internalLinks.familiars.linkText",
    },
    {
      title: "config.internalLinks.enemies.title",
      description: "config.internalLinks.enemies.description",
      href: "/db/enemies",
      iconName: "Axe",
      linkText: "config.internalLinks.enemies.linkText",
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
    "Familiars",
    "Resource Nodes",
    "Treasure Chests",
    "Dungeon Portals",
    "Flight Pillars",
  ],
  topFilters: [
    "dungeon_portal",
    "flight_pillar",
    "chest_basic",
    "mineral_copper",
  ],
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
        icon: "🧪",
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
      {
        href: "/db/familiars",
        type: "familiars",
        titleKey: "config.internalLinks.familiars.title",
        titleFallback: "Familiars",
        icon: "🐾",
        description: "config.db.familiars.description",
      },
      {
        href: "/db/enemies",
        type: "enemies",
        titleKey: "config.internalLinks.enemies.title",
        titleFallback: "Enemies",
        icon: "⚔️",
        description: "config.db.enemies.description",
      },
    ],
    typeLabels: {
      inventory: "config.db.typeLabels.inventory",
      recipes: "config.db.typeLabels.recipes",
      familiars: "config.db.typeLabels.familiars",
      enemies: "config.db.typeLabels.enemies",
    },
  },
});
