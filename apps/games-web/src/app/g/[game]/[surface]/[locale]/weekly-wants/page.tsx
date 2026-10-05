import { ExternalAnchor, HeaderOffset, PageTitle } from "@repo/ui/header";
import { type Metadata } from "next";
import { ContentLayout } from "@repo/ui/ads";
import { JSONLDScript } from "@repo/ui/apps";
import { Button } from "@repo/ui/controls";
import {
  type API_WEEKLY_WANTS,
  type REWARD_LEVEL,
  type WEEKLY_WANTS,
} from "@repo/ui/data";
import Image from "next/image";
import Link from "next/link";
import {
  DEFAULT_LOCALE,
  getT,
  getMetadataAlternates,
  localizePath,
} from "@repo/lib";
import { getStaticDictionary } from "@repo/ui/dicts";
import { requireApp } from "@/lib/get-app-config";
import { WeeklyWantsView } from "@/games/palia/weekly-wants-view";
import WeeklyWantsGuide from "./weekly-wants.webp";
import Villagers from "./villagers.webp";

async function fetchWeeklyWantsData(): Promise<WEEKLY_WANTS | null> {
  try {
    const response = await fetch("https://palia-api.th.gl/weekly-wants", {
      cache: "force-cache",
      next: { tags: ["weekly-wants"] },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as API_WEEKLY_WANTS;
    const weeklyWants = Object.entries(data.preferences).reduce(
      (acc, [key, wants]) => {
        acc[key] = wants
          .flatMap((value) =>
            value
              ? [
                  {
                    itemPersistId: value.itemPersistId,
                    objectId: value.objectId,
                    rewardLevel: value.rewardLevel as REWARD_LEVEL,
                  },
                ]
              : [],
          )
          .reverse();
        return acc;
      },
      {} as WEEKLY_WANTS["weeklyWants"],
    );
    return { version: data.version, timestamp: data.timestamp, weeklyWants };
  } catch {
    return null;
  }
}

type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const config = await requireApp("palia");
  const { locale = DEFAULT_LOCALE } = await params;
  const dict = await getStaticDictionary(config.name, locale);
  const t = getT(dict);

  const { canonical, languageAlternates } = getMetadataAlternates(
    "/weekly-wants",
    locale,
    config.supportedLocales,
  );

  const title = t("weeklyWants.meta.title");
  const description = t("weeklyWants.meta.description");

  return {
    alternates: { canonical, languages: languageAlternates },
    title,
    description,
    openGraph: { title, description, url: canonical },
  };
}

export default async function WeeklyWants({ params }: PageProps) {
  const config = await requireApp("palia");
  const { locale = DEFAULT_LOCALE } = await params;
  const dict = await getStaticDictionary(config.name, locale);
  const t = getT(dict);

  const pageTitle = t("weeklyWants.meta.title");
  const heading = t("weeklyWants.heading");
  const weeklyWantsData = await fetchWeeklyWantsData();

  return (
    <>
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: pageTitle,
          description: t("weeklyWants.meta.description"),
          author: {
            "@type": "Organization",
            name: "The Hidden Gaming Lair",
            url: "https://www.th.gl",
          },
          publisher: {
            "@type": "Organization",
            name: "The Hidden Gaming Lair",
            url: "https://www.th.gl",
          },
          mainEntityOfPage: `https://palia.th.gl${localizePath("/weekly-wants", locale)}`,
        }}
      />
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: `https://palia.th.gl${localizePath("/", locale)}`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: heading,
              item: `https://palia.th.gl${localizePath("/weekly-wants", locale)}`,
            },
          ],
        }}
      />
      <HeaderOffset full>
        <PageTitle title={heading} />
        <nav
          aria-label="Breadcrumb"
          className="text-xs text-muted-foreground px-4 py-2"
        >
          <ol className="flex items-center gap-1">
            <li>
              <Link
                href={localizePath("/", locale)}
                className="hover:text-foreground transition-colors"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{heading}</li>
          </ol>
        </nav>
        <ContentLayout
          id="palia"
          header={
            <>
              <h2 className="text-2xl">{heading}</h2>
              <p className="text-sm">{t("weeklyWants.description")}</p>
            </>
          }
          content={
            <div className="flex flex-col gap-8">
              {weeklyWantsData ? (
                <WeeklyWantsView data={weeklyWantsData} locale={locale} />
              ) : (
                <div className="py-20 text-center text-muted-foreground">
                  Couldn't load this week's wants. Please try again later.
                </div>
              )}

              <section className="flex flex-col gap-3 items-center pt-6 border-t border-border/50">
                <p>{t("weeklyWants.step1")}</p>
                <Button asChild>
                  <ExternalAnchor href="https://www.th.gl/companion-app">
                    {t("weeklyWants.appButton")}
                  </ExternalAnchor>
                </Button>
                <p>{t("weeklyWants.step2")}</p>
                <Image src={WeeklyWantsGuide} alt={t("weeklyWants.guideAlt")} />
                <p>{t("weeklyWants.step3")}</p>
                <Image src={Villagers} alt={t("weeklyWants.villagersAlt")} />
              </section>
            </div>
          }
        />
      </HeaderOffset>
    </>
  );
}
