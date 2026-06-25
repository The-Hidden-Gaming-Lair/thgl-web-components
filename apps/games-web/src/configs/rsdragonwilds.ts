import { resolveAppConfig } from "@repo/lib";

export const rsdragonwilds = resolveAppConfig({
  name: "rsdragonwilds",
  // Production URL is dragonwilds.th.gl (NOT rsdragonwilds.th.gl)
  supportedLocales: ["en", "de", "es", "fr", "it", "ja", "ko", "pt", "zh-CN"],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      title: "Ashenfall Map",
      description:
        "Find resource nodes, ores, chests, dungeons and lodestones across Ashenfall with our interactive map.",
      href: "/maps/worldMap",
      iconName: "Map",
      linkText: "Explore the Map",
    },
    {
      title: "Items",
      description:
        "Browse every resource, consumable and component by category — with icons, descriptions and crafting recipes.",
      href: "/db/inventory",
      iconName: "Gift",
      linkText: "Open the Items database",
    },
    {
      title: "Equipment",
      description:
        "Weapons, armour and tools with combat stats — damage, slots and the skills they use.",
      href: "/db/equipment",
      iconName: "Axe",
      linkText: "Open the Equipment database",
    },
    {
      title: "Recipes",
      description:
        "Every crafting recipe by station, with ingredients cross-linked to each item.",
      href: "/db/recipes",
      iconName: "BookOpen",
      linkText: "Open the Recipes database",
    },
    {
      title: "Enemies",
      description: "Creatures and bosses you'll face across Ashenfall.",
      href: "/db/enemies",
      iconName: "Bug",
      linkText: "Open the Bestiary",
    },
  ],
  externalLinks: [],
  keywords: ["Chests", "Lore", "Quests", "Items", "Recipes", "Equipment"],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items, equipment, recipes…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "🎒",
        description: "Resources, consumables and components.",
      },
      {
        href: "/db/equipment",
        type: "equipment",
        titleFallback: "Equipment",
        icon: "⚔️",
        description: "Weapons, armour and tools with stats.",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleFallback: "Recipes",
        icon: "📜",
        description: "Crafting recipes by station, with ingredients.",
      },
      {
        href: "/db/enemies",
        type: "enemies",
        titleFallback: "Enemies",
        icon: "💀",
        description: "Creatures and bosses across Ashenfall.",
      },
    ],
    typeLabels: {
      inventory: "Items",
      equipment: "Equipment",
      recipes: "Recipe",
      enemies: "Enemies",
    },
  },
});
