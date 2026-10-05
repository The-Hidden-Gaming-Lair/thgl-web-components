import { getStaticDictionary } from "@repo/ui/dicts";
import type { WikiSection } from "@/lib/db/wiki";

/**
 * Once-Human wiki sections. Each entry pulls items from every
 * `database.json` category whose `type` starts with `typePrefix`.
 *
 * Weapons is *not* wiki-shaped — it's a single flat category rendered
 * as an icon+rarity grid, so it lives outside this map.
 */
export const ONCE_HUMAN_SECTIONS = {
  remnants: {
    href: "/db/remnants",
    label: "Remnants",
    tagline:
      "Field-guide entries you collect from every location in Once Human.",
    icon: "📓",
    accent: "text-emerald-400 border-emerald-800/50 bg-emerald-900/20",
    typePrefix: "remnants_",
    keywords: ["Remnants", "Field Guide", "Lore", "Collectibles"],
  },
  "regional-records": {
    href: "/db/regional-records",
    label: "Regional Records",
    tagline:
      "Survivor accounts and discoveries from each region of Once Human.",
    icon: "🗺",
    accent: "text-cyan-400 border-cyan-800/50 bg-cyan-900/20",
    typePrefix: "regional_records_",
    keywords: ["Regional Records", "Lore", "Region", "World"],
  },
  "echoes-of-stardust": {
    href: "/db/echoes-of-stardust",
    label: "Echoes of Stardust",
    tagline:
      "Stardust chronicles, securement logs, adventure logs and other long-form lore from Once Human.",
    icon: "✦",
    accent: "text-indigo-400 border-indigo-800/50 bg-indigo-900/20",
    typePrefix: "echoes_of_stardust_",
    keywords: ["Echoes of Stardust", "Stardust Chronicles", "Lore", "Story"],
  },
} as const satisfies Record<string, WikiSection>;

export type OnceHumanSectionKey = keyof typeof ONCE_HUMAN_SECTIONS;

/**
 * A section with its label + tagline in the page's locale (once-human UI dict
 * `oh.wiki.<key>.label` / `.tagline`; English above is the fallback).
 */
export async function localizedSection(
  key: OnceHumanSectionKey,
  locale: string,
): Promise<WikiSection> {
  const dict = await getStaticDictionary("once-human", locale);
  const section: WikiSection = ONCE_HUMAN_SECTIONS[key];
  return {
    ...section,
    label: dict[`oh.wiki.${key}.label`] ?? section.label,
    tagline: dict[`oh.wiki.${key}.tagline`] ?? section.tagline,
  };
}
