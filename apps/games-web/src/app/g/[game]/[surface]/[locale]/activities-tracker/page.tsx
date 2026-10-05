import { type Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ACTIVITIES_PATH,
  DEFAULT_LOCALE,
  getMetadataAlternates,
  localizePath,
  translate,
  type ActivitiesConfig,
} from "@repo/lib";
import { getFullDbDictionary } from "@repo/ui/dicts";
import { JSONLDScript } from "@repo/ui/apps";
import { ContentLayout } from "@repo/ui/ads";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { getAppConfig } from "@/lib/get-app-config";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { breadcrumbJsonLd } from "@/lib/db/json-ld";
import {
  activitiesDict,
  activitiesLabels,
  activitiesView,
  formatClock,
  loadActivities,
  resetRows,
  weekdayName,
} from "@/lib/activities/data";
import { ActivitiesTracker } from "@/lib/activities/tracker";

/**
 * Daily & weekly activities tracker — for every game that ships
 * `config/activities.json` (data-forge, inbox #320). Progress clears itself
 * at the game's server reset; the page server-renders the intro, the reset
 * times per region and the full list. Other games 404 here.
 */
type PageProps = { params: Promise<{ locale?: string }> };

function introVars(
  config: ActivitiesConfig,
  locale: string,
  title: string,
): Record<string, string> {
  const r = config.reset;
  return {
    title,
    count: String(config.activities.length),
    time: formatClock(locale, r.dailyHour, r.dailyMinute ?? 0),
    weekday: weekdayName(locale, r.weeklyDay),
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  const appConfig = await getAppConfig();
  const config = await loadActivities(appConfig);
  if (!config) notFound();
  const dict = await getFullDbDictionary(appConfig.name, locale);
  const vars = introVars(config, locale, appConfig.title);
  const title = translate(dict, "activities.metaTitle", { vars });
  const description = translate(dict, "activities.metaDescription", { vars });
  const { canonical, languageAlternates } = getMetadataAlternates(
    ACTIVITIES_PATH,
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
  const config = await loadActivities(appConfig);
  if (!config) notFound();
  const dict = activitiesDict(
    config,
    await getFullDbDictionary(appConfig.name, locale),
    locale,
  );
  const vars = introVars(config, locale, appConfig.title);
  const title = translate(dict, "activities.title");
  const crumbs = [{ label: title }];
  const url = `https://${appConfig.domain}.th.gl${localizePath(ACTIVITIES_PATH, locale)}`;
  const view = activitiesView(config, dict);
  const rows = resetRows(config, dict, locale, Date.now());

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
      <PageTitle title={translate(dict, "activities.metaTitle", { vars })} />
      <div className="px-4 pt-2">
        <Breadcrumb crumbs={crumbs} locale={locale} dict={dict} />
      </div>
      <ContentLayout
        id={appConfig.name}
        header={
          <>
            <h2 className="text-2xl">
              {translate(dict, "activities.heading", { vars })}
            </h2>
            <p className="text-sm">
              {translate(dict, "activities.intro", { vars })}
            </p>
          </>
        }
        content={
          <div className="space-y-8 text-left">
            <ActivitiesTracker
              view={view}
              labels={activitiesLabels(dict)}
              locale={locale}
            />
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                {translate(dict, "activities.resetTimes", { vars })}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      {rows.length > 1 && (
                        <th className="py-1 pr-3 font-normal">
                          {translate(dict, "activities.region")}
                        </th>
                      )}
                      <th className="py-1 pr-3 font-normal">
                        {translate(dict, "activities.dailyReset")}
                      </th>
                      <th className="py-1 pr-3 font-normal">
                        {translate(dict, "activities.weeklyReset")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-t border-slate-800">
                        {rows.length > 1 && (
                          <td className="py-1.5 pr-3">{r.label}</td>
                        )}
                        <td className="py-1.5 pr-3">
                          {translate(dict, "activities.serverTime", {
                            vars: { time: r.daily, offset: r.offset },
                          })}
                        </td>
                        <td className="py-1.5 pr-3">
                          {translate(dict, "activities.serverTime", {
                            vars: { time: r.weekly, offset: r.offset },
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                {translate(dict, "activities.resetNote")}
              </p>
            </section>
          </div>
        }
      />
    </HeaderOffset>
  );
}
