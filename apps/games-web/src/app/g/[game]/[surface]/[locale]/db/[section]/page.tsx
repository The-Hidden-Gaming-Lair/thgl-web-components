import { type Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  fetchDatabaseIndex,
  fetchVersion,
  getMetadataAlternates,
  localizePath,
  translate,
  DEFAULT_LOCALE,
} from "@repo/lib";
import { getFullDbDictionary } from "@repo/ui/dicts";
import { JSONLDScript } from "@repo/ui/apps";
import { getAppConfig } from "@/lib/get-app-config";
import { resolveDict, resolveDictWithFallback } from "@/lib/db/resolve-dict";
import { breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/db/json-ld";
import {
  buildSectionDescription,
  buildSectionTitle,
  getSectionLabels,
} from "@/lib/db/seo";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { FilterableEntityGrid } from "@/lib/db/filterable-entity-grid";
import { getPartnerSectionLink } from "@/lib/db/partner-links";
import { PartnerLinkRow } from "@/lib/db/partner-link";
import { fetchFullPropsCategory, flattenPropsText } from "@/lib/db/props-text";

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

type SectionCfg = NonNullable<
  Awaited<ReturnType<typeof getAppConfig>>["db"]
>["homeSections"][number];

/** Categories of the database index that belong to this section. */
function sectionCategories<T extends { type: string }>(
  database: T[],
  secCfg: SectionCfg,
): T[] {
  const types = [secCfg.type, ...(secCfg.extraTypes ?? [])];
  return database.filter(
    (cat) =>
      types.includes(cat.type) ||
      (secCfg.typePrefix ? cat.type.startsWith(secCfg.typePrefix) : false),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE, section } = await params;
  const { appConfig, secCfg } = await resolveSection(section, locale);
  const [dict, database] = await Promise.all([
    getFullDbDictionary(appConfig.name, locale),
    fetchDatabaseIndex(appConfig.name).catch(() => []),
  ]);
  const { plural: label } = getSectionLabels(appConfig, dict, secCfg, section);
  const cats = sectionCategories(database, secCfg);
  const count = cats.reduce((sum, cat) => sum + cat.items.length, 0);
  const title = count
    ? buildSectionTitle(dict, label, count, appConfig.title)
    : `${label} | ${appConfig.title}`;
  const description = buildSectionDescription(
    dict,
    label,
    count,
    appConfig.title,
    cats.flatMap((cat) =>
      cat.items.slice(0, 4).map((i) => resolveDict(dict, i.id)),
    ),
  );
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
  const [dict, database, version] = await Promise.all([
    getFullDbDictionary(appConfig.name, locale),
    fetchDatabaseIndex(appConfig.name),
    fetchVersion(appConfig.name),
  ]);

  const data = sectionCategories(database, secCfg);
  if (!data.length) notFound();

  // Flattened effect text per item id, so the grid's filter can match effects
  // ("Ranged Offence") and not just names. The slim index drops props — pull
  // them from the per-type files.
  const textById = new Map<string, string>();
  await Promise.all(
    data.map(async (cat) => {
      const full = await fetchFullPropsCategory(appConfig.name, cat);
      for (const item of full.items) {
        const text = flattenPropsText(item.props);
        if (text) textById.set(item.id, text);
      }
    }),
  );

  const { plural: label } = getSectionLabels(appConfig, dict, secCfg, section);
  const iconsHash = version.more.icons;
  const totalCount = data.reduce((sum, cat) => sum + cat.items.length, 0);
  const jsonLdItems = data.flatMap((cat) =>
    cat.items.map((i) => ({ id: i.id, name: resolveDict(dict, i.id) })),
  );
  const crumbs = [
    {
      label: translate(dict, "db.database", { fallback: "Database" }),
      href: "/db",
    },
    { label },
  ];
  const pageUrl = `https://${appConfig.domain}.th.gl${localizePath(`/db/${section}`, locale)}`;

  return (
    <>
      <JSONLDScript
        json={collectionPageJsonLd({
          appConfig,
          section,
          sectionLabel: label,
          description: buildSectionDescription(
            dict,
            label,
            totalCount,
            appConfig.title,
            jsonLdItems.slice(0, 4).map((i) => i.name),
          ),
          items: jsonLdItems,
          locale,
        })}
      />
      <JSONLDScript
        json={breadcrumbJsonLd({
          appConfig,
          homeLabel: dict["ui.nav_home"] || "Home",
          crumbs,
          url: pageUrl,
          locale,
        })}
      />
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Breadcrumb crumbs={crumbs} locale={locale} dict={dict} />
        <h1 className="text-2xl font-bold mb-2">{label}</h1>
        <p className="text-sm text-muted-foreground mb-3">
          {translate(dict, "db.entriesCount", {
            fallback: "{{count}} entries",
            vars: { count: totalCount.toLocaleString(locale) },
          })}
          {appConfig.db?.checklists?.some((c) => c.section === section) && (
            <>
              {" · "}
              <Link
                href={localizePath(`/checklist/${section}`, locale)}
                className="text-amber-300 underline underline-offset-2 hover:text-amber-200"
              >
                {translate(dict, "checklist.openSectionChecklist", {
                  fallback: "Track your progress in the checklist",
                })}
              </Link>
            </>
          )}
        </p>
        {(() => {
          const partner = getPartnerSectionLink(appConfig.name, section);
          if (!partner) return null;
          return (
            <div className="mb-6">
              <PartnerLinkRow
                link={partner}
                label={`${label} build guides on ${partner.name}`}
              />
            </div>
          );
        })()}
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
              text: textById.get(i.id),
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

// Cached in Next's page cache (cache-handler.cjs): rendered once per pod and
// game data version, then served without re-rendering — see
// src/lib/route-params.ts. No dynamic APIs below this route; plain fetches stay
// uncached so a re-render after a data update always sees fresh data.
export const dynamic = "force-static";
export const fetchCache = "default-no-store";
export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}
