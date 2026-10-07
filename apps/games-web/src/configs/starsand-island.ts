import { resolveAppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

export const starsandIsland = resolveAppConfig({
  name: "starsand-island",
  supportedLocales: ["en", "ja", "zh-CN", "zh-TW"],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      title: "Starsand Island Map",
      description: "config.internalLinks.maps-Starsand%20Island.description",
      href: "/maps/Starsand%20Island",
      iconName: "Map",
      // Inlined getPreviewImageUrl("starsand-island", "StarSandIsland")
      bgImage: `${DATA_FORGE_CDN_URL}/starsand-island/map-tiles/StarSandIsland/preview.webp`,
      linkText: "config.internalLinks.maps-Starsand%20Island.linkText",
    },
    {
      title: "Moonlit Forest Map",
      description: "config.internalLinks.maps-Moonlit%20Forest.description",
      href: "/maps/Moonlit%20Forest",
      iconName: "Map",
      // Inlined getPreviewImageUrl("starsand-island", "MineCave_MainLand")
      bgImage: `${DATA_FORGE_CDN_URL}/starsand-island/map-tiles/MineCave_MainLand/preview.webp`,
      linkText: "config.internalLinks.maps-Moonlit%20Forest.linkText",
    },
    {
      title: "checklist.navTitle",
      description: "checklist.navDescription",
      href: "/checklist",
      iconName: "SquareCheckBig",
      linkText: "checklist.navLinkText",
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
    "Treasure Chests",
    "Campsites",
    "Gravecrystals",
    "Fishing Spots",
    "Shops",
    "Resources",
    "Moonlit Forest",
  ],
  topFilters: ["chest_island", "campsite", "elf_stone"],
  db: {
    // Collection checklists (/checklist, /checklist/<section>).
    checklists: [{ section: "codex" }],
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
        href: "/db/recipes",
        type: "recipes",
        titleKey: "config.db.recipes.title",
        titleFallback: "Recipes",
        icon: "🍳",
        description: "config.db.recipes.description",
      },
      {
        href: "/db/codex",
        type: "codex",
        titleKey: "config.db.codex.title",
        titleFallback: "Codex",
        icon: "📖",
        description: "config.db.codex.description",
      },
    ],
    typeLabels: {
      inventory: "config.db.typeLabels.inventory",
      recipes: "config.db.typeLabels.recipes",
      codex: "config.db.typeLabels.codex",
    },
  },
});
