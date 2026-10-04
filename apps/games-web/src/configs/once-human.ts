import { resolveAppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

// Inlined per-map preview URLs (getPreviewImageUrl would drag cbor-x
// into middleware via @repo/lib).
const preview = () =>
  `${DATA_FORGE_CDN_URL}/once-human/map-tiles/default/preview.webp`;

export const onceHuman = resolveAppConfig({
  name: "once-human",
  supportedLocales: ["en"],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      href: "/maps/Deviation%20Secure",
      title: "Deviation Secure Map",
      description: "Navigate Deviation Secure with our interactive maps.",
      iconName: "Map",
      bgImage: preview(),
      linkText: "Explore the Deviation Secure Map",
    },
    {
      href: "/maps/Manibus%20&%20Evolution's%20Call",
      title: "Manibus Evolution's Call Map",
      description:
        "Navigate Manibus Evolution's Call with our interactive maps.",
      iconName: "Map",
      bgImage: preview(),
      linkText: "Explore the Manibus Evolution's Call Map",
    },
    {
      href: "/maps/Prismverse's%20Clash",
      title: "Prismverse's Clash Map",
      description: "Navigate Prismverse's Clash with our interactive maps.",
      iconName: "Map",
      bgImage: preview(),
      linkText: "Explore the Prismverse's Clash Map",
    },
    {
      href: "/maps/The%20Way%20of%20Winter",
      title: "The Way of Winter Map",
      description: "Navigate The Way of Winter with our interactive maps.",
      iconName: "Map",
      bgImage: preview(),
      linkText: "Explore the The Way of Winter Map",
    },
    {
      href: "/maps/Endless%20Dream",
      title: "Endless Dream Map",
      description: "Navigate Endless Dream with our interactive maps.",
      iconName: "Map",
      bgImage: preview(),
      linkText: "Explore the Endless Dream Map",
    },
    {
      title: "crafting.navTitle",
      description: "crafting.navDescription",
      href: "/crafting",
      iconName: "Hammer",
      linkText: "crafting.navLinkText",
    },
    {
      title: "blueprints.navTitle",
      description: "blueprints.navDescription",
      href: "/blueprints",
      iconName: "Sparkles",
      linkText: "blueprints.navLinkText",
    },
    {
      href: "/db/blueprints",
      title: "Blueprints",
      description:
        "Every weapon and armor blueprint with its Starchrom cost per star, fragments to fuse and the gear it crafts.",
      iconName: "FileText",
      linkText: "Browse Blueprints",
    },
    {
      href: "/db/materials",
      title: "Materials",
      description:
        "Every crafting material - ores, ingots, parts, fuel - with its recipe, station and where it comes from.",
      iconName: "Gift",
      linkText: "Browse Materials",
    },
    {
      href: "/db/consumables",
      title: "Consumables",
      description:
        "Food, medicine, ammo, tactical items and feed with their recipes.",
      iconName: "ChefHat",
      linkText: "Browse Consumables",
    },
    {
      href: "/db/gear",
      title: "Gear",
      description:
        "Craftable weapons, armor and tools for every crafting tier with their material costs.",
      iconName: "Shield",
      linkText: "Browse Gear",
    },
    {
      href: "/db/facilities",
      title: "Facilities",
      description:
        "Workbenches, production facilities, furniture and Build Mode pieces with their material costs.",
      iconName: "House",
      linkText: "Browse Facilities",
    },
    {
      href: "/db/vehicles",
      title: "Vehicles",
      description: "Vehicle parts and vehicles with their recipes.",
      iconName: "Grid",
      linkText: "Browse Vehicles",
    },
    {
      href: "/db/alternate-recipes",
      title: "Alternate Recipes",
      description:
        "Second ways to make an item and the recipes that change in a specific scenario.",
      iconName: "ScrollText",
      linkText: "Browse Alternate Recipes",
    },
    {
      href: "/db/mod-locations",
      title: "Mod Locations",
      iconName: "ArrowUp",
      linkText: "View Mod Locations",
    },
    {
      href: "/db/deviant-locations",
      title: "Deviant Locations",
      iconName: "Bug",
      linkText: "View Deviant Locations",
    },
    {
      href: "/db/remnants",
      title: "Remnants",
      iconName: "NotepadText",
      linkText: "View Remnants",
    },
    {
      href: "/db/regional-records",
      title: "Regional Records",
      iconName: "NotepadText",
      linkText: "View Regional Records",
    },
    {
      href: "/db/echoes-of-stardust",
      title: "Echoes Of Stardust",
      iconName: "NotepadText",
      linkText: "View Echoes Of Stardust",
    },
    {
      href: "/db/weapons",
      title: "Weapons",
      iconName: "Axe",
      linkText: "View Weapons",
    },
  ],
  keywords: ["Ores", "Resources", "Riddles", "Deviants"],
  topFilters: [
    "mystical_crate",
    "landscape_viewpoint_camera",
    "hoard_loot_crate",
  ],
  db: {
    // One indexable /blueprints/<id> page per blueprint (sitemap + codex link).
    entryPages: [
      {
        type: "blueprints",
        path: "/blueprints",
        labelKey: "blueprints.dbLink",
      },
    ],
    heroSubtitle: "Codex & Compendium",
    searchPlaceholder: "Search items, recipes, remnants, weapons...",
    homeSections: [
      {
        href: "/db/materials",
        type: "materials",
        icon: "⛏",
        titleFallback: "Materials",
        description:
          "Ores, ingots, parts and fuel with recipes, stations and sources.",
      },
      {
        href: "/db/consumables",
        type: "consumables",
        icon: "🍲",
        titleFallback: "Consumables",
        description: "Food, medicine, ammo, tactical items and feed.",
      },
      {
        href: "/db/gear",
        type: "gear",
        icon: "🛡",
        titleFallback: "Gear",
        description: "Craftable weapons, armor and tools per crafting tier.",
      },
      {
        href: "/db/facilities",
        type: "facilities",
        icon: "🏗",
        titleFallback: "Facilities",
        description:
          "Workbenches, production facilities, furniture and Build Mode pieces.",
      },
      {
        href: "/db/vehicles",
        type: "vehicles",
        icon: "🚙",
        titleFallback: "Vehicles",
        description: "Vehicle parts and vehicles with their recipes.",
      },
      {
        href: "/db/blueprints",
        type: "blueprints",
        icon: "★",
        titleFallback: "Blueprints",
        description:
          "Weapon and armor blueprints with the Starchrom price of every star.",
      },
      {
        href: "/db/alternate-recipes",
        type: "alternate-recipes",
        icon: "📜",
        titleFallback: "Alternate Recipes",
        description: "Extra and scenario-specific recipes.",
      },
      {
        href: "/db/weapons",
        type: "weapon",
        icon: "⚔",
        titleFallback: "Weapons",
      },
      {
        href: "/db/remnants",
        type: "remnants",
        typePrefix: "remnants_",
        icon: "📓",
        titleFallback: "Remnants",
      },
      {
        href: "/db/regional-records",
        type: "regional_records",
        typePrefix: "regional_records_",
        icon: "🗺",
        titleFallback: "Regional Records",
      },
      {
        href: "/db/echoes-of-stardust",
        type: "echoes_of_stardust",
        typePrefix: "echoes_of_stardust_",
        icon: "✦",
        titleFallback: "Echoes of Stardust",
      },
    ],
    homeExtraLinks: [
      {
        href: "/db/mod-locations",
        title: "Mod Locations",
        description:
          "Comprehensive list of mod drop locations, item types, enemy types, and map regions.",
        icon: "⬆",
      },
      {
        href: "/db/deviant-locations",
        title: "Deviant Locations",
        description:
          "Where to find each Deviant, what type they are, and what they like.",
        icon: "🐛",
      },
    ],
    typeLabels: {
      materials: "Material",
      consumables: "Consumable",
      gear: "Gear",
      facilities: "Facility",
      vehicles: "Vehicle",
      "alternate-recipes": "Recipe",
      blueprints: "Blueprint",
      weapon: "Weapon",
      remnants: "Remnant",
      regional_records: "Record",
      echoes_of_stardust: "Echo",
    },
    typeColors: {
      materials: "bg-stone-800/60 text-stone-300",
      consumables: "bg-lime-900/40 text-lime-400",
      gear: "bg-sky-900/40 text-sky-400",
      facilities: "bg-amber-900/40 text-amber-400",
      vehicles: "bg-teal-900/40 text-teal-400",
      "alternate-recipes": "bg-violet-900/40 text-violet-400",
      blueprints: "bg-yellow-900/40 text-yellow-400",
      weapon: "bg-orange-900/40 text-orange-400",
      remnants: "bg-emerald-900/40 text-emerald-400",
      regional_records: "bg-cyan-900/40 text-cyan-400",
      echoes_of_stardust: "bg-indigo-900/40 text-indigo-400",
    },
    languageCount: 1,
  },
});
