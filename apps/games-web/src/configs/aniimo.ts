import { resolveAppConfig } from "@repo/lib";

export const aniimo = resolveAppConfig({
  name: "aniimo",
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "id",
    "ja",
    "ko",
    "pt",
    "ru",
    "th",
    "vi",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      title: "Team Builder",
      description:
        "Build a team of four: element coverage of every skill, shared weaknesses, role balance, suggested picks, a counter finder for any element and the game's own recommended teams.",
      href: "/team-builder",
      iconName: "Users",
      linkText: "Open the Team Builder",
    },
    {
      href: "/activities-tracker",
      title: "activities.navTitle",
      description: "activities.navDescription",
      linkText: "activities.navLinkText",
      bgImage: "/games/thgl-web/activity-tracker.webp",
      iconName: "Activity",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "Aniimo Spawns",
    "Chests",
    "Lumin Amber",
    "Transporters",
    "Sanctums",
    "Alpha & Omega",
  ],
  topFilters: [
    "transporter",
    "sanctum",
    "alpha",
    "chest_advanced",
    "lumin_amber",
  ],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search Aniimo, skills, items, quests…",
    sectionsInNav: true,
    // One indexable /team-builder/<id> matchup page per Aniimo (sitemap + codex link).
    entryPages: [
      { type: "aniimo", path: "/team-builder", labelKey: "tb.entry.label" },
    ],
    homeSections: [
      {
        href: "/db/aniimo",
        type: "aniimo",
        titleFallback: "Aniimo",
        icon: "🐾",
        description:
          "Every Aniimo species with element, stage, traversal and base stats.",
      },
      {
        href: "/db/items",
        type: "items",
        titleFallback: "Items",
        icon: "🎒",
        description: "Items, materials and consumables by rarity.",
      },
      {
        href: "/db/skills",
        type: "skills",
        titleFallback: "Skills",
        icon: "✨",
        description:
          "Every Aniimo skill with element, power, EP cost and cooldown, linked from each species.",
      },
      {
        href: "/db/talents",
        type: "talents",
        titleFallback: "Talents",
        icon: "🧬",
        description: "Aniimo talents by rarity with their effects.",
      },
      {
        href: "/db/type_chart",
        type: "type_chart",
        titleFallback: "Type Chart",
        icon: "⚔️",
        description: "Damage multipliers between all nine elements.",
      },
      {
        href: "/db/roles",
        type: "roles",
        titleFallback: "Roles",
        icon: "🛡️",
        description:
          "The five combat roles and every Aniimo that fills each one.",
      },
      {
        href: "/db/shops",
        type: "shops",
        titleFallback: "Shops",
        icon: "🛒",
        description: "What every shop sells, with prices and currencies.",
      },
      {
        href: "/db/quests",
        type: "quests",
        titleFallback: "Quests",
        icon: "📜",
        description: "Main story quests by chapter with their regions.",
      },
      {
        href: "/db/badges",
        type: "badges",
        titleFallback: "Badges",
        icon: "🏅",
        description: "Pathfinder profile badges and how to earn them.",
      },
    ],
  },
});
