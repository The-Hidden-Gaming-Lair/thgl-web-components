import { resolveAppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

// Inlined per-map preview URLs; the originals used getPreviewImageUrl()
// which would drag cbor-x into middleware via @repo/lib.
const preview = (mapId: string) =>
  `${DATA_FORGE_CDN_URL}/blue-protocol-star-resonance/map-tiles/${mapId}/preview.webp`;

export const blueProtocolStarResonance = resolveAppConfig({
  name: "blue-protocol-star-resonance",
  supportedLocales: ["en", "ja", "zh-CN", "zh-TW", "th"],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      title: "Asteria Plains Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Asteria Plains with our interactive maps.",
      href: "/maps/Asteria%20Plains",
      iconName: "Map",
      bgImage: preview("asteria_plains"),
      linkText: "Explore the Asteria Plains Map",
    },
    {
      title: "Asterleeds Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Asterleeds with our interactive maps.",
      href: "/maps/Asterleeds",
      iconName: "Map",
      bgImage: preview("asterleeds"),
      linkText: "Explore the Asterleeds Map",
    },
    {
      title: "Moonshadow Wilds Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Moonshadow Wilds with our interactive maps.",
      href: "/maps/Moonshadow%20Wilds",
      iconName: "Map",
      bgImage: preview("moonshadow_wilds"),
      linkText: "Explore the Moonshadow Wilds Map",
    },
    {
      title: "Bahamar Highlands Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Bahamar Highlands with our interactive maps.",
      href: "/maps/Bahamar%20Highlands",
      iconName: "Map",
      bgImage: preview("bahamar_highlands"),
      linkText: "Explore the Bahamar Highlands Map",
    },
    {
      title: "Bahamar Highlands (Deepreach) Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Bahamar Highlands Deepreach with our interactive maps.",
      href: "/maps/Bahamar%20Highlands%20(Deepreach)",
      iconName: "Map",
      bgImage: preview("bahamar_highlands_deepreach"),
      linkText: "Explore the Bahamar Highlands Deepreach Map",
    },
    {
      title: "Windhowl Canyon Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Windhowl Canyon with our interactive maps.",
      href: "/maps/Windhowl%20Canyon",
      iconName: "Map",
      bgImage: preview("windhowl_canyon"),
      linkText: "Explore the Windhowl Canyon Map",
    },
    {
      title: "Everfall Forest Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Everfall Forest with our interactive maps.",
      href: "/maps/Everfall%20Forest",
      iconName: "Map",
      bgImage: preview("everfall_forest"),
      linkText: "Explore the Everfall Forest Map",
    },
    {
      title: "Duskdye Woods Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Duskdye Woods with our interactive maps.",
      href: "/maps/Duskdye%20Woods",
      iconName: "Map",
      bgImage: preview("duskdye_woods"),
      linkText: "Explore the Duskdye Woods Map",
    },
    {
      title: "Underground District Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Underground District with our interactive maps.",
      href: "/maps/Underground%20District",
      iconName: "Map",
      bgImage: preview("underground_district"),
      linkText: "Explore the Underground District Map",
    },
    {
      title: "Stray Starway Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Stray Starway with our interactive maps.",
      href: "/maps/Stray%20Starway",
      iconName: "Map",
      bgImage: preview("stray_starway"),
      linkText: "Explore the Stray Starway Map",
    },
    {
      title: "Skimmer's Lair Map",
      description:
        "Navigate Blue Protocol: Star Resonance's Skimmer's Lair with our interactive maps.",
      href: "/maps/Skimmer's%20Lair",
      iconName: "Map",
      bgImage: preview("skimmer_s_lair"),
      linkText: "Explore the Skimmer's Lair Map",
    },
    {
      href: "/activities-tracker",
      title: "Activities Tracker",
      linkText: "Track Daily & Weekly Activities",
      bgImage: "/games/thgl-web/activity-tracker.webp",
      iconName: "SquareCheckBig",
    },
    {
      href: "/db/story",
      title: "Story Episodes",
      linkText: "Follow the Story Episodes",
      iconName: "BookOpen",
    },
    {
      href: "/db/reading-books",
      title: "Reading Books",
      linkText: "Explore all Reading Books",
      iconName: "BookOpen",
    },
    {
      href: "/db/dictionary",
      title: "Lore Dictionary",
      linkText: "Browse the Lore Dictionary",
      iconName: "BookOpen",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: ["BPSR", "Bosses", "Guides", "Maps", "Rare Spawns", "Engram Hubs"],
  topFilters: ["monster_ignisor", "camera_point", "wind_barrier"],
  db: {
    heroSubtitle: "Lore Codex",
    searchPlaceholder: "Search dictionary, books, story...",
    homeSections: [
      {
        href: "/db/dictionary",
        type: "dictionary",
        typePrefix: "dictionary_",
        icon: "📚",
        titleFallback: "Lore Dictionary",
        description:
          "In-world encyclopedia entries — historical events, settings, concepts and circumstances from across the world.",
      },
      {
        href: "/db/reading-books",
        type: "reading_books",
        typePrefix: "reading_books_",
        icon: "📖",
        titleFallback: "Reading Books",
        description:
          "Collectible books, letters, notices and records you find throughout the game.",
      },
      {
        href: "/db/story",
        type: "story_episode",
        typePrefix: "story_episode_",
        icon: "✦",
        titleFallback: "Story Episodes",
        description: "The main story, episode by episode.",
      },
    ],
    typeLabels: {
      dictionary: "Dictionary",
      reading_books: "Book",
      story_episode: "Story",
    },
    typeColors: {
      dictionary: "bg-cyan-900/40 text-cyan-400",
      reading_books: "bg-amber-900/40 text-amber-400",
      story_episode: "bg-indigo-900/40 text-indigo-400",
    },
    languageCount: 5,
  },
});
