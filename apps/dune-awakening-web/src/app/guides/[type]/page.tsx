import type { Metadata } from "next";
import {
  decodeFromBuffer,
  fetchVersion,
  getAppUrl,
  getTypeFromVersion,
} from "@repo/lib";
import { NodesCoordinates, Spawns } from "@repo/ui/providers";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { APP_CONFIG } from "@/config";
import { notFound } from "next/navigation";
import { Subtitle } from "@repo/ui/content";
import Head from "next/head";
import MapProgress from "./map-progress";

interface PageProps {
  params: Promise<{ type: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const type = (await params).type;
  const decodedType = decodeURIComponent(type);

  const guideTitle = decodedType.replace(/-/g, " ");
  const title = `${guideTitle} Locations & Map – ${APP_CONFIG.title}`;
  const description = `Looking for all ${guideTitle} in ${APP_CONFIG.title}? Use this interactive map to find every ${guideTitle}, track discoveries, and explore spawn points across regions.`;
  const keywords = `${guideTitle}, ${guideTitle} locations, ${guideTitle} map, Dune Awakening ${guideTitle}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `/guides/${type}` },
    openGraph: {
      url: `/guides/${type}`,
    },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const type = (await params).type;
  const decodedType = decodeURIComponent(type);
  const guideTitle = decodedType.replace(/-/g, " ");

  const version = await fetchVersion(APP_CONFIG.name);

  const typeName = getTypeFromVersion(version, type);
  if (!typeName) notFound();

  const url = `https://data.th.gl/api/${APP_CONFIG.name}/search?type=${typeName}`;
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const spawns = decodeFromBuffer<Spawns>(new Uint8Array(buffer));

  const icon = version.data.filters
    .find((f) => f.values.find((v) => v.id === typeName))
    ?.values.find((v) => v.id === typeName)?.icon;
  if (!icon) notFound();

  const maps = spawns.reduce((acc, n) => {
    const mapName = n.mapName || "default";
    if (!acc.includes(mapName)) {
      acc.push(mapName);
    }
    return acc;
  }, [] as string[]);

  const simpleSpawns = spawns.map((s) => ({
    id: s.id || s.type,
    p: s.p,
    mapName: s.mapName,
    type: s.type,
    name: version.data.enDict[s.id ?? s.type] || s.id || s.type,
    icon,
  }));

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: `Where can I find ${guideTitle} in Dune Awakening?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `Use this interactive map to locate all ${guideTitle} in ${APP_CONFIG.title}. You can mark them as discovered and get more tips.`,
                  },
                },
                {
                  "@type": "Question",
                  name: `How many ${guideTitle} are there in total?`,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: `This guide shows every known ${guideTitle}, grouped by map, with progress tracking included.`,
                  },
                },
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: `https://${APP_CONFIG.domain}`,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Guides",
                  item: `https://${APP_CONFIG.domain}/guides`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: guideTitle,
                  item: `https://${APP_CONFIG.domain}/guides/${type}`,
                },
              ],
            }),
          }}
        />
      </Head>
      <HeaderOffset full>
        <PageTitle title={`${guideTitle} Guide – ${APP_CONFIG.title}`} />
        <ContentLayout
          id={APP_CONFIG.name}
          header={
            <>
              <Subtitle title={`${decodedType.replace(/-/g, " ")} – Guide`} />
              <p className="text-sm mt-2">
                Discover all <strong>{guideTitle}</strong> locations in{" "}
                <strong>{APP_CONFIG.title}</strong>. Use the interactive map to
                find spawn points, mark progress, and get tips for each item.
              </p>
            </>
          }
          content={
            <>
              {maps.map((map) => {
                const mapSpawns = simpleSpawns.filter((s) => s.mapName === map);
                return (
                  <MapProgress
                    key={map}
                    spawns={mapSpawns}
                    map={map}
                    tiles={version.data.tiles}
                  />
                );
              })}
            </>
          }
        />
      </HeaderOffset>
    </>
  );
}
