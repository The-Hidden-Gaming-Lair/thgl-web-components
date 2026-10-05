import { ExternalAnchor, HeaderOffset, PageTitle } from "@repo/ui/header";
import { type Metadata } from "next";
import { ContentLayout } from "@repo/ui/ads";
import { JSONLDScript } from "@repo/ui/apps";
import { Button } from "@repo/ui/controls";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import {
  DEFAULT_LOCALE,
  getApiUrl,
  decodeFromBuffer,
  fetchVersion,
  getT,
  getMetadataAlternates,
  localizePath,
  encodeAndObfuscate,
  resolveForgeUrl,
} from "@repo/lib";
import { PaliaGrid } from "@repo/ui/data";
import { type Spawns } from "@repo/ui/providers";
import { DownloadIcon, FilterIcon, MapPinIcon } from "lucide-react";
import { getStaticDictionary } from "@repo/ui/dicts";
import { requireApp } from "@/lib/get-app-config";
import PileMapClient from "@/games/palia/pile-map-client";
import LootTables from "@/games/palia/loot-tables";
import Filter from "./filter.webp";
import Map from "./map.webp";

type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const config = await requireApp("palia");
  const { locale = DEFAULT_LOCALE } = await params;
  const dict = await getStaticDictionary(config.name, locale);
  const t = getT(dict);

  const { canonical, languageAlternates } = getMetadataAlternates(
    "/rummage-pile",
    locale,
    config.supportedLocales,
  );

  const title = t("rummagePile.meta.title");
  const description = t("rummagePile.meta.description");

  return {
    alternates: { canonical, languages: languageAlternates },
    title,
    description,
    openGraph: { title, description, url: canonical },
  };
}

type TimedLootPiles = {
  [type: string]: {
    mapName: string;
    positions: [number, number, number][];
    timestamp: number;
  };
};

export default async function RummagePile({ params }: PageProps) {
  const config = await requireApp("palia");
  const { locale = DEFAULT_LOCALE } = await params;
  const dict = await getStaticDictionary(config.name, locale);
  const t = getT(dict);
  const version = await fetchVersion(config.name);

  const rummagePileIcon = version.data.filters
    .find((f) => f.group === "players")!
    .values.find((v) => v.id === "other_player")!.icon;

  const timedLootPilesResponse = await fetch(
    "https://palia-api.th.gl/nodes?type=timedLootPiles",
    {
      headers: { authorization: process.env.PALIA_API_KEY || "" },
      next: { revalidate: 300, tags: ["rummage-pile"] },
    },
  );
  const data = (await timedLootPilesResponse.json()) as TimedLootPiles;

  const url = await resolveForgeUrl(getApiUrl("palia", "q=stable"));
  const response = await fetch(url, { next: { revalidate: 300 } });
  const buffer = await response.arrayBuffer();
  const stableNodes = decodeFromBuffer<Spawns>(new Uint8Array(buffer));
  const stableNodeIcon = version.data.filters
    .find((f) => f.group === "locations")!
    .values.find((v) => v.id === "stable")!.icon;

  const encodedTimedLootPiles = encodeAndObfuscate(data);

  const pageTitle = t("rummagePile.meta.title");
  const pageDescription = t("rummagePile.meta.description");

  return (
    <>
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: pageTitle,
          description: pageDescription,
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
          mainEntityOfPage: `https://palia.th.gl${localizePath("/rummage-pile", locale)}`,
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
              name: t("rummagePile.heading"),
              item: `https://palia.th.gl${localizePath("/rummage-pile", locale)}`,
            },
          ],
        }}
      />
      <HeaderOffset full>
        <PageTitle title={t("rummagePile.heading")} />
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
            <li aria-current="page">{t("rummagePile.heading")}</li>
          </ol>
        </nav>
        <ContentLayout
          id="palia"
          header={
            <>
              <h2 className="text-2xl">{t("rummagePile.heading")}</h2>
              <p className="text-sm">{t("rummagePile.description")}</p>
            </>
          }
          content={
            <>
              <Suspense>
                <PileMapClient
                  encodedTimedLootPiles={encodedTimedLootPiles}
                  stableNodes={stableNodes}
                  stableNodeIcon={stableNodeIcon}
                  icon={rummagePileIcon}
                  tiles={version.data.tiles}
                  icons={version.more.icons}
                  locale={locale}
                />
                <PaliaGrid force />
              </Suspense>
              <div className="mt-8 rounded-2xl bg-linear-to-br from-primary/5 via-transparent to-accent/5 border border-primary/20 p-6 md:p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-primary mb-2">
                    {t("rummagePile.cta.title")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("rummagePile.cta.description")}
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3 mb-8">
                  <ExternalAnchor
                    href="https://www.th.gl/companion-app"
                    className="relative group"
                  >
                    <div className="absolute -inset-px rounded-xl bg-linear-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex flex-col items-center gap-4 rounded-xl bg-card/50 border border-border/50 p-5 h-full group-hover:border-primary/50 transition-colors">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg shrink-0">
                        1
                      </div>
                      <DownloadIcon className="w-8 h-8 text-primary shrink-0" />
                      <div className="text-center">
                        <p className="font-medium mb-1">
                          {t("rummagePile.cta.step1.title")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("rummagePile.cta.step1.description")}
                        </p>
                      </div>
                    </div>
                  </ExternalAnchor>

                  <div className="relative group">
                    <div className="absolute -inset-px rounded-xl bg-linear-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex flex-col items-center gap-4 rounded-xl bg-card/50 border border-border/50 p-5 h-full">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg shrink-0">
                        2
                      </div>
                      <FilterIcon className="w-8 h-8 text-primary shrink-0" />
                      <div className="text-center">
                        <p className="font-medium mb-1">
                          {t("rummagePile.cta.step2.title")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("rummagePile.cta.step2.description")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute -inset-px rounded-xl bg-linear-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex flex-col items-center gap-4 rounded-xl bg-card/50 border border-border/50 p-5 h-full">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg shrink-0">
                        3
                      </div>
                      <MapPinIcon className="w-8 h-8 text-primary shrink-0" />
                      <div className="text-center">
                        <p className="font-medium mb-1">
                          {t("rummagePile.cta.step3.title")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("rummagePile.cta.step3.description")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mb-8">
                  <div className="rounded-lg overflow-hidden shadow-lg border border-border/50">
                    <Image
                      src={Filter}
                      alt={t("rummagePile.cta.filterAlt")}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="rounded-lg overflow-hidden shadow-lg border border-border/50">
                    <Image
                      src={Map}
                      alt={t("rummagePile.cta.mapAlt")}
                      className="w-full h-auto"
                    />
                  </div>
                </div>

                <Button
                  size="lg"
                  className="shadow-lg shadow-primary/20"
                  asChild
                >
                  <ExternalAnchor href="https://www.th.gl/companion-app">
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    {t("rummagePile.cta.button")}
                  </ExternalAnchor>
                </Button>
              </div>

              <LootTables locale={locale} />
            </>
          }
        />
      </HeaderOffset>
    </>
  );
}
