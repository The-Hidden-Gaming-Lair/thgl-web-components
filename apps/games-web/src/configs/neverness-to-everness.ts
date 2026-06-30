import { resolveAppConfig } from "@repo/lib";

export const nevernessToEverness = resolveAppConfig({
  name: "neverness-to-everness",
  // Map markers use English category labels; the database/codex below is localized
  // across all 8 locales the game ships (dicts/*.json).
  supportedLocales: ["en", "de", "es", "fr", "ja", "ko", "ru", "zh-CN"],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      title: "Characters",
      description:
        "Every playable Appraiser — element, rarity and base stats (HP/ATK/DEF/CRIT).",
      href: "/db/characters",
      iconName: "Heart",
      linkText: "Browse Characters",
    },
    {
      title: "Arcs (Weapons)",
      description: "Every Arc weapon by rarity, with descriptions and icons.",
      href: "/db/arcs",
      iconName: "Axe",
      linkText: "Browse Arcs",
    },
    {
      title: "Cartridges",
      description: "Equipment cartridges/modules by rarity.",
      href: "/db/cartridges",
      iconName: "Grid",
      linkText: "Browse Cartridges",
    },
    {
      title: "Vehicles",
      description: "Drivable vehicles by rarity.",
      href: "/db/vehicles",
      iconName: "Server",
      linkText: "Browse Vehicles",
    },
    {
      title: "Anomaly Archive",
      description:
        "Every Vision/Anomaly in Hethereau — Organisms, Objects, Phenomena, Locations and Memes — with codes, threat level and lore.",
      href: "/db/visions",
      iconName: "BookOpen",
      linkText: "Browse the Anomaly Archive",
    },
    {
      title: "Bestiary",
      description:
        "Every enemy — bosses, weekly bosses, elites and normal foes — with type and habitat.",
      href: "/db/bestiary",
      iconName: "Bug",
      linkText: "Browse the Bestiary",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: ["Characters", "Arcs", "Cartridges", "Anomaly Archive", "Bestiary"],
  topFilters: [
    "treasure_box",
    "treasure_gift21",
    "oracle_stone",
    "vision_soul",
  ],
  db: {
    heroSubtitle: "Characters, Arcs, Anomalies & more",
    searchPlaceholder: "Search the database…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/characters",
        type: "characters",
        titleFallback: "Characters",
        icon: "🧑",
        description: "Playable Appraisers — element, rarity, base stats.",
      },
      {
        href: "/db/arcs",
        type: "arcs",
        titleFallback: "Arcs (Weapons)",
        icon: "⚔️",
        description: "Arc weapons by rarity.",
      },
      {
        href: "/db/cartridges",
        type: "cartridges",
        titleFallback: "Cartridges",
        icon: "🔲",
        description: "Equipment cartridges/modules by rarity.",
      },
      {
        href: "/db/vehicles",
        type: "vehicles",
        titleFallback: "Vehicles",
        icon: "🚗",
        description: "Drivable vehicles by rarity.",
      },
      {
        href: "/db/visions",
        type: "visions",
        titleFallback: "Anomaly Archive",
        icon: "📖",
        description: "Visions/Anomalies by category.",
      },
      {
        href: "/db/bestiary",
        type: "bestiary",
        titleFallback: "Bestiary",
        icon: "👹",
        description: "Bosses, weekly bosses, elites and normal enemies.",
      },
    ],
    typeLabels: {
      characters: "Characters",
      arcs: "Arcs (Weapons)",
      cartridges: "Cartridges",
      vehicles: "Vehicles",
      visions: "Anomaly Archive",
      bestiary: "Bestiary",
    },
  },
});
