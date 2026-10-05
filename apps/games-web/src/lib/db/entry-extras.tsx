import Link from "next/link";
import {
  type AppConfig,
  type DatabaseConfig,
  type Version,
  decodeFromBuffer,
  encodeMapFilterParam,
  fetchDict,
  findFilterTypesForDbEntry,
  fetchDbDict,
  getApiUrl,
  localizePath,
  resolveForgeUrl,
  translate,
} from "@repo/lib";
import { DataFeedback, PageComments } from "@repo/ui/data";
import { resolveDict } from "./resolve-dict";
import { SpriteIcon } from "./sprite-icon";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const SECTION_HEADER =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground";
const LINK = "text-amber-300 underline underline-offset-2 hover:text-amber-200";
const MAX_RELATED = 8;

/** `search?…&summary=1`: spawn count + maps (null = the API did not answer). */
export async function fetchSummary(
  appName: string,
  query: string,
): Promise<{ count: number; maps: string[] } | null> {
  try {
    const url = await resolveForgeUrl(getApiUrl(appName, `${query}&summary=1`));
    const res = await fetch(url);
    if (!res.ok) return null;
    return decodeFromBuffer<{ count: number; maps: string[] }>(
      new Uint8Array(await res.arrayBuffer()),
    );
  } catch {
    return null;
  }
}

/**
 * "On the map" block for a DB entry whose thing also exists as a map filter
 * type (declared `dbSection` link or exact English-name match — see
 * db-map-links.ts): spawn count, a map link with only that type enabled, and
 * the type's guide page. Renders nothing when there is no match or no spawns.
 */
async function OnTheMap({
  appConfig,
  section,
  id,
  name,
  locale,
  version,
  dict,
}: {
  appConfig: AppConfig;
  section: string;
  id: string;
  name: string;
  locale: string;
  version: Version;
  /** Page dict (UI strings + db terms) for the block's own labels. */
  dict: Record<string, string>;
}) {
  const filters = version.data.filters;
  if (filters.length === 0) return null;

  const [enDbDict, gameDict, enGameDict] = await Promise.all([
    fetchDbDict(appConfig.name, "en"),
    fetchDict(appConfig.name, locale),
    fetchDict(appConfig.name, "en"),
  ]);
  const typeIds = findFilterTypesForDbEntry({
    section,
    id,
    filters,
    enDict: enDbDict,
  });
  if (typeIds.length === 0) return null;

  const summaries = await Promise.all(
    typeIds.map((typeId) => fetchSummary(appConfig.name, `type=${typeId}`)),
  );
  const count = summaries.reduce((n, s) => n + (s?.count ?? 0), 0);
  if (count === 0) return null;

  const tiles = version.data.tiles;
  const tileNames = Object.keys(tiles);
  const maps = [
    ...new Set(
      summaries.flatMap((s) => s?.maps ?? []).map((m) => m || tileNames[0]),
    ),
  ].filter((m) => m && tiles[m]);
  // Open the map holding most of the entry's spawns: the summary lists maps in
  // spawn order, so the first one is as good a pick as any without per-map
  // counts; prefer tile order for determinism.
  maps.sort((a, b) => tileNames.indexOf(a) - tileNames.indexOf(b));
  const mapName = maps[0];

  const label = (key: string) =>
    translate(gameDict, key, { fallback: translate(enGameDict, key) });
  const filterParam = encodeMapFilterParam(filters, typeIds);
  const mapHref = mapName
    ? `${localizePath(
        `/maps/${encodeURIComponent(tiles[mapName]?.defaultTitle || label(mapName))}`,
        locale,
      )}${filterParam ? `?filters=${encodeURIComponent(filterParam)}` : ""}`
    : null;
  // Guide URLs are keyed by the type's localized name (guide-page.tsx
  // reverse-maps it through the same game dict).
  const guideHref = localizePath(
    `/guides/${encodeURIComponent(label(typeIds[0]))}`,
    locale,
  );

  return (
    <section className="mt-8 border-t border-slate-800 pt-4">
      <h2 className={SECTION_HEADER}>
        {translate(dict, "db.onTheMap", { fallback: "On the map" })}
      </h2>
      <p className="mt-2 text-sm">
        {translate(dict, "db.onTheMapCount", {
          fallback:
            count === 1
              ? "{{name}} has 1 known location"
              : "{{name}} has {{count}} known locations",
          vars: { name, count: count.toLocaleString(locale) },
        })}
        {maps.length > 1 &&
          ` ${translate(dict, "db.onTheMapMaps", {
            fallback: "across {{maps}} maps",
            vars: { maps: String(maps.length) },
          })}`}
        .
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {mapHref && (
          <Link href={mapHref} className={LINK}>
            {translate(dict, "db.showOnMap", {
              fallback: "Show on the interactive map",
            })}
          </Link>
        )}
        <Link href={guideHref} className={LINK}>
          {translate(dict, "db.locationGuide", {
            fallback: "Location guide & progress tracker",
          })}
        </Link>
      </div>
    </section>
  );
}

/** Up to MAX_RELATED other entries of the same group in the same category. */
function RelatedEntries({
  index,
  type,
  id,
  groupId,
  section,
  dict,
  locale,
  appName,
  iconsHash,
}: {
  index: DatabaseConfig;
  type: string;
  id: string;
  groupId: string | undefined;
  section: string;
  dict: Record<string, string>;
  locale: string;
  appName: string;
  iconsHash?: string;
}) {
  if (!groupId) return null;
  const category = index.find((c) => c.type === type);
  const related = (category?.items ?? [])
    .filter((i) => i.groupId === groupId && i.id !== id)
    .slice(0, MAX_RELATED);
  if (related.length === 0) return null;
  const groupLabel = resolveDict(dict, groupId);

  return (
    <section className="mt-8 border-t border-slate-800 pt-4">
      <h2 className={SECTION_HEADER}>
        {translate(dict, "db.related", { fallback: "Related" })}
        {groupLabel && groupLabel !== groupId ? ` · ${groupLabel}` : ""}
      </h2>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((item) => {
          const icon =
            item.icon && typeof item.icon === "object"
              ? (item.icon as IconSprite)
              : undefined;
          return (
            <li key={item.id}>
              <Link
                href={localizePath(
                  `/db/${section}/${encodeURIComponent(item.id)}`,
                  locale,
                )}
                className="flex items-center gap-2 rounded-md border border-slate-800 px-2 py-1.5 text-sm hover:border-slate-600 hover:bg-slate-900"
              >
                {icon && (
                  <SpriteIcon
                    icon={icon}
                    appName={appName}
                    size={24}
                    iconsHash={iconsHash}
                  />
                )}
                <span className="truncate">
                  {resolveDict(dict, item.id) || item.id}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Community + cross-link blocks under a DB entry: "On the map" (unless the
 * entry already plots its own locations / embeds a map), "Related", the
 * "Was this accurate?" feedback and the lazy "Tips & comments" thread. The
 * two community widgets are client-only and fetch nothing server-side, so the
 * page stays identical for every visitor (edge-cached).
 */
export async function EntryExtras({
  appConfig,
  section,
  id,
  name,
  type,
  groupId,
  props,
  index,
  dict,
  locale,
  version,
}: {
  appConfig: AppConfig;
  section: string;
  id: string;
  name: string;
  type: string;
  groupId?: string;
  props: Record<string, unknown> | undefined;
  index: DatabaseConfig;
  dict: Record<string, string>;
  locale: string;
  version: Version;
}) {
  const p = props as
    | {
        locations?: { list?: unknown[] };
        embeddedMap?: { mapName?: string };
      }
    | undefined;
  const hasOwnMap = Boolean(
    p?.locations?.list?.length || p?.embeddedMap?.mapName,
  );
  const targetId = `db:${section}/${id}`;

  return (
    <>
      {!hasOwnMap && (
        <OnTheMap
          appConfig={appConfig}
          section={section}
          id={id}
          name={name}
          locale={locale}
          version={version}
          dict={dict}
        />
      )}
      <RelatedEntries
        index={index}
        type={type}
        id={id}
        groupId={groupId}
        section={section}
        dict={dict}
        locale={locale}
        appName={appConfig.name}
        iconsHash={version.more.icons}
      />
      <DataFeedback
        appName={appConfig.name}
        targetId={targetId}
        className="mt-8 border-t border-slate-800 pt-4"
      />
      <PageComments id={targetId} appName={appConfig.name} />
    </>
  );
}
