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
      title: "Items",
      description:
        "Every Subnautica 2 resource, tool, piece of equipment and upgrade, with descriptions in 11 languages.",
      href: "/db/inventory",
      iconName: "Gift",
      linkText: "Browse Items",
    },
    {
      title: "Blueprints",
      description:
        "Crafting recipes grouped by station — Fabricator, Habitat Builder, Processor and more — with every ingredient.",
      href: "/db/blueprints",
      iconName: "NotepadText",
      linkText: "Browse Blueprints",
    },
    {
      title: "Creatures",
      description:
        "The scannable fauna and flora of the Crater, organised by family with full databank lore.",
      href: "/db/lifeforms",
      iconName: "Bug",
      linkText: "Browse Creatures",
    },
    {
      title: "Farming",
      description:
        "Plants you can grow in a growbed, and what each is cultivated from.",
      href: "/db/farming",
      iconName: "Trophy",
      linkText: "Browse Farming",
    },
    {
      title: "Biomods",
      description:
        "Active and passive bio-modifications you can install, with their abilities and descriptions.",
      href: "/db/biomods",
      iconName: "Heart",
      linkText: "Browse Biomods",
    },
    {
      title: "Databank",
      description:
        "The in-game PDA databank: ruins, points of interest, colonist logs and lore from across the Crater.",
      href: "/db/databank",
      iconName: "BookOpen",
      linkText: "Browse the Databank",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: ["Resource Deposits", "Titanium", "Quartz", "Points of Interest"],
  topFilters: ["resource_titanium", "resource_quartz", "poi"],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items, blueprints, creatures, lore…",
    sectionsInNav: true,
    // Section slugs are tenant-resolved by the generic /db/[section] route, so they must
    // avoid the game-specific static folders (items, creatures, …) that 404 other tenants —
    // hence "inventory"/"lifeforms" rather than "items"/"creatures".
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "🛠️",
        description: "Resources, tools, equipment and upgrades.",
      },
      {
        href: "/db/blueprints",
        type: "blueprints",
        titleFallback: "Blueprints",
        icon: "📋",
        description: "Crafting recipes by station, with ingredients.",
      },
      {
        href: "/db/lifeforms",
        type: "lifeforms",
        titleFallback: "Creatures",
        icon: "🐟",
        description: "Scannable fauna and flora, by family.",
      },
      {
        href: "/db/farming",
        type: "farming",
        titleFallback: "Farming",
        icon: "🌱",
        description: "Growable plants and what they're grown from.",
      },
      {
        href: "/db/biomods",
        type: "biomods",
        titleFallback: "Biomods",
        icon: "🧬",
        description: "Active and passive bio-modifications.",
      },
      {
        href: "/db/databank",
        type: "databank",
        titleFallback: "Databank",
        icon: "📖",
        description: "Ruins, points of interest, colonist logs and lore.",
      },
    ],
    typeLabels: {
      inventory: "Items",
      blueprints: "Blueprints",
      lifeforms: "Creatures",
      farming: "Farming",
      biomods: "Biomods",
      databank: "Databank",
    },
  },
});
