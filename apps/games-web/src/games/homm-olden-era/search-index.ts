import {
  fetchDatabaseIndex,
  fetchDbDict,
  fetchVersion,
  getIconsUrl,
  localizePath,
} from "@repo/lib";

const APP_NAME = "homm-olden-era";

const SECTION_MAP: Record<string, string> = {
  units: "units",
  heroes: "heroes",
  spells: "spells",
  items: "artifacts",
  item_sets: "artifacts",
  skills: "skills",
  sub_skills: "skills",
  specializations: "factions",
  factions: "factions",
  faction_laws: "factions",
  buildings: "buildings",
  map_objects: "map-objects",
};

function resolveDict(dict: Record<string, string>, key: string): string {
  const value = dict[key];
  if (!value) return key;
  if (value[0] === "@") return dict[value] ?? value;
  return value;
}

/**
 * Build the header-search index payload for homm-olden-era: every DB
 * entity with display name (from dict), type, section URL, and the
 * sprite-icon coords needed by the dropdown.
 */
export async function buildHommSearchIndex(locale: string) {
  const [database, dict, version] = await Promise.all([
    fetchDatabaseIndex(APP_NAME),
    fetchDbDict(APP_NAME, locale),
    fetchVersion(APP_NAME),
  ]);

  const iconsUrl = getIconsUrl(APP_NAME, "icons.webp", version.more.icons);

  const entries = database
    .filter((category) => !category.type.startsWith("_"))
    .flatMap((category) =>
      category.items.map((item) => {
        const section = SECTION_MAP[category.type] ?? category.type;
        const dictKey =
          category.type === "factions" ? `faction_${item.id}` : item.id;
        const icon =
          item.icon && typeof item.icon === "object"
            ? (item.icon as {
                url: string;
                x: number;
                y: number;
                width: number;
                height: number;
              })
            : undefined;

        return {
          id: item.id,
          name: resolveDict(dict, dictKey),
          type: category.type,
          section,
          href: localizePath(`/db/${section}/${item.id}`, locale),
          icon,
        };
      }),
    );

  return { entries, iconsUrl };
}
