import { resolveAppConfig } from "@repo/lib";

/**
 * The Blood of Dawnwalker — interactive map of Vale Sangora (one open world).
 * Subdomain: bloodofdawnwalker.th.gl (derived from games.ts `web`).
 *
 * THGLApp companion support (detector `bloodofdawnwalker_detector`) is built but not
 * yet in a public app release: `appUrl` (the "In-Game App" CTA) stays null until then.
 * Live mode stays enabled so the typeIDs map (`version.typesIdMap`) reaches the map
 * page for the Debug app / the future release.
 * No manual "/maps/..." internalLink — the home page auto-generates the richer
 * map card (preview + counts) for the single map.
 */
export const bloodOfDawnwalker = resolveAppConfig({
  name: "blood-of-dawnwalker",
  // English-only for the static release (decision 2026-09-12). data-forge already writes all 15
  // game locales (cs, de, es, es-MX, fr, hu, it, ja, ko, pl, pt-BR, tr, zh-CN, zh-TW) to
  // dicts/<locale>.json (map names + database) — add them here to enable them later.
  supportedLocales: ["en"],
  // No "In-Game App" CTA until a public THGLApp build ships the Dawnwalker detector
  // (companion block is inDevelopment in games.ts). Set to "https://www.th.gl/companion-app" then.
  appUrl: null,
  internalLinks: [],
  promoLinks: [],
  externalLinks: [],
  keywords: [
    "Shrines",
    "Destroyed Shrines",
    "Towers",
    "Bandit Camps",
    "Monster Lairs",
    "Ancient Circles",
    "Vendors",
    "Chests",
    "Hidden Caches",
    "Items",
    "Weapons",
    "Armour",
    "Recipes",
    "Bestiary",
    "Glossary",
    "Readables",
    "Vendors",
  ],
  topFilters: ["shrine", "tower", "monster_lair", "bandit_camp"],
  // Database (codex): sections mirror data-forge `config/database.<type>.json`
  // (data-mining/src/blood-of-dawnwalker/components.database.ts). Slugs avoid the
  // static /db/<folder> routes (items, weapons, creatures, ...).
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search items, recipes, monsters, lore…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "🗡️",
        description:
          "Weapons, armour, rings and amulets, consumables, ingredients, manuals, keys and valuables with stats, prices and vendors.",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleFallback: "Recipes",
        icon: "🧪",
        description:
          "Every crafting recipe with its ingredients, output and the recipe scroll that teaches it.",
      },
      {
        href: "/db/bestiary",
        type: "bestiary",
        titleFallback: "Bestiary",
        icon: "🐺",
        description:
          "Monsters, animals and the undead of Vale Sangora: glossary lore, portraits and blood values.",
      },
      {
        href: "/db/glossary",
        type: "glossary",
        titleFallback: "Glossary",
        icon: "📖",
        description:
          "Characters, legends, locations and tutorials from the in-game glossary.",
      },
      {
        href: "/db/readables",
        type: "readables",
        titleFallback: "Readables",
        icon: "📜",
        description:
          "Books, notes, letters, posters and manual pages, with their full text.",
      },
      {
        href: "/db/vendors",
        type: "vendors",
        titleFallback: "Vendors",
        icon: "🏪",
        description:
          "Blacksmiths, armourers, medics, innkeepers, merchants and named traders, with what each one sells.",
      },
    ],
    typeLabels: {
      inventory: "Item",
      recipes: "Recipe",
      bestiary: "Creature",
      glossary: "Glossary",
      readables: "Readable",
      vendors: "Vendor",
    },
  },
});
