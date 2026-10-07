import { resolveAppConfig } from "@repo/lib";

export const whereWindsMeet = resolveAppConfig({
  name: "where-winds-meet",
  domain: "wherewindsmeet",
  // Public since 2026-09-28 (map, codex and companion). Elite-gated preview release
  // (`PREVIEW_RELEASE_APPS`) 2026-09-13..28; before that `inDevelopment`, a "Coming
  // Soon" placeholder, until the companion detector got real offsets.
  // The twelve the game itself ships, all of which packages/ui has a global
  // dictionary for. Must stay in step with the dicts the extractor emits.
  supportedLocales: [
    "en",
    "de",
    "fr",
    "es",
    "ja",
    "ko",
    "ru",
    "pt-BR",
    "th",
    "vi",
    "zh-Hans",
    "zh-Hant",
  ],
  // Gates the web "In-Game App" CTA — the companion block in games.ts alone
  // does NOT surface it.
  appUrl: "https://www.th.gl/companion-app",
  // No hand-written /maps/... entries: the home page auto-generates a richer
  // preview card per map from this tenant config, and an internalLink SHADOWS
  // it. (The previous entries also included a "Hidden Mountain Map" link, which
  // became a dead route when that map was merged into Hexi — the game treats
  // both clusters as one 河西大地图.) internalLinks is for guides and tools.
  internalLinks: [
    {
      title: "checklist.navTitle",
      description: "checklist.navDescription",
      href: "/checklist",
      iconName: "SquareCheckBig",
      linkText: "checklist.navLinkText",
    },
    {
      href: "/activities-tracker",
      title: "activities.navTitle",
      description: "activities.navDescription",
      linkText: "activities.navLinkText",
      iconName: "Activity",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "Treasure Chests",
    "Boundary Stones",
    "Cats",
    "Gathering",
    "Wildlife",
  ],
  topFilters: ["chest_g4", "chest_g3", "boundary_stone"],
  // Sections come from data-mining/src/where-winds-meet/components.database.ts —
  // `type` must match the `database.<type>.json` slug exactly. `inventory` and
  // `wardrobe` are deliberately not `items`/`outfits`: those are static
  // /db/<slug> routes owned by other games and would 404 here.
  db: {
    // Collection checklists (/checklist, /checklist/<section>).
    checklists: [
      { section: "achievements", descriptions: true },
      { section: "lore" },
      { section: "wardrobe" },
      { section: "titles", descriptions: true },
      { section: "fish" },
    ],
    heroSubtitle: "config.db.heroSubtitle",
    searchPlaceholder: "config.db.searchPlaceholder",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleKey: "config.db.inventory.title",
        titleFallback: "Items",
        icon: "🎒",
        description: "config.db.inventory.description",
      },
      {
        href: "/db/gear",
        type: "gear",
        titleKey: "config.db.gear.title",
        titleFallback: "Equipment",
        icon: "⚔️",
        description: "config.db.gear.description",
      },
      {
        href: "/db/chronicle",
        type: "chronicle",
        titleKey: "config.db.chronicle.title",
        titleFallback: "Chronicle",
        icon: "📖",
        description: "config.db.chronicle.description",
      },
      {
        href: "/db/lore",
        type: "lore",
        titleKey: "config.db.lore.title",
        titleFallback: "Jianghu Lore",
        icon: "📜",
        description: "config.db.lore.description",
      },
      {
        href: "/db/abilities",
        type: "abilities",
        titleKey: "config.db.abilities.title",
        titleFallback: "Skills",
        icon: "✨",
        description: "config.db.abilities.description",
      },
      {
        href: "/db/inner-ways",
        type: "inner-ways",
        titleKey: "config.db.inner-ways.title",
        titleFallback: "Inner Ways",
        icon: "☯️",
        description: "config.db.inner-ways.description",
      },
      {
        href: "/db/wardrobe",
        type: "wardrobe",
        titleKey: "config.db.wardrobe.title",
        titleFallback: "Outfits",
        icon: "👘",
        description: "config.db.wardrobe.description",
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
        href: "/db/titles",
        type: "titles",
        titleKey: "config.db.titles.title",
        titleFallback: "Titles",
        icon: "🎖️",
        description: "config.db.titles.description",
      },
      {
        href: "/db/books",
        type: "books",
        titleKey: "config.db.books.title",
        titleFallback: "Books",
        icon: "📕",
        description: "config.db.books.description",
      },
      {
        href: "/db/fish",
        type: "fish",
        titleKey: "config.db.fish.title",
        titleFallback: "Fish",
        icon: "🐟",
        description: "config.db.fish.description",
      },
    ],
    typeLabels: {
      inventory: "config.db.typeLabels.inventory",
      gear: "config.db.typeLabels.gear",
      chronicle: "config.db.typeLabels.chronicle",
      lore: "config.db.typeLabels.lore",
      abilities: "config.db.typeLabels.abilities",
      "inner-ways": "config.db.typeLabels.inner-ways",
      wardrobe: "config.db.typeLabels.wardrobe",
      achievements: "config.db.typeLabels.achievements",
      titles: "config.db.typeLabels.titles",
      books: "config.db.typeLabels.books",
      fish: "config.db.typeLabels.fish",
    },
  },
});
