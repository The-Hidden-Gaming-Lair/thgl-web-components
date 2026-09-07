import { resolveAppConfig } from "@repo/lib";

export const whereWindsMeet = resolveAppConfig({
  name: "where-winds-meet",
  domain: "wherewindsmeet",
  // Development only: production serves a "Coming Soon" placeholder (noindex) for
  // the WHOLE site, while the local dev server still renders the real map and
  // codex so work can continue. The map's Hexi tile art is still missing and the
  // companion detector has no offsets yet, so nothing here is ready for players.
  // Pair with `companion.inDevelopment` in packages/lib/src/games.ts — this flag
  // only covers the website.
  inDevelopment: true,
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
  internalLinks: [],
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
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items, skills, lore…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "🎒",
        description:
          "Every item in the game — materials, consumables, quest pieces and curios.",
      },
      {
        href: "/db/gear",
        type: "gear",
        titleFallback: "Equipment",
        icon: "⚔️",
        description: "Weapons and armour, with the tier each piece belongs to.",
      },
      {
        href: "/db/chronicle",
        type: "chronicle",
        titleFallback: "Chronicle",
        icon: "📖",
        description:
          "The in-game Chronicle: antiques, dishes, creatures, places and people you record as you explore.",
      },
      {
        href: "/db/lore",
        type: "lore",
        titleFallback: "Jianghu Lore",
        icon: "📜",
        description:
          "The tales, rumours and histories tied to each region of the world.",
      },
      {
        href: "/db/abilities",
        type: "abilities",
        titleFallback: "Skills",
        icon: "✨",
        description:
          "Passive skills and talents, and what each one actually does.",
      },
      {
        href: "/db/inner-ways",
        type: "inner-ways",
        titleFallback: "Inner Ways",
        icon: "☯️",
        description:
          "Xinfa — the inner arts that shape a build, and their effects.",
      },
      {
        href: "/db/wardrobe",
        type: "wardrobe",
        titleFallback: "Outfits",
        icon: "👘",
        description:
          "Cosmetic outfits and appearances, with the verse each ships with.",
      },
      {
        href: "/db/achievements",
        type: "achievements",
        titleFallback: "Achievements",
        icon: "🏆",
        description: "Every achievement and what it takes to earn it.",
      },
      {
        href: "/db/titles",
        type: "titles",
        titleFallback: "Titles",
        icon: "🎖️",
        description: "Titles you can wear, and how each one is unlocked.",
      },
      {
        href: "/db/books",
        type: "books",
        titleFallback: "Books",
        icon: "📕",
        description: "Readable books and letters found across the world.",
      },
      {
        href: "/db/fish",
        type: "fish",
        titleFallback: "Fish",
        icon: "🐟",
        description:
          "Fish you can catch, with the size range each species reaches.",
      },
    ],
    typeLabels: {
      inventory: "Items",
      gear: "Equipment",
      chronicle: "Chronicle",
      lore: "Jianghu Lore",
      abilities: "Skills",
      "inner-ways": "Inner Ways",
      wardrobe: "Outfits",
      achievements: "Achievements",
      titles: "Titles",
      books: "Books",
      fish: "Fish",
    },
  },
});
