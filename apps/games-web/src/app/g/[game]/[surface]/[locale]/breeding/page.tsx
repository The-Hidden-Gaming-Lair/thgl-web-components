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
  breedingLabels,
  fetchBreedingData,
  getBreedingPals,
} from "@/lib/breeding/data";
import { BreedingCalculator } from "@/lib/breeding/calculator";
import { BreedingPalGrid } from "@/lib/breeding/pal-grid";

/**
 * Breeding calculator — for tenants that ship `config/breeding.json`
 * (Palworld). Parents → child, child → parents and a path finder, all
 * client-side over the per-build game data; every pal links to its
 * server-rendered /breeding/<id> page. Other games 404 here.
 */
type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  const appConfig = await getAppConfig();
  const dict = await getFullDbDictionary(appConfig.name, locale);
  const title = translate(dict, "breeding.metaTitle");
  const description = translate(dict, "breeding.metaDescription");
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/breeding",
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
  const data = await fetchBreedingData(appConfig.name);
  if (!data) notFound();
  const [dict, version] = await Promise.all([
    getFullDbDictionary(appConfig.name, locale),
    fetchVersion(appConfig.name),
  ]);
  const pals = await getBreedingPals(appConfig.name, data, dict);
  const title = translate(dict, "breeding.title");
  const crumbs = [{ label: title }];
  const url = `https://${appConfig.domain}.th.gl${locale === DEFAULT_LOCALE ? "" : `/${locale}`}/breeding`;

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
      <PageTitle title={translate(dict, "breeding.metaTitle")} />
      <div className="px-4 pt-2">
        <Breadcrumb crumbs={crumbs} locale={locale} dict={dict} />
      </div>
      <ContentLayout
        id={appConfig.name}
        header={
          <>
            <h2 className="text-2xl">
              {translate(dict, "breeding.metaTitle")}
            </h2>
            <p className="text-sm">{translate(dict, "breeding.intro")}</p>
          </>
        }
        content={
          <div className="text-left space-y-8">
            <BreedingCalculator
              data={data}
              pals={pals}
              labels={breedingLabels(dict)}
              appName={appConfig.name}
              iconsHash={version.more.icons}
              locale={locale}
            />
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                {translate(dict, "breeding.allPals")}
              </h2>
              <BreedingPalGrid
                pals={pals}
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
