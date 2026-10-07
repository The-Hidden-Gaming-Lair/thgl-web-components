import { resolveAppConfig } from "@repo/lib";

export const rsdragonwilds = resolveAppConfig({
  name: "rsdragonwilds",
  // Production URL is dragonwilds.th.gl (NOT rsdragonwilds.th.gl)
  // zh-TW added with the 0.12.1.x hotfixes (game shipped a zh-Hant localization)
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "it",
    "ja",
    "ko",
    "pt",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: "https://www.th.gl/companion-app",
  // No manual "/maps/..." internalLink: the home page auto-generates a richer
  // map card (with the preview.webp image + live location count) for each map,
  // and that auto-card is suppressed when an internalLink already targets the
  // same /maps/<name> href. A hand-written map link here would shadow the
  // preview card (and the old "/maps/worldMap" href 404'd — the route uses the
  // localized map title, e.g. /maps/Ashenfall).
  internalLinks: [
    {
      title: "config.internalLinks.inventory.title",
      description: "config.internalLinks.inventory.description",
      href: "/db/inventory",
      iconName: "Gift",
      linkText: "config.internalLinks.inventory.linkText",
    },
    {
      title: "config.internalLinks.equipment.title",
      description: "config.internalLinks.equipment.description",
      href: "/db/equipment",
      iconName: "Axe",
      linkText: "config.internalLinks.equipment.linkText",
    },
    {
      title: "config.internalLinks.recipes.title",
      description: "config.internalLinks.recipes.description",
      href: "/db/recipes",
      iconName: "BookOpen",
      linkText: "config.internalLinks.recipes.linkText",
    },
    {
      title: "config.internalLinks.enemies.title",
      description: "config.internalLinks.enemies.description",
      href: "/db/enemies",
      iconName: "Bug",
      linkText: "config.internalLinks.enemies.linkText",
    },
    {
      title: "checklist.navTitle",
      description: "checklist.navDescription",
      href: "/checklist",
      iconName: "SquareCheckBig",
      linkText: "checklist.navLinkText",
    },
    {
      title: "crafting.navTitle",
      description: "crafting.navDescription",
      href: "/crafting",
      iconName: "Hammer",
      linkText: "crafting.navLinkText",
    },
    {
      title: "xp.navTitle",
      description: "xp.navDescription",
      href: "/xp-planner",
      bgImage: "/games/thgl-web/tools/xp-planner.webp",
      iconName: "ChartLine",
      linkText: "xp.navLinkText",
    },
  ],
  externalLinks: [],
  keywords: ["Chests", "Lore", "Quests", "Items", "Recipes", "Equipment"],
  db: {
    // Collection checklists (/checklist, /checklist/<section>).
    checklists: [{ section: "enemies" }],
    heroSubtitle: "config.db.heroSubtitle",
    searchPlaceholder: "config.db.searchPlaceholder",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleKey: "config.internalLinks.inventory.title",
        titleFallback: "Items",
        icon: "🎒",
        description: "config.db.inventory.description",
      },
      {
        href: "/db/equipment",
        type: "equipment",
        titleKey: "config.internalLinks.equipment.title",
        titleFallback: "Equipment",
        icon: "⚔️",
        description: "config.db.equipment.description",
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
        href: "/db/enemies",
        type: "enemies",
        titleKey: "config.internalLinks.enemies.title",
        titleFallback: "Enemies",
        icon: "💀",
        description: "config.db.enemies.description",
      },
    ],
    typeLabels: {
      inventory: "config.db.typeLabels.inventory",
      equipment: "config.db.typeLabels.equipment",
      recipes: "config.db.typeLabels.recipes",
      enemies: "config.db.typeLabels.enemies",
    },
  },
});
