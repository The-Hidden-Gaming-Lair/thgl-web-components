import type { Metadata } from "next";
import Link from "next/link";
import {
  AppConfig,
  fetchDatabaseIndex,
  fetchVersion,
  getUpdateMessages,
  DEFAULT_LOCALE,
  getMetadataAlternates,
  localizePath,
} from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { ReleaseNotes } from "@repo/ui/content";
import { JSONLDScript } from "@repo/ui/apps";
import { getFullDbDictionary } from "@repo/ui/dicts";
import { HeroSearch } from "@/lib/db/hero-search";
import { resolveDict } from "@/lib/db/resolve-dict";

type PageProps = {
  params: Promise<{ locale?: string }>;
};

export function createDbHomePageGenerateMetadata(appConfig: AppConfig) {
  const dbConfig = appConfig.db;
  if (!dbConfig) {
    throw new Error(
      `createDbHomePageGenerateMetadata called for "${appConfig.name}" which has no appConfig.db`,
    );
  }
  return async function generateMetadata({
    params,
  }: PageProps): Promise<Metadata> {
    const { locale = DEFAULT_LOCALE } = await params;
    const title = `${appConfig.title} Database — The Hidden Gaming Lair`;
    const description = `Complete database for ${appConfig.title} — browse ${appConfig.keywords.slice(0, 4).join(", ").toLowerCase()} with stats, abilities, and cross-references.`;
    const { canonical, languageAlternates } = getMetadataAlternates(
      "/",
      locale,
      appConfig.supportedLocales,
    );
    return {
      title,
      description,
      keywords: appConfig.keywords,
      alternates: { canonical, languages: languageAlternates },
      openGraph: {
        title,
        description,
        url: canonical,
        images: ["/opengraph-image.jpg"],
      },
    };
  };
}

/**
 * Render the DB-site landing page: hero with stats, search button, a grid
 * of section cards (each with entity counts), extra full-width links,
 * and the Website Updates changelog.
 *
 * Driven entirely by `appConfig.db.homeSections` — to support a new
 * database game, populate the registry and this page renders correctly
 * without any code changes here.
 */
export function createDbHomePage(appConfig: AppConfig) {
  const dbConfig = appConfig.db;
  if (!dbConfig) {
    throw new Error(
      `createDbHomePage called for "${appConfig.name}" which has no appConfig.db`,
    );
  }
  const languageCount =
    dbConfig.languageCount ?? appConfig.supportedLocales.length;

  return async function HomePage({ params }: PageProps) {
    const { locale = DEFAULT_LOCALE } = await params;
    const [database, version, updateMessages, dict] = await Promise.all([
      fetchDatabaseIndex(appConfig.name),
      fetchVersion(appConfig.name),
      getUpdateMessages(appConfig.name),
      getFullDbDictionary(appConfig.name, locale),
    ]);

    const lastUpdated = version.createdAt ? new Date(version.createdAt) : null;

    const counts = new Map<string, number>();
    for (const entry of database) {
      if (entry.type.startsWith("_")) continue;
      counts.set(
        entry.type,
        (counts.get(entry.type) ?? 0) + entry.items.length,
      );
    }
    const totalItems = Array.from(counts.values()).reduce((a, b) => a + b, 0);

    const baseUrl = `https://${appConfig.domain}.th.gl`;
    const description = `Complete database for ${appConfig.title} — ${totalItems.toLocaleString()} entries across ${counts.size} categories.`;

    return (
      <>
        <JSONLDScript
          json={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: `${appConfig.title} Database — The Hidden Gaming Lair`,
            url: baseUrl,
            description,
            inLanguage: appConfig.supportedLocales,
            publisher: {
              "@type": "Organization",
              name: "The Hidden Gaming Lair",
              url: "https://www.th.gl",
            },
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${baseUrl}/db/units?q={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
          }}
        />
        <HeaderOffset full>
          <ContentLayout
            id={appConfig.name}
            header={
              <section className="space-y-8">
                <div className="text-center space-y-3">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {appConfig.title}
                  </h1>
                  <p className="text-lg text-amber-400">
                    {dbConfig.heroSubtitle}
                  </p>

                  <div className="flex items-center justify-center gap-6 pt-2 text-muted-foreground flex-wrap">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground tabular-nums">
                        {totalItems.toLocaleString()}
                      </div>
                      <div className="text-xs uppercase tracking-wider">
                        Database Entries
                      </div>
                    </div>
                    <div className="h-8 w-px bg-muted" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground tabular-nums">
                        {counts.size}
                      </div>
                      <div className="text-xs uppercase tracking-wider">
                        Categories
                      </div>
                    </div>
                    <div className="h-8 w-px bg-muted" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground tabular-nums">
                        {languageCount}
                      </div>
                      <div className="text-xs uppercase tracking-wider">
                        Languages
                      </div>
                    </div>
                    {lastUpdated && (
                      <>
                        <div className="h-8 w-px bg-muted" />
                        <div className="text-center">
                          <div className="text-sm font-medium text-foreground">
                            {lastUpdated.toLocaleDateString(locale, {
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
                </div>

                <HeroSearch placeholder={dbConfig.searchPlaceholder} />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
                  {dbConfig.homeSections.map((section) => {
                    const count =
                      (counts.get(section.type) ?? 0) +
                      (section.extraTypes ?? []).reduce(
                        (sum, t) => sum + (counts.get(t) ?? 0),
                        0,
                      );
                    const link = appConfig.internalLinks?.find(
                      (l) => l.href === section.href,
                    );
                    const titleKey = section.titleKey ?? link?.title;
                    const title = titleKey
                      ? resolveDict(dict, titleKey)
                      : (section.titleFallback ?? section.type);
                    const descKey = section.description ?? link?.description;
                    const desc = descKey
                      ? resolveDict(dict, descKey)
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
                              <h2 className="text-lg font-semibold group-hover:text-amber-400 transition-colors">
                                {title}
                              </h2>
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

                {dbConfig.homeExtraLinks &&
                  dbConfig.homeExtraLinks.length > 0 && (
                    <div className="text-left space-y-2">
                      {dbConfig.homeExtraLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={localizePath(link.href, locale)}
                          className="group flex items-start gap-3 border border-slate-800 hover:border-amber-800/50 rounded-lg p-5 transition-all hover:bg-slate-900/50"
                        >
                          <span className="text-2xl mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                            {link.icon}
                          </span>
                          <div>
                            <h2 className="text-lg font-semibold group-hover:text-amber-400 transition-colors">
                              {resolveDict(dict, link.title)}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-1">
                              {resolveDict(dict, link.description)}
                            </p>
                          </div>
                        </Link>
                      ))}
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
