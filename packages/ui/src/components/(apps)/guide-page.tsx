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
  getNodeId,
} from "@repo/lib";
import { Spawns } from "../(providers)";
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

export function createGuidePage(appConfig: AppConfig) {
  return async function GuidePage({ params }: PageProps) {
    const { locale = DEFAULT_LOCALE, type } = await params;
    const [dict, version] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
    ]);

    const t = getT(dict);
    const defaultMapName = Object.keys(version.data.tiles)[0] || "default";

    // Find all type IDs that translate to the same name (e.g. "Sword" in multiple rarity categories)
    const allTypeIds = getAllTypesFromVersion(version, type, dict);
    let guideId: string;
    let icon;
    let spawns: Spawns;

    if (allTypeIds.length > 0) {
      guideId = allTypeIds[0]; // Use first for title/icon
      icon = getIconFromFilters(version.data.filters, guideId);
      // Fetch spawns for ALL matching types
      const allSpawnArrays = await Promise.all(
        allTypeIds.map(async (typeId) => {
          const url = await resolveForgeUrl(
            getApiUrl(appConfig.name, `type=${typeId}`),
          );
          const response = await fetch(url);
          const buffer = await response.arrayBuffer();
          return decodeFromBuffer<Spawns>(new Uint8Array(buffer));
        }),
      );
      spawns = allSpawnArrays.flat();
    } else {
      const groupId = getGroupFromVersion(version, type, dict);
      if (!groupId) {
        return notFound();
      }
      guideId = groupId;
      icon = null;
      const url = await resolveForgeUrl(
        getApiUrl(appConfig.name, `group=${guideId}`),
      );
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      spawns = decodeFromBuffer<Spawns>(new Uint8Array(buffer));
    }
    const guideTitle = t(guideId);

    // Build type → group label map for disambiguation in the spawns list
    const typeGroupLabels: Record<string, string> = {};
    for (const filter of version.data.filters) {
      for (const v of filter.values) {
        if (!typeGroupLabels[v.id]) {
          typeGroupLabels[v.id] = t(filter.group, { fallback: filter.group });
        }
      }
    }

    const maps = spawns
      .reduce((acc, n) => {
        const mapName = n.mapName || defaultMapName;
        if (!acc.includes(mapName) && version.data.tiles[mapName]) {
          acc.push(mapName);
        }
        return acc;
      }, [] as string[])
      .sort(
        (a, b) =>
          Object.keys(version.data.tiles).indexOf(a) -
          Object.keys(version.data.tiles).indexOf(b),
      );

    if (spawns.length === 0) {
      // Ensure at least one map for UI rendering
      maps.push(defaultMapName);
    }

    // Resolved term for a dict key that exists (t() follows `@` pointers), else
    // undefined — t() alone would echo the key back for a missing term.
    const term = (key: string | undefined) =>
      key !== undefined && dict[key] ? t(key) : undefined;
    const simpleSpawns = spawns.map<SimpleSpawn>((s) => {
      // A spawn id is a stable key (discovered-node state, comments) and only
      // SOMETIMES a dict key: a named NPC/chest has its own term, a position-
      // derived `{type}@{x}:{y}` id never does. Fall through to the type name so
      // unnamed spawns group into one list row and the tooltip shows the type
      // name instead of the raw id.
      const typeLabel = term(s.type) ?? s.type;
      const name = term(s.id) ?? typeLabel;
      return {
        id: getNodeId(s),
        p: s.p,
        mapName: s.mapName || defaultMapName,
        type: s.type,
        name,
        // The client dict on guide pages only ships UI strings, so the tooltip
        // can't re-translate `name` — hand it the resolved label verbatim.
        label: name,
        typeLabel,
        icon:
          s.icon || getIconFromFilters(version.data.filters, s.type) || icon,
        description: s.description,
        data: s.data,
      };
    });

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
                      spawns: <strong>{simpleSpawns.length}</strong>,
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
                simpleSpawns={simpleSpawns}
                maps={maps}
                mapLabels={Object.fromEntries(maps.map((m) => [m, t(m)]))}
                tiles={version.data.tiles}
                appName={appConfig.name}
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
