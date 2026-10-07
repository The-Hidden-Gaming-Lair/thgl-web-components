import { resolveAppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

export const soulframe = resolveAppConfig({
  name: "soulframe",
  // Every client language: data-forge decodes each locale's Languages.bin from
  // the game's own packages (data-mining\src\soulframe\languages.py).
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
  appUrl: null,
  internalLinks: [
    {
      title: "Midrath Map",
      description: "config.internalLinks.maps-Midrath.description",
      href: "/maps/Midrath",
      iconName: "Map",
      // Inlined getPreviewImageUrl("soulframe", "Midrath", "2")
      bgImage: `${DATA_FORGE_CDN_URL}/soulframe/map-tiles/Midrath/preview.webp?v=2`,
      linkText: "config.internalLinks.maps-Midrath.linkText",
    },
    {
      title: "config.internalLinks.landmarks.title",
      description: "config.internalLinks.landmarks.description",
      href: "/db/landmarks",
      iconName: "MapPin",
      linkText: "config.internalLinks.landmarks.linkText",
    },
    {
      title: "config.internalLinks.foes.title",
      description: "config.internalLinks.foes.description",
      href: "/db/foes",
      iconName: "Axe",
      linkText: "config.internalLinks.foes.linkText",
    },
    {
      title: "config.internalLinks.wildlife.title",
      description: "config.internalLinks.wildlife.description",
      href: "/db/wildlife",
      iconName: "PawPrint",
      linkText: "config.internalLinks.wildlife.linkText",
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
  keywords: ["World Trees", "Shrines", "Dungeons", "Foes", "Wildlife"],
  topFilters: ["shrine", "dungeon", "world_tree"],
  db: {
    // Collection checklists (/checklist, /checklist/<section>): the codex tabs
    // Orlick's journal fills as you discover places, foes and animals.
    checklists: [
      { section: "landmarks" },
      { section: "foes" },
      { section: "wildlife" },
    ],
    heroSubtitle: "config.db.heroSubtitle",
    searchPlaceholder: "config.db.searchPlaceholder",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/landmarks",
        type: "landmarks",
        // Codex tab name in every locale (data-forge dict term).
        titleKey: "landmarks",
        titleFallback: "Locations",
        icon: "🗺️",
        description: "config.db.landmarks.description",
      },
      {
        href: "/db/foes",
        type: "foes",
        // Codex tab name in every locale (data-forge dict term).
        titleKey: "foes",
        titleFallback: "Foes",
        icon: "⚔️",
        description: "config.db.foes.description",
      },
      {
        href: "/db/wildlife",
        type: "wildlife",
        // Codex tab name in every locale (data-forge dict term).
        titleKey: "wildlife",
        titleFallback: "Wildlife",
        icon: "🦌",
        description: "config.db.wildlife.description",
      },
    ],
    // Singular (what ONE entry is) — singularize("Foes") would give "Fo".
    typeLabels: {
      landmarks: "config.db.typeLabels.landmarks",
      foes: "config.db.typeLabels.foes",
      wildlife: "config.db.typeLabels.wildlife",
    },
  },
});
