import type { DatabaseConfig } from "@repo/lib";
import {
  findEntry as findEntryGeneric,
  loadAllWikiItems,
  loadSection as loadSectionGeneric,
  type WikiSection,
} from "@/lib/db/wiki";
import { BPSR_SECTIONS } from "./sections";

const APP_NAME = "blue-protocol-star-resonance";

/** BPSR-specific item props the generic WikiItemProps doesn't enumerate. */
export type BpsrItemProps = {
  title: string;
  content: string;
  description?: string;
  icon?: string;
  entryCount?: number;
  phaseOrder?: number;
  episode?: number | string;
  dictionaryType?: number | string;
  titlePic?: string;
  unlock?: number | string;
};

export function loadSection(section: WikiSection, locale = "en") {
  return loadSectionGeneric(APP_NAME, section, locale);
}

export function findEntry(section: WikiSection, id: string, locale = "en") {
  return findEntryGeneric(APP_NAME, section, id, locale);
}

/**
 * Entry ids before the 2026-10 codex rework were the bare table ids
 * (`/db/reading-books/1001`); they now carry a section prefix. Returns the
 * current id for an old one that still exists, for a permanent redirect.
 */
const LEGACY_ID_PREFIX: Record<string, string> = {
  dictionary: "dict_",
  "reading-books": "book_",
  story: "story_",
};
export async function legacyEntryId(
  section: WikiSection,
  id: string,
): Promise<string | undefined> {
  const prefix = LEGACY_ID_PREFIX[section.typePrefix];
  if (!prefix || !/^\d+$/.test(id)) return undefined;
  const found = await findEntryGeneric(APP_NAME, section, `${prefix}${id}`);
  return found ? `${prefix}${id}` : undefined;
}

/** The loaded section as a database slice (for SectionJsonLd). */
export function groupsAsDatabase(
  section: WikiSection,
  groups: Awaited<ReturnType<typeof loadSection>>,
): DatabaseConfig {
  return [
    {
      type: section.typePrefix,
      items: groups.flatMap((g) =>
        g.items.map((i) => ({ id: i.id, props: i.props })),
      ),
    },
  ];
}

/** Flat item list for the header search index. */
export function loadAllItems() {
  return loadAllWikiItems(APP_NAME, Object.values(BPSR_SECTIONS));
}
