import { resolveAppConfig } from "@repo/lib";

export const enshrouded = resolveAppConfig({
  name: "enshrouded",
  // Not ready for production — show an "In Development" placeholder on enshrouded.th.gl.
  // The real map/codex still renders on the local dev server for continued work.
  inDevelopment: true,
  // The game ships 15 languages; extraction emits a dict per THGL locale.
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "it",
    "ja",
    "ko",
    "pl",
    "pt-BR",
    "ru",
    "th",
    "tr",
    "uk",
    "zh-CN",
    "zh-TW",
  ],
  // Live-mode companion app — player position tracking via THGLApp (ECS reader).
  // appUrl enables the "In-Game App" CTA on the web page.
  appUrl: "https://www.th.gl/companion-app",
  // No manual "/maps/..." internalLink: the home page auto-generates a richer
  // map card (preview image + live location count) for each map.
  internalLinks: [],
  externalLinks: [],
  keywords: [
    "Enshrouded",
    "Embervale",
    "Shroud",
    "Flameborn",
    "Vaults",
    "Bosses",
    "NPCs",
    "Landmarks",
    "Resources",
    "Quests",
    "Keen Games",
  ],
  // Quest codex — the game's journal (166 quests) with objectives, recommended
  // level and resolved locations. Backed by data-forge `database.questlog.json`.
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search quests…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/questlog",
        type: "questlog",
        titleFallback: "Quests",
        icon: "📜",
        description:
          "Every quest and its objectives, with recommended level and map locations.",
      },
    ],
    typeLabels: {
      questlog: "Quest",
    },
  },
});
