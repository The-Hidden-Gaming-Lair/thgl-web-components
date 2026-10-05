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
      description: "Navigate Soulframe's Midrath with our interactive maps.",
      href: "/maps/Midrath",
      iconName: "Map",
      // Inlined getPreviewImageUrl("soulframe", "Midrath", "2")
      bgImage: `${DATA_FORGE_CDN_URL}/soulframe/map-tiles/Midrath/preview.webp?v=2`,
      linkText: "Explore the Midrath Map",
    },
    {
      title: "Locations",
      description:
        "Every named place in Midrath, its World Trees, dungeons and enclaves, with lore and map positions.",
      href: "/db/landmarks",
      iconName: "MapPin",
      linkText: "Browse Locations",
    },
    {
      title: "Foes",
      description:
        "The Ode, Mendicants, corrupted creatures and bosses of Midrath — where they spawn and which dungeons they guard.",
      href: "/db/foes",
      iconName: "Axe",
      linkText: "Browse Foes",
    },
    {
      title: "Wildlife",
      description:
        "Midrath's animals and their rare Glimmering variants, with where to find them.",
      href: "/db/wildlife",
      iconName: "PawPrint",
      linkText: "Browse Wildlife",
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
    heroSubtitle: "Codex: locations, foes & wildlife",
    searchPlaceholder: "Search locations, foes, wildlife…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/landmarks",
        type: "landmarks",
        // Codex tab name in every locale (data-forge dict term).
        titleKey: "landmarks",
        titleFallback: "Locations",
        icon: "🗺️",
        description:
          "Named places of Midrath, World Trees, dungeons and enclaves.",
      },
      {
        href: "/db/foes",
        type: "foes",
        // Codex tab name in every locale (data-forge dict term).
        titleKey: "foes",
        titleFallback: "Foes",
        icon: "⚔️",
        description: "Ode, Mendicants, corrupted creatures and bosses.",
      },
      {
        href: "/db/wildlife",
        type: "wildlife",
        // Codex tab name in every locale (data-forge dict term).
        titleKey: "wildlife",
        titleFallback: "Wildlife",
        icon: "🦌",
        description: "Animals of Midrath and their Glimmering variants.",
      },
    ],
    // Singular (what ONE entry is) — singularize("Foes") would give "Fo".
    typeLabels: {
      landmarks: "Location",
      foes: "Foe",
      wildlife: "Animal",
    },
  },
});
