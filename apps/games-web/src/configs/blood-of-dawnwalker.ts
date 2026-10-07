import { resolveAppConfig } from "@repo/lib";

/**
 * The Blood of Dawnwalker — interactive map of Vale Sangora (one open world).
 * Subdomain: bloodofdawnwalker.th.gl (derived from games.ts `web`).
 *
 * THGLApp companion support (detector `bloodofdawnwalker_detector`) ships in the public
 * app since 17.1.2 (2026-09-16); `appUrl` enables the "In-Game App" CTA.
 * No manual "/maps/..." internalLink — the home page auto-generates the richer
 * map card (preview + counts) for the single map.
 */
export const bloodOfDawnwalker = resolveAppConfig({
  name: "blood-of-dawnwalker",
  // English-only for the static release (decision 2026-09-12). data-forge already writes all 15
  // game locales (cs, de, es, es-MX, fr, hu, it, ja, ko, pl, pt-BR, tr, zh-CN, zh-TW) to
  // dicts/<locale>.json (map names + database) — add them here to enable them later.
  supportedLocales: ["en"],
  // appUrl enables the "In-Game App" CTA on the web page.
  appUrl: "https://www.th.gl/companion-app",
  // Curated database cards (guides page + llms.txt); the map card is auto-generated (see above).
  internalLinks: [
    {
      title: "config.internalLinks.inventory.title",
      description: "config.internalLinks.inventory.description",
      href: "/db/inventory",
      iconName: "Gift",
      linkText: "config.internalLinks.inventory.linkText",
    },
    {
      title: "config.internalLinks.quests.title",
      description: "config.internalLinks.quests.description",
      href: "/db/quests",
      iconName: "ScrollText",
      linkText: "config.internalLinks.quests.linkText",
    },
    {
      title: "config.internalLinks.bestiary.title",
      description: "config.internalLinks.bestiary.description",
      href: "/db/bestiary",
      iconName: "Bug",
      linkText: "config.internalLinks.bestiary.linkText",
    },
    {
      title: "config.internalLinks.perks.title",
      description: "config.internalLinks.perks.description",
      href: "/db/perks",
      iconName: "Sparkles",
      linkText: "config.internalLinks.perks.linkText",
    },
    {
      title: "checklist.navTitle",
      description: "checklist.navDescription",
      href: "/checklist",
      iconName: "SquareCheckBig",
      linkText: "checklist.navLinkText",
    },
    {
      title: "crafting.navTitle",
      description: "crafting.navDescription",
      href: "/crafting",
      iconName: "Hammer",
      linkText: "crafting.navLinkText",
    },
  ],
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
    "Quests",
    "Perks",
    "Skill Trees",
    "Active Abilities",
    "Court",
    "Edicts",
  ],
  topFilters: ["shrine", "tower", "monster_lair", "bandit_camp"],
  // Database (codex): sections mirror data-forge `config/database.<type>.json`
  // (data-mining/src/blood-of-dawnwalker/components.database.ts). Slugs avoid the
  // static /db/<folder> routes (items, weapons, creatures, ...).
  db: {
    // Collection checklists (/checklist, /checklist/<section>).
    checklists: [{ section: "readables" }],
    heroSubtitle: "config.db.heroSubtitle",
    searchPlaceholder: "config.db.searchPlaceholder",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/inventory",
        type: "inventory",
        titleKey: "config.internalLinks.inventory.title",
        titleFallback: "Items",
        icon: "🗡️",
        description: "config.db.inventory.description",
      },
      {
        href: "/db/recipes",
        type: "recipes",
        titleKey: "config.db.recipes.title",
        titleFallback: "Recipes",
        icon: "🧪",
        description: "config.db.recipes.description",
      },
      {
        href: "/db/bestiary",
        type: "bestiary",
        titleKey: "config.internalLinks.bestiary.title",
        titleFallback: "Bestiary",
        icon: "🐺",
        description: "config.db.bestiary.description",
      },
      {
        href: "/db/glossary",
        type: "glossary",
        titleKey: "config.db.glossary.title",
        titleFallback: "Glossary",
        icon: "📖",
        description: "config.db.glossary.description",
      },
      {
        href: "/db/readables",
        type: "readables",
        titleKey: "config.db.readables.title",
        titleFallback: "Readables",
        icon: "📜",
        description: "config.db.readables.description",
      },
      {
        href: "/db/vendors",
        type: "vendors",
        titleKey: "config.db.vendors.title",
        titleFallback: "Vendors",
        icon: "🏪",
        description: "config.db.vendors.description",
      },
      {
        href: "/db/quests",
        type: "quests",
        titleKey: "config.internalLinks.quests.title",
        titleFallback: "Quests",
        icon: "❗",
        description: "config.db.quests.description",
      },
      {
        href: "/db/perks",
        type: "perks",
        titleKey: "config.internalLinks.perks.title",
        titleFallback: "Perks",
        icon: "🌳",
        description: "config.db.perks.description",
      },
      {
        href: "/db/abilities",
        type: "abilities",
        titleKey: "config.db.abilities.title",
        titleFallback: "Active Abilities",
        icon: "⚔️",
        description: "config.db.abilities.description",
      },
      {
        href: "/db/court",
        type: "court",
        titleKey: "config.db.court.title",
        titleFallback: "Court",
        icon: "👑",
        description: "config.db.court.description",
      },
    ],
    typeLabels: {
      inventory: "config.db.typeLabels.inventory",
      recipes: "config.db.typeLabels.recipes",
      bestiary: "config.db.typeLabels.bestiary",
      glossary: "config.db.typeLabels.glossary",
      readables: "config.db.typeLabels.readables",
      vendors: "config.db.typeLabels.vendors",
      quests: "config.db.typeLabels.quests",
      perks: "config.db.typeLabels.perks",
      abilities: "config.db.typeLabels.abilities",
      court: "config.db.typeLabels.court",
    },
  },
});
