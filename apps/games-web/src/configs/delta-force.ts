import { resolveAppConfig } from "@repo/lib";

export const deltaForce = resolveAppConfig({
  name: "delta-force",
  // Marker names, container titles, extract names, region labels and the whole codex come
  // from the game's own locres exports in all 12 locales (data-forge dicts/*.json).
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "ja",
    "ko",
    "pt-BR",
    "ru",
    "th",
    "tr",
    "zh-CN",
    "zh-TW",
  ],
  appUrl: null,
  internalLinks: [
    {
      title: "Keycards",
      description:
        "Every keycard with the map and area of the room it opens, uses and guide price.",
      href: "/db/keycards",
      iconName: "ShieldCheck",
      linkText: "Browse Keycards",
    },
    {
      title: "Collectibles",
      description:
        "All sellable loot by category — weight, grid size, rarity and guide price.",
      href: "/db/collectibles",
      iconName: "Gift",
      linkText: "Browse Collectibles",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "Extraction Points",
    "Keycard Rooms",
    "Safes",
    "Loot Containers",
    "Keycards",
    "Collectibles",
  ],
  topFilters: ["extract", "keycard_room", "c_safe", "c_small_safe", "boss"],
  db: {
    heroSubtitle: "Keycards, collectibles, gear, weapons, attachments & ammo",
    searchPlaceholder: "Search items, keycards, ammo…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/keycards",
        type: "keycards",
        titleFallback: "Keycards",
        icon: "🔑",
        description: "Every keycard and the room it opens.",
      },
      {
        href: "/db/collectibles",
        type: "collectibles",
        titleFallback: "Collectibles",
        icon: "💎",
        description: "Sellable loot by category, with guide prices.",
      },
      {
        href: "/db/gear",
        type: "gear",
        titleFallback: "Gear",
        icon: "🪖",
        description: "Helmets, ballistic vests, chest rigs and backpacks.",
      },
      {
        href: "/db/weapons",
        type: "weapons",
        titleFallback: "Weapons",
        icon: "🔫",
        description: "Every base weapon by class.",
      },
      {
        href: "/db/attachments",
        type: "attachments",
        titleFallback: "Attachments",
        icon: "🔧",
        description: "Optics, muzzles, grips, mags and more.",
      },
      {
        href: "/db/ammo",
        type: "ammo",
        titleFallback: "Ammo",
        icon: "🧨",
        description: "Ammunition by caliber.",
      },
      {
        href: "/db/consumables",
        type: "consumables",
        titleFallback: "Consumables",
        icon: "💉",
        description: "Meds and repair kits.",
      },
      {
        href: "/db/operators",
        type: "operators",
        titleFallback: "Operators",
        icon: "🎖️",
        description: "Every operator by class, with their profile.",
      },
    ],
    typeLabels: {
      keycards: "Keycards",
      collectibles: "Collectibles",
      gear: "Gear",
      weapons: "Weapons",
      attachments: "Attachments",
      ammo: "Ammo",
      consumables: "Consumables",
      operators: "Operators",
    },
  },
});
