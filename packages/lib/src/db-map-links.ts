import type { DatabaseConfig, DbAppConfig, FiltersConfig } from "./config";

/**
 * Cross-links between map filter types (guide pages, the map) and database
 * entries (/db pages). Pure functions over data the pages already load
 * (version filters, the database index, the English db dict), so neither side
 * needs a new endpoint.
 *
 * A filter type and a DB entry are linked when
 *   1. the filter value declares it: `dbSection` + (`dbEntryId` ?? type id), and
 *      that entry exists in the index, or
 *   2. their ENGLISH names match exactly after normalization (case, whitespace,
 *      Unicode form) — English so every locale agrees on the same pairs.
 * Nothing fuzzier: a wrong cross-link is worse than none.
 */

export type DbEntryRef = {
  /** URL section slug (`/db/<section>/<id>`). */
  section: string;
  id: string;
  /** Database category type the entry lives in. */
  type: string;
};

type FilterValue = FiltersConfig[number]["values"][number];

/** Names shorter than this never name-match (too generic: "Ore", "Key"). */
const MIN_NAME_LENGTH = 3;

export function normalizeLinkName(name: string): string {
  return name.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

function resolveTerm(dict: Record<string, string>, key: string): string {
  const value = dict[key];
  if (!value) return "";
  if (value[0] === "@") return dict[value] ?? "";
  return value;
}

/** Database category type → `/db/<slug>` section, from `db.homeSections`. */
export function getDbSectionByType(
  homeSections: DbAppConfig["homeSections"] | undefined,
  index: DatabaseConfig,
): Map<string, string> {
  const sectionByType = new Map<string, string>();
  for (const s of homeSections ?? []) {
    const slug = s.href.replace(/^\/db\//, "");
    sectionByType.set(s.type, slug);
    for (const et of s.extraTypes ?? []) sectionByType.set(et, slug);
    if (s.typePrefix) {
      for (const cat of index) {
        if (cat.type.startsWith(s.typePrefix) && !sectionByType.has(cat.type)) {
          sectionByType.set(cat.type, slug);
        }
      }
    }
  }
  return sectionByType;
}

const entriesByNameCache = new WeakMap<
  DatabaseConfig,
  WeakMap<Record<string, string>, Map<string, DbEntryRef[]>>
>();

/** normalized English name → entries, memoized per (index, dict) object pair. */
function getEntriesByName(
  index: DatabaseConfig,
  enDict: Record<string, string>,
  sectionByType: Map<string, string>,
): Map<string, DbEntryRef[]> {
  let byDict = entriesByNameCache.get(index);
  if (!byDict) {
    byDict = new WeakMap();
    entriesByNameCache.set(index, byDict);
  }
  const cached = byDict.get(enDict);
  if (cached) return cached;

  const byName = new Map<string, DbEntryRef[]>();
  for (const cat of index) {
    if (cat.type.startsWith("_")) continue;
    const section = sectionByType.get(cat.type);
    if (!section) continue;
    for (const item of cat.items) {
      const name = normalizeLinkName(resolveTerm(enDict, item.id));
      if (name.length < MIN_NAME_LENGTH) continue;
      const list = byName.get(name) ?? [];
      list.push({ section, id: item.id, type: cat.type });
      byName.set(name, list);
    }
  }
  byDict.set(enDict, byName);
  return byName;
}

function findEntry(
  index: DatabaseConfig,
  sectionByType: Map<string, string>,
  section: string,
  id: string,
): DbEntryRef | null {
  for (const cat of index) {
    if (sectionByType.get(cat.type) !== section) continue;
    if (cat.items.some((i) => i.id === id)) {
      return { section, id, type: cat.type };
    }
  }
  return null;
}

/** DB entries for a guide's filter types (declared links first, then names). */
export function findDbEntriesForFilterTypes({
  typeIds,
  filters,
  index,
  enDict,
  sectionByType,
  limit = 3,
}: {
  typeIds: string[];
  filters: FiltersConfig;
  index: DatabaseConfig;
  enDict: Record<string, string>;
  sectionByType: Map<string, string>;
  limit?: number;
}): DbEntryRef[] {
  const results: DbEntryRef[] = [];
  const seen = new Set<string>();
  const push = (ref: DbEntryRef | null) => {
    if (!ref) return;
    const key = `${ref.section}/${ref.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push(ref);
  };

  const values = new Map<string, FilterValue>();
  for (const f of filters) for (const v of f.values) values.set(v.id, v);

  for (const typeId of typeIds) {
    const v = values.get(typeId);
    if (v?.dbSection) {
      push(findEntry(index, sectionByType, v.dbSection, v.dbEntryId ?? v.id));
    }
  }

  const byName = getEntriesByName(index, enDict, sectionByType);
  for (const typeId of typeIds) {
    const name = normalizeLinkName(resolveTerm(enDict, typeId));
    if (name.length < MIN_NAME_LENGTH) continue;
    for (const ref of byName.get(name) ?? []) push(ref);
  }

  return results.slice(0, limit);
}

/**
 * The codex entries a guide's filter types mix (`mixedDbEntries`: one marker type for several
 * entries found in different places), deduped, in filter order. Non-empty → the guide shows
 * each entry's own table instead of a map whose spots belong to different entries.
 */
export function findMixedDbEntries(
  typeIds: string[],
  filters: FiltersConfig,
): { section: string; id: string }[] {
  const wanted = new Set(typeIds);
  const seen = new Set<string>();
  const refs: { section: string; id: string }[] = [];
  for (const f of filters) {
    for (const v of f.values) {
      if (!wanted.has(v.id)) continue;
      for (const ref of v.mixedDbEntries ?? []) {
        const key = `${ref.section}/${ref.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        refs.push(ref);
      }
    }
  }
  return refs;
}

/**
 * Map filter types for a DB entry (declared links first, then names). Types
 * that never plot markers (`no_map_markers`) are skipped.
 */
export function findFilterTypesForDbEntry({
  section,
  id,
  filters,
  enDict,
}: {
  section: string;
  id: string;
  filters: FiltersConfig;
  enDict: Record<string, string>;
}): string[] {
  const declared: string[] = [];
  const byName: string[] = [];
  const entryName = normalizeLinkName(resolveTerm(enDict, id));
  for (const f of filters) {
    for (const v of f.values) {
      if (v.no_map_markers || (v as { live_only?: boolean }).live_only) {
        continue;
      }
      if (v.dbSection === section && (v.dbEntryId ?? v.id) === id) {
        if (!declared.includes(v.id)) declared.push(v.id);
        continue;
      }
      if (
        entryName.length >= MIN_NAME_LENGTH &&
        normalizeLinkName(resolveTerm(enDict, v.id)) === entryName &&
        !byName.includes(v.id)
      ) {
        byName.push(v.id);
      }
    }
  }
  return declared.length > 0 ? declared : byName;
}

/**
 * `findFilterTypesForDbEntry` for many entries of ONE section at once: one
 * pass over the filters builds the lookup, so a whole codex section (up to
 * thousands of entries, e.g. the /checklist pages) costs O(entries + values)
 * instead of O(entries × values). Same rules and result order.
 */
export function createFilterTypeLookup({
  section,
  filters,
  enDict,
}: {
  section: string;
  filters: FiltersConfig;
  enDict: Record<string, string>;
}): (id: string) => string[] {
  const declared = new Map<string, string[]>();
  const byName = new Map<string, string[]>();
  const add = (map: Map<string, string[]>, key: string, typeId: string) => {
    const list = map.get(key) ?? [];
    if (!list.includes(typeId)) list.push(typeId);
    map.set(key, list);
  };
  for (const f of filters) {
    for (const v of f.values) {
      if (v.no_map_markers || (v as { live_only?: boolean }).live_only) {
        continue;
      }
      if (v.dbSection === section) add(declared, v.dbEntryId ?? v.id, v.id);
      const name = normalizeLinkName(resolveTerm(enDict, v.id));
      if (name.length >= MIN_NAME_LENGTH) add(byName, name, v.id);
    }
  }
  return (id) => {
    const own = declared.get(id);
    if (own?.length) return [...own];
    const name = normalizeLinkName(resolveTerm(enDict, id));
    if (name.length < MIN_NAME_LENGTH) return [];
    return [...(byName.get(name) ?? [])];
  };
}

/**
 * `?filters=` value that opens the map with exactly these filter types on —
 * the same encoding the "Share map view" dialog produces (indices into the
 * sorted list of every filter value id; see search-params.ts).
 */
export function encodeMapFilterParam(
  filters: FiltersConfig,
  typeIds: string[],
): string | null {
  const sorted = filters.flatMap((f) => f.values.map((v) => v.id)).sort();
  const indices = typeIds
    .map((id) => sorted.indexOf(id))
    .filter((i) => i !== -1)
    .sort((a, b) => a - b);
  if (indices.length === 0) return null;
  return JSON.stringify({ f: indices.join(","), g: "" });
}
