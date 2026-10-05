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
  fetchStatsData,
  getStatsPals,
  ivLabels,
} from "@/lib/iv-calculator/data";
import { IvCalculator } from "@/lib/iv-calculator/calculator";

/**
 * IV / stat calculator — for tenants that ship `config/stats.json` (Palworld).
 * In-game stats → talents (IVs) and talents → stats, with the game's own formula,
 * all client-side over the per-build data. Other games 404 here.
 */
type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  const appConfig = await getAppConfig();
  const dict = await getFullDbDictionary(appConfig.name, locale);
  const title = translate(dict, "iv.metaTitle");
  const description = translate(dict, "iv.metaDescription");
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/iv-calculator",
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
  const data = await fetchStatsData(appConfig.name);
  if (!data) notFound();
  const [dict, version] = await Promise.all([
    getFullDbDictionary(appConfig.name, locale),
    fetchVersion(appConfig.name),
  ]);
  const pals = await getStatsPals(appConfig.name, data, dict);
  const title = translate(dict, "iv.title");
  const crumbs = [{ label: title }];
  const url = `https://${appConfig.domain}.th.gl${locale === DEFAULT_LOCALE ? "" : `/${locale}`}/iv-calculator`;

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
      <PageTitle title={translate(dict, "iv.metaTitle")} />
      <div className="px-4 pt-2">
        <Breadcrumb crumbs={crumbs} locale={locale} dict={dict} />
      </div>
      <ContentLayout
        id={appConfig.name}
        header={
          <>
            <h2 className="text-2xl">{translate(dict, "iv.metaTitle")}</h2>
            <p className="text-sm">{translate(dict, "iv.intro")}</p>
          </>
        }
        content={
          <div className="text-left">
            <IvCalculator
              data={data}
              pals={pals}
              labels={ivLabels(dict, data, locale)}
              appName={appConfig.name}
              iconsHash={version.more.icons}
              locale={locale}
            />
          </div>
        }
      />
    </HeaderOffset>
  );
}
