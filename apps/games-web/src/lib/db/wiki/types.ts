/**
 * Generic wiki-section descriptor. A "wiki section" is a DB section
 * whose entries are text/HTML content (not entity stat sheets like
 * homm units). Used by games that group their lore/codex/quest-log
 * data as `<prefix>_<subgroup>` categories in `database.json`.
 */
export type WikiSection = {
  /** URL path stem, e.g. "/db/dictionary" or "/db/remnants". */
  href: string;
  /** Human-readable section title (used in headings, breadcrumbs, metadata). */
  label: string;
  /** One-sentence description shown under the hero. */
  tagline: string;
  /** Glyph rendered on the hero (e.g. "📚"). */
  icon: string;
  /** Tailwind classes used by the category-pill accent. */
  accent: string;
  /**
   * Every `database.json` category whose `type` starts with this prefix
   * belongs to this section.
   */
  typePrefix: string;
  /**
   * The section is ONE database type whose entries carry a `groupId`: the
   * categories are the groups (label = the group's dict term) instead of the
   * `<prefix>_<subgroup>` types.
   */
  groupByGroupId?: boolean;
  /** Extra keywords appended to the page-level metadata. */
  keywords?: string[];
};

/** Generic prop shape used by wiki items across games. */
export type WikiItemProps = {
  title: string;
  content: string;
  description?: string;
  [key: string]: unknown;
};

export type WikiItem = {
  id: string;
  type: string;
  /** Localized category label (e.g. "Holt Town"). */
  category: string;
  props: WikiItemProps;
};
