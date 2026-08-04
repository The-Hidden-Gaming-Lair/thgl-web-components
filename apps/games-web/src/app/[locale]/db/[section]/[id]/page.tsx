import { type ComponentType } from "react";
import { type Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  fetchDatabaseIndex,
  fetchDatabaseType,
  fetchVersion,
  fetchTiles,
  getMetadataAlternates,
  localizePath,
  type TilesConfig,
  DEFAULT_LOCALE,
} from "@repo/lib";
import { getFullDictionary } from "@repo/ui/dicts";
import { JSONLDScript } from "@repo/ui/apps";
import { getAppConfig } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { entityPageJsonLd } from "@/lib/db/json-ld";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { GenericEntityView } from "@/lib/db/generic-view";
import { SocEntityView } from "@/games/songs-of-conquest/entity-view";

// Per-game detail-view overrides. Tenants not listed fall back to the generic
// view. SoC adds structured sections (skill pools, faction indexes) on top and
// resolves cross-link / variant names per-locale from the passed `dict`.
const DETAIL_VIEWS: Record<string, ComponentType<any>> = {
  "songs-of-conquest": SocEntityView,
};

/**
 * Generic DB entry (detail) page — tenant-resolved counterpart of the
 * per-game entry-page factories. Validates the id belongs to one of the
 * section's database types, then renders the shared GenericEntityView.
 */
type Params = Promise<{ id: string; locale?: string; section: string }>;
type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

// Map tiles for the embedded location map, fetched once per app and cached at
// the module level (the tile config doesn't change at runtime).
const tilesCache = new Map<string, Promise<TilesConfig>>();
function getTiles(appName: string): Promise<TilesConfig> {
  let p = tilesCache.get(appName);
  if (!p) {
    p = fetchTiles(appName);
    tilesCache.set(appName, p);
  }
  return p;
}

async function resolveSection(section: string, locale: string, id: string) {
  const appConfig = await getAppConfig();
  if (!appConfig.db) notFound();
  const secCfg = appConfig.db.homeSections.find(
    (s) => s.href === `/db/${section}` || s.type === section,
  );
  if (!secCfg) {
    // Old per-category slug folded into a parent section via extraTypes
    // (e.g. /db/weapon/<id> → /db/items/<id>). 308-redirect.
    const parent = appConfig.db.homeSections.find((s) =>
      (s.extraTypes ?? []).includes(section),
    );
    if (parent) permanentRedirect(localizePath(`${parent.href}/${id}`, locale));
    notFound();
  }
  const types = [secCfg.type, ...(secCfg.extraTypes ?? [])];
  return { appConfig, secCfg, types };
}

// Build a data-rich meta description from an entry's props (stats + where it's
// found / sold / crafted / dropped). Generic over any tenant's prop shape.
function buildEntityDescription(
  name: string,
  sectionLabel: string,
  props: Record<string, any> | undefined,
  appTitle: string,
): string {
  const p = props ?? {};
  const stats: string[] = [];
  if (p.Damage) stats.push(`${p.Damage} damage`);
  if (p.Value) stats.push(String(p.Value));
  if (p["Magic Circle"] != null)
    stats.push(`Circle of Magic ${p["Magic Circle"]}`);
  const names = (a: any) =>
    Array.isArray(a)
      ? a
          .slice(0, 3)
          .map((r: any) => r.name)
          .filter(Boolean)
      : [];
  const prov: string[] = [];
  if (p.locations?.total)
    prov.push(
      `found in ${p.locations.total} chest${p.locations.total > 1 ? "s" : ""}`,
    );
  if (names(p.soldBy).length)
    prov.push(`sold by ${names(p.soldBy).join(", ")}`);
  if (p.craftable?.station) prov.push(`craftable at a ${p.craftable.station}`);
  if (names(p.droppedBy).length)
    prov.push(`dropped by ${names(p.droppedBy).join(", ")}`);
  if (p.drops?.total)
    prov.push(`drops ${p.drops.total} item${p.drops.total > 1 ? "s" : ""}`);
  if (p.sells?.total) prov.push(`sells ${p.sells.total} items`);

  let desc = `${name} — ${sectionLabel.toLowerCase()} in ${appTitle}`;
  if (stats.length) desc += ` (${stats.join(", ")})`;
  desc += ".";
  if (prov.length) {
    const joined = prov.join("; ");
    desc += " " + joined.charAt(0).toUpperCase() + joined.slice(1) + ".";
  }
  return desc.length > 300 ? desc.slice(0, 297) + "…" : desc;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id, locale = DEFAULT_LOCALE, section } = await params;
  const { appConfig, secCfg } = await resolveSection(section, locale, id);
  const dict = await getFullDictionary(appConfig.name, locale);
  const name = resolveDict(dict, id) || id;
  const sectionLabel =
    appConfig.db?.typeLabels?.[secCfg.type] ||
    resolveDict(dict, secCfg.type) ||
    section;

  // Pull the entry's props (cached fetch shared with the page) for a rich,
  // data-driven description. Best-effort — fall back to a simple line.
  let props: Record<string, any> | undefined;
  try {
    const index = await fetchDatabaseIndex(appConfig.name);
    const secTypes = [secCfg.type, ...(secCfg.extraTypes ?? [])];
    const matchingType =
      index.find(
        (cat) =>
          secTypes.includes(cat.type) && cat.items.some((i) => i.id === id),
      )?.type ?? index.find((cat) => cat.items.some((i) => i.id === id))?.type;
    if (matchingType) {
      const full = await fetchDatabaseType(appConfig.name, matchingType);
      props = full.items.find((i) => i.id === id)?.props as
        | Record<string, any>
        | undefined;
    }
  } catch {
    /* fall back to the simple description */
  }

  const title = `${name} - ${appConfig.title}`;
  const description = buildEntityDescription(
    name,
    sectionLabel,
    props,
    appConfig.title,
  );
  const { canonical, languageAlternates } = getMetadataAlternates(
    `/db/${section}/${id}`,
    locale,
    appConfig.supportedLocales,
  );
  return {
    title,
    description,
    alternates: { canonical, languages: languageAlternates },
    openGraph: {
      title,
      description,
      url: canonical,
      images: ["/opengraph-image.jpg"],
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { id, locale = DEFAULT_LOCALE, section } = await params;
  const { appConfig, secCfg, types } = await resolveSection(
    section,
    locale,
    id,
  );

  const [index, dict, version] = await Promise.all([
    fetchDatabaseIndex(appConfig.name),
    getFullDictionary(appConfig.name, locale),
    fetchVersion(appConfig.name),
  ]);
  const iconsHash = version.more.icons;

  // id → sprite icon for every DB entry, so cross-links (sold-by / sells) can
  // show the target's icon.
  const icons: Record<string, IconSprite> = {};
  for (const cat of index) {
    for (const it of cat.items) {
      if (it.icon && typeof it.icon === "object") {
        icons[it.id] = it.icon as IconSprite;
      }
    }
  }

  // Prefer a category within THIS section's types (ids can repeat across types
  // — e.g. SoC's faction "arleon" and town "arleon"), then fall back to any.
  const matchingType =
    index.find(
      (cat) => types.includes(cat.type) && cat.items.some((i) => i.id === id),
    )?.type ?? index.find((cat) => cat.items.some((i) => i.id === id))?.type;
  if (
    !matchingType ||
    (!types.includes(matchingType) &&
      !(secCfg.typePrefix && matchingType.startsWith(secCfg.typePrefix)))
  ) {
    notFound();
  }

  const fullType = await fetchDatabaseType(appConfig.name, matchingType);
  const item = fullType.items.find((i) => i.id === id);
  if (!item) notFound();

  // Only fetch map tiles when this entry actually has locations to plot.
  const hasLocations = Boolean(
    (item.props as { locations?: { list?: unknown[] } } | undefined)?.locations
      ?.list?.length,
  );
  const tiles = hasLocations ? await getTiles(appConfig.name) : undefined;

  const name = resolveDict(dict, id) || id;
  const desc = resolveDict(dict, `${id}_desc`);
  const sectionLabel =
    appConfig.db?.typeLabels?.[secCfg.type] ||
    resolveDict(dict, secCfg.type) ||
    section;
  const groupId = (item as { groupId?: string }).groupId;
  const groupLabel = groupId ? resolveDict(dict, groupId) : undefined;
  const icon =
    item.icon && typeof item.icon === "object"
      ? (item.icon as IconSprite)
      : undefined;

  const hasDesc = desc && desc !== `${id}_desc` && desc !== id;
  return (
    <>
      <JSONLDScript
        json={entityPageJsonLd({
          appConfig,
          section,
          sectionLabel,
          entityId: item.id,
          entityName: name,
          description: hasDesc ? desc : undefined,
          locale,
        })}
      />
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Breadcrumb
          crumbs={[
            { label: sectionLabel, href: `/db/${section}` },
            { label: name },
          ]}
          locale={locale}
          dict={dict}
        />
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-6">
        {(() => {
          const DetailView = DETAIL_VIEWS[appConfig.name] ?? GenericEntityView;
          return (
            <DetailView
              id={item.id}
              name={name}
              desc={desc}
              groupLabel={groupLabel}
              icon={icon}
              props={item.props as Record<string, unknown> | undefined}
              iconsHash={iconsHash}
              appName={appConfig.name}
              locale={locale}
              icons={icons}
              tiles={tiles}
              filters={version.data.filters}
              dict={dict}
            />
          );
        })()}
      </div>
    </>
  );
}
