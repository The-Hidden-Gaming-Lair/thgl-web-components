import { resolveAppConfig } from "@repo/lib";

export const satisfactory = resolveAppConfig({
  name: "satisfactory",
  supportedLocales: [
    "en",
    "cs",
    "de",
    "es",
    "es-MX",
    "fr",
    "hu",
    "id",
    "it",
    "ja",
    "ko",
    "pl",
    "pt",
    "ru",
    "th",
    "tr",
    "uk",
    "vi",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: "https://www.th.gl/companion-app",
  keywords: ["Mercer Spheres", "Resource Nodes", "Power Slugs", "Hard Drives"],
  // List EVERY db section here (in homeSections order): the header renders
  // internalLinks before "All Guides" and appends any homeSections not linked
  // yet after it — a partial list splits the database links around "All Guides".
  internalLinks: [
    {
      title: "Items",
      description:
        "Browse every Satisfactory item and resource — parts, equipment, ammo and fuels — with stack sizes, energy values, sink points and crafting cross-links.",
      href: "/db/inventory",
      iconName: "Gift",
      linkText: "Open the Items database",
    },
    {
      title: "Buildings",
      description:
        "All buildable structures — production machines, power generators, logistics and architecture — with power stats and build costs.",
      href: "/db/structures",
      iconName: "House",
      linkText: "Browse Buildings",
    },
    {
      title: "Recipes",
      description:
        "Every machine and workshop recipe, grouped by building — ingredients, products, crafting time and output per minute.",
      href: "/db/recipes",
      iconName: "BookOpen",
      linkText: "Browse Recipes",
    },
    {
      title: "Schematics",
      description:
        "Milestones, MAM research, alternate recipes and the AWESOME Shop — costs and everything they unlock.",
      href: "/db/schematics",
      iconName: "ScrollText",
      linkText: "Browse Schematics",
    },
    {
      title: "Creatures",
      description:
        "The fauna of MASSAGE-2(A-B)b — health, damage, gas resistance and drops.",
      href: "/db/fauna",
      iconName: "PawPrint",
      linkText: "Browse Creatures",
    },
  ],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items, buildings, recipes…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "📦",
        description:
          "Parts, resources, equipment, ammo and fuels — with stack sizes, energy values and sink points.",
      },
      {
        href: "/db/structures",
        type: "structures",
        titleFallback: "Buildings",
        icon: "🏭",
        description:
          "Production machines, generators, logistics and architecture — with power stats and build costs.",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleFallback: "Recipes",
        icon: "📜",
        description:
          "Machine and workshop recipes by building — ingredients, products and output per minute.",
      },
      {
        href: "/db/schematics",
        type: "schematics",
        titleFallback: "Schematics",
        icon: "🔬",
        description:
          "Milestones, MAM research, alternate recipes and the AWESOME Shop — costs and unlocks.",
      },
      {
        href: "/db/fauna",
        type: "fauna",
        titleFallback: "Creatures",
        icon: "🐗",
        description: "The fauna of MASSAGE-2(A-B)b — health, damage and drops.",
      },
    ],
    typeLabels: {
      inventory: "Items",
      structures: "Buildings",
      recipes: "Recipe",
      schematics: "Schematics",
      fauna: "Creatures",
    },
  },
});
