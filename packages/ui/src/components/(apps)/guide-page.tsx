import {
  AppConfig,
  games,
  getApiUrl,
  decodeFromBuffer,
  DEFAULT_LOCALE,
  fetchDatabaseIndex,
  fetchDbDict,
  fetchVersion,
  findDbEntriesForFilterTypes,
  getDbSectionByType,
  FiltersConfig,
  getAllTypesFromVersion,
  getGroupFromVersion,
  getMetadataAlternates,
  getT,
  getTypeFromVersion,
  loadAllDicts,
  localizePath,
  resolveForgeUrl,
  SimpleSpawn,
  translateForLocale,
} from "@repo/lib";
import { HeaderOffset, PageTitle } from "../(header)";
import { ContentLayout } from "../(ads)";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { Subtitle } from "../(content)";
import MapGuides from "../(data)/map-guides";
import { PageComments } from "../(data)/page-comments";
import { Metadata } from "next";
import { getFullDictionary } from "../../dicts";
import { JSONLDScript } from "./json-ld-script";

type PageProps = {
  params: Promise<{ locale?: string; type: string }>;
};

/**
 * Per-locale guide path for a type/group id: the slug is the guide's name in
 * that locale (English fallback), exactly as the sitemap lists it. Any other
 * slug that resolves to the same guide (`/de/guides/Bloom` for `Blüte`) must
 * name this one as canonical instead of competing with it as a duplicate.
 */
async function getGuidePathFn(
  appConfig: AppConfig,
  guideKey: string,
): Promise<(locale: string) => string> {
  const allDicts = await loadAllDicts(appConfig.name, [
    ...new Set([DEFAULT_LOCALE, ...appConfig.supportedLocales]),
  ]);
  const enDict = allDicts.get(DEFAULT_LOCALE) ?? {};
  return (locale) =>
    `/guides/${encodeURIComponent(translateForLocale(allDicts, enDict, locale, guideKey))}`;
}

export function createGuidePageGenerateMetadata(appConfig: AppConfig) {
  return async function generateMetadata({
    params,
  }: PageProps): Promise<Metadata> {
    const { locale = DEFAULT_LOCALE, type } = await params;

    const [dict, version] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
    ]);

    const guideTitle =
      getTypeFromVersion(version, type, dict) ||
      getGroupFromVersion(version, type, dict);

    if (!guideTitle) {
      return {};
    }

    const t = getT(dict);

    const title = t("guide.pageTitle", {
      vars: { guide: t(guideTitle), title: appConfig.title },
    });
    const description = t("guide.intro", {
      vars: { guide: t(guideTitle), title: appConfig.title },
    });
    const keywords = t("guide.meta.keywords", {
      vars: { guide: t(guideTitle), title: appConfig.title },
    });

    const { canonical, languageAlternates } = getMetadataAlternates(
      await getGuidePathFn(appConfig, guideTitle),
      locale,
      appConfig.supportedLocales,
    );

    const metaData: Metadata = {
      title: title,
      description: description,
      keywords: keywords,
      alternates: {
        canonical: canonical,
        languages: languageAlternates,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        images: ["/opengraph-image.jpg"],
      },
    };
    return metaData;
  };
}

function getIconFromFilters(filters: FiltersConfig, id: string) {
  return (
    filters
      .find((f) => f.values.some((v) => v.id === id))
      ?.values.find((v) => v.id === id)?.icon ?? null
  );
}

/** `search?…&summary=1` response: how many spawns match and on which maps. */
type GuideSummary = { count: number; maps: string[] };

/** null = the search API could not answer (NOT the same as zero spawns). */
async function fetchGuideSummary(
  appName: string,
  query: string,
): Promise<GuideSummary | null> {
  try {
    const url = await resolveForgeUrl(getApiUrl(appName, `${query}&summary=1`));
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return decodeFromBuffer<GuideSummary>(new Uint8Array(buffer));
  } catch {
    return null;
  }
}

/**
 * Database entries this guide's filter types correspond to (declared
 * `dbSection` links, else an exact English-name match), with localized names.
 * Best-effort: a DB hiccup just drops the links.
 */
async function getGuideDbLinks(
  appConfig: AppConfig,
  locale: string,
  typeIds: string[],
  filters: FiltersConfig,
): Promise<{ href: string; name: string }[]> {
  if (!appConfig.db || typeIds.length === 0) return [];
  try {
    const [index, enDict, localeDict] = await Promise.all([
      fetchDatabaseIndex(appConfig.name),
      fetchDbDict(appConfig.name, "en"),
      fetchDbDict(appConfig.name, locale),
    ]);
    const refs = findDbEntriesForFilterTypes({
      typeIds,
      filters,
      index,
      enDict,
      sectionByType: getDbSectionByType(appConfig.db.homeSections, index),
    });
    const t = getT(localeDict);
    return refs.map((ref) => ({
      href: localizePath(
        `/db/${ref.section}/${encodeURIComponent(ref.id)}`,
        locale,
      ),
      name: t(ref.id),
    }));
  } catch {
    return [];
  }
}

export function createGuidePage(appConfig: AppConfig) {
  return async function GuidePage({ params }: PageProps) {
    const { locale = DEFAULT_LOCALE, type } = await params;
    const [dict, version] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
    ]);

    const t = getT(dict);
    const tileNames = Object.keys(version.data.tiles);
    const defaultMapName = tileNames[0] || "default";

    // Find all type IDs that translate to the same name (e.g. "Sword" in multiple rarity categories)
    const allTypeIds = getAllTypesFromVersion(version, type, dict);
    let guideId: string;
    let icon: ReturnType<typeof getIconFromFilters>;
    let typeIds: string[];
    // Search-API queries the client runs to load the spawns (one per type, or
    // the whole group).
    let queries: string[];

    if (allTypeIds.length > 0) {
      guideId = allTypeIds[0]; // Use first for title/icon
      icon = getIconFromFilters(version.data.filters, guideId);
      typeIds = allTypeIds;
      queries = allTypeIds.map((typeId) => `type=${typeId}`);
    } else {
      const groupId = getGroupFromVersion(version, type, dict);
      if (!groupId) {
        // English slug under a locale prefix (indexed before the locale dict
        // got a real translation, hreflang alternates, old links):
        // `/de/guides/Chromite` → 308 to the localized `/de/guides/Chromit`.
        if (locale !== DEFAULT_LOCALE) {
          const enDict = await getFullDictionary(
            appConfig.name,
            DEFAULT_LOCALE,
          );
          const enId =
            getAllTypesFromVersion(version, type, enDict)[0] ??
            getGroupFromVersion(version, type, enDict);
          if (enId) {
            const path = (await getGuidePathFn(appConfig, enId))(locale);
            if (
              decodeURIComponent(path) !== `/guides/${decodeURIComponent(type)}`
            ) {
              permanentRedirect(localizePath(path, locale));
            }
          }
        }
        return notFound();
      }
      guideId = groupId;
      icon = null;
      typeIds =
        version.data.filters
          .find((f) => f.group === groupId)
          ?.values.map((v) => v.id) ?? [];
      queries = [`group=${groupId}`];
    }
    const guideTitle = t(guideId);
    const guideUrl = `https://${appConfig.domain}.th.gl${localizePath((await getGuidePathFn(appConfig, guideId))(locale), locale)}`;

    // The server only needs the spawn COUNT and the MAPS for the intro text
    // and the map tabs; the spawns themselves are loaded by the client
    // (MapGuides). Embedding every spawn in the render made a resource type
    // with 38k spawns (Dune: Scrap Metal) an 80 MB, 12 s origin render.
    const [rawSummaries, dbLinks] = await Promise.all([
      Promise.all(
        queries.map((query) => fetchGuideSummary(appConfig.name, query)),
      ),
      // Only type guides map to one entity; a group guide has no DB twin.
      getGuideDbLinks(
        appConfig,
        locale,
        allTypeIds.length > 0 ? typeIds : [],
        version.data.filters,
      ),
    ]);
    // A type with no plottable spawns (live-only NPCs, overlay-only types)
    // has nothing to guide — 404 it instead of rendering "0 known …"
    // boilerplate. Only when every summary actually answered: a search-API
    // outage must never 404 a real guide.
    if (rawSummaries.every((s) => s !== null)) {
      const total = rawSummaries.reduce((n, s) => n + (s?.count ?? 0), 0);
      if (total === 0) return notFound();
    }
    const summaries = rawSummaries.map((s) => s ?? { count: 0, maps: [] });
    const spawnCount = summaries.reduce((n, s) => n + s.count, 0);
    const maps = [...new Set(summaries.flatMap((s) => s.maps))]
      .map((mapName) => mapName || defaultMapName)
      .filter(
        (mapName, i, arr) =>
          version.data.tiles[mapName] && arr.indexOf(mapName) === i,
      )
      .sort((a, b) => tileNames.indexOf(a) - tileNames.indexOf(b));
    if (maps.length === 0) {
      // Ensure at least one map for UI rendering
      maps.push(defaultMapName);
    }

    // Build type → group label map for disambiguation in the spawns list
    const typeGroupLabels: Record<string, string> = {};
    for (const filter of version.data.filters) {
      for (const v of filter.values) {
        if (!typeGroupLabels[v.id]) {
          typeGroupLabels[v.id] = t(filter.group, { fallback: filter.group });
        }
      }
    }

    // Resolved term for a dict key that exists (t() follows `@` pointers), else
    // undefined — t() alone would echo the key back for a missing term.
    const term = (key: string | undefined) =>
      key !== undefined && dict[key] ? t(key) : undefined;
    // Per-type label + icon for the client: its dict only ships UI strings and
    // filter names, and the search API only names spawns that own a term, so
    // unnamed spawns fall back to these.
    const typeLabels: Record<string, string> = {};
    const typeIcons: Record<string, SimpleSpawn["icon"]> = {};
    for (const typeId of typeIds) {
      typeLabels[typeId] = term(typeId) ?? typeId;
      typeIcons[typeId] =
        getIconFromFilters(version.data.filters, typeId) || icon;
    }

    return (
      <>
        <JSONLDScript
          json={{
            "@context": "https://schema.org",
            "@type": "Article",
            headline: t("guide.pageTitle", {
              vars: { guide: guideTitle, title: appConfig.title },
            }),
            description: t("guide.intro", {
              vars: { guide: guideTitle, title: appConfig.title },
            }),
            author: {
              "@type": "Organization",
              name: "The Hidden Gaming Lair",
              url: "https://www.th.gl",
            },
            publisher: {
              "@type": "Organization",
              name: "The Hidden Gaming Lair",
              url: "https://www.th.gl",
            },
            dateModified: version.createdAt
              ? new Date(version.createdAt).toISOString()
              : undefined,
            mainEntityOfPage: guideUrl,
          }}
        />
        <JSONLDScript
          json={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: t("guide.jsonld.1.question", {
                  vars: { guide: guideTitle, title: appConfig.title },
                }),
                acceptedAnswer: {
                  "@type": "Answer",
                  text: t("guide.jsonld.1.answer", {
                    vars: { guide: guideTitle, title: appConfig.title },
                  }),
                },
              },
              {
                "@type": "Question",
                name: t("guide.jsonld.2.question", {
                  vars: { guide: guideTitle, title: appConfig.title },
                }),
                acceptedAnswer: {
                  "@type": "Answer",
                  text: t("guide.jsonld.2.answer", {
                    vars: { guide: guideTitle, title: appConfig.title },
                  }),
                },
              },
            ],
          }}
        />
        <JSONLDScript
          json={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `https://${appConfig.domain}.th.gl${localizePath("/", locale)}`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Guides",
                item: `https://${appConfig.domain}.th.gl${localizePath("/guides", locale)}`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: guideTitle,
                item: guideUrl,
              },
            ],
          }}
        />
        <HeaderOffset full>
          <ContentLayout
            id={appConfig.name}
            header={
              <>
                <PageTitle
                  title={t("guide.title", {
                    vars: { guide: guideTitle, title: appConfig.title },
                  })}
                />
                <nav
                  aria-label="Breadcrumb"
                  className="text-xs text-muted-foreground py-2"
                >
                  <ol className="flex items-center gap-1">
                    <li>
                      <Link
                        href={localizePath("/", locale)}
                        className="hover:text-foreground transition-colors"
                      >
                        Home
                      </Link>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li>
                      <Link
                        href={localizePath("/guides", locale)}
                        className="hover:text-foreground transition-colors"
                      >
                        Guides
                      </Link>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li aria-current="page">{guideTitle}</li>
                  </ol>
                </nav>
                <Subtitle
                  title={t("guide.subtitle", {
                    vars: { guide: guideTitle },
                  })}
                  order={2}
                />
                <p className="text-sm mt-2">
                  {t.rich("guide.description", {
                    components: {
                      guide: <strong>{guideTitle}</strong>,
                      title: <strong>{appConfig.title}</strong>,
                    },
                  })}
                </p>
                <p className="text-sm mt-2">
                  {t.rich("guide.spawns", {
                    components: {
                      spawns: <strong>{spawnCount}</strong>,
                      maps: <strong>{maps.length}</strong>,
                      guide: <strong>{guideTitle}</strong>,
                    },
                  })}
                </p>
                {dbLinks.length > 0 && (
                  <p className="text-sm mt-2">
                    {t("guide.dbLinks", { fallback: "In the database:" })}{" "}
                    {dbLinks.map((link, i) => (
                      <span key={link.href}>
                        {i > 0 && ", "}
                        <Link
                          href={link.href}
                          className="text-amber-300 underline underline-offset-2 hover:text-amber-200"
                        >
                          {link.name}
                        </Link>
                      </span>
                    ))}
                  </p>
                )}
                {version.createdAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last updated:{" "}
                    {new Date(version.createdAt).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </>
            }
            content={
              <>
                <MapGuides
                  appName={appConfig.name}
                  locale={locale}
                  queries={queries}
                  typeLabels={typeLabels}
                  typeIcons={typeIcons}
                  defaultMapName={defaultMapName}
                  maps={maps}
                  mapLabels={Object.fromEntries(maps.map((m) => [m, t(m)]))}
                  tiles={version.data.tiles}
                  additionalTooltip={
                    games.find((g) => g.id === appConfig.name)
                      ?.additionalTooltip ?? appConfig.game?.additionalTooltip
                  }
                  typeGroupLabels={typeGroupLabels}
                />
                {/* Keyed by the type/group ID, not the localized URL slug, so
                  every language shares one thread. */}
                <PageComments
                  id={`guide:${guideId}`}
                  appName={appConfig.name}
                />
              </>
            }
          />
        </HeaderOffset>
      </>
    );
  };
}
