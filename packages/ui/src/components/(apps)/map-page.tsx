import type { Metadata } from "next";
import {
  AppConfig,
  DEFAULT_LOCALE,
  fetchVersion,
  getCanonicalMapName,
  getMapNameFromVersion,
  getMetadataAlternates,
  getOpenGraphImageUrl,
  getT,
  localizePath,
  translate,
} from "@repo/lib";
import { CoordinatesProvider, I18NProvider } from "../(providers)";
import { HeaderOffset, PageTitle } from "../(header)";
import { FullMapDynamic } from "../(dynamic)/full-map-dynamic";
import { MarkersSearch } from "../(controls)/markers-search";
import { FloatingAds } from "../(ads)";
import { MarkerPanel, ZoneDetailsPanel } from "../(data)";
import { notFound, permanentRedirect } from "next/navigation";
import { getFullDictionary } from "../../dicts";
import { ReactNode } from "react";
import { JSONLDScript } from "./json-ld-script";
import { PreviewReleaseGuard } from "./preview-release-guard";
import { AdditionalTooltipType } from "../(content)";

type MapPageProps = {
  params: Promise<{
    locale?: string;
    map: string;
    type?: string;
    marker?: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** A data-forge dict-optimizer pointer key (`@1hc740`). These are build- AND
 *  locale-specific, so one must never appear in a URL — but older sitemaps
 *  leaked English pointers into localized marker URLs (/de/maps/…/@1hc740). */
const DICT_POINTER_RE = /^@[0-9a-z]{3,12}$/i;

/**
 * Resolve dict-pointer slugs in a marker URL back to readable names: the
 * marker name from the `?id=` spawn id (translated in this locale), else the
 * pointer itself when this locale's dict happens to have it. Non-pointer slugs
 * pass through unchanged. Used for the canonical URL and a 308 to it.
 */
function resolvePointerSlugs(
  dict: Record<string, string>,
  typeName: string | undefined,
  markerId: string | undefined,
  idParam: string | string[] | undefined,
): { typeName?: string; markerId?: string } {
  const deref = (key: string): string | undefined => {
    const v = dict[key];
    if (!v) return undefined;
    const out = v[0] === "@" ? dict[v] : v;
    return out && !DICT_POINTER_RE.test(out) ? out : undefined;
  };
  let resolvedType = typeName;
  if (typeName && DICT_POINTER_RE.test(typeName)) {
    resolvedType = deref(typeName) ?? typeName;
  }
  let resolvedMarker = markerId;
  if (markerId && DICT_POINTER_RE.test(markerId)) {
    const nodeId = Array.isArray(idParam) ? idParam[0] : idParam;
    const spawnId =
      nodeId && nodeId.includes("@")
        ? nodeId.slice(0, nodeId.indexOf("@"))
        : undefined;
    resolvedMarker =
      (spawnId ? deref(spawnId) : undefined) ?? deref(markerId) ?? markerId;
  }
  return { typeName: resolvedType, markerId: resolvedMarker };
}

export function createMapPageGenerateMetadata(appConfig: AppConfig) {
  return async function generateMetadata({
    params,
    searchParams,
  }: MapPageProps): Promise<Metadata> {
    const {
      locale = DEFAULT_LOCALE,
      map,
      type: typeSlug,
      marker: markerSlug,
    } = await params;
    const rawTypeName = typeSlug ? decodeURIComponent(typeSlug) : undefined;
    const rawMarkerId = markerSlug ? decodeURIComponent(markerSlug) : undefined;

    const [dict, version, sp] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
      searchParams,
    ]);
    const { typeName, markerId } = resolvePointerSlugs(
      dict,
      rawTypeName,
      rawMarkerId,
      sp?.id,
    );

    const mapName = getMapNameFromVersion(version, map, dict);
    if (!mapName) {
      return {};
    }

    const t = getT(dict);

    const keywords =
      appConfig.keywords
        .slice(0, 5)
        .map((k) => t(k))
        .join(", ") ?? "";

    const mapDisplayName = t(mapName);

    // Marker-specific metadata
    if (typeName && markerId) {
      // If slug is a human name (no @), use it directly
      // If slug is a nodeId (has @), extract and translate the id prefix
      let displayName: string;
      if (markerId.includes("@")) {
        const idPrefix = markerId.slice(0, markerId.indexOf("@"));
        const translated = t(idPrefix, { fallback: idPrefix });
        displayName =
          translated !== idPrefix && translated !== typeName
            ? translated
            : typeName;
      } else {
        // Slug is already a human-readable name
        displayName = markerId;
      }

      const title = `${displayName} - ${mapDisplayName} | ${appConfig.title}`;
      const description = `Find ${displayName} (${typeName}) on the ${mapDisplayName} interactive map for ${appConfig.title}. ${keywords}`;

      const markerPath = `/maps/${map}/${encodeURIComponent(typeName)}/${encodeURIComponent(markerId)}`;
      const { canonical, languageAlternates } = getMetadataAlternates(
        markerPath,
        locale,
        appConfig.supportedLocales,
      );

      return {
        title,
        description,
        keywords: [
          displayName,
          typeName,
          ...appConfig.keywords.map((k) => t(k)),
        ],
        alternates: {
          canonical,
          languages: languageAlternates,
        },
        openGraph: {
          title,
          description,
          url: canonical,
          images: [getOpenGraphImageUrl(appConfig.name, mapName)],
        },
      };
    }

    const title = t("map.pageTitle", {
      vars: { title: appConfig.title, map: mapDisplayName },
    });
    const description = t("map.intro", {
      vars: { title: appConfig.title, keywords, map: mapDisplayName },
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
        images: [getOpenGraphImageUrl(appConfig.name, mapName)],
      },
    };
    return metaData;
  };
}

export function createMapPage(
  appConfig: AppConfig,
  additionalFilters?: ReactNode,
  additionalTooltip?: AdditionalTooltipType,
  additionalComponents?: ReactNode,
  filterBarExtras?: ReactNode,
) {
  return async function Map({ params, searchParams }: MapPageProps) {
    const {
      locale = DEFAULT_LOCALE,
      map,
      type: typeSlug,
      marker: markerSlug,
    } = await params;
    const rawMarkerId = markerSlug ? decodeURIComponent(markerSlug) : undefined;
    const rawTypeName = typeSlug ? decodeURIComponent(typeSlug) : undefined;

    const [dict, version, sp] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
      searchParams,
    ]);

    const t = getT(dict);
    // Dict-pointer slugs (leaked by old sitemaps) → readable names; 308 below.
    const { typeName, markerId } = resolvePointerSlugs(
      dict,
      rawTypeName,
      rawMarkerId,
      sp?.id,
    );
    const slugsChanged = typeName !== rawTypeName || markerId !== rawMarkerId;

    // Resolve the map tolerantly ('+'-as-space + case-insensitive) and, when the
    // URL isn't the canonical proper-cased %20 form (the one the sitemap emits /
    // Google should index), 308-redirect to it. Avoids serving duplicate-content
    // map URLs. The redirect key is the MAP segment only — the type/marker tail
    // is preserved (mirrors the encode(decode(slug)) pattern used elsewhere), so
    // the canonical target never re-triggers a redirect (no loop).
    const canonical = getCanonicalMapName(version, map, dict);
    if (!canonical) {
      notFound();
    }
    if (
      decodeURIComponent(map.replace(/\+/g, " ")) !== canonical.name ||
      slugsChanged
    ) {
      let dest = localizePath(
        `/maps/${encodeURIComponent(canonical.name)}`,
        locale,
      );
      if (typeName) {
        dest += `/${encodeURIComponent(typeName)}`;
        if (markerId) {
          dest += `/${encodeURIComponent(markerId)}`;
        }
      }
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(sp)) {
        if (Array.isArray(v)) v.forEach((entry) => qs.append(k, entry));
        else if (v !== undefined) qs.set(k, v);
      }
      const query = qs.toString();
      permanentRedirect(query ? `${dest}?${query}` : dest);
    }
    const mapName = canonical.key;

    let decodedMap = decodeURIComponent(map);
    if (!decodedMap.endsWith(" Map")) {
      decodedMap += " Map";
    }

    // For marker pages, build a human-readable title
    let markerDisplayName: string | undefined;
    if (markerId && typeName) {
      if (markerId.includes("@")) {
        const idPrefix = markerId.slice(0, markerId.indexOf("@"));
        const translated = t(idPrefix, { fallback: idPrefix });
        markerDisplayName =
          translated !== idPrefix && translated !== typeName
            ? translated
            : typeName;
      } else {
        markerDisplayName = markerId;
      }
    }

    const mapTitle = markerDisplayName
      ? `${markerDisplayName} - ${decodedMap} | ${appConfig.title}`
      : t("map.pageTitle", {
          vars: { title: appConfig.title, map: decodedMap },
        });
    const mapDescription = t("map.intro", {
      vars: {
        title: appConfig.title,
        map: t(mapName),
        keywords:
          appConfig.keywords
            ?.slice(0, 5)
            .map((k) => t(k))
            .join(", ") ?? "",
      },
    });

    const baseMapUrl = `https://${appConfig.domain}.th.gl${localizePath(`/maps/${map}`, locale)}`;
    const markerUrl =
      typeName && markerId
        ? `${baseMapUrl}/${encodeURIComponent(typeName)}/${encodeURIComponent(markerId)}`
        : undefined;

    return (
      <>
        <JSONLDScript
          json={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: mapTitle,
            description: mapDescription,
            url: markerUrl ?? baseMapUrl,
            isPartOf: {
              "@type": "WebSite",
              name: `${appConfig.title} Interactive Map`,
              url: `https://${appConfig.domain}.th.gl`,
            },
            dateModified: version.createdAt
              ? new Date(version.createdAt).toISOString()
              : undefined,
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
              {
                "@type": "ListItem",
                position: 3,
                name: t(mapName),
                item: baseMapUrl,
              },
              ...(typeName
                ? [
                    {
                      "@type": "ListItem" as const,
                      position: 4,
                      name: typeName,
                      item: `${baseMapUrl}/${encodeURIComponent(typeName)}`,
                    },
                  ]
                : []),
              ...(markerDisplayName && markerUrl
                ? [
                    {
                      "@type": "ListItem" as const,
                      position: 5,
                      name: markerDisplayName,
                      item: markerUrl,
                    },
                  ]
                : []),
            ],
          }}
        />
        {/* Root layout ships only the static UI dict to keep page weight
            small. Map markers / filters / search need to translate game IDs
            client-side, so wrap the map subtree with the full dict here. */}
        <I18NProvider dict={dict} locale={locale}>
          <PreviewReleaseGuard appName={appConfig.name} title={appConfig.title}>
            <CoordinatesProvider
              appName={appConfig.name}
              staticDrawings={version.data.drawings}
              filters={version.data.filters}
              mapNames={Object.keys(version.data.tiles)}
              useCbor
              regions={version.data.regions}
              typesIdMap={
                appConfig.withoutLiveMode ? {} : version.data.typesIdMap
              }
              nodesPaths={version.more.nodes}
              globalFilters={version.data.globalFilters}
              map={mapName}
              clusterPrecision={appConfig.markerOptions?.clusterPrecision}
              inGameCoordinates={appConfig.game?.inGameCoordinates}
            >
              <HeaderOffset full>
                <PageTitle title={mapTitle} />
                <FullMapDynamic
                  appConfig={appConfig}
                  tilesConfig={version.data.tiles}
                  iconsPath={version.more.icons}
                  additionalTooltip={additionalTooltip}
                />
                {additionalComponents}
                <MarkersSearch
                  lastMapUpdate={version.createdAt}
                  tileOptions={version.data.tiles}
                  appName={appConfig.name}
                  iconsPath={version.more.icons}
                  additionalFilters={additionalFilters}
                  filterBarExtras={filterBarExtras}
                  mapEnTitles={Object.fromEntries(
                    Object.keys(version.data.tiles).map((k) => [
                      k,
                      translate(dict, k),
                    ]),
                  )}
                >
                  <FloatingAds id={appConfig.name} />
                </MarkersSearch>
                <MarkerPanel
                  appName={appConfig.name}
                  markerSlug={markerId}
                  additionalTooltip={additionalTooltip}
                  coordinateCopyFormat={
                    appConfig.markerOptions?.coordinateCopyFormat
                  }
                />
                <ZoneDetailsPanel appName={appConfig.name} />
              </HeaderOffset>
            </CoordinatesProvider>
          </PreviewReleaseGuard>
        </I18NProvider>
      </>
    );
  };
}
