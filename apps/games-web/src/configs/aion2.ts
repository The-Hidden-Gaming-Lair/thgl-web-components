import { resolveAppConfig } from "@repo/lib";

export const aion2 = resolveAppConfig({
  name: "aion2",
  // The client ships eight text languages (L10N/Text/<culture>/L10NString).
  supportedLocales: ["en", "de", "es", "fr", "ja", "ko", "pt-BR", "ru"],
  // Companion app: local player position plus live gathering nodes, monsters and Hidden Cubes
  // on the faction overworld maps only (Mixed game: nothing live in the Abyss, dungeons,
  // battlefields or arenas, never other players), and collected Empyrean Traces marked
  // discovered (characterData.collectedNodeIds). The detector enforces it, see data-forge
  // docs\FAIR_PLAY_RULES.md.
  appUrl: "https://www.th.gl/companion-app",
  // Partner link (gaming.tools server status) — keep it next to our own /db.
  externalLinks: [
    {
      href: "https://aion2.gaming.tools/server-status",
      title: "Server Status",
    },
  ],
  // No internalLinks for maps: the home page auto-generates map cards from the tiles.
  internalLinks: [
    {
      title: "Items",
      description:
        "Every weapon, armor piece, accessory, consumable and material in AION 2, with stats and where to get them.",
      href: "/db/inventory",
      iconName: "Axe",
      linkText: "Browse Items",
    },
    {
      title: "Bestiary",
      description:
        "Every monster in Atreia and the Abyss with level, type, drops and spawn locations.",
      href: "/db/bestiary",
      iconName: "Bug",
      linkText: "Browse the Bestiary",
    },
  ],
  promoLinks: [],
  keywords: [
    "Kibelisk",
    "Empyrean Trace",
    "Hidden Cube",
    "Sealed Dungeon",
    "Stronghold",
    "Field Boss",
    "Odyle",
    "Gathering",
    "Monsters",
    "Verteron",
    "Altgard",
    "Reshanta",
  ],
  topFilters: ["kibelisk", "empyrean_trace", "hidden_cube"],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search the database…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "🎒",
        description:
          "Weapons, armor, accessories, consumables and materials with stats, drops and recipes.",
      },
      {
        href: "/db/bestiary",
        type: "bestiary",
        titleFallback: "Bestiary",
        icon: "🐉",
        description:
          "Every monster with level, creature type, drops and spawn locations.",
      },
      {
        href: "/db/quests",
        type: "quests",
        titleFallback: "Quests",
        icon: "📜",
        description:
          "Episode, regional, duty and exploration quests with rewards and where they start.",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleFallback: "Recipes",
        icon: "⚒️",
        description:
          "Crafting recipes with their materials and crafting station.",
      },
      {
        href: "/db/gatherables",
        type: "gatherables",
        titleFallback: "Gathering",
        icon: "🌿",
        description: "Gathering nodes, what they yield and where to find them.",
      },
      {
        href: "/db/skills",
        type: "skills",
        titleFallback: "Skills",
        icon: "✨",
        description: "Class skills for every class.",
      },
      {
        href: "/db/titles",
        type: "titles",
        titleFallback: "Titles",
        icon: "🏅",
        description: "Every title with its equipped and owned effects.",
      },
      {
        href: "/db/achievements",
        type: "achievements",
        titleFallback: "Achievements",
        icon: "🏆",
        description:
          "Every achievement tier with its objective and rewards, by journal category.",
      },
      {
        href: "/db/daevanion",
        type: "daevanion",
        titleFallback: "Daevanion",
        icon: "🌟",
        description:
          "Daevanion boards for every class with each node's stat or skill bonus and cost.",
      },
      {
        href: "/db/pets",
        type: "pets",
        titleFallback: "Pets",
        icon: "🐾",
        description: "Pets and mounts you can collect.",
      },
      {
        href: "/db/wings",
        type: "wings",
        titleFallback: "Wings",
        icon: "🪽",
        description: "Wings with their equipped stats.",
      },
    ],
  },
});
