import { resolveAppConfig } from "@repo/lib";

// Maps are NOT listed here: the home page auto-generates a card per map in
// version.data.tiles. Locales = the languages the playtest client ships
// (data-forge chrono-odyssey/localization.ts; Arabic is not mined yet).
export const chronoOdyssey = resolveAppConfig({
  name: "chrono-odyssey",
  supportedLocales: ["en", "ja", "ko", "zh-CN", "zh-TW"],
  appUrl: null,
  internalLinks: [
    {
      title: "Items",
      description:
        "Every Chrono Odyssey item: weapons, armor, accessories, materials and consumables with rarity, stats and crafting uses.",
      href: "/db/inventory",
      iconName: "Gift",
      linkText: "Open the Items database",
    },
    {
      title: "Recipes",
      description:
        "Every crafting recipe by workbench, with ingredients, mastery level and gold cost, cross-linked to each item.",
      href: "/db/recipes",
      iconName: "BookOpen",
      linkText: "Browse Recipes",
    },
    {
      title: "crafting.navTitle",
      description: "crafting.navDescription",
      href: "/crafting",
      iconName: "Hammer",
      linkText: "crafting.navLinkText",
    },
    {
      title: "checklist.navTitle",
      description: "checklist.navDescription",
      href: "/checklist",
      iconName: "SquareCheckBig",
      linkText: "checklist.navLinkText",
    },
  ],
  externalLinks: [],
  keywords: ["Bound Stones", "Beacons of Time", "Vaults", "Labyrinths"],
  db: {
    // Collection checklists: the map's collectibles, one codex entry per marker.
    checklists: [
      { section: "bound_stones", descriptions: true },
      { section: "beacons_of_time", descriptions: true },
      { section: "vaults", descriptions: true },
    ],
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items, recipes, monsters…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleKey: "inventory",
        titleFallback: "Items",
        icon: "🗡️",
        description: "Weapons, armor, accessories, materials and consumables.",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleKey: "recipes",
        titleFallback: "Recipes",
        icon: "📜",
        description:
          "Crafting recipes by workbench, with ingredients and costs.",
      },
      {
        href: "/db/bestiary",
        type: "bestiary",
        titleKey: "bestiary",
        titleFallback: "Monsters",
        icon: "🐺",
        description: "Monsters and bosses with level, stats and spawn spots.",
      },
      {
        href: "/db/dungeons",
        type: "dungeons",
        titleKey: "dungeons",
        titleFallback: "Dungeons",
        icon: "🏛️",
        description:
          "Expeditions, labyrinths and trials with bosses and rewards.",
      },
      {
        href: "/db/bound_stones",
        type: "bound_stones",
        titleKey: "bound_stones",
        titleFallback: "Bound Stones",
        icon: "🪨",
        description: "Every Bound Stone fast-travel point on the map.",
      },
      {
        href: "/db/beacons_of_time",
        type: "beacons_of_time",
        titleKey: "beacons_of_time",
        titleFallback: "Beacons of Time",
        icon: "⏳",
        description: "Every Beacon of Time and where to find it.",
      },
      {
        href: "/db/vaults",
        type: "vaults",
        titleKey: "vaults",
        titleFallback: "Vaults",
        icon: "🔒",
        description: "Every Vault on the map.",
      },
    ],
    // Singular entry labels; the collectibles' are the map types' dict terms
    // (the game's own names, localized).
    typeLabels: {
      inventory: "Item",
      recipes: "Recipe",
      bestiary: "Monster",
      dungeons: "Dungeon",
      bound_stones: "bound-stone",
      beacons_of_time: "beacon-of-time",
      vaults: "vault",
    },
  },
});
