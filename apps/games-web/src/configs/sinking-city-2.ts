import { resolveAppConfig } from "@repo/lib";

export const sinkingCity2 = resolveAppConfig({
  name: "sinking-city-2",
  // Public since 2026-09-28 (map + codex). Was an Elite-gated preview release
  // (PREVIEW_RELEASE_APPS) before that, and an "In Development" placeholder earlier.
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
      title: "config.internalLinks.items.title",
      description: "config.internalLinks.items.description",
      href: "/db/items",
      iconName: "Gift",
      linkText: "config.internalLinks.items.linkText",
    },
    {
      title: "config.internalLinks.lore.title",
      description: "config.internalLinks.lore.description",
      href: "/db/lore",
      iconName: "BookOpen",
      linkText: "config.internalLinks.lore.linkText",
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
  keywords: ["Lore", "Evidence", "Dream Essence", "Collectibles", "Arkham"],
  topFilters: ["lore", "evidence", "dream_essence"],
  db: {
    // Collection checklists (/checklist, /checklist/<section>).
    checklists: [{ section: "lore" }],
    heroSubtitle: "config.db.heroSubtitle",
    searchPlaceholder: "config.db.searchPlaceholder",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/items",
        type: "items",
        titleKey: "config.db.items.title",
        titleFallback: "Items",
        icon: "🧰",
        description: "config.db.items.description",
      },
      {
        href: "/db/lore",
        type: "lore",
        titleKey: "config.internalLinks.lore.title",
        titleFallback: "Lore",
        icon: "📖",
        description: "config.db.lore.description",
      },
      {
        href: "/db/evidence",
        type: "evidence",
        titleKey: "config.db.evidence.title",
        titleFallback: "Evidence",
        icon: "🔍",
        description: "config.db.evidence.description",
      },
      {
        href: "/db/cases",
        type: "cases",
        titleKey: "config.db.cases.title",
        titleFallback: "Cases",
        icon: "🗂️",
        description: "config.db.cases.description",
      },
    ],
    typeLabels: {
      items: "config.db.typeLabels.items",
      lore: "config.db.typeLabels.lore",
      evidence: "config.db.typeLabels.evidence",
      cases: "config.db.typeLabels.cases",
    },
  },
});
