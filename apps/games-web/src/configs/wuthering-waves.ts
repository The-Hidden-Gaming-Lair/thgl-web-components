import { resolveAppConfig } from "@repo/lib";

export const wutheringWaves = resolveAppConfig({
  name: "wuthering-waves",
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "ja",
    "ko",
    "pt",
    "th",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: "https://www.th.gl/companion-app",
  // Maps are NOT listed here: the home page auto-generates a card for each map
  // in version.data.tiles (Overworld, Lahai-Roi, Honami City, etc.).
  internalLinks: [
    {
      href: "/activities-tracker",
      title: "activities.navTitle",
      description: "activities.navDescription",
      linkText: "activities.navLinkText",
      iconName: "Activity",
    },
  ],
  externalLinks: [],
  keywords: [
    "Echoes",
    "Waveplate Activities",
    "Tidal Heritage",
    "Collectibles",
  ],
  topFilters: ["Treasure005", "branch3.0_693_Treasure_3_4"],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search resonators, weapons, echoes, items…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/resonators",
        type: "resonators",
        titleFallback: "Resonators",
        icon: "🧝",
        description: "Playable characters by element and rarity.",
      },
      {
        href: "/db/weapons",
        type: "weapons",
        titleFallback: "Weapons",
        icon: "⚔️",
        description: "Weapons by type and rarity.",
      },
      {
        href: "/db/echoes",
        type: "echoes",
        titleFallback: "Echoes",
        icon: "👁️",
        description: "Collectible echoes with cost, skills and sonata sets.",
      },
      {
        href: "/db/sonatas",
        type: "sonatas",
        titleFallback: "Sonatas",
        icon: "🎼",
        description: "Echo set bonuses and the echoes that grant them.",
      },
      {
        href: "/db/enemies",
        type: "enemies",
        titleFallback: "Enemies",
        icon: "💀",
        description: "Monsters and bosses across the world.",
      },
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "🎒",
        description: "Materials, consumables and resources.",
      },
    ],
    typeLabels: {
      resonators: "Resonators",
      weapons: "Weapons",
      echoes: "Echoes",
      sonatas: "Sonatas",
      enemies: "Enemies",
      inventory: "Items",
    },
  },
});
