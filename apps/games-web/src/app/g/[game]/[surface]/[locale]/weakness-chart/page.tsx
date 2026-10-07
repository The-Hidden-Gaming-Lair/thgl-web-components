import { type Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchVersion,
  getMetadataAlternates,
  localizePath,
  translate,
  DEFAULT_LOCALE,
  WEAKNESS_CHART_PATH,
} from "@repo/lib";
import { getFullDbDictionary } from "@repo/ui/dicts";
import { JSONLDScript } from "@repo/ui/apps";
import { ContentLayout } from "@repo/ui/ads";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { getAppConfig } from "@/lib/get-app-config";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { breadcrumbJsonLd } from "@/lib/db/json-ld";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import {
  fetchWeaknessData,
  getWeaknessNames,
  weaknessLabels,
} from "@/lib/weakness-chart/data";
import { EntryLink, WeaknessChart } from "@/lib/weakness-chart/chart";

/**
 * Weakness Chart — for tenants that ship `config/weaknesses.json` (Grounded 2).
 * Every creature × damage type (damage taken, from the game's status effects),
 * sortable per damage type, plus the weapons that deal each damage type.
 * Names, icons and links come from the codex. Other games 404 here.
 */
type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  const appConfig = await getAppConfig();
  const dict = await getFullDbDictionary(appConfig.name, locale);
  const vars = { title: appConfig.title };
  const title = translate(dict, "weak.metaTitle", { vars });
  const description = translate(dict, "weak.metaDescription", { vars });
  const { canonical, languageAlternates } = getMetadataAlternates(
    WEAKNESS_CHART_PATH,
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
  const data = await fetchWeaknessData(appConfig.name);
  if (!data) notFound();
  const [dict, version] = await Promise.all([
    getFullDbDictionary(appConfig.name, locale),
    fetchVersion(appConfig.name),
  ]);
  const names = await getWeaknessNames(appConfig.name, data, dict);
  if (names.creatures.length === 0) notFound();
  const vars = { title: appConfig.title };
  const title = translate(dict, "weak.title");
  const crumbs = [{ label: title }];
  const url = `https://${appConfig.domain}.th.gl${localizePath(WEAKNESS_CHART_PATH, locale)}`;
  const iconsHash = version.more.icons;

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
      <PageTitle title={translate(dict, "weak.metaTitle", { vars })} />
      <div className="px-4 pt-2">
        <Breadcrumb crumbs={crumbs} locale={locale} dict={dict} />
      </div>
      <ContentLayout
        id={appConfig.name}
        header={
          <>
            <h2 className="text-2xl">
              {translate(dict, "weak.heading", { vars })}
            </h2>
            <p className="text-sm">
              {translate(dict, "weak.intro", {
                vars: {
                  ...vars,
                  creatures: String(names.creatures.length),
                  types: String(names.types.length),
                },
              })}
            </p>
          </>
        }
        content={
          <div className="text-left space-y-8">
            <WeaknessChart
              data={data}
              names={names}
              labels={weaknessLabels(dict)}
              appName={appConfig.name}
              iconsHash={iconsHash}
              locale={locale}
            />
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">
                {translate(dict, "weak.weaponsHeading")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {translate(dict, "weak.weaponsIntro")}
              </p>
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,16rem),1fr))]">
                {names.types
                  .filter((t) => names.weaponsByType[t.typeId]?.length)
                  .map((t) => (
                    <div
                      key={t.typeId}
                      className="space-y-1 rounded-md border p-2"
                    >
                      <h3 className="flex items-center gap-2 font-medium">
                        {t.icon && (
                          <SpriteIcon
                            icon={t.icon}
                            appName={appConfig.name}
                            iconsHash={iconsHash}
                            size={24}
                          />
                        )}
                        {t.name}
                      </h3>
                      {t.desc && (
                        <p className="text-xs text-muted-foreground">
                          {t.desc}
                        </p>
                      )}
                      <ul className="text-sm">
                        {names.weaponsByType[t.typeId].map((w) => (
                          <li key={w.id}>
                            <EntryLink
                              entry={w}
                              appName={appConfig.name}
                              iconsHash={iconsHash}
                              locale={locale}
                              size={20}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        }
      />
    </HeaderOffset>
  );
}
