import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AppConfig,
  DEFAULT_LOCALE,
  fetchDatabaseIndex,
  fetchVersion,
  getMetadataAlternates,
  getT,
  localizePath,
} from "@repo/lib";
import { HeaderOffset, PageTitle } from "../(header)";
import { ContentLayout } from "../(ads)";
import { Subtitle } from "../(content)";
import { getFullDictionary, getStaticDictionary } from "../../dicts";
import { JSONLDScript } from "./json-ld-script";
import { PreviewReleaseGuard } from "./preview-release-guard";
import { DbGlobalSearch } from "./db-global-search";

/**
 * `/db` database landing — the section-overview hub for any tenant with a `db`
 * config. Mirrors the `/maps` and `/guides` listing pages (header + breadcrumb +
 * a card per `db.homeSections`), NOT the DB-only home (no hero stats / release
 * notes). Lists ALL sections; the home page caps its grid at 6 and links here.
 */
type PageProps = { params: Promise<{ locale?: string }> };

export function createDbPageGenerateMetadata(appConfig: AppConfig) {
  return async function generateMetadata({
    params,
  }: PageProps): Promise<Metadata> {
    const { locale = DEFAULT_LOCALE } = await params;
    if (!appConfig.db) notFound();
    const dict = await getStaticDictionary(appConfig.name, locale);
    const t = getT(dict);
    const title = t("db.pageTitle", {
      vars: { title: appConfig.title },
      fallback: `${appConfig.title} Database`,
    });
    const description = t("db.intro", {
      vars: { title: appConfig.title },
      fallback: `Browse the complete ${appConfig.title} database.`,
    });
    const { canonical, languageAlternates } = getMetadataAlternates(
      "/db",
      locale,
      appConfig.supportedLocales,
    );
    return {
      title,
      description,
      keywords: appConfig.keywords.map((k) => t(k)),
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

export function createDbPage(appConfig: AppConfig) {
  return async function DbPage({ params }: PageProps) {
    const { locale = DEFAULT_LOCALE } = await params;
    const db = appConfig.db;
    if (!db) notFound();

    const [dict, version, database] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
      fetchDatabaseIndex(appConfig.name),
    ]);
    const t = getT(dict);

    const resolveDbText = (key: string): string => {
      const v = dict[key];
      if (!v) return key;
      return v[0] === "@" ? (dict[v] ?? v) : v;
    };

    const counts = new Map<string, number>();
    for (const entry of database) {
      if (entry.type.startsWith("_")) continue;
      counts.set(
        entry.type,
        (counts.get(entry.type) ?? 0) + entry.items.length,
      );
    }

    const sections = db.homeSections.map((section) => {
      // Count by exact type, extraTypes, AND typePrefix (mirrors /db/[section]).
      const count = [...counts].reduce(
        (sum, [ty, c]) =>
          ty === section.type ||
          (section.extraTypes ?? []).includes(ty) ||
          (section.typePrefix ? ty.startsWith(section.typePrefix) : false)
            ? sum + c
            : sum,
        0,
      );
      const title = section.titleKey
        ? resolveDbText(section.titleKey)
        : (section.titleFallback ?? section.type);
      const desc = section.description
        ? resolveDbText(section.description)
        : undefined;
      return { ...section, title, desc, count };
    });

    // Flat search index across every section for the global DB search box.
    const sectionForType = (type: string) =>
      sections.find(
        (s) =>
          s.type === type ||
          (s.extraTypes ?? []).includes(type) ||
          (s.typePrefix ? type.startsWith(s.typePrefix) : false),
      );
    const searchItems = database
      .filter((e) => !e.type.startsWith("_"))
      .flatMap((entry) => {
        const sec = sectionForType(entry.type);
        if (!sec) return [];
        const slug = sec.href.replace(/^\/db\//, "");
        return entry.items.map((i) => ({
          id: i.id,
          name: resolveDbText(i.id),
          section: slug,
          sectionLabel: sec.title,
        }));
      });

    return (
      <>
        <JSONLDScript
          json={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: sections.map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: s.title,
              url: `https://${appConfig.domain}.th.gl${localizePath(s.href, locale)}`,
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
                name: "Database",
                item: `https://${appConfig.domain}.th.gl${localizePath("/db", locale)}`,
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
                    title={t("db.pageTitle", {
                      vars: { title: appConfig.title },
                      fallback: `${appConfig.title} Database`,
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
                      <li aria-current="page">Database</li>
                    </ol>
                  </nav>
                  <Subtitle
                    title={t("db.title", {
                      vars: { title: appConfig.title },
                      fallback: `${appConfig.title} Database`,
                    })}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("db.description", {
                      vars: {
                        title: appConfig.title,
                        count: String(sections.length),
                      },
                      fallback: `Browse all ${sections.length} database categories for ${appConfig.title}.`,
                    })}
                  </p>
                  <DbGlobalSearch items={searchItems} locale={locale} />
                </>
              }
              content={
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left mt-4">
                  {sections.map((section) => (
                    <li key={section.href}>
                      <Link
                        href={localizePath(section.href, locale)}
                        className="group relative block h-full border border-slate-800 hover:border-amber-800/50 rounded-lg p-5 transition-all hover:bg-slate-900/50"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                            {section.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h2 className="text-lg font-semibold group-hover:text-amber-400 transition-colors">
                                {section.title}
                              </h2>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {section.count.toLocaleString()}
                              </span>
                            </div>
                            {section.desc && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {section.desc}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              }
            />
          </HeaderOffset>
        </PreviewReleaseGuard>
      </>
    );
  };
}
