import { fetchDatabase, fetchDbDict, type DatabaseConfig } from "@repo/lib";
import { resolveDict } from "@/lib/db/resolve-dict";
import type { WikiItem, WikiItemProps, WikiSection } from "./types";

/**
 * Humanise the trailing portion of a category type for display in the
 * sidebar / breadcrumb (e.g. `dictionary_historical_events` →
 * `Historical Events`). Used when the dict lookup for the full type
 * key returns nothing.
 */
export function humanizeCategory(catType: string, typePrefix: string): string {
  const trimmed = catType.startsWith(typePrefix)
    ? catType.slice(typePrefix.length)
    : catType;
  return trimmed
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Fetch all items belonging to a wiki section, keyed by category. Each
 * category is a `database.json` row whose `type` starts with the
 * section's `typePrefix`. Categories are sorted alphabetically by
 * their English label so the sidebar order stays stable across deploys.
 */
export async function loadSection(
  appName: string,
  section: WikiSection,
  locale = "en",
): Promise<{ category: { type: string; label: string }; items: WikiItem[] }[]> {
  const [database, enDict, localeDict] = await Promise.all([
    fetchDatabase(appName),
    fetchDbDict(appName),
    locale === "en"
      ? Promise.resolve(null as Record<string, string> | null)
      : fetchDbDict(appName, locale),
  ]);

  const dict = localeDict ?? enDict;

  const matching = database
    .filter((cat) => cat.type.startsWith(section.typePrefix))
    .sort((a, b) => {
      const la =
        resolveDict(enDict, a.type) !== a.type
          ? resolveDict(enDict, a.type)
          : humanizeCategory(a.type, section.typePrefix);
      const lb =
        resolveDict(enDict, b.type) !== b.type
          ? resolveDict(enDict, b.type)
          : humanizeCategory(b.type, section.typePrefix);
      return la.localeCompare(lb, undefined, { numeric: true });
    });

  return matching.map((cat) => {
    const label =
      resolveDict(dict, cat.type) !== cat.type
        ? resolveDict(dict, cat.type)
        : humanizeCategory(cat.type, section.typePrefix);

    const items: WikiItem[] = cat.items.map((i) => ({
      id: i.id,
      type: cat.type,
      category: label,
      props: i.props as WikiItemProps,
    }));

    return { category: { type: cat.type, label }, items };
  });
}

/** Lookup an item by id across every category in a section. */
export async function findEntry(
  appName: string,
  section: WikiSection,
  id: string,
  locale = "en",
): Promise<{
  item: WikiItem;
  neighbors: { prev?: WikiItem; next?: WikiItem };
  siblings: WikiItem[];
} | null> {
  const sections = await loadSection(appName, section, locale);
  for (const { items } of sections) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) continue;
    const item = items[idx];
    return {
      item,
      neighbors: { prev: items[idx - 1], next: items[idx + 1] },
      // Up to 5 other entries in the same category
      siblings: items.filter((i) => i.id !== id).slice(0, 5),
    };
  }
  return null;
}

/** Total item count across all categories of a section. */
export async function countSection(
  appName: string,
  section: WikiSection,
): Promise<number> {
  const grouped = await loadSection(appName, section);
  return grouped.reduce((s, g) => s + g.items.length, 0);
}

/**
 * Flat list of every wiki item across the supplied sections, for use
 * by the header search index. Returns each entry with the section's
 * `href` (URL stem) so search dropdowns can link directly without
 * looking up the section themselves.
 */
export async function loadAllWikiItems(
  appName: string,
  sections: WikiSection[],
): Promise<
  Array<{
    id: string;
    href: string;
    label: string;
    type: string;
    category: string;
    title: string;
  }>
> {
  const database: DatabaseConfig = await fetchDatabase(appName);
  const enDict = await fetchDbDict(appName);
  const out: Array<{
    id: string;
    href: string;
    label: string;
    type: string;
    category: string;
    title: string;
  }> = [];

  for (const cat of database) {
    if (cat.type.startsWith("_")) continue;
    const section = sections.find((s) => cat.type.startsWith(s.typePrefix));
    if (!section) continue;
    const category =
      resolveDict(enDict, cat.type) !== cat.type
        ? resolveDict(enDict, cat.type)
        : humanizeCategory(cat.type, section.typePrefix);
    for (const item of cat.items) {
      const props = item.props as WikiItemProps;
      out.push({
        id: item.id,
        href: section.href,
        label: section.label,
        type: cat.type,
        category,
        title: props.title ?? item.id,
      });
    }
  }
  return out;
}
