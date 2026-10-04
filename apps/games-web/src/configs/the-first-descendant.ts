import { resolveAppConfig } from "@repo/lib";

export const theFirstDescendant = resolveAppConfig({
  name: "the-first-descendant",
  // The client ships twelve text languages (Data/DataCenter/LocalizedString M1String*Json).
  supportedLocales: [
    "en",
    "de",
    "fr",
    "es",
    "it",
    "pl",
    "pt-BR",
    "ru",
    "ja",
    "ko",
    "zh-CN",
    "zh-TW",
  ],
  // No companion app: online-only client with anti-cheat, so there is no live tracking.
  appUrl: null,
  // No internalLinks for maps: the home page auto-generates map cards from the tiles.
  internalLinks: [
    {
      title: "Amorphous Materials",
      description:
        "Every Amorphous Material Pattern with its rewards and drop chances, and where each Descendant and weapon part comes from.",
      href: "/db/amorphous",
      iconName: "Gift",
      linkText: "Browse Amorphous Materials",
    },
    {
      title: "Descendants",
      description:
        "All Descendants and Ultimate Descendants with abilities, base stats and the research materials to unlock them.",
      href: "/db/descendants",
      iconName: "Users",
      linkText: "Browse Descendants",
    },
    {
      title: "Weapons",
      description:
        "Every weapon with ATK, fire rate, magazine size, unique abilities and research recipe.",
      href: "/db/weapons",
      iconName: "Axe",
      linkText: "Browse Weapons",
    },
    {
      title: "crafting.navTitle",
      description: "crafting.navDescription",
      href: "/crafting",
      iconName: "Hammer",
      linkText: "crafting.navLinkText",
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
    "Encrypted Vault",
    "Void Fragment",
    "Void Fusion Reactor",
    "Battlefield Missions",
    "Calling of the Descendant",
    "Special Operations",
    "Camps",
    "Albion",
    "Kingston",
    "Sterile Land",
    "Vespers",
    "Echo Swamp",
    "Agna Desert",
    "White-night Gulch",
    "Hagios",
    "Fortress",
    "Axion Plains",
  ],
  topFilters: ["encrypted_vault", "void_fusion_reactor", "camp"],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search Descendants, weapons, modules…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/descendants",
        type: "descendants",
        titleFallback: "Descendants",
        icon: "🧬",
        description:
          "Descendants and Ultimate Descendants with abilities, stats and research materials.",
      },
      {
        href: "/db/abilities",
        type: "abilities",
        titleFallback: "Abilities",
        icon: "✨",
        description:
          "Every Descendant ability with cooldown, cost and description.",
      },
      {
        href: "/db/weapons",
        type: "weapons",
        titleFallback: "Weapons",
        icon: "🔫",
        description:
          "Weapons by class with ATK, fire rate, magazine, unique ability and research recipe.",
      },
      {
        href: "/db/modules",
        type: "modules",
        titleFallback: "Modules",
        icon: "🧩",
        description:
          "Descendant and weapon modules with socket, capacity and effects per enhancement level.",
      },
      {
        href: "/db/reactors",
        type: "reactors",
        titleFallback: "Reactors",
        icon: "⚛️",
        description:
          "Reactors by element and Arche type with skill power at max level.",
      },
      {
        href: "/db/components",
        type: "components",
        titleFallback: "External Components",
        icon: "🛡️",
        description: "External components by slot with stats and set bonuses.",
      },
      {
        href: "/db/amorphous",
        type: "amorphous",
        titleFallback: "Amorphous Materials & Loot",
        icon: "🎁",
        description:
          "Amorphous Material Patterns and loot boxes with every reward and its drop chance.",
      },
      {
        href: "/db/materials",
        type: "materials",
        titleFallback: "Materials & Consumables",
        icon: "⚗️",
        description:
          "Materials, blueprints and consumables — what they research and where they come from.",
      },
      {
        href: "/db/bosses",
        type: "bosses",
        titleFallback: "Bosses",
        icon: "💀",
        description:
          "Void Intercept Battle and field bosses with HP, defense and drops.",
      },
      {
        href: "/db/records",
        type: "records",
        titleFallback: "Records",
        icon: "📜",
        description:
          "Journals, Arche Echoes and documents with their full text.",
      },
      {
        href: "/db/arche-tuning",
        type: "arche-tuning",
        titleFallback: "Arche Tuning",
        icon: "🔷",
        description:
          "Arche Tuning board nodes with their stats and point cost.",
      },
      {
        href: "/db/reinforcements",
        type: "reinforcements",
        titleFallback: "Inversion Reinforcements",
        icon: "🔺",
        description:
          "Inversion Reinforcements with effects, durations and their sets.",
      },
      {
        href: "/db/skins",
        type: "skins",
        titleFallback: "Skins & Customization",
        icon: "🎨",
        description:
          "Descendant, weapon, fellow and vehicle skins and attachments.",
      },
      {
        href: "/db/fellows",
        type: "fellows",
        titleFallback: "Fellows",
        icon: "🐕",
        description:
          "Fellow companions with their abilities and research recipe.",
      },
      {
        href: "/db/vehicles",
        type: "vehicles",
        titleFallback: "Vehicles",
        icon: "🏍️",
        description: "Hover bikes and how to research them.",
      },
    ],
    typeLabels: {
      descendants: "Descendants",
      abilities: "Abilities",
      weapons: "Weapons",
      modules: "Modules",
      reactors: "Reactors",
      components: "External Components",
      amorphous: "Amorphous Materials & Loot",
      materials: "Materials & Consumables",
      bosses: "Bosses",
      records: "Records",
      "arche-tuning": "Arche Tuning",
      reinforcements: "Inversion Reinforcements",
      skins: "Skins & Customization",
      fellows: "Fellows",
      vehicles: "Vehicles",
    },
  },
});
