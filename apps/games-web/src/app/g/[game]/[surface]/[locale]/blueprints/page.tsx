import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
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
  blueprintLabels,
  fetchBlueprintData,
  localizeBlueprintData,
  getBlueprintOptions,
} from "@/lib/blueprints/data";
import { BlueprintIconBox, BlueprintPlanner } from "@/lib/blueprints/planner";

/**
 * Blueprint star calculator — for tenants that ship `config/blueprints.json`
 * (Once Human). Plan unlocks and star upgrades for any number of blueprints and
 * get the Starchrom total; client-side over the per-build data. Other games 404.
 */
type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  const appConfig = await getAppConfig();
  const dict = await getFullDbDictionary(appConfig.name, locale);
  const title = translate(dict, "blueprints.metaTitle");
  const description = translate(dict, "blueprints.metaDescription");
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/blueprints",
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
  const rawData = await fetchBlueprintData(appConfig.name);
  if (!rawData) notFound();
  const [dict, version] = await Promise.all([
    getFullDbDictionary(appConfig.name, locale),
    fetchVersion(appConfig.name),
  ]);
  const data = localizeBlueprintData(rawData, dict);
  const options = await getBlueprintOptions(appConfig.name, data, dict);
  const title = translate(dict, "blueprints.title");
  const crumbs = [{ label: title }];
  const url = `https://${appConfig.domain}.th.gl${locale === DEFAULT_LOCALE ? "" : `/${locale}`}/blueprints`;

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
      <PageTitle title={translate(dict, "blueprints.metaTitle")} />
      <div className="px-4 pt-2">
        <Breadcrumb crumbs={crumbs} locale={locale} dict={dict} />
      </div>
      <ContentLayout
        id={appConfig.name}
        header={
          <>
            <h2 className="text-2xl">{title}</h2>
            <p className="text-sm">{translate(dict, "blueprints.intro")}</p>
          </>
        }
        content={
          <div className="text-left">
            <BlueprintPlanner
              data={data}
              options={options}
              labels={blueprintLabels(dict)}
              appName={appConfig.name}
              iconsHash={version.more.icons}
              locale={locale}
            />
            {(["weapon", "armor"] as const).map((kind) => (
              <section key={kind} className="mt-10 space-y-2">
                <h3 className="text-lg font-semibold">
                  {translate(dict, `blueprints.list.${kind}`)}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="py-1 font-normal">
                          {translate(dict, "blueprints.col.name")}
                        </th>
                        <th className="py-1 font-normal">
                          {translate(dict, "blueprints.col.rarity")}
                        </th>
                        <th className="py-1 text-right font-normal">
                          {translate(dict, "blueprints.unlock")}
                        </th>
                        <th className="py-1 text-right font-normal">
                          {translate(dict, "blueprints.col.toMax")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {options
                        .filter((o) => o.kind === kind)
                        .map((o) => {
                          const costs = data.blueprints[o.id]!.costs;
                          return (
                            <tr key={o.id} className="border-t">
                              <td className="py-1.5 pr-2">
                                <Link
                                  className="flex items-center gap-2 hover:underline"
                                  href={localizePath(
                                    `/blueprints/${o.id}`,
                                    locale,
                                  )}
                                >
                                  <BlueprintIconBox
                                    option={o}
                                    size={28}
                                    appName={appConfig.name}
                                    iconsHash={version.more.icons}
                                  />
                                  {o.name}
                                </Link>
                              </td>
                              <td className="py-1.5 pr-2 text-muted-foreground">
                                {data.rarities[o.rarity] ?? o.rarity}{" "}
                                {"★".repeat(o.maxStar)}
                              </td>
                              <td className="py-1.5 text-right tabular-nums">
                                {costs[0]!.toLocaleString(locale)}
                              </td>
                              <td className="py-1.5 text-right tabular-nums">
                                {costs
                                  .reduce((a, b) => a + b, 0)
                                  .toLocaleString(locale)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        }
      />
    </HeaderOffset>
  );
}
