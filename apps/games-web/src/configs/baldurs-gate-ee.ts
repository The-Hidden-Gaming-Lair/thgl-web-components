import { resolveAppConfig } from "@repo/lib";

export const baldursGateEE = resolveAppConfig({
  name: "baldurs-gate-ee",
  // Every language the game ships a dialog.tlk for (data-forge emits all 15).
  supportedLocales: [
    "en",
    "cs",
    "de",
    "es",
    "fr",
    "hu",
    "it",
    "ja",
    "ko",
    "pl",
    "pt-BR",
    "ru",
    "tr",
    "uk",
    "zh-CN",
  ],
  appUrl: "https://www.th.gl/companion-app",
  // No manual "/maps/..." internalLinks — the home page auto-generates the map
  // cards from version.data.tiles. The links below point at the database.
  internalLinks: [
    {
      title: "Items",
      description:
        "Every weapon, armor, ring, potion and scroll in Baldur's Gate and Siege of Dragonspear — stats, where to find them and who sells them.",
      href: "/db/inventory",
      iconName: "Shield",
      linkText: "Browse Items",
    },
    {
      title: "Bestiary",
      description:
        "The creatures of the Sword Coast with HP, AC, THAC0, XP, saving throws and their loot.",
      href: "/db/bestiary",
      iconName: "Bug",
      linkText: "Browse the Bestiary",
    },
    {
      title: "Spells",
      description:
        "All wizard and priest spells by level and school, with the scrolls that teach them.",
      href: "/db/spells",
      iconName: "Sparkles",
      linkText: "Browse Spells",
    },
    {
      title: "Stores",
      description:
        "Every merchant, inn, tavern and temple — what they sell, at which price, and where.",
      href: "/db/stores",
      iconName: "MapPin",
      linkText: "Browse Stores",
    },
  ],
  externalLinks: [],
  keywords: [
    "Sword Coast",
    "Siege of Dragonspear",
    "Containers",
    "Traps",
    "Secret Doors",
    "Companions",
    "Merchants",
    "Area Exits",
  ],
  topFilters: [
    "exit",
    "container",
    "companion",
    "store",
    "trap",
    "secret_door",
  ],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items, spells, creatures, characters…",
    sectionsInNav: true,
    groupHeaderSections: ["characters"],
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "🗡️",
        description: "Weapons, armor, rings, potions, scrolls, wands and more.",
      },
      {
        href: "/db/spells",
        type: "spells",
        titleFallback: "Spells",
        icon: "✨",
        description: "Wizard and priest spells by level and school.",
      },
      {
        href: "/db/bestiary",
        type: "bestiary",
        titleFallback: "Bestiary",
        icon: "🐺",
        description: "Hostile creatures with stats, defenses and drops.",
      },
      {
        href: "/db/characters",
        type: "characters",
        titleFallback: "Characters",
        icon: "🧝",
        description: "Companions, merchants and named characters.",
      },
      {
        href: "/db/quests",
        type: "quests",
        titleFallback: "Quests",
        icon: "📜",
        description:
          "Every quest from the journal, with its steps, givers and areas.",
      },
      {
        href: "/db/stores",
        type: "stores",
        titleFallback: "Stores",
        icon: "🛒",
        description: "Shops, inns, taverns and temples with their stock.",
      },
    ],
    typeLabels: {
      inventory: "Item",
      spells: "Spell",
      bestiary: "Creature",
      characters: "Character",
      stores: "Store",
      quests: "Quest",
    },
  },
});
