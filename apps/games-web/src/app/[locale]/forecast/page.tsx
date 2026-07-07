import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DATA_FORGE_CDN_URL,
  resolveForgeUrl,
  getMetadataAlternates,
  DEFAULT_LOCALE,
} from "@repo/lib";
import { ContentLayout } from "@repo/ui/ads";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { getAppConfig } from "@/lib/get-app-config";
import {
  WeatherForecast,
  type WeatherData,
} from "@/lib/forecast/weather-forecast";

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
  const data = await fetchWeather(appConfig.name);
  if (!data) notFound();

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
          <div className="text-left">
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
        }
      />
    </HeaderOffset>
  );
}
