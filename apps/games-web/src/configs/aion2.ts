import { resolveAppConfig } from "@repo/lib";

export const aion2 = resolveAppConfig({
  name: "aion2",
  // The client ships eight text languages (L10N/Text/<culture>/L10NString).
  supportedLocales: ["en", "de", "es", "fr", "ja", "ko", "pt-BR", "ru"],
  // Companion app: the own character's position on every map the web plots; live gathering
  // nodes and monsters on the six faction overworld maps only (Mixed game: nothing live in the
  // Abyss, dungeons, battlefields or arenas, never other players or Hidden Cubes); the own
  // character's collected Empyrean Traces, finished quests and cleared Strongholds marked
  // discovered per character (characterData.collectedNodeSets, @repo/lib game-reported-nodes.ts)
  // and open quests' objectives highlighted (characterData.focusNodeIds, live-focus.ts). The
  // detector enforces it, see data-forge docs\FAIR_PLAY_RULES.md (AION 2 row).
  appUrl: "https://www.th.gl/companion-app",
  // Partner link (gaming.tools server status) — keep it next to our own /db.
  externalLinks: [
    {
      href: "https://aion2.gaming.tools/server-status",
      title: "server_status",
    },
  ],
  // No internalLinks for maps: the home page auto-generates map cards from the tiles.
  internalLinks: [
    {
      title: "config.internalLinks.inventory.title",
      description: "config.internalLinks.inventory.description",
      href: "/db/inventory",
      iconName: "Axe",
      linkText: "config.internalLinks.inventory.linkText",
    },
    {
      title: "config.internalLinks.bestiary.title",
      description: "config.internalLinks.bestiary.description",
      href: "/db/bestiary",
      iconName: "Bug",
      linkText: "config.internalLinks.bestiary.linkText",
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
    heroSubtitle: "config.db.heroSubtitle",
    searchPlaceholder: "config.db.searchPlaceholder",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleKey: "config.internalLinks.inventory.title",
        titleFallback: "Items",
        icon: "🎒",
        description: "config.db.inventory.description",
      },
      {
        href: "/db/bestiary",
        type: "bestiary",
        titleKey: "config.internalLinks.bestiary.title",
        titleFallback: "Bestiary",
        icon: "🐉",
        description: "config.db.bestiary.description",
      },
      {
        href: "/db/quests",
        type: "quests",
        titleKey: "config.db.quests.title",
        titleFallback: "Quests",
        icon: "📜",
        description: "config.db.quests.description",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleKey: "config.db.recipes.title",
        titleFallback: "Recipes",
        icon: "⚒️",
        description: "config.db.recipes.description",
      },
      {
        href: "/db/gatherables",
        type: "gatherables",
        titleKey: "config.db.gatherables.title",
        titleFallback: "Gathering",
        icon: "🌿",
        description: "config.db.gatherables.description",
      },
      {
        href: "/db/skills",
        type: "skills",
        titleKey: "config.db.skills.title",
        titleFallback: "Skills",
        icon: "✨",
        description: "config.db.skills.description",
      },
      {
        href: "/db/titles",
        type: "titles",
        titleKey: "config.db.titles.title",
        titleFallback: "Titles",
        icon: "🏅",
        description: "config.db.titles.description",
      },
      {
        href: "/db/achievements",
        type: "achievements",
        titleKey: "config.db.achievements.title",
        titleFallback: "Achievements",
        icon: "🏆",
        description: "config.db.achievements.description",
      },
      {
        href: "/db/daevanion",
        type: "daevanion",
        titleKey: "config.db.daevanion.title",
        titleFallback: "Daevanion",
        icon: "🌟",
        description: "config.db.daevanion.description",
      },
      {
        href: "/db/pets",
        type: "pets",
        titleKey: "config.db.pets.title",
        titleFallback: "Pets",
        icon: "🐾",
        description: "config.db.pets.description",
      },
      {
        href: "/db/wings",
        type: "wings",
        titleKey: "config.db.wings.title",
        titleFallback: "Wings",
        icon: "🪽",
        description: "config.db.wings.description",
      },
    ],
  },
});
