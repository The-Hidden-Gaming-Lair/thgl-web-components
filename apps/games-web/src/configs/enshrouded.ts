import { resolveAppConfig } from "@repo/lib";

export const enshrouded = resolveAppConfig({
  name: "enshrouded",
  // Preview release: the site is live, but the map/db pages are Elite-gated (PreviewReleaseGuard →
  // PREVIEW_RELEASE_APPS) while support is finalized. (Was `inDevelopment` = full "Coming Soon".)
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
    heroSubtitle: "config.db.heroSubtitle",
    searchPlaceholder: "db.searchAll",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/questlog",
        type: "questlog",
        titleKey: "config.db.questlog.title",
        titleFallback: "Quests",
        icon: "📜",
        description: "config.db.questlog.description",
      },
      {
        href: "/db/items",
        type: "items",
        titleKey: "config.db.items.title",
        titleFallback: "Items",
        icon: "⚔️",
        description: "config.db.items.description",
      },
      {
        href: "/db/bestiary",
        type: "bestiary",
        titleKey: "config.db.bestiary.title",
        titleFallback: "Bestiary",
        icon: "🐾",
        description: "config.db.bestiary.description",
      },
    ],
    typeLabels: {
      questlog: "config.db.typeLabels.questlog",
      items: "config.db.typeLabels.items",
      bestiary: "config.db.typeLabels.bestiary",
    },
  },
});
