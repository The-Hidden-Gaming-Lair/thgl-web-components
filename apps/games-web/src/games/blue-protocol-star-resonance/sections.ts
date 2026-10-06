import type { WikiSection } from "@/lib/db/wiki";

/**
 * BPSR wiki sections: one database type each (`dictionary`, `reading-books`,
 * `story`), its categories are the entries' groups.
 */
export const BPSR_SECTIONS = {
  dictionary: {
    href: "/db/dictionary",
    label: "Lore Dictionary",
    tagline:
      "An encyclopedia of lore, concepts, and historical events in Blue Protocol: Star Resonance.",
    icon: "📚",
    accent: "text-cyan-400 border-cyan-800/50 bg-cyan-900/20",
    typePrefix: "dictionary",
    groupByGroupId: true,
    keywords: [
      "Lore Dictionary",
      "Encyclopedia",
      "World Lore",
      "History",
      "Concepts",
    ],
  },
  "reading-books": {
    href: "/db/reading-books",
    label: "Reading Books",
    tagline:
      "A comprehensive collection of books, letters, posters, and records found throughout Blue Protocol: Star Resonance.",
    icon: "📖",
    accent: "text-amber-400 border-amber-800/50 bg-amber-900/20",
    typePrefix: "reading-books",
    groupByGroupId: true,
    keywords: [
      "Reading Books",
      "Lore Books",
      "Travel Guides",
      "Letters",
      "Collectibles",
    ],
  },
  story: {
    href: "/db/story",
    label: "Story Episodes",
    tagline:
      "Follow the epic story of Blue Protocol: Star Resonance through detailed episode summaries and quest phases.",
    icon: "✦",
    accent: "text-indigo-400 border-indigo-800/50 bg-indigo-900/20",
    typePrefix: "story",
    groupByGroupId: true,
    keywords: [
      "Story Episodes",
      "Main Story",
      "Quest Phases",
      "Lore",
      "Campaign",
    ],
  },
} as const satisfies Record<string, WikiSection>;

export type BpsrSectionKey = keyof typeof BPSR_SECTIONS;
