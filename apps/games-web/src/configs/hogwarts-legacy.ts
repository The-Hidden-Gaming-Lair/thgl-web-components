import { type AppConfig } from "@repo/lib";

// Maps are NOT listed here: the home page auto-generates a card per map in
// version.data.tiles. Locales = the languages the client ships (data-forge
// hogwarts-legacy/localization.ts; Arabic is not mined yet).
export const hogwartsLegacy: AppConfig = {
  name: "hogwarts-legacy",
  title: "Hogwarts Legacy",
  domain: "hogwarts",
  supportedLocales: [
    "en",
    "de",
    "es",
    "es-MX",
    "fr",
    "it",
    "ja",
    "ko",
    "pl",
    "pt-BR",
    "ru",
    "zh-CN",
    "zh-TW",
  ],
  // The Hogwarts Legacy Overwolf app was deprecated; the game is now supported
  // via the THGL Companion App (same as Avowed). The old Overwolf URL 404s.
  appUrl: "https://www.th.gl/companion-app",
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 15000,
      zDistance: 350,
    },
  },
  internalLinks: [
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
  ],
  keywords: ["Accio Page", "Field Guide Pages", "Collections"],
  db: {
    // Collection checklists: the Field Guide's Collections and the map's
    // collectibles (one codex entry per marker).
    checklists: [
      { section: "field_guide" },
      { section: "merlin_trials" },
      { section: "demiguise_statues" },
      { section: "astronomy_tables" },
      { section: "ancient_magic_hotspots" },
      { section: "treasure_vaults" },
      { section: "balloon_challenges" },
      { section: "landing_platforms" },
      { section: "beasts" },
      { section: "enemies" },
      { section: "brooms" },
      { section: "wand_handles" },
      { section: "traits" },
      { section: "conjurations" },
      { section: "challenges", descriptions: true },
    ],
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search spells, gear, beasts, quests…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/spells",
        type: "spells",
        titleKey: "spells",
        titleFallback: "Spells",
        icon: "🪄",
        description:
          "Every spell with cooldown and range, the talents that upgrade it and where it is needed.",
      },
      {
        href: "/db/talents",
        type: "talents",
        titleKey: "talents",
        titleFallback: "Talents",
        icon: "⭐",
        description:
          "All talents by tree with the level they unlock at and the spell or potion they upgrade.",
      },
      {
        href: "/db/gear",
        type: "gear",
        titleKey: "gear",
        titleFallback: "Gear",
        icon: "🧥",
        description:
          "Every robe, hat, mask, scarf and glove with its rarities, value and the quest or challenge that gives it.",
      },
      {
        href: "/db/traits",
        type: "traits",
        titleKey: "traits",
        titleFallback: "Traits",
        icon: "🧵",
        description:
          "Gear traits for the Enchanted Loom with the beast materials they need.",
      },
      {
        href: "/db/potions",
        type: "potions",
        titleKey: "potions",
        titleFallback: "Potions",
        icon: "🧪",
        description: "Potion recipes with ingredients and brewing time.",
      },
      {
        href: "/db/plants",
        type: "plants",
        titleKey: "plants",
        titleFallback: "Plants",
        icon: "🌱",
        description:
          "Plants for the Room of Requirement with growth time, pot size and yield.",
      },
      {
        href: "/db/ingredients",
        type: "ingredients",
        titleKey: "ingredients",
        titleFallback: "Ingredients",
        icon: "🍄",
        description:
          "Ingredients and beast products: what drops them and which potions and traits use them.",
      },
      {
        href: "/db/beasts",
        type: "beasts",
        titleKey: "beasts",
        titleFallback: "Beasts",
        icon: "🦄",
        description:
          "Rescuable beasts with their products and every beast den on the map.",
      },
      {
        href: "/db/enemies",
        type: "enemies",
        titleKey: "enemies",
        titleFallback: "Enemies",
        icon: "🕷️",
        description:
          "Enemies and infamous foes with their combat traits, dungeons and map locations.",
      },
      {
        href: "/db/dungeons",
        type: "dungeons",
        titleKey: "dungeons",
        titleFallback: "Dungeons",
        icon: "🏰",
        description:
          "Caves, castles and mines with the spells you need, the enemies inside and their resources.",
      },
      {
        href: "/db/quests",
        type: "quests",
        titleKey: "quests",
        titleFallback: "Quests",
        icon: "📜",
        description:
          "Main, side and relationship quests and assignments with rewards and where they start.",
      },
      {
        href: "/db/challenges",
        type: "challenges",
        titleKey: "challenges",
        titleFallback: "Challenges",
        icon: "🏆",
        description: "Field Guide challenges with every tier and its reward.",
      },
      {
        href: "/db/field_guide",
        type: "field_guide",
        titleKey: "field_guide",
        titleFallback: "Revelio Pages",
        icon: "📖",
        description:
          "All 150 Field Guide pages of Hogwarts, Hogsmeade and the Highlands with their spot on the map.",
      },
      {
        href: "/db/conjurations",
        type: "conjurations",
        titleKey: "conjurations",
        titleFallback: "Conjurations",
        icon: "🪑",
        description:
          "Room of Requirement conjurations: price and where to get each spellcraft.",
      },
      {
        href: "/db/brooms",
        type: "brooms",
        titleKey: "brooms",
        titleFallback: "Brooms",
        icon: "🧹",
        description: "Every broom with its price and where to get it.",
      },
      {
        href: "/db/wand_handles",
        type: "wand_handles",
        titleKey: "wand_handles",
        titleFallback: "Wand Handles",
        icon: "✨",
        description: "Wand handles from collection chests and quests.",
      },
      {
        href: "/db/merlin_trials",
        type: "merlin_trials",
        titleKey: "merlin_trials",
        titleFallback: "Merlin Trials",
        icon: "🗿",
        description: "All 95 Merlin Trials on the map.",
      },
      {
        href: "/db/demiguise_statues",
        type: "demiguise_statues",
        titleKey: "demiguise_statues",
        titleFallback: "Demiguise Statues",
        icon: "🌙",
        description: "Every Demiguise Statue and its moon.",
      },
      {
        href: "/db/astronomy_tables",
        type: "astronomy_tables",
        titleKey: "astronomy_tables",
        titleFallback: "Astronomy Tables",
        icon: "🔭",
        description: "Every Astronomy Table on the map.",
      },
      {
        href: "/db/ancient_magic_hotspots",
        type: "ancient_magic_hotspots",
        titleKey: "ancient_magic_hotspots",
        titleFallback: "Ancient Magic Hotspots",
        icon: "💫",
        description: "Every Ancient Magic Hotspot on the map.",
      },
      {
        href: "/db/treasure_vaults",
        type: "treasure_vaults",
        titleKey: "treasure_vaults",
        titleFallback: "Treasure Vaults",
        icon: "💰",
        description: "Every Treasure Vault on the map.",
      },
      {
        href: "/db/balloon_challenges",
        type: "balloon_challenges",
        titleKey: "balloon_challenges",
        titleFallback: "Balloon Sets",
        icon: "🎈",
        description: "Every set of balloons to pop on your broom.",
      },
      {
        href: "/db/landing_platforms",
        type: "landing_platforms",
        titleKey: "landing_platforms",
        titleFallback: "Landing Platforms",
        icon: "🛬",
        description: "Every broom Landing Platform on the map.",
      },
    ],
  },
};
