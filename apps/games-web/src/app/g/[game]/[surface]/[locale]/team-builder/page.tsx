import { type Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchVersion,
  getMetadataAlternates,
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
  fetchTeamBuilderData,
  getTeamBuilderNames,
} from "@/lib/team-builder/data";
import { TeamBuilder } from "@/lib/team-builder/team-builder";
import { TeamSpeciesGrid } from "@/lib/team-builder/species-grid";

/**
 * Team Builder — for tenants that ship `config/team-builder.json` (Aniimo).
 * Four slots, element coverage and weaknesses from the game's element chart,
 * role balance, suggestions, a counter finder and the game's own recommended
 * picks; every species links to its server-rendered /team-builder/<id>
 * matchup page. Other games 404 here.
 */
type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  const appConfig = await getAppConfig();
  const dict = await getFullDbDictionary(appConfig.name, locale);
  const title = translate(dict, "tb.metaTitle");
  const description = translate(dict, "tb.metaDescription");
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/team-builder",
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
  const appConfig = await getAppConfig();
  const data = await fetchTeamBuilderData(appConfig.name);
  if (!data) notFound();
  const [dict, version] = await Promise.all([
    getFullDbDictionary(appConfig.name, locale),
    fetchVersion(appConfig.name),
  ]);
  const names = await getTeamBuilderNames(appConfig.name, data, dict);
  const title = translate(dict, "tb.title");
  const crumbs = [{ label: title }];
  const url = `https://${appConfig.domain}.th.gl${locale === DEFAULT_LOCALE ? "" : `/${locale}`}/team-builder`;

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
      <PageTitle title={translate(dict, "tb.metaTitle")} />
      <div className="px-4 pt-2">
        <Breadcrumb crumbs={crumbs} locale={locale} dict={dict} />
      </div>
      <ContentLayout
        id={appConfig.name}
        header={
          <>
            <h2 className="text-2xl">{translate(dict, "tb.heading")}</h2>
            <p className="text-sm">{translate(dict, "tb.intro")}</p>
          </>
        }
        content={
          <div className="text-left space-y-8">
            <TeamBuilder
              data={data}
              names={names}
              appName={appConfig.name}
              iconsHash={version.more.icons}
              locale={locale}
            />
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {translate(dict, "tb.allAniimo")}
              </h2>
              <TeamSpeciesGrid
                data={data}
                names={names}
                appName={appConfig.name}
                iconsHash={version.more.icons}
                locale={locale}
              />
            </section>
          </div>
        }
      />
    </HeaderOffset>
  );
}
