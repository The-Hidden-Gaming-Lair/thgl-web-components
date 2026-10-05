import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import { ContentLayout } from "@repo/ui/ads";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { getAppConfig } from "@/lib/get-app-config";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { breadcrumbJsonLd } from "@/lib/db/json-ld";
import {
  buildChecklistEntries,
  checklistCategories,
  checklistLabels,
  checklistMapTitles,
  checklistSectionLabel,
  getChecklistSections,
} from "@/lib/checklist/data";
import { ChecklistView } from "@/lib/checklist/checklist-view";

/**
 * Collection checklist for one codex section (`/checklist/<section>`, the
 * section slug of `/db/<section>`): every entry with a tick, progress, group /
 * missing-only filters and links to its codex entry and the map. Server-
 * rendered with every entry (the SEO page "<Game> <Section> Checklist");
 * ticks live in the viewer's browser. 404 unless the tenant lists the section
 * in `db.checklists`.
 */
type PageProps = { params: Promise<{ locale?: string; section: string }> };

async function resolve(locale: string, section: string) {
  const appConfig = await getAppConfig();
  const info = getChecklistSections(appConfig).find(
    (s) => s.section === section,
  );
  if (!info) notFound();
  const [dict, index] = await Promise.all([
    getFullDbDictionary(appConfig.name, locale),
    fetchDatabaseIndex(appConfig.name).catch(() => []),
  ]);
  const total = checklistCategories(index, info.home).reduce(
    (n, cat) => n + cat.items.length,
    0,
  );
  if (!total) notFound();
  const label = checklistSectionLabel(appConfig, dict, info);
  return { appConfig, info, dict, index, total, label };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE, section } = await params;
  const { appConfig, dict, total, label } = await resolve(locale, section);
  const vars = {
    game: appConfig.title,
    section: label,
    count: total.toLocaleString(locale),
  };
  const title = translate(dict, "checklist.metaTitle", { vars });
  const description = translate(dict, "checklist.metaDescription", { vars });
  const { canonical, languageAlternates } = getMetadataAlternates(
    `/checklist/${section}`,
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
  const { appConfig, info, dict, index, total, label } = await resolve(
    locale,
    section,
  );
  const version = await fetchVersion(appConfig.name);
  const { entries, groups } = await buildChecklistEntries({
    appConfig,
    info,
    index,
    dict,
    version,
    locale,
  });
  const vars = {
    game: appConfig.title,
    section: label,
    count: total.toLocaleString(locale),
  };
  const heading = translate(dict, "checklist.sectionTitle", { vars });
  const crumbs = [
    { label: translate(dict, "checklist.navTitle"), href: "/checklist" },
    { label: heading },
  ];
  const url = `https://${appConfig.domain}.th.gl${localizePath(`/checklist/${section}`, locale)}`;

  return (
    <HeaderOffset full>
      <JSONLDScript
        json={breadcrumbJsonLd({
          appConfig,
          homeLabel: dict["ui.nav_home"] || "Home",
          crumbs,
          url,
          locale,
        })}
      />
      <PageTitle title={translate(dict, "checklist.metaTitle", { vars })} />
      <div className="px-4 pt-2">
        <Breadcrumb crumbs={crumbs} locale={locale} dict={dict} />
      </div>
      <ContentLayout
        id={appConfig.name}
        header={
          <>
            <h2 className="text-2xl">
              {appConfig.title} {heading}
            </h2>
            <p className="text-sm">
              {translate(dict, "checklist.intro", { vars })}{" "}
              <Link
                href={localizePath(`/db/${section}`, locale)}
                className="text-amber-300 underline underline-offset-2 hover:text-amber-200"
              >
                {translate(dict, "checklist.browseCodex", { vars })}
              </Link>
            </p>
          </>
        }
        content={
          <div className="text-left">
            <ChecklistView
              appName={appConfig.name}
              section={section}
              sectionLabel={label}
              entries={entries}
              groups={groups}
              labels={checklistLabels(dict)}
              iconsHash={version.more.icons}
              locale={locale}
              mapTitles={checklistMapTitles(version, dict)}
            />
          </div>
        }
      />
    </HeaderOffset>
  );
}
