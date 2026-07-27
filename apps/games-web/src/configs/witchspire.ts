import { resolveAppConfig } from "@repo/lib";

export const witchspire = resolveAppConfig({
  name: "witchspire",
  // Only `en` — the data pipeline emits no other dicts for Witchspire yet (the
  // extractor doesn't pull Localization/*.locres). Advertising more locales
  // produced hreflang alternates + locale-switcher entries whose dict fetches
  // 404'd on the CDN. Re-add locales once dicts/<locale>.json actually ship.
  supportedLocales: ["en"],
  appUrl: "https://www.th.gl/companion-app",
  // No manual "/maps/..." internalLink: the home page auto-generates a richer
  // map card (preview image + live location count) per map, and that auto-card
  // is suppressed when an internalLink already targets the same /maps/<name>.
  internalLinks: [
    {
      title: "Items",
      description:
        "Browse every Witchspire item by category — wands, potions, food, tools, rings and resources — with rarity, descriptions and crafting recipes.",
      href: "/db/inventory",
      iconName: "Gift",
      linkText: "Open the Items database",
    },
    {
      title: "Recipes",
      description:
        "Every crafting recipe in Witchspire, grouped by station — ingredients, amounts and refine time, cross-linked to each item.",
      href: "/db/recipes",
      iconName: "BookOpen",
      linkText: "Browse Recipes",
    },
    {
      title: "Familiars",
      description:
        "Every catchable familiar in Witchspire, with portraits — the creatures you bond with and grow.",
      href: "/db/familiars",
      iconName: "Bug",
      linkText: "Browse Familiars",
    },
    {
      title: "Enemies",
      description:
        "Froblins, Ancients and bosses you'll face across the Flying Islands.",
      href: "/db/enemies",
      iconName: "Axe",
      linkText: "Browse Enemies",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "Familiars",
    "Resource Nodes",
    "Treasure Chests",
    "Dungeon Portals",
    "Flight Pillars",
  ],
  topFilters: [
    "dungeon_portal",
    "flight_pillar",
    "chest_basic",
    "mineral_copper",
  ],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "🧪",
        description: "Resources, equipment, wands, amulets and consumables.",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleFallback: "Recipes",
        icon: "📜",
        description: "Crafting recipes by station, with ingredients and time.",
      },
      {
        href: "/db/familiars",
        type: "familiars",
        titleFallback: "Familiars",
        icon: "🐾",
        description: "Catchable creatures you bond with and grow.",
      },
      {
        href: "/db/enemies",
        type: "enemies",
        titleFallback: "Enemies",
        icon: "⚔️",
        description: "Froblins, Ancients and bosses across the islands.",
      },
    ],
    typeLabels: {
      inventory: "Items",
      recipes: "Recipe",
      familiars: "Familiars",
      enemies: "Enemies",
    },
  },
});
