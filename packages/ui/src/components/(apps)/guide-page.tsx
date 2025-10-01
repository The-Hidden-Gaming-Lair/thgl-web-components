import {
  AppConfig,
  DATA_FORGE_URL,
  decodeFromBuffer,
  DEFAULT_LOCALE,
  fetchVersion,
  FiltersConfig,
  getGroupFromVersion,
  getMetadataAlternates,
  getT,
  getTypeFromVersion,
  localizePath,
  SimpleSpawn,
} from "@repo/lib";
import { Spawns } from "@repo/ui/providers";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { notFound } from "next/navigation";
import { Subtitle } from "@repo/ui/content";
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
      getTypeFromVersion(version, type) || getGroupFromVersion(version, type);

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

const DEFAULT_MAP_NAME = "default";

export function createGuidePage(appConfig: AppConfig) {
  return async function GuidePage({ params }: PageProps) {
    const { locale = DEFAULT_LOCALE, type } = await params;
    const [dict, version] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
    ]);

    const t = getT(dict);

    let url, icon;
    let guideId = getTypeFromVersion(version, type);
    if (!guideId) {
      guideId = getGroupFromVersion(version, type);
      if (!guideId) {
        return notFound();
      }
      url = `${DATA_FORGE_URL}/api/${appConfig.name}/search?group=${guideId}`;
      icon = null;
    } else {
      url = `${DATA_FORGE_URL}/api/${appConfig.name}/search?type=${guideId}`;
      icon = getIconFromFilters(version.data.filters, guideId);
    }
    const guideTitle = t(guideId);
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const spawns = decodeFromBuffer<Spawns>(new Uint8Array(buffer));
    const maps = spawns
      .reduce((acc, n) => {
        const mapName = n.mapName || DEFAULT_MAP_NAME;
        if (!acc.includes(mapName)) {
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
      maps.push(Object.keys(version.data.tiles)[0]);
    }

    const simpleSpawns = spawns.map<SimpleSpawn>((s) => ({
      id: s.id || s.type,
      p: s.p,
      mapName: s.mapName || DEFAULT_MAP_NAME,
      type: s.type,
      name: version.data.enDict[s.id ?? s.type] || s.id || s.type,
      icon: s.icon || icon || getIconFromFilters(version.data.filters, s.type),
    }));
    return (
      <>
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
          <PageTitle
            title={t("guide.title", {
              vars: { guide: guideTitle, title: appConfig.title },
            })}
          />
          <ContentLayout
            id={appConfig.name}
            header={
              <>
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
              </>
            }
            content={
              <MapGuides
                simpleSpawns={simpleSpawns}
                maps={maps}
                tiles={version.data.tiles}
                appName={appConfig.name}
                additionalTooltip={appConfig.game?.additionalTooltip}
              />
            }
          />
        </HeaderOffset>
      </>
    );
  };
}
