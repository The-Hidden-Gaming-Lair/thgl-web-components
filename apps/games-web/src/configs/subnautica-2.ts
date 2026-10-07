import { resolveAppConfig } from "@repo/lib";

export const subnautica2 = resolveAppConfig({
  name: "subnautica-2",
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "it",
    "ja",
    "ko",
    "pt",
    "ru",
    "uk",
    "zh-CN",
  ],
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
      title: "config.internalLinks.blueprints.title",
      description: "config.internalLinks.blueprints.description",
      href: "/db/blueprints",
      iconName: "NotepadText",
      linkText: "config.internalLinks.blueprints.linkText",
    },
    {
      title: "config.internalLinks.lifeforms.title",
      description: "config.internalLinks.lifeforms.description",
      href: "/db/lifeforms",
      iconName: "Bug",
      linkText: "config.internalLinks.lifeforms.linkText",
    },
    {
      title: "config.internalLinks.farming.title",
      description: "config.internalLinks.farming.description",
      href: "/db/farming",
      iconName: "Trophy",
      linkText: "config.internalLinks.farming.linkText",
    },
    {
      title: "config.internalLinks.biomods.title",
      description: "config.internalLinks.biomods.description",
      href: "/db/biomods",
      iconName: "Heart",
      linkText: "config.internalLinks.biomods.linkText",
    },
    {
      title: "config.internalLinks.databank.title",
      description: "config.internalLinks.databank.description",
      href: "/db/databank",
      iconName: "BookOpen",
      linkText: "config.internalLinks.databank.linkText",
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
  keywords: ["Resource Deposits", "Titanium", "Quartz", "Points of Interest"],
  topFilters: ["resource_titanium", "resource_quartz", "poi"],
  db: {
    heroSubtitle: "config.db.heroSubtitle",
    searchPlaceholder: "config.db.searchPlaceholder",
    sectionsInNav: true,
    // Section slugs are tenant-resolved by the generic /db/[section] route, so they must
    // avoid the game-specific static folders (items, creatures, …) that 404 other tenants —
    // hence "inventory"/"lifeforms" rather than "items"/"creatures".
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleKey: "config.internalLinks.inventory.title",
        titleFallback: "Items",
        icon: "🛠️",
        description: "config.db.inventory.description",
      },
      {
        href: "/db/blueprints",
        type: "blueprints",
        titleKey: "config.internalLinks.blueprints.title",
        titleFallback: "Blueprints",
        icon: "📋",
        description: "config.db.blueprints.description",
      },
      {
        href: "/db/lifeforms",
        type: "lifeforms",
        titleKey: "config.internalLinks.lifeforms.title",
        titleFallback: "Creatures",
        icon: "🐟",
        description: "config.db.lifeforms.description",
      },
      {
        href: "/db/farming",
        type: "farming",
        titleKey: "config.internalLinks.farming.title",
        titleFallback: "Farming",
        icon: "🌱",
        description: "config.db.farming.description",
      },
      {
        href: "/db/biomods",
        type: "biomods",
        titleKey: "config.internalLinks.biomods.title",
        titleFallback: "Biomods",
        icon: "🧬",
        description: "config.db.biomods.description",
      },
      {
        href: "/db/databank",
        type: "databank",
        titleKey: "config.internalLinks.databank.title",
        titleFallback: "Databank",
        icon: "📖",
        description: "config.db.databank.description",
      },
    ],
    typeLabels: {
      inventory: "config.db.typeLabels.inventory",
      blueprints: "config.db.typeLabels.blueprints",
      lifeforms: "config.db.typeLabels.lifeforms",
      farming: "config.db.typeLabels.farming",
      biomods: "config.db.typeLabels.biomods",
      databank: "config.db.typeLabels.databank",
    },
  },
});
