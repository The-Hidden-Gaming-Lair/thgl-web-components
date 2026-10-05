import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DATA_FORGE_CDN_URL,
  resolveForgeUrl,
  getMetadataAlternates,
  DEFAULT_LOCALE,
  fetchActivitiesConfig,
} from "@repo/lib";
import { ContentLayout } from "@repo/ui/ads";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { getAppConfig } from "@/lib/get-app-config";
import {
  WeatherForecast,
  type ForecastServer,
  type WeatherData,
} from "@/lib/forecast/weather-forecast";
import { DailyRares, type DailyRaresData } from "@/lib/forecast/daily-rares";

/**
 * Weather forecast — for tenants that ship a deterministic weather calendar at
 * `config/weather.json` (currently Heartopia). The link only appears where the
 * tenant config lists it, and non-weather games 404 here. Uses the shared
 * HeaderOffset + ContentLayout (header gap, container width, ad slots) like /guides.
 */
type PageProps = { params: Promise<{ locale?: string }> };

async function fetchWeather(appName: string): Promise<WeatherData | null> {
  const res = await fetch(
    await resolveForgeUrl(
      `${DATA_FORGE_CDN_URL}/${appName}/config/weather.json`,
    ),
    { next: { revalidate: 300 } },
  );
  if (!res.ok) return null;
  return res.json();
}

/** Optional daily-rares rotation (Heartopia Roaming Oak / Flawless Fluorite) — rendered above
 *  the weather when the tenant ships `config/daily-rares.json`. */
async function fetchDailyRares(
  appName: string,
): Promise<DailyRaresData | null> {
  const res = await fetch(
    await resolveForgeUrl(
      `${DATA_FORGE_CDN_URL}/${appName}/config/daily-rares.json`,
    ),
    { next: { revalidate: 300 } },
  );
  if (!res.ok) return null;
  return res.json();
}

const TITLE = "Weather Forecast";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  const appConfig = await getAppConfig();
  const title = `${TITLE} - ${appConfig.title}`;
  const description = `Hour-by-hour weather forecast for ${appConfig.title} — plan around meteor showers, rainbows, auroras, snow and more.`;
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/forecast",
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
  const [data, rares, activities] = await Promise.all([
    fetchWeather(appConfig.name),
    fetchDailyRares(appConfig.name),
    fetchActivitiesConfig(appConfig.name).catch(() => null),
  ]);
  if (!data) notFound();
  // The game's servers and their fixed clocks (the activities tracker's regions) for the
  // optional "show my local time" line; regions on a DST zone (`tz`) are left out.
  const servers: ForecastServer[] = (activities?.reset.regions ?? []).flatMap(
    (r) =>
      r.utcOffsetMinutes === undefined || r.tz !== undefined
        ? []
        : [
            {
              id: r.id,
              label:
                activities?.terms?.[locale]?.[r.name] ??
                activities?.terms?.en?.[r.name] ??
                r.id,
              utcOffsetMinutes: r.utcOffsetMinutes,
            },
          ],
  );

  return (
    <HeaderOffset full>
      <PageTitle title={TITLE} />
      <nav
        aria-label="Breadcrumb"
        className="text-xs text-muted-foreground px-4 py-2"
      >
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{TITLE}</li>
        </ol>
      </nav>
      <ContentLayout
        id={appConfig.name}
        header={
          <>
            <h2 className="text-2xl">{TITLE}</h2>
            <p className="text-sm">
              {appConfig.title}&apos;s weather runs on a fixed calendar —
              certain fish, bugs and ores only appear in specific weather and
              time of day.
            </p>
          </>
        }
        content={
          <div className="text-left space-y-6">
            {rares && (
              <DailyRares
                data={rares}
                locale={locale}
                labels={{
                  title: "Roaming Oak & Flawless Fluorite",
                  intro:
                    "Only one of each appears per day. Here is where to find them — click a spot to open it on the map.",
                  today: "Today",
                  date: "Date",
                  near: "near",
                  reset:
                    "The spots change with the daily reset and repeat every 50 days.",
                  types: {
                    resource_oak: "Roaming Oak",
                    resource_fluorite: "Flawless Fluorite",
                  },
                }}
              />
            )}
            <WeatherForecast
              data={data}
              locale={locale}
              game={appConfig.name}
              servers={servers}
              labels={{
                localTime: "Also show my local time",
                localTimeHint:
                  "All times are server time ({server}), the way players share them. The second time is yours ({you}).",
                server: "Server",
                yourTime: "your time",
                title: TITLE,
                hourly: "Hourly forecast",
                special: "Special weather",
                find: "Find next special weather",
                today: "Today",
                slots:
                  "Each day shows the game's four 6-hour windows. Dates follow the real calendar.",
                variants:
                  "Meteor showers and auroras come in three variants (1–3); the number marks which one the game shows in that hour.",
              }}
            />
          </div>
        }
      />
    </HeaderOffset>
  );
}
