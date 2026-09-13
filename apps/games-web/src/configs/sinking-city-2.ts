import { resolveAppConfig } from "@repo/lib";

export const sinkingCity2 = resolveAppConfig({
  name: "sinking-city-2",
  // Preview release: the map/codex is Elite-Supporter-gated (added to
  // PREVIEW_RELEASE_APPS in packages/lib/src/preview-release.ts); the marketing/home
  // page stays public. No longer a full "In Development" placeholder.
  // Locales the game ships (Game.locres) that the THGL UI also supports.
  supportedLocales: [
    "en",
    "de",
    "fr",
    "es",
    "it",
    "ja",
    "ko",
    "pt-BR",
    "pl",
    "tr",
    "uk",
    "cs",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: null,
  internalLinks: [
    {
      title: "Items & Codex",
      description:
        "Browse The Sinking City 2's weapons, consumables and quest objects — with icons and descriptions.",
      href: "/db/items",
      iconName: "Gift",
      linkText: "Open the Items database",
    },
    {
      title: "Lore",
      description:
        "Every lore document, note and letter you can find across flooded Arkham.",
      href: "/db/lore",
      iconName: "BookOpen",
      linkText: "Read the Lore",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: ["Lore", "Evidence", "Dream Essence", "Collectibles", "Arkham"],
  topFilters: ["lore", "evidence", "dream_essence"],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items & lore…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/items",
        type: "items",
        titleFallback: "Items",
        icon: "🧰",
        description: "Weapons, consumables, ammunition and quest objects.",
      },
      {
        href: "/db/lore",
        type: "lore",
        titleFallback: "Lore",
        icon: "📖",
        description: "Documents, notes and letters found across Arkham.",
      },
      {
        href: "/db/evidence",
        type: "evidence",
        titleFallback: "Evidence",
        icon: "🔍",
        description: "Clues and evidence uncovered during investigations.",
      },
      {
        href: "/db/cases",
        type: "cases",
        titleFallback: "Cases",
        icon: "🗂️",
        description: "Investigation cases and their conclusions.",
      },
    ],
    typeLabels: {
      items: "Items",
      lore: "Lore",
      evidence: "Evidence",
      cases: "Cases",
    },
  },
});
