import type { Metadata } from "next";
import {
  AppConfig,
  DEFAULT_LOCALE,
  fetchVersion,
  getMapNameFromVersion,
  getMetadataAlternates,
  getT,
  localizePath,
} from "@repo/lib";
import { CoordinatesProvider } from "@repo/ui/providers";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { FullMapDynamic } from "@repo/ui/full-map-dynamic";
import { MarkersSearch } from "@repo/ui/controls";
import { FloatingAds } from "@repo/ui/ads";
import { notFound } from "next/navigation";
import { getFullDictionary } from "@repo/ui/dicts";
import { ReactNode } from "react";
import { AdditionalTooltipType } from "../(content)";

type PageProps = {
  params: Promise<{ locale?: string; map: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function createMapPageGenerateMetadata(appConfig: AppConfig) {
  return async function generateMetadata({
    params,
  }: PageProps): Promise<Metadata> {
    const { locale = DEFAULT_LOCALE, map } = await params;

    const [dict, version] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
    ]);

    const mapName = getMapNameFromVersion(version, map);
    if (!mapName) {
      return {};
    }

    const t = getT(dict);

    const keywords = appConfig.keywords.map((k) => t(k)).join(", ") ?? "";

    const title = t("map.pageTitle", {
      vars: { title: appConfig.title, map: t(mapName) },
    });
    const description = t("map.intro", {
      vars: { title: appConfig.title, keywords, map: t(mapName) },
    });

    const { canonical, languageAlternates } = getMetadataAlternates(
      `/maps/${map}`,
      locale,
      appConfig.supportedLocales,
    );

    const metaData: Metadata = {
      title: title,
      description: description,
      keywords: appConfig.keywords.map((k) => t(k)),
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

export function createMapPage(
  appConfig: AppConfig,
  additionalFilters?: ReactNode,
  additionalTooltip?: AdditionalTooltipType,
) {
  return async function Map({ params }: PageProps) {
    const { locale = DEFAULT_LOCALE, map } = await params;
    const [dict, version] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
    ]);

    const t = getT(dict);

    const mapName = getMapNameFromVersion(version, map);
    if (!mapName) {
      notFound();
    }

    let decodedMap = decodeURIComponent(map);
    if (!decodedMap.endsWith(" Map")) {
      decodedMap += " Map";
    }

    return (
      <CoordinatesProvider
        appName={appConfig.name}
        staticDrawings={version.data.drawings}
        filters={version.data.filters}
        mapNames={Object.keys(version.data.tiles)}
        useCbor
        regions={version.data.regions}
        typesIdMap={version.data.typesIdMap}
        nodesPaths={version.more.nodes}
        globalFilters={version.data.globalFilters}
        map={mapName}
      >
        <HeaderOffset full>
          <PageTitle
            title={t("map.pageTitle", {
              vars: { title: appConfig.title, map: decodedMap },
            })}
          />
          <FullMapDynamic
            appConfig={appConfig}
            tilesConfig={version.data.tiles}
            iconsPath={version.more.icons}
            additionalTooltip={additionalTooltip}
          />
          <MarkersSearch
            lastMapUpdate={version.createdAt}
            tileOptions={version.data.tiles}
            appName={appConfig.name}
            iconsPath={version.more.icons}
            additionalFilters={additionalFilters}
            additionalTooltip={additionalTooltip}
          >
            <FloatingAds id={appConfig.name} />
          </MarkersSearch>
        </HeaderOffset>
      </CoordinatesProvider>
    );
  };
}
