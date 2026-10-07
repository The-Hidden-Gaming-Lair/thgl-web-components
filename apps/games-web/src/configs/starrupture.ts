import { resolveAppConfig } from "@repo/lib";

export const starrupture = resolveAppConfig({
  name: "starrupture",
  // 12 locales — the data pipeline emits dicts/<locale>.json for each of these
  // (verified against public/starrupture/dicts). Use the EXACT data-forge locale
  // codes (pt-BR, zh-Hans, zh-Hant), which are the dict filenames the frontend fetches.
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "ja",
    "ko",
    "pl",
    "pt-BR",
    "ru",
    "th",
    "zh-Hans",
    "zh-Hant",
  ],
  appUrl: "https://www.th.gl/companion-app",
  // No manual "/maps/..." internalLink — the home page auto-generates a richer
  // map card (preview + live location count) for the single map (Arcadia-7 /
  // ChimeraMain), and that auto-card is shadowed by a manual /maps link.
  // The DB section internalLinks below use display-name-safe /db/<slug> hrefs.
  internalLinks: [
    {
      title: "config.internalLinks.inventory.title",
      description: "config.internalLinks.inventory.description",
      href: "/db/inventory",
      iconName: "BookOpen",
      linkText: "config.internalLinks.inventory.linkText",
    },
    {
      title: "config.internalLinks.recipes.title",
      description: "config.internalLinks.recipes.description",
      href: "/db/recipes",
      iconName: "Axe",
      linkText: "config.internalLinks.recipes.linkText",
    },
    {
      title: "config.internalLinks.stations.title",
      description: "config.internalLinks.stations.description",
      href: "/db/stations",
      iconName: "Grid",
      linkText: "config.internalLinks.stations.linkText",
    },
    {
      title: "config.internalLinks.corporations.title",
      description: "config.internalLinks.corporations.description",
      href: "/db/corporations",
      iconName: "Bug",
      linkText: "config.internalLinks.corporations.linkText",
    },
    {
      title: "crafting.navTitle",
      description: "crafting.navDescription",
      href: "/crafting",
      iconName: "Hammer",
      linkText: "crafting.navLinkText",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "Resource Nodes",
    "Salvage & Loot",
    "Gatherables",
    "Points of Interest",
    "Collectibles",
  ],
  topFilters: ["res_titanium", "found_drone", "loc_monolith"],
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
        icon: "📦",
        description: "config.db.inventory.description",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleKey: "config.internalLinks.recipes.title",
        titleFallback: "Recipes",
        icon: "⚙️",
        description: "config.db.recipes.description",
      },
      {
        href: "/db/stations",
        type: "stations",
        titleKey: "config.internalLinks.stations.title",
        titleFallback: "Buildings",
        icon: "🏭",
        description: "config.db.stations.description",
      },
      {
        href: "/db/corporations",
        type: "corporations",
        titleKey: "config.internalLinks.corporations.title",
        titleFallback: "Corporations",
        icon: "🏢",
        description: "config.db.corporations.description",
      },
      {
        href: "/db/lems",
        type: "lems",
        titleKey: "config.db.lems.title",
        titleFallback: "LEMs",
        icon: "🔷",
        description: "config.db.lems.description",
      },
      // "aliens" + "lore" sections removed in game Update 2 (build 25052139):
      // DT_Encyclopedia dropped all non-building rows (placeholder codex deleted).
      // Re-add when the reworked codex ships (ENC_Fauna/ENC_Space icons are pre-staged).
      {
        href: "/db/audiologs",
        type: "audiologs",
        titleKey: "config.db.audiologs.title",
        titleFallback: "Audiologs",
        icon: "🎙️",
        description: "config.db.audiologs.description",
      },
      {
        href: "/db/datapads",
        type: "datapads",
        titleKey: "config.db.datapads.title",
        titleFallback: "Data Pads",
        icon: "💾",
        description: "config.db.datapads.description",
      },
    ],
    typeLabels: {
      inventory: "config.db.typeLabels.inventory",
      recipes: "config.db.typeLabels.recipes",
      stations: "config.db.typeLabels.stations",
      corporations: "config.db.typeLabels.corporations",
      lems: "config.db.typeLabels.lems",
      aliens: "config.db.typeLabels.aliens",
      audiologs: "config.db.typeLabels.audiologs",
      datapads: "config.db.typeLabels.datapads",
      lore: "config.db.typeLabels.lore",
    },
  },
});
