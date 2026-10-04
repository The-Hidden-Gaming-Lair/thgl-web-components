import {
  createFilterTypeLookup,
  fetchDbDict,
  localizePath,
  translate,
  type AppConfig,
  type DatabaseConfig,
  type Version,
} from "@repo/lib";
import { resolveDict, resolveDictWithFallback } from "@/lib/db/resolve-dict";
import { fetchFullPropsCategory } from "@/lib/db/props-text";
import { getSectionLabels } from "@/lib/db/seo";

/**
 * Collection checklist data (`/checklist`, `/checklist/<section>`): which codex
 * sections a tenant opted in (`db.checklists`) and the per-entry rows — name,
 * icon, group, optional description and where it is on the map. Built from
 * data the /db pages already load (database index, per-type props, version
 * filters + spawn counts), so no data-forge output is checklist-specific.
 */

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type HomeSection = NonNullable<AppConfig["db"]>["homeSections"][number];

export type ChecklistSectionInfo = {
  /** URL slug, same as `/db/<section>`. */
  section: string;
  descriptions: boolean;
  home: HomeSection;
};

/** The tenant's checklist sections that resolve to a real `/db` section. */
export function getChecklistSections(
  appConfig: AppConfig,
): ChecklistSectionInfo[] {
  const db = appConfig.db;
  if (!db?.checklists) return [];
  const out: ChecklistSectionInfo[] = [];
  for (const c of db.checklists) {
    const home = db.homeSections.find((s) => s.href === `/db/${c.section}`);
    if (!home) continue;
    out.push({
      section: c.section,
      descriptions: Boolean(c.descriptions),
      home,
    });
  }
  return out;
}

/** Database categories of one section (type, extraTypes, typePrefix). */
export function checklistCategories(
  index: DatabaseConfig,
  home: HomeSection,
): DatabaseConfig {
  const types = [home.type, ...(home.extraTypes ?? [])];
  return index.filter(
    (cat) =>
      types.includes(cat.type) ||
      (home.typePrefix ? cat.type.startsWith(home.typePrefix) : false),
  );
}

export function checklistSectionLabel(
  appConfig: AppConfig,
  dict: Record<string, string>,
  info: ChecklistSectionInfo,
): string {
  return getSectionLabels(appConfig, dict, info.home, info.section).plural;
}

export type ChecklistEntry = {
  id: string;
  name: string;
  groupId?: string;
  icon?: IconSprite;
  desc?: string;
  /** Direct map deep link (an entry with its own `props.locations`). */
  mapHref?: string;
  /**
   * Map filter types that plot this entry (opened with the map's stable
   * `?types=` param); the client asks the search API which map holds them.
   */
  types?: string[];
};

export type ChecklistGroup = { id: string; label: string };

type Locations = {
  list?: { map: string; type: string; node: string }[];
};

function cleanDesc(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every row of one checklist section, in codex (index) order. */
export async function buildChecklistEntries({
  appConfig,
  info,
  index,
  dict,
  version,
  locale,
}: {
  appConfig: AppConfig;
  info: ChecklistSectionInfo;
  index: DatabaseConfig;
  dict: Record<string, string>;
  version: Version;
  locale: string;
}): Promise<{ entries: ChecklistEntry[]; groups: ChecklistGroup[] }> {
  const cats = checklistCategories(index, info.home);
  const [fullCats, enDbDict] = await Promise.all([
    Promise.all(cats.map((cat) => fetchFullPropsCategory(appConfig.name, cat))),
    fetchDbDict(appConfig.name, "en").catch(() => ({})),
  ]);
  const locationsById = new Map<string, Locations>();
  for (const cat of fullCats) {
    for (const item of cat.items) {
      const loc = (item.props as { locations?: Locations } | undefined)
        ?.locations;
      if (loc?.list?.length) locationsById.set(item.id, loc);
    }
  }

  const filters = version.data.filters;
  const byType = version.counts?.byType;
  const lookup =
    filters.length > 0
      ? createFilterTypeLookup({
          section: info.section,
          filters,
          enDict: enDbDict as Record<string, string>,
        })
      : null;

  const entries: ChecklistEntry[] = [];
  const groups = new Map<string, ChecklistGroup>();
  for (const cat of cats) {
    for (const item of cat.items) {
      const name = resolveDict(dict, item.id) || item.id;
      const groupId = item.groupId ?? undefined;
      if (groupId && !groups.has(groupId)) {
        groups.set(groupId, {
          id: groupId,
          label: resolveDictWithFallback(dict, groupId, groupId),
        });
      }
      const entry: ChecklistEntry = { id: item.id, name };
      if (groupId) entry.groupId = groupId;
      if (item.icon && typeof item.icon === "object") {
        entry.icon = item.icon as IconSprite;
      }
      if (info.descriptions) {
        const raw = resolveDict(dict, `${item.id}_desc`);
        if (raw && raw !== `${item.id}_desc` && raw !== item.id) {
          const desc = cleanDesc(raw);
          if (desc) entry.desc = desc;
        }
      }
      const loc = locationsById.get(item.id)?.list?.[0];
      if (loc) {
        const node = encodeURIComponent(loc.node);
        entry.mapHref = localizePath(
          `/maps/${loc.map}/${loc.type}/${node}?id=${node}`,
          locale,
        );
      } else if (lookup) {
        // Same filter-type match as the /db entry's "On the map" block, kept
        // only when the type actually has spawns.
        const types = lookup(item.id).filter(
          (t) => !byType || (byType[t] ?? 0) > 0,
        );
        if (types.length) entry.types = types;
      }
      entries.push(entry);
    }
  }
  return { entries, groups: [...groups.values()] };
}

/** Map name → localized `/maps/<title>` path segment, in tile order. */
export function checklistMapTitles(
  version: Version,
  dict: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [mapName, tile] of Object.entries(version.data.tiles)) {
    out[mapName] =
      (tile as { defaultTitle?: string }).defaultTitle ||
      translate(dict, mapName);
  }
  return out;
}

/** The `checklist.*` UI strings of a locale (sent to the client view). */
export function checklistLabels(dict: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(dict).filter(([k]) => k.startsWith("checklist.")),
  );
}
