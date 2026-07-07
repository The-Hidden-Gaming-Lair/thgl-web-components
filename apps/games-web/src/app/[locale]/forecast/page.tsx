import { type Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DATA_FORGE_CDN_URL,
  resolveForgeUrl,
  getMetadataAlternates,
  DEFAULT_LOCALE,
} from "@repo/lib";
import { getFullDictionary } from "@repo/ui/dicts";
import { getAppConfig } from "@/lib/get-app-config";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import {
  WeatherForecast,
  type WeatherData,
} from "@/lib/forecast/weather-forecast";

/**
 * Weather forecast — for tenants that ship a deterministic weather calendar at
 * `config/weather.json` (currently Heartopia). The link only appears where the
 * tenant config lists it, and non-weather games 404 here.
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

const TITLE = "Weather Forecast";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  const appConfig = await getAppConfig();
  const title = `${TITLE} - ${appConfig.title}`;
  const description = `Hour-by-hour weather forecast for ${appConfig.title} — plan around meteor showers, rainbows, storms and more.`;
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

  const [data, dict] = await Promise.all([
    fetchWeather(appConfig.name),
    getFullDictionary(appConfig.name, locale),
  ]);
  if (!data) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Breadcrumb crumbs={[{ label: TITLE }]} locale={locale} dict={dict} />
      <h1 className="text-2xl font-bold mb-1">{TITLE}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {appConfig.title}&apos;s weather runs on a fixed calendar — certain
        fish, bugs and ores only appear in specific weather and time of day.
      </p>
      <WeatherForecast
        data={data}
        locale={locale}
        labels={{
          title: TITLE,
          hourly: "Hourly forecast",
          special: "Special weather",
          find: "Find next special weather",
        }}
      />
    </div>
  );
}
