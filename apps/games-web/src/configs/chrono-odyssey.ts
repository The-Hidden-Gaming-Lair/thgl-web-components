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
    heroSubtitle: "config.db.heroSubtitle",
    searchPlaceholder: "config.db.searchPlaceholder",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleKey: "inventory",
        titleFallback: "Items",
        icon: "🗡️",
        description: "config.db.inventory.description",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleKey: "recipes",
        titleFallback: "Recipes",
        icon: "📜",
        description: "config.db.recipes.description",
      },
      {
        href: "/db/bestiary",
        type: "bestiary",
        titleKey: "bestiary",
        titleFallback: "Monsters",
        icon: "🐺",
        description: "config.db.bestiary.description",
      },
      {
        href: "/db/dungeons",
        type: "dungeons",
        titleKey: "dungeons",
        titleFallback: "Dungeons",
        icon: "🏛️",
        description: "config.db.dungeons.description",
      },
      {
        href: "/db/bound_stones",
        type: "bound_stones",
        titleKey: "bound_stones",
        titleFallback: "Bound Stones",
        icon: "🪨",
        description: "config.db.bound_stones.description",
      },
      {
        href: "/db/beacons_of_time",
        type: "beacons_of_time",
        titleKey: "beacons_of_time",
        titleFallback: "Beacons of Time",
        icon: "⏳",
        description: "config.db.beacons_of_time.description",
      },
      {
        href: "/db/vaults",
        type: "vaults",
        titleKey: "vaults",
        titleFallback: "Vaults",
        icon: "🔒",
        description: "config.db.vaults.description",
      },
    ],
    // Singular entry labels; the collectibles' are the map types' dict terms
    // (the game's own names, localized).
    typeLabels: {
      inventory: "config.db.typeLabels.inventory",
      recipes: "config.db.typeLabels.recipes",
      bestiary: "config.db.typeLabels.bestiary",
      dungeons: "Dungeon",
      bound_stones: "bound-stone",
      beacons_of_time: "beacon-of-time",
      vaults: "vault",
    },
  },
});
