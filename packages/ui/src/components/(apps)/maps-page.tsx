import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  AppConfig,
  DEFAULT_LOCALE,
  fetchDict,
  fetchVersion,
  getMetadataAlternates,
  getPreviewImageUrl,
  getT,
  localizePath,
  resolveForgeUrl,
  translate,
} from "@repo/lib";
import { HeaderOffset, PageTitle } from "../(header)";
import { ContentLayout } from "../(ads)";
import { Subtitle } from "../(content)";
import { getFullDictionary, getStaticDictionary } from "../../dicts";
import { JSONLDScript } from "./json-ld-script";
import { PreviewReleaseGuard } from "./preview-release-guard";

type PageProps = {
  params: Promise<{ locale?: string }>;
};

function getTileBase(tileUrl: string): string {
  return tileUrl
    .replace(/^\/map-tiles\//, "")
    .replace(/\/\{z\}.*$/, "")
    .replace(/-[0-9a-f]{16,}$/, "");
}

export function createMapsPageGenerateMetadata(appConfig: AppConfig) {
  return async function generateMetadata({
    params,
  }: PageProps): Promise<Metadata> {
    const { locale = DEFAULT_LOCALE } = await params;
    const dict = await getStaticDictionary(appConfig.name, locale);
    const t = getT(dict);

    const title = t("maps.pageTitle", { vars: { title: appConfig.title } });
    const description = t("maps.intro", {
      vars: { title: appConfig.title },
    });

    const { canonical, languageAlternates } = getMetadataAlternates(
      "/maps",
      locale,
      appConfig.supportedLocales,
    );

    return {
      title,
      description,
      keywords: appConfig.keywords.map((k) => t(k)),
      alternates: {
        canonical,
        languages: languageAlternates,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        images: ["/opengraph-image.jpg"],
      },
    };
  };
}

export function createMapsPage(appConfig: AppConfig) {
  return async function MapsPage({ params }: PageProps) {
    const { locale = DEFAULT_LOCALE } = await params;
    const [dict, version, enDict] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
      fetchDict(appConfig.name),
    ]);
    const t = getT(dict);

    // Only TOP-LEVEL maps get a listing card — interior floors (tagged with
    // `layer`) are reached via the parent map's LayerSelect, not as standalone
    // /maps pages (mirrors the in-map MapSelect filter).
    const mapNames = Object.keys(version.data.tiles).filter(
      (m) => !version.data.tiles[m]?.layer,
    );

    const countsByMap = version.counts?.byMap;

    const maps = await Promise.all(
      mapNames.map(async (map) => {
        const mapName = t(map);
        const enName = translate(enDict, map);
        const tileUrl = version.data.tiles[map]?.url ?? "";
        const tileBase = getTileBase(tileUrl);
        return {
          key: map,
          name: mapName,
          href: `/maps/${encodeURIComponent(enName)}`,
          // Host-aware resolve so next/image's optimizer fetches the local
          // data-forge on *-dev hosts and the CDN otherwise (see home-page).
          bgImage: tileBase
            ? await resolveForgeUrl(
                getPreviewImageUrl(appConfig.name, tileBase),
              )
            : undefined,
          locationCount: countsByMap?.[map] ?? 0,
        };
      }),
    );

    return (
      <>
        <JSONLDScript
          json={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: maps.map((m, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: m.name,
              url: `https://${appConfig.domain}.th.gl${localizePath(m.href, locale)}`,
            })),
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
                name: "Maps",
                item: `https://${appConfig.domain}.th.gl${localizePath("/maps", locale)}`,
              },
            ],
          }}
        />

        <PreviewReleaseGuard appName={appConfig.name} title={appConfig.title}>
          <HeaderOffset full>
            <ContentLayout
              id={appConfig.name}
              header={
                <>
                  <PageTitle
                    title={t("maps.pageTitle", {
                      vars: { title: appConfig.title },
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
                      <li aria-current="page">Maps</li>
                    </ol>
                  </nav>
                  <Subtitle
                    title={t("maps.title", {
                      vars: { title: appConfig.title },
                      fallback: `${appConfig.title} Maps`,
                    })}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("maps.description", {
                      vars: {
                        title: appConfig.title,
                        count: String(maps.length),
                      },
                      fallback: `Browse all ${maps.length} interactive maps for ${appConfig.title}.`,
                    })}
                  </p>
                </>
              }
              content={(() => {
                const mapsWithImage = maps.filter((m) => m.bgImage);
                const mapsWithoutImage = maps.filter((m) => !m.bgImage);
                const totalLocations = version.counts?.total;

                const renderMapCard = (map: (typeof maps)[number]) => (
                  <li key={map.key}>
                    <Link
                      href={localizePath(map.href, locale)}
                      className="group block border rounded-lg overflow-hidden hover:border-primary transition-colors"
                    >
                      {map.bgImage ? (
                        <div className="aspect-video bg-muted/30 relative">
                          <Image
                            src={map.bgImage}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        </div>
                      ) : null}
                      <div className="px-3 py-2 flex items-baseline justify-between gap-2">
                        <span className="font-medium text-sm truncate">
                          {map.name}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {map.locationCount > 0 && (
                            <>
                              {map.locationCount.toLocaleString()} locations
                              ·{" "}
                            </>
                          )}
                          <span className="group-hover:text-primary transition-colors">
                            Explore →
                          </span>
                        </span>
                      </div>
                    </Link>
                  </li>
                );

                return (
                  <div className="space-y-6 mt-4">
                    {totalLocations && (
                      <p className="text-sm text-muted-foreground text-center">
                        {totalLocations.toLocaleString()} total locations across{" "}
                        {maps.length} maps
                      </p>
                    )}
                    {mapsWithImage.length > 0 && (
                      <ul
                        className={`grid gap-4 ${
                          mapsWithImage.length === 1
                            ? "grid-cols-1 max-w-md mx-auto"
                            : mapsWithImage.length === 2
                              ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                        }`}
                      >
                        {mapsWithImage.map(renderMapCard)}
                      </ul>
                    )}
                    {mapsWithoutImage.length > 0 && (
                      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {mapsWithoutImage.map(renderMapCard)}
                      </ul>
                    )}
                  </div>
                );
              })()}
            />
          </HeaderOffset>
        </PreviewReleaseGuard>
      </>
    );
  };
}
