import {
  AppConfig,
  games,
  getApiUrl,
  decodeFromBuffer,
  DEFAULT_LOCALE,
  fetchVersion,
  FiltersConfig,
  getAllTypesFromVersion,
  getGroupFromVersion,
  getMetadataAlternates,
  getT,
  getTypeFromVersion,
  localizePath,
  resolveForgeUrl,
  SimpleSpawn,
} from "@repo/lib";
import { HeaderOffset, PageTitle } from "../(header)";
import { ContentLayout } from "../(ads)";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Subtitle } from "../(content)";
import MapGuides from "../(data)/map-guides";
import { Metadata } from "next";
import { getFullDictionary } from "../../dicts";
import { JSONLDScript } from "./json-ld-script";

type PageProps = {
  params: Promise<{ locale?: string; type: string }>;
};

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
      `/guides/${type}`,
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

async function fetchGuideSummary(
  appName: string,
  query: string,
): Promise<GuideSummary> {
  const url = await resolveForgeUrl(getApiUrl(appName, `${query}&summary=1`));
  const response = await fetch(url);
  if (!response.ok) return { count: 0, maps: [] };
  const buffer = await response.arrayBuffer();
  return decodeFromBuffer<GuideSummary>(new Uint8Array(buffer));
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

    // The server only needs the spawn COUNT and the MAPS for the intro text
    // and the map tabs; the spawns themselves are loaded by the client
    // (MapGuides). Embedding every spawn in the render made a resource type
    // with 38k spawns (Dune: Scrap Metal) an 80 MB, 12 s origin render.
    const summaries = await Promise.all(
      queries.map((query) => fetchGuideSummary(appConfig.name, query)),
    );
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
            mainEntityOfPage: `https://${appConfig.domain}.th.gl${localizePath(`/guides/${type}`, locale)}`,
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
                item: `https://${appConfig.domain}.th.gl${localizePath(`/guides/${type}`, locale)}`,
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
            }
          />
        </HeaderOffset>
      </>
    );
  };
}
