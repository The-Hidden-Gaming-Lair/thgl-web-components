import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { HeaderOffset, PageTitle } from "../(header)";
import { ContentLayout } from "../(ads)";
import { NavGrid, ReleaseNotes, Subtitle } from "../(content)";
import {
  AppConfig,
  DEFAULT_LOCALE,
  fetchDatabaseIndex,
  fetchVersion,
  getIconsUrl,
  getMetadataAlternates,
  getPreviewImageUrl,
  getT,
  getUpdateMessages,
  type IconSprite,
  localizePath,
  resolveForgeUrl,
} from "@repo/lib";
import type { NavCardProps } from "../(content)";
import { getFullDictionary, getStaticDictionary } from "../../dicts";
import { JSONLDScript } from "./json-ld-script";

const MAX_HOME_MAP_CARDS = 6;

type PageProps = {
  params: Promise<{ locale?: string }>;
};

export function createHomePageGenerateMetadata(appConfig: AppConfig) {
  return async function generateMetadata({
    params,
  }: PageProps): Promise<Metadata> {
    const { locale = DEFAULT_LOCALE } = await params;
    const dict = await getStaticDictionary(appConfig.name, locale);
    const t = getT(dict);

    // Featured sections for the "Explore {{features}} in {{title}}…" meta
    // description. Prefer curated internalLinks; fall back to the game's
    // keywords so games without internalLinks (e.g. Avowed, Satisfactory)
    // never render an empty slot ("Explore  in {{title}}…").
    const featureSource =
      appConfig.internalLinks && appConfig.internalLinks.length > 0
        ? appConfig.internalLinks.slice(0, 3).map((link) => t(link.title))
        : appConfig.keywords.slice(0, 3).map((k) => t(k));
    const features = featureSource.join(", ");

    const keywords =
      appConfig.keywords
        .slice(0, 5)
        .map((k) => t(k))
        .join(", ") ?? "";

    const title = t("home.pageTitle", { vars: { title: appConfig.title } });
    const description = t("home.intro", {
      vars: { title: appConfig.title, features, keywords },
    });

    const { canonical, languageAlternates } = getMetadataAlternates(
      "/",
      locale,
      appConfig.supportedLocales,
    );

    return {
      title,
      description,
      keywords: appConfig.keywords.map((k) => t(k)),
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
  };
}

export function createHomePage(appConfig: AppConfig) {
  return async function Home({ params }: PageProps) {
    const { locale = DEFAULT_LOCALE } = await params;
    // Hybrid games (maps + a database, e.g. Subnautica 2 / Witchspire) render the
    // database sections as the same polished card grid the DB-only home uses, instead
    // of plain feature rows. Fetch the index only when there are sections to count.
    const dbSections = appConfig.db?.homeSections ?? [];
    const [dict, updateMessages, version, database] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      getUpdateMessages(appConfig.name),
      fetchVersion(appConfig.name),
      dbSections.length
        ? fetchDatabaseIndex(appConfig.name).catch(() => [])
        : Promise.resolve([]),
    ]);

    const t = getT(dict);

    // Resolve a dict value, following @-pointers, falling back to the raw string
    // (mirrors the DB home's resolveDict so plain-string titles/descriptions pass through).
    const resolveDbText = (key: string): string => {
      const v = dict[key];
      if (!v) return key;
      return v[0] === "@" ? (dict[v] ?? v) : v;
    };

    // Entity counts per database type, for the section cards.
    const dbCounts = new Map<string, number>();
    for (const entry of database) {
      if (entry.type.startsWith("_")) continue;
      dbCounts.set(
        entry.type,
        (dbCounts.get(entry.type) ?? 0) + entry.items.length,
      );
    }
    const dbHrefs = new Set(dbSections.map((s) => s.href));

    const features =
      appConfig.internalLinks
        ?.slice(0, 3)
        .map((link) => t(link.title))
        .join(", ") ?? "";

    const keywords = appConfig.keywords?.map((k) => t(k)).join(", ") ?? "";

    const internalLinkHrefs = new Set(
      appConfig.internalLinks?.map((link) => link.href) ?? [],
    );
    const mapNames = Object.keys(version.data.tiles);
    const mapCards: NavCardProps[] = await Promise.all(
      mapNames
        .filter((map) => {
          const mapName = t(map);
          const href = `/maps/${encodeURIComponent(mapName)}`;
          return !internalLinkHrefs.has(href);
        })
        .map(async (map) => {
          const mapName = t(map);
          const tileUrl = version.data.tiles[map]?.url ?? "";
          // Extract tile base path from URL like "/map-tiles/0305_Forest-b12cd6b0/{z}/{y}/{x}.webp"
          const tileBase = tileUrl
            .replace(/^\/map-tiles\//, "")
            .replace(/\/\{z\}.*$/, "")
            .replace(/-[0-9a-f]{16,}$/, "");
          const mapLocCount = version.counts?.byMap?.[map] || 0;
          const desc =
            mapLocCount > 0
              ? `${mapLocCount.toLocaleString()} locations`
              : `Navigate ${mapName} with our interactive maps.`;
          return {
            title: `${mapName} Map`,
            description: desc,
            href: `/maps/${encodeURIComponent(mapName)}`,
            iconName: "Map" as NavCardProps["iconName"],
            // Resolve through the host-aware forge proxy so next/image's
            // server-side optimizer fetches the correct origin: the local
            // data-forge on *-dev hosts, the CDN otherwise. Without this the
            // optimizer resolves the relative /__forge-cdn path against
            // localhost:3100 (not the -dev tenant) and always hits prod.
            bgImage: tileBase
              ? await resolveForgeUrl(
                  getPreviewImageUrl(appConfig.name, tileBase),
                )
              : undefined,
            linkText: `Explore the ${mapName}`,
          };
        }),
    );

    const hasCompanionApp =
      appConfig.appUrl && appConfig.appUrl.includes("companion-app");

    // Split internalLinks into map cards, guide links, and other feature cards
    // Enrich map cards with location counts from version.counts.byMap
    const mapNameToKey = new Map<string, string>();
    for (const tileKey of Object.keys(version.data.tiles)) {
      mapNameToKey.set(t(tileKey), tileKey);
    }
    const internalMapCards: NavCardProps[] =
      appConfig.internalLinks
        ?.filter((link) => link.href?.startsWith("/maps/"))
        .map((link) => {
          const mapDisplayName = decodeURIComponent(
            link.href.replace("/maps/", ""),
          );
          const tileKey = mapNameToKey.get(mapDisplayName);
          const locCount = tileKey && version.counts?.byMap?.[tileKey];
          return {
            ...link,
            description: locCount
              ? `${locCount.toLocaleString()} locations`
              : link.description,
          };
        }) ?? [];
    // Feature cards: non-map, non-guide links (e.g. "Weapons", "Deviant Locations").
    // Exclude any that are also DB sections — those render as the card grid below, so
    // they must not also appear as plain feature rows.
    const featureCards =
      appConfig.internalLinks?.filter(
        (link) =>
          !link.href?.startsWith("/maps/") &&
          !link.href?.startsWith("/guides") &&
          !dbHrefs.has(link.href),
      ) ?? [];

    const allMapCards = [...internalMapCards, ...mapCards];
    const totalMapCount = allMapCards.length;

    // Total locations: use counts from version if available, otherwise count filter types
    const totalLocations = version.counts?.total;
    const totalLocationTypes = version.data.filters.reduce(
      (sum, group) => sum + group.values.length,
      0,
    );

    const lastUpdated = version.createdAt ? new Date(version.createdAt) : null;

    // Build highlighted filter types for the home page.
    // Priority: topFilters config > first N filter values from each group
    const MAX_HIGHLIGHTED_FILTERS = 8;
    type HighlightedFilter = {
      id: string;
      name: string;
      group: string;
      locationCount: number;
      href: string;
      icon?: IconSprite;
    };
    const highlightedFilters: HighlightedFilter[] = [];

    // Build lookup: filter value ID → { groupName, icon }
    const filterLookup = new Map<
      string,
      { groupName: string; icon?: IconSprite }
    >();
    for (const group of version.data.filters) {
      for (const value of group.values) {
        filterLookup.set(value.id, {
          groupName: group.group,
          icon:
            typeof value.icon === "object"
              ? (value.icon as IconSprite)
              : undefined,
        });
      }
    }

    if (appConfig.topFilters && appConfig.topFilters.length > 0) {
      // Use explicitly configured top filters
      for (const filterId of appConfig.topFilters) {
        if (highlightedFilters.length >= MAX_HIGHLIGHTED_FILTERS) break;
        const info = filterLookup.get(filterId);
        if (!info) continue;
        const name = t(filterId);
        highlightedFilters.push({
          id: filterId,
          name,
          group: t(info.groupName),
          locationCount: version.counts?.byType?.[filterId] || 0,
          href: `/guides/${encodeURIComponent(name)}`,
          icon: info.icon,
        });
      }
    }
    // Auto-pick from groups to fill remaining slots
    const usedIds = new Set(highlightedFilters.map((f) => f.id));
    for (const group of version.data.filters) {
      if (highlightedFilters.length >= MAX_HIGHLIGHTED_FILTERS) break;
      const first = group.values[0];
      if (!first || usedIds.has(first.id)) continue;
      const info = filterLookup.get(first.id);
      const name = t(first.id);
      highlightedFilters.push({
        id: first.id,
        name,
        group: t(group.group),
        locationCount: version.counts?.byType?.[first.id] || 0,
        href: `/guides/${encodeURIComponent(name)}`,
        icon: info?.icon,
      });
    }

    return (
      <>
        <JSONLDScript
          json={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: `${appConfig.title} Interactive Map - The Hidden Gaming Lair`,
            url: `https://${appConfig.domain}.th.gl`,
            description: t("home.intro", {
              vars: { title: appConfig.title, features, keywords },
            }),
            publisher: {
              "@type": "Organization",
              name: "The Hidden Gaming Lair",
              url: "https://www.th.gl",
            },
          }}
        />
        <HeaderOffset full>
          <ContentLayout
            id={appConfig.name}
            header={
              <section className="space-y-6">
                <PageTitle
                  title={t("home.pageTitle", {
                    vars: { title: appConfig.title },
                  })}
                />
                {/* Title + intro */}
                <div className="space-y-2">
                  <Subtitle
                    title={t("home.sectionTitle", {
                      vars: { title: appConfig.title },
                    })}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("home.intro", {
                      vars: { title: appConfig.title, features, keywords },
                    })}
                  </p>
                </div>

                {/* Stats bar */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 text-muted-foreground flex-wrap">
                  {totalMapCount > 0 && (
                    <div className="text-center px-3 py-1">
                      <div className="text-lg font-semibold text-foreground tabular-nums">
                        {totalMapCount}
                      </div>
                      <div className="text-xs uppercase tracking-wider">
                        {totalMapCount === 1 ? "Map" : "Maps"}
                      </div>
                    </div>
                  )}
                  {(totalLocations || totalLocationTypes > 0) && (
                    <>
                      <div className="h-8 w-px bg-muted" />
                      <div className="text-center px-3 py-1">
                        <div className="text-lg font-semibold text-foreground tabular-nums">
                          {totalLocations
                            ? totalLocations.toLocaleString()
                            : totalLocationTypes}
                        </div>
                        <div className="text-xs uppercase tracking-wider">
                          {totalLocations ? "Locations" : "Location Types"}
                        </div>
                      </div>
                    </>
                  )}
                  {lastUpdated && (
                    <>
                      <div className="h-8 w-px bg-muted" />
                      <div className="text-center px-3 py-1">
                        <div className="text-sm font-medium text-foreground">
                          {lastUpdated.toLocaleDateString("en", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-xs uppercase tracking-wider">
                          Last Updated
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* 1. Companion app CTA */}
                {hasCompanionApp && (
                  <a
                    href={appConfig.appUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mx-auto flex items-center gap-3 border border-muted rounded-lg px-4 py-2.5 hover:border-primary/50 transition-colors max-w-md"
                  >
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    <span className="text-sm text-left">
                      <strong className="text-foreground block text-sm">
                        In-Game Companion App
                      </strong>
                      <span className="text-xs text-muted-foreground">
                        Live overlay with player tracking and auto-discovery
                      </span>
                    </span>
                    <span className="text-primary text-xs ml-auto shrink-0 group-hover:underline">
                      Get it free →
                    </span>
                  </a>
                )}

                {/* 2. Map cards */}
                {allMapCards.length > 0 &&
                  (() => {
                    const visible = allMapCards.slice(0, MAX_HOME_MAP_CARDS);
                    const withImage = visible.filter((c) => c.bgImage);
                    const withoutImage = visible.filter((c) => !c.bgImage);
                    return (
                      <div className="space-y-2">
                        {withImage.length > 0 && (
                          <div
                            className={`grid gap-4 ${
                              withImage.length === 1
                                ? "grid-cols-1 max-w-md mx-auto"
                                : withImage.length === 2
                                  ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                            }`}
                          >
                            {withImage.map((card) => (
                              <Link
                                key={card.href ?? card.title}
                                href={localizePath(card.href ?? "/", locale)}
                                className="group block border rounded-lg overflow-hidden hover:border-primary transition-colors"
                              >
                                <div className="aspect-video bg-muted/30 relative">
                                  <Image
                                    src={card.bgImage!}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                  />
                                </div>
                                <div className="px-3 py-2 flex items-baseline justify-between gap-2">
                                  <span className="font-medium text-sm truncate">
                                    {t(card.title)}
                                  </span>
                                  <span className="text-xs text-muted-foreground shrink-0">
                                    {card.description &&
                                      /^\d/.test(card.description) && (
                                        <>{card.description} · </>
                                      )}
                                    <span className="group-hover:text-primary transition-colors">
                                      Explore →
                                    </span>
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                        {withoutImage.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {withoutImage.map((card) => (
                              <Link
                                key={card.href ?? card.title}
                                href={localizePath(card.href ?? "/", locale)}
                                className="group block border rounded-lg overflow-hidden hover:border-primary transition-colors"
                              >
                                <div className="px-3 py-2 flex items-baseline justify-between gap-2">
                                  <span className="font-medium text-sm truncate">
                                    {t(card.title)}
                                  </span>
                                  <span className="text-xs text-muted-foreground shrink-0">
                                    {card.description &&
                                      /^\d/.test(card.description) && (
                                        <>{card.description} · </>
                                      )}
                                    <span className="group-hover:text-primary transition-colors">
                                      Explore →
                                    </span>
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                {allMapCards.length > MAX_HOME_MAP_CARDS && (
                  <Link
                    href={localizePath("/maps", locale)}
                    className="inline-flex items-center gap-2 rounded-md border border-muted/50 px-4 py-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    {t("maps.viewAll", {
                      vars: { count: String(allMapCards.length) },
                      fallback: `View all ${allMapCards.length} maps`,
                    })}{" "}
                    →
                  </Link>
                )}

                {/* 3. Database sections (hybrid map + DB games) — the same polished
                    card grid the DB-only home uses, driven by appConfig.db.homeSections. */}
                {dbSections.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
                      Database
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
                      {dbSections.map((section) => {
                        const count =
                          (dbCounts.get(section.type) ?? 0) +
                          (section.extraTypes ?? []).reduce(
                            (sum, ty) => sum + (dbCounts.get(ty) ?? 0),
                            0,
                          );
                        const title = section.titleKey
                          ? resolveDbText(section.titleKey)
                          : (section.titleFallback ?? section.type);
                        const desc = section.description
                          ? resolveDbText(section.description)
                          : undefined;
                        return (
                          <Link
                            key={section.href}
                            href={localizePath(section.href, locale)}
                            className="group relative border border-slate-800 hover:border-amber-800/50 rounded-lg p-5 transition-all hover:bg-slate-900/50"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                {section.icon}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-lg font-semibold group-hover:text-amber-400 transition-colors">
                                    {title}
                                  </h3>
                                  <span className="text-xs text-muted-foreground tabular-nums">
                                    {count}
                                  </span>
                                </div>
                                {desc && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {desc}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Feature cards (non-map, non-guide internal links) */}
                {featureCards.length > 0 && <NavGrid cards={featureCards} />}

                {/* 4. Highlighted filters / guides */}
                {highlightedFilters.length > 0 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {highlightedFilters.map((filter) => (
                        <Link
                          key={filter.id}
                          href={localizePath(filter.href, locale)}
                          className="flex items-center gap-2.5 rounded-md border border-muted/50 px-2.5 py-2 text-left hover:border-primary/50 transition-colors group"
                        >
                          {filter.icon && (
                            <img
                              alt=""
                              role="presentation"
                              className="shrink-0 object-none"
                              src={getIconsUrl(
                                appConfig.name,
                                filter.icon.url,
                                version.more.icons,
                              )}
                              width={filter.icon.width}
                              height={filter.icon.height}
                              style={{
                                objectPosition: `-${filter.icon.x}px -${filter.icon.y}px`,
                                width: filter.icon.width,
                                height: filter.icon.height,
                                zoom: 24 / filter.icon.width,
                              }}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                              {filter.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {filter.group}
                              {filter.locationCount > 0 &&
                                ` · ${filter.locationCount.toLocaleString()}`}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <Link
                      href={localizePath("/guides", locale)}
                      className="inline-flex items-center gap-2 rounded-md border border-muted/50 px-4 py-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      View all guides →
                    </Link>
                  </div>
                )}
              </section>
            }
            content={<ReleaseNotes updateMessages={updateMessages} />}
          />
        </HeaderOffset>
      </>
    );
  };
}
