import { resolveAppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

const preview = (mapId: string) =>
  `${DATA_FORGE_CDN_URL}/diablo4/map-tiles/${mapId}/preview.webp`;

export const diablo4 = resolveAppConfig({
  name: "diablo4",
  supportedLocales: ["en"],
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Diablo_4_Map",
  withoutLiveMode: true,
  internalLinks: [
    {
      title: "Diablo IV Map",
      description:
        "Explore Diablo 4 Interactive Maps with real-time position tracking. Find Altars of Lilith, dungeons, bosses, events, and more.",
      href: "/maps/Sanctuary",
      iconName: "Map",
      linkText: "Explore the Map",
      bgImage: preview("Sanctuary"),
    },
    {
      title: "Aspects",
      description:
        "Browse all 600+ Legendary Aspects from the Codex of Power — filterable by class and type.",
      href: "/db/aspects",
      iconName: "BookOpen",
      linkText: "Browse Aspects",
    },
    {
      title: "Unique Items",
      description:
        "Every Unique item in Diablo IV with class restrictions, item type, and unique power descriptions.",
      href: "/db/uniques",
      iconName: "Gift",
      linkText: "Browse Unique Items",
    },
  ],
  externalLinks: [],
  keywords: ["Dungeons", "World Events", "Strongholds", "Nightmare Dungeons"],
  topFilters: [
    "altarsOfLilith",
    "tenetOfAkarat",
    "dungeons",
    "strongholds",
    "worldBossArenas",
    "waypoints",
    "cellars",
    "sideQuests",
  ],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search aspects, gems, runes…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/aspects",
        type: "aspects",
        titleFallback: "Aspects",
        icon: "📖",
        description:
          "Legendary Aspects from the Codex of Power, by class and type.",
      },
      {
        href: "/db/uniques",
        type: "uniques",
        titleFallback: "Unique Items",
        icon: "💎",
        description: "Every Unique item with class, slot, and unique power.",
      },
      {
        href: "/db/gems",
        type: "gems",
        titleFallback: "Gems",
        icon: "💠",
        description: "All gems by type and quality tier.",
      },
      {
        href: "/db/runes",
        type: "runes",
        titleFallback: "Runes",
        icon: "🔮",
        description: "Condition and Invocation runes with power values.",
      },
      {
        href: "/db/glyphs",
        type: "glyphs",
        titleFallback: "Paragon Glyphs",
        icon: "⭐",
        description: "Paragon Glyphs by attribute and bonus effect.",
      },
      {
        href: "/db/temper_manuals",
        type: "temper_manuals",
        titleFallback: "Temper Manuals",
        icon: "📜",
        description: "Tempering recipes by class and category.",
      },
      {
        href: "/db/seals",
        type: "seals",
        titleFallback: "Horadric Seals",
        icon: "🔰",
        description: "Horadric Seals by quality tier.",
      },
    ],
    typeLabels: {
      aspects: "Aspect",
      uniques: "Unique Item",
      gems: "Gem",
      runes: "Rune",
      glyphs: "Paragon Glyph",
      temper_manuals: "Temper Manual",
      seals: "Horadric Seal",
    },
  },
});
