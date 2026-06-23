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
  appUrl: null,
  internalLinks: [
    {
      title: "The Crater Map",
      description:
        "Find resource deposits, wrecks, and points of interest across Subnautica 2's Crater with our interactive map.",
      href: "/maps/The%20Crater",
      iconName: "Map",
      linkText: "Explore the Crater Map",
    },
    {
      title: "Item Database",
      description:
        "Browse every Subnautica 2 resource, tool, piece of equipment and upgrade with descriptions in 11 languages.",
      href: "/db/inventory",
      iconName: "Gift",
      linkText: "Open the Item Database",
    },
    {
      title: "Databank",
      description:
        "Read the in-game PDA databank: scanned creatures, flora, ruins and lore from across the Crater.",
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
    searchPlaceholder: "Search items, creatures, flora, lore…",
    // Section slugs are tenant-resolved by the generic /db/[section] route. They must
    // avoid the game-specific static folders (items, creatures, …) which 404 other
    // tenants — "inventory" + "databank" have none.
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "🛠️",
        description: "Resources, tools, equipment and upgrades.",
      },
      {
        href: "/db/databank",
        type: "databank",
        titleFallback: "Databank",
        icon: "📖",
        description: "Scanned creatures, flora, ruins and lore from the PDA.",
      },
    ],
    typeLabels: { inventory: "Items", databank: "Databank" },
  },
});
