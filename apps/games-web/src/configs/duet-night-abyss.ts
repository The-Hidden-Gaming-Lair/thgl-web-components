import { resolveAppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

// Inlined per-map preview URLs (avoid getPreviewImageUrl + cbor-x leak
// into middleware).
const preview = (mapId: string) =>
  `${DATA_FORGE_CDN_URL}/duet-night-abyss/map-tiles/${mapId}/preview.webp`;

// Locales = the six client languages (data-forge duet-night-abyss/localization.ts,
// TextMap_I18n).
export const duetNightAbyss = resolveAppConfig({
  name: "duet-night-abyss",
  supportedLocales: ["en", "fr", "ja", "ko", "zh-CN", "zh-TW"],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      title: "Bloomfield Station Map",
      description:
        "Navigate Duet Night Abyss's Bloomfield Station with our interactive maps.",
      href: "/maps/Bloomfield%20Station",
      iconName: "Map",
      bgImage: preview("Haiboliya_Chezhan_Main"),
      linkText: "Explore the Bloomfield Station Map",
    },
    {
      title: "Ironworks Map",
      description:
        "Navigate Duet Night Abyss's Ironworks with our interactive maps.",
      href: "/maps/Ironworks",
      iconName: "Map",
      bgImage: preview("Haiboliya_Chezhan_CZDX"),
      linkText: "Explore the Ironworks Map",
    },
    {
      title: "Haojing Map",
      description:
        "Navigate Duet Night Abyss's Haojing region with our interactive maps.",
      href: "/maps/Haojing",
      iconName: "Map",
      bgImage: preview("Huaxu_Haojing_Main"),
      linkText: "Explore the Haojing Map",
    },
    {
      title: "Mistwharf Map",
      description:
        "Navigate Duet Night Abyss's Mistwharf region with our interactive maps.",
      href: "/maps/Mistwharf",
      iconName: "Map",
      bgImage: preview("Huaxu_Yanjindu_Main"),
      linkText: "Explore the Mistwharf Map",
    },
    {
      title: "Zhuyin Altar Map",
      description:
        "Navigate Duet Night Abyss's Zhuyin Altar with our interactive maps.",
      href: "/maps/Zhuyin%20Altar",
      iconName: "Map",
      bgImage: preview("Huaxu_Yanjindu_Alt"),
      linkText: "Explore the Zhuyin Altar Map",
    },
    {
      title: "Purgatorio Island Map",
      description:
        "Navigate Duet Night Abyss's Purgatorio Island with our interactive maps.",
      href: "/maps/Purgatorio%20Island",
      iconName: "Map",
      bgImage: preview("Prologue"),
      linkText: "Explore the Purgatorio Island Map",
    },
    {
      title: "Lonza Fortress Map",
      description:
        "Navigate Duet Night Abyss's Lonza Fortress with our interactive maps.",
      href: "/maps/Lonza%20Fortress",
      iconName: "Map",
      bgImage: preview("EX01"),
      linkText: "Explore the Lonza Fortress Map",
    },
    {
      title: "Eastern District, Icelake Map",
      description:
        "Navigate Duet Night Abyss's Eastern District, Icelake with our interactive maps.",
      href: "/maps/Eastern%20District%2C%20Icelake",
      iconName: "Map",
      bgImage: preview("Chapter01"),
      linkText: "Explore the Eastern District, Icelake Map",
    },
    {
      title: "Glevum Pit Map",
      description:
        "Navigate Duet Night Abyss's Glevum Pit with our interactive maps.",
      href: "/maps/Glevum%20Pit",
      iconName: "Map",
      bgImage: preview("Chapter01_KK"),
      linkText: "Explore the Glevum Pit Map",
    },
    {
      title: "Icelake Sewers Map",
      description:
        "Navigate Duet Night Abyss's Icelake Sewers with our interactive maps.",
      href: "/maps/Icelake%20Sewers",
      iconName: "Map",
      bgImage: preview("Chapter01_Sew"),
      linkText: "Explore the Icelake Sewers Map",
    },
    {
      title: "Galea Theatre Map",
      description:
        "Navigate Duet Night Abyss's Galea Theatre with our interactive maps.",
      href: "/maps/Galea%20Theatre",
      iconName: "Map",
      bgImage: preview("Chapter01_Thea"),
      linkText: "Explore the Galea Theatre Map",
    },
    {
      href: "/activities-tracker",
      title: "activities.navTitle",
      description: "activities.navDescription",
      linkText: "activities.navLinkText",
      iconName: "Activity",
    },
    {
      href: "/db/quests",
      title: "Quests Database",
      linkText: "Browse All Quests",
      iconName: "BookOpen",
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
  keywords: ["DNA", "Geniemon", "Chests", "Collectibles", "Readables"],
  topFilters: ["geniemon_zisha"],
  db: {
    // Collection checklists: the map's collectibles and the game's own
    // collection logs (fish, Geniemon, achievements).
    checklists: [
      { section: "readables" },
      { section: "music" },
      { section: "fish" },
      { section: "geniemons", descriptions: false },
      { section: "achievements", descriptions: true },
    ],
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search characters, weapons, Demon Wedges, items…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/characters",
        type: "characters",
        titleKey: "characters",
        titleFallback: "Characters",
        icon: "🧑",
        description:
          "Every playable character with element, weapon mastery, base stats, skills and ascension materials.",
      },
      {
        href: "/db/weaponry",
        type: "weaponry",
        titleKey: "weaponry",
        titleFallback: "Weapons",
        icon: "⚔️",
        description:
          "Melee and ranged weapons with base stats, passive effect per refinement and ascension materials.",
      },
      {
        href: "/db/demon_wedges",
        type: "demon_wedges",
        titleKey: "demon_wedges",
        titleFallback: "Demon Wedges",
        icon: "🔷",
        description:
          "Every Demon Wedge with its effect at max level, tolerance, track and rarity variants.",
      },
      {
        href: "/db/geniemons",
        type: "geniemons",
        titleKey: "geniemons",
        titleFallback: "Geniemon",
        icon: "🐾",
        description: "Geniemon companions and where to find them on the map.",
      },
      {
        href: "/db/inventory",
        type: "inventory",
        titleKey: "inventory",
        titleFallback: "Items",
        icon: "🎒",
        description:
          "Materials, consumables and currencies with what they craft, ascend and where they come from.",
      },
      {
        href: "/db/forging",
        type: "forging",
        titleKey: "forging",
        titleFallback: "Forging",
        icon: "🔨",
        description:
          "Foundry recipes with ingredients, coin cost and forging time, cross-linked to each product.",
      },
      {
        href: "/db/enemies",
        type: "enemies",
        titleKey: "enemies",
        titleFallback: "Enemies",
        icon: "👹",
        description: "The enemy archive with base stats, element and drops.",
      },
      {
        href: "/db/fish",
        type: "fish",
        titleKey: "fish",
        titleFallback: "Fish",
        icon: "🐟",
        description:
          "Every fish with size, difficulty, sell value and fishing spots.",
      },
      {
        href: "/db/readables",
        type: "readables",
        titleKey: "readables",
        titleFallback: "Reading",
        icon: "📖",
        description:
          "Books, notes and treasure maps with their full text and map spots.",
      },
      {
        href: "/db/music",
        type: "music",
        titleKey: "music",
        titleFallback: "Sheet Music",
        icon: "🎼",
        description: "Every piece of sheet music and where to collect it.",
      },
      {
        href: "/db/accessories",
        type: "accessories",
        titleKey: "accessories",
        titleFallback: "Accessories",
        icon: "🎀",
        description:
          "Character accessories with how to get them and Foundry recipes.",
      },
      {
        href: "/db/encyclopedia",
        type: "encyclopedia",
        titleKey: "encyclopedia",
        titleFallback: "Encyclopedia",
        icon: "📚",
        description:
          "The in-game encyclopedia: factions, characters, customs and civilisation, with related entries.",
      },
      {
        href: "/db/achievements",
        type: "achievements",
        titleKey: "achievements",
        titleFallback: "Achievements",
        icon: "🏆",
        description: "Every achievement with its goal and rewards.",
      },
      {
        href: "/db/quests",
        // Quests live across one exact category (`mainquests`) plus three
        // `sidequests_*` subcategories — match the umbrella via prefix
        // and include `mainquests` explicitly.
        type: "mainquests",
        extraTypes: [
          "sidequests_character",
          "sidequests_story",
          "sidequests_world",
        ],
        icon: "📜",
        titleFallback: "Quests",
        description:
          "Main story and side quests with prerequisites and rewards.",
      },
    ],
    typeLabels: {
      characters: "Character",
      weaponry: "Weapon",
      demon_wedges: "Demon Wedge",
      geniemons: "Geniemon",
      inventory: "Item",
      forging: "Recipe",
      enemies: "Enemy",
      fish: "Fish",
      readables: "Readable",
      music: "Sheet Music",
      accessories: "Accessory",
      encyclopedia: "Encyclopedia",
      achievements: "Achievement",
      mainquests: "Main Quest",
      sidequests_character: "Character Quest",
      sidequests_story: "Story Quest",
      sidequests_world: "World Quest",
    },
    typeColors: {
      mainquests: "bg-amber-900/40 text-amber-400",
      sidequests_character: "bg-blue-900/40 text-blue-400",
      sidequests_story: "bg-purple-900/40 text-purple-400",
      sidequests_world: "bg-emerald-900/40 text-emerald-400",
    },
  },
});
