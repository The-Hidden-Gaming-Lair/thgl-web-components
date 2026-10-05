import { type Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchDatabaseIndex,
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
  checklistCategories,
  checklistLabels,
  checklistSectionLabel,
  getChecklistSections,
} from "@/lib/checklist/data";
import { ChecklistHub } from "@/lib/checklist/checklist-hub";

/**
 * Collection checklist hub — every codex section the tenant opted in
 * (`db.checklists`) with this viewer's progress. Tenants without checklists 404.
 */
type PageProps = { params: Promise<{ locale?: string }> };

async function load(locale: string) {
  const appConfig = await getAppConfig();
  const infos = getChecklistSections(appConfig);
  if (!infos.length) notFound();
  const [dict, index] = await Promise.all([
    getFullDbDictionary(appConfig.name, locale),
    fetchDatabaseIndex(appConfig.name).catch(() => []),
  ]);
  const sections = infos
    .map((info) => {
      const ids = checklistCategories(index, info.home).flatMap((cat) =>
        cat.items.map((i) => i.id),
      );
      return {
        section: info.section,
        label: checklistSectionLabel(appConfig, dict, info),
        icon: info.home.icon,
        total: ids.length,
        ids,
      };
    })
    .filter((s) => s.total > 0);
  if (!sections.length) notFound();
  return { appConfig, dict, sections };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  const { appConfig, dict, sections } = await load(locale);
  const vars = {
    game: appConfig.title,
    sections: sections.map((s) => s.label).join(", "),
  };
  const title = translate(dict, "checklist.hubMetaTitle", { vars });
  const description = translate(dict, "checklist.hubMetaDescription", {
    vars,
  });
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/checklist",
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
  const { locale = DEFAULT_LOCALE } = await params;
  const { appConfig, dict, sections } = await load(locale);
  const title = translate(dict, "checklist.hubTitle", {
    vars: { game: appConfig.title },
  });
  const crumbs = [{ label: translate(dict, "checklist.navTitle") }];
  const url = `https://${appConfig.domain}.th.gl${localizePath("/checklist", locale)}`;

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
      <PageTitle title={title} />
      <div className="px-4 pt-2">
        <Breadcrumb crumbs={crumbs} locale={locale} dict={dict} />
      </div>
      <ContentLayout
        id={appConfig.name}
        header={
          <>
            <h2 className="text-2xl">{title}</h2>
            <p className="text-sm">{translate(dict, "checklist.hubIntro")}</p>
          </>
        }
        content={
          <div className="text-left">
            <ChecklistHub
              appName={appConfig.name}
              sections={sections}
              labels={checklistLabels(dict)}
              locale={locale}
            />
          </div>
        }
      />
    </HeaderOffset>
  );
}
