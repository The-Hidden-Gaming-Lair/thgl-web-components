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
  evoLabel,
  fetchEvolutionsData,
  getEvolutionNames,
} from "@/lib/evolutions/data";
import { LineRow, SpeciesChip, type EvoCtx } from "@/lib/evolutions/parts";

/**
 * Evolution guide hub — for tenants that ship `config/evolutions.json`
 * (Aniimo). Every evolution line with its branches and levels, then every
 * Aniimo that does not evolve; each species links to its server-rendered
 * /evolutions/<id> page with the full requirements. Other games 404 here.
 */
type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  const appConfig = await getAppConfig();
  const dict = await getFullDbDictionary(appConfig.name, locale);
  const title = translate(dict, "evo.metaTitle");
  const description = translate(dict, "evo.metaDescription");
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/evolutions",
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
  const data = await fetchEvolutionsData(appConfig.name);
  if (!data) notFound();
  const [dict, version] = await Promise.all([
    getFullDbDictionary(appConfig.name, locale),
    fetchVersion(appConfig.name),
  ]);
  const names = await getEvolutionNames(appConfig.name, data, dict);
  const label = evoLabel(dict);
  const ctx: EvoCtx = {
    data,
    names,
    dict,
    label,
    appName: appConfig.name,
    iconsHash: version.more.icons,
    locale,
  };
  const inLine = new Set(data.lines.flatMap((l) => l.species));
  const single = Object.keys(data.species)
    .filter((id) => !inLine.has(id))
    .sort((a, b) =>
      (names.species[a]?.name ?? a).localeCompare(names.species[b]?.name ?? b),
    );
  const title = label("title");
  const crumbs = [{ label: title }];
  const url = `https://${appConfig.domain}.th.gl${locale === DEFAULT_LOCALE ? "" : `/${locale}`}/evolutions`;
  const sectionTitle =
    "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

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
      <PageTitle title={label("metaTitle")} />
      <div className="px-4 pt-2">
        <Breadcrumb crumbs={crumbs} locale={locale} dict={dict} />
      </div>
      <ContentLayout
        id={appConfig.name}
        header={
          <>
            <h2 className="text-2xl">{label("heading")}</h2>
            <p className="text-sm">
              {label("intro", { count: String(data.lines.length) })}
            </p>
          </>
        }
        content={
          <div className="text-left space-y-8">
            <section className="space-y-2">
              <h2 className={sectionTitle}>
                {label("lines", { count: String(data.lines.length) })}
              </h2>
              <ul className="space-y-2">
                {data.lines.map((line) => (
                  <LineRow key={line.id} line={line} ctx={ctx} />
                ))}
              </ul>
            </section>
            {single.length > 0 && (
              <section className="space-y-2">
                <h2 className={sectionTitle}>
                  {label("single", { count: String(single.length) })}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {label("singleHint")}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {single.map((id) => (
                    <li key={id}>
                      <SpeciesChip id={id} ctx={ctx} size={32} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        }
      />
    </HeaderOffset>
  );
}
