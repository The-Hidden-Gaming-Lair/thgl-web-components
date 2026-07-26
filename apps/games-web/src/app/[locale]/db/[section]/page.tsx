import { type Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  fetchDatabaseIndex,
  fetchVersion,
  getMetadataAlternates,
  localizePath,
  DEFAULT_LOCALE,
} from "@repo/lib";
import { getFullDictionary } from "@repo/ui/dicts";
import { JSONLDScript } from "@repo/ui/apps";
import { getAppConfig } from "@/lib/get-app-config";
import { resolveDict, resolveDictWithFallback } from "@/lib/db/resolve-dict";
import { collectionPageJsonLd } from "@/lib/db/json-ld";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { FilterableEntityGrid } from "@/lib/db/filterable-entity-grid";

/**
 * Generic DB section listing. Works for any tenant that defines `db` in its
 * AppConfig — the section slug is matched against `db.homeSections`. Static
 * per-section routes (homm/drakantos/etc.) still take precedence over this
 * dynamic segment; this catches everything else (e.g. Gothic's weapon/armor/…).
 */
type PageProps = { params: Promise<{ locale?: string; section: string }> };

async function resolveSection(section: string, locale: string) {
  const appConfig = await getAppConfig();
  const db = appConfig.db;
  if (!db) notFound();
  const secCfg = db.homeSections.find(
    (s) => s.href === `/db/${section}` || s.type === section,
  );
  if (!secCfg) {
    // An old per-category slug folded into a parent section via extraTypes
    // (e.g. /db/weapon → /db/items). 308-redirect to keep old URLs alive.
    const parent = db.homeSections.find((s) =>
      (s.extraTypes ?? []).includes(section),
    );
    if (parent) permanentRedirect(localizePath(parent.href, locale));
    notFound();
  }
  return { appConfig, db, secCfg };
}

function getSectionLabel(
  appConfig: Awaited<ReturnType<typeof getAppConfig>>,
  dict: Record<string, string>,
  type: string,
  section: string,
): string {
  return (
    appConfig.db?.typeLabels?.[type] ||
    resolveDict(dict, `config.internalLinks.${section}.title`) ||
    resolveDict(dict, type) ||
    section
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE, section } = await params;
  const { appConfig, secCfg } = await resolveSection(section, locale);
  const dict = await getFullDictionary(appConfig.name, locale);
  const label = getSectionLabel(appConfig, dict, secCfg.type, section);
  const title = `${label} - ${appConfig.title}`;
  const description = `Browse all ${label.toLowerCase()} in ${appConfig.title}.`;
  const { canonical, languageAlternates } = getMetadataAlternates(
    `/db/${section}`,
    locale,
    appConfig.supportedLocales,
  );
  return {
    title,
    description,
    alternates: { canonical, languages: languageAlternates },
    openGraph: {
      title,
      description,
      url: canonical,
      images: ["/opengraph-image.jpg"],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale = DEFAULT_LOCALE, section } = await params;
  const { appConfig, secCfg } = await resolveSection(section, locale);
  const types = [secCfg.type, ...(secCfg.extraTypes ?? [])];

  const [dict, database, version] = await Promise.all([
    getFullDictionary(appConfig.name, locale),
    fetchDatabaseIndex(appConfig.name),
    fetchVersion(appConfig.name),
  ]);

  const data = database.filter(
    (cat) =>
      types.includes(cat.type) ||
      (secCfg.typePrefix ? cat.type.startsWith(secCfg.typePrefix) : false),
  );
  if (!data.length) notFound();

  const label = getSectionLabel(appConfig, dict, secCfg.type, section);
  const iconsHash = version.more.icons;
  const totalCount = data.reduce((sum, cat) => sum + cat.items.length, 0);
  const jsonLdItems = data.flatMap((cat) =>
    cat.items.map((i) => ({ id: i.id, name: resolveDict(dict, i.id) })),
  );

  return (
    <>
      <JSONLDScript
        json={collectionPageJsonLd({
          appConfig,
          section,
          sectionLabel: label,
          description: `Browse all ${label.toLowerCase()} in ${appConfig.title}.`,
          items: jsonLdItems,
          locale,
        })}
      />
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Breadcrumb crumbs={[{ label }]} locale={locale} dict={dict} />
        <h1 className="text-2xl font-bold mb-2">{label}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {totalCount.toLocaleString()} entries
        </p>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-6">
        <FilterableEntityGrid
          items={data.flatMap((cat) =>
            cat.items.map((i) => ({
              id: i.id,
              icon: i.icon && typeof i.icon === "object" ? i.icon : undefined,
              groupId: i.groupId ?? "other",
              name: resolveDict(dict, i.id),
              groupLabel: resolveDictWithFallback(
                dict,
                i.groupId ?? "other",
                i.groupId ?? "other",
              ),
            })),
          )}
          section={section}
          locale={locale}
          iconsHash={iconsHash}
          appName={appConfig.name}
        />
      </div>
    </>
  );
}
