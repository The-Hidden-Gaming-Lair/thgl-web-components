import { resolveAppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

// Inlined per-map preview URLs; the originals used getPreviewImageUrl()
// which would drag cbor-x into middleware via @repo/lib.
const preview = (mapId: string) =>
  `${DATA_FORGE_CDN_URL}/blue-protocol-star-resonance/map-tiles/${mapId}/preview.webp`;

export const blueProtocolStarResonance = resolveAppConfig({
  name: "blue-protocol-star-resonance",
  supportedLocales: ["en", "ja", "zh-CN", "zh-TW", "th"],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      title: "Asteria Plains Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Asteria Plains with our interactive maps.",
      href: "/maps/Asteria%20Plains",
      iconName: "Map",
      bgImage: preview("asteria_plains"),
      linkText: "Explore the Asteria Plains Map",
    },
    {
      title: "Asterleeds Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Asterleeds with our interactive maps.",
      href: "/maps/Asterleeds",
      iconName: "Map",
      bgImage: preview("asterleeds"),
      linkText: "Explore the Asterleeds Map",
    },
    {
      title: "Moonshadow Wilds Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Moonshadow Wilds with our interactive maps.",
      href: "/maps/Moonshadow%20Wilds",
      iconName: "Map",
      bgImage: preview("moonshadow_wilds"),
      linkText: "Explore the Moonshadow Wilds Map",
    },
    {
      title: "Bahamar Highlands Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Bahamar Highlands with our interactive maps.",
      href: "/maps/Bahamar%20Highlands",
      iconName: "Map",
      bgImage: preview("bahamar_highlands"),
      linkText: "Explore the Bahamar Highlands Map",
    },
    {
      title: "Bahamar Highlands (Deepreach) Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Bahamar Highlands Deepreach with our interactive maps.",
      href: "/maps/Bahamar%20Highlands%20(Deepreach)",
      iconName: "Map",
      bgImage: preview("bahamar_highlands_deepreach"),
      linkText: "Explore the Bahamar Highlands Deepreach Map",
    },
    {
      title: "Windhowl Canyon Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Windhowl Canyon with our interactive maps.",
      href: "/maps/Windhowl%20Canyon",
      iconName: "Map",
      bgImage: preview("windhowl_canyon"),
      linkText: "Explore the Windhowl Canyon Map",
    },
    {
      title: "Everfall Forest Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Everfall Forest with our interactive maps.",
      href: "/maps/Everfall%20Forest",
      iconName: "Map",
      bgImage: preview("everfall_forest"),
      linkText: "Explore the Everfall Forest Map",
    },
    {
      title: "Duskdye Woods Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Duskdye Woods with our interactive maps.",
      href: "/maps/Duskdye%20Woods",
      iconName: "Map",
      bgImage: preview("duskdye_woods"),
      linkText: "Explore the Duskdye Woods Map",
    },
    {
      title: "Underground District Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Underground District with our interactive maps.",
      href: "/maps/Underground%20District",
      iconName: "Map",
      bgImage: preview("underground_district"),
      linkText: "Explore the Underground District Map",
    },
    {
      title: "Stray Starway Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Stray Starway with our interactive maps.",
      href: "/maps/Stray%20Starway",
      iconName: "Map",
      bgImage: preview("stray_starway"),
      linkText: "Explore the Stray Starway Map",
    },
    {
      title: "Skimmer's Lair Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Skimmer's Lair with our interactive maps.",
      href: "/maps/Skimmer's%20Lair",
      iconName: "Map",
      bgImage: preview("skimmer_s_lair"),
      linkText: "Explore the Skimmer's Lair Map",
    },
    {
      href: "/activities-tracker",
      title: "activities.navTitle",
      description: "activities.navDescription",
      linkText: "activities.navLinkText",
      iconName: "Activity",
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
  promoLinks: [],
  externalLinks: [],
  keywords: ["BPSR", "Bosses", "Guides", "Maps", "Rare Spawns", "Engram Hubs"],
  topFilters: ["monster_ignisor", "camera_point", "wind_barrier"],
  db: {
    // Collection checklists (/checklist, /checklist/<section>): the game's own
    // collections - reading material, the fishing log, Monster Hunt, Battle
    // Imagines and mounts.
    checklists: [
      { section: "reading-books" },
      { section: "fish" },
      { section: "monsters" },
      { section: "imagines" },
      { section: "mounts" },
    ],
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items, gear, recipes, monsters…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleKey: "inventory",
        titleFallback: "Items",
        icon: "🎒",
        description:
          "Consumables, materials, gems and growth items with the recipes, shops, monsters and gathering spots behind them.",
      },
      {
        href: "/db/equipment",
        type: "equipment",
        titleKey: "equipment",
        titleFallback: "Gear",
        icon: "🛡️",
        description:
          "Weapons, armor and accessories with gear score, class, base attributes and where they drop or are crafted.",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleKey: "recipes",
        titleFallback: "Recipes",
        icon: "⚒️",
        description:
          "Life Skill recipes, gear forging and Battle Imagine crafting with ingredients, yield and Focus cost.",
      },
      {
        href: "/db/imagines",
        type: "imagines",
        titleKey: "imagines",
        titleFallback: "Battle Imagine",
        icon: "✨",
        description:
          "Every Battle Imagine with its skill, modifications and the monster it resonates with.",
      },
      {
        href: "/db/monsters",
        type: "monsters",
        titleKey: "monsters",
        titleFallback: "Monster Hunt",
        icon: "👹",
        description:
          "The Monster Hunt list: where each monster lives, its hunt rewards and every spot on the map.",
      },
      {
        href: "/db/dungeons",
        type: "dungeons",
        titleKey: "dungeons",
        titleFallback: "Dungeons",
        icon: "🏰",
        description:
          "Dungeons and raids with their modes, recommended ability score, party size and rewards.",
      },
      {
        href: "/db/gathering",
        type: "gathering",
        titleKey: "gathering",
        titleFallback: "Gathering",
        icon: "🌿",
        description:
          "Life Skill gathering nodes with their yields, Focus cost and every node on the map.",
      },
      {
        href: "/db/fish",
        type: "fish",
        titleKey: "fish",
        titleFallback: "Fish",
        icon: "🐟",
        description:
          "Fish and ocean finds with size, fishing spots, the bait that catches them and what they cook into.",
      },
      {
        href: "/db/mounts",
        type: "mounts",
        titleKey: "mounts",
        titleFallback: "Mounts",
        icon: "🐗",
        description: "Mount Imagines with their speed and skins.",
      },
      {
        href: "/db/furniture",
        type: "furniture",
        titleKey: "furniture",
        titleFallback: "Furniture",
        icon: "🪑",
        description:
          "Homestead furniture with the materials to craft it and the Homestead EXP it gives.",
      },
      {
        href: "/db/shops",
        type: "shops",
        titleKey: "shops",
        titleFallback: "Shops",
        icon: "🏪",
        description:
          "Exchange shops and what they sell, with the price in Luno, tokens or materials.",
      },
      {
        href: "/db/dictionary",
        type: "dictionary",
        titleKey: "dictionary",
        icon: "📚",
        titleFallback: "Lore Dictionary",
        description:
          "In-world encyclopedia entries — historical events, settings, concepts and circumstances from across the world.",
      },
      {
        href: "/db/reading-books",
        type: "reading-books",
        titleKey: "reading-books",
        icon: "📖",
        titleFallback: "Reading Books",
        description:
          "Collectible books, letters, notices and records you find throughout the game.",
      },
      {
        href: "/db/story",
        type: "story",
        titleKey: "story",
        icon: "✦",
        titleFallback: "Story Episodes",
        description: "The main story, episode by episode.",
      },
    ],
    typeColors: {
      dictionary: "bg-cyan-900/40 text-cyan-400",
      "reading-books": "bg-amber-900/40 text-amber-400",
      story: "bg-indigo-900/40 text-indigo-400",
    },
    languageCount: 5,
  },
});
