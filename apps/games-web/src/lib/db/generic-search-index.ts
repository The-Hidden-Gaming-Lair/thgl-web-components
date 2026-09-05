import {
  type AppConfig,
  fetchDatabaseIndex,
  fetchDict,
  fetchVersion,
  getIconsUrl,
  localizePath,
} from "@repo/lib";
import { fetchFullPropsCategory, flattenPropsText } from "./props-text";

function resolveDict(dict: Record<string, string>, key: string): string {
  const value = dict[key];
  if (!value) return key;
  if (value[0] === "@") return dict[value] ?? value;
  return value;
}

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Header-search index for any generic DB tenant (one without a hand-written
 * `search-index.ts`), e.g. Gothic 1 Remake. Indexes every database entry by its
 * localized name plus its flattened effect text (`text`), so reverse lookups
 * like "View Radius" surface the skills/artifacts that grant it. Maps each
 * category type to its section slug via `db.homeSections`. Returns the entries
 * plus the sprite-icon URL the dropdown uses to render icons.
 */
export async function buildGenericSearchIndex(
  appConfig: AppConfig,
  locale: string,
) {
  const [database, dict, version] = await Promise.all([
    fetchDatabaseIndex(appConfig.name),
    fetchDict(appConfig.name, locale),
    fetchVersion(appConfig.name),
  ]);

  const iconsUrl = getIconsUrl(
    appConfig.name,
    "icons.webp",
    version.more.icons,
  );

  // category type -> section slug (from /db/<slug> hrefs in homeSections).
  const sectionByType = new Map<string, string>();
  for (const s of appConfig.db?.homeSections ?? []) {
    const slug = s.href.replace(/^\/db\//, "");
    sectionByType.set(s.type, slug);
    for (const et of s.extraTypes ?? []) sectionByType.set(et, slug);
  }

  const entries = (
    await Promise.all(
      database
        .filter((category) => !category.type.startsWith("_"))
        .map(async (category) => {
          // The slim index drops props — pull effect text from the per-type file.
          const full = await fetchFullPropsCategory(appConfig.name, category);
          const textById = new Map(
            full.items.map((i) => [i.id, flattenPropsText(i.props)]),
          );
          const section = sectionByType.get(category.type) ?? category.type;
          return category.items.map((item) => {
            const icon =
              item.icon && typeof item.icon === "object"
                ? (item.icon as IconSprite)
                : undefined;
            return {
              id: item.id,
              name: resolveDict(dict, item.id),
              type: category.type,
              section,
              href: localizePath(`/db/${section}/${item.id}`, locale),
              icon,
              text: textById.get(item.id) || undefined,
            };
          });
        }),
    )
  ).flat();

  return { entries, iconsUrl };
}
