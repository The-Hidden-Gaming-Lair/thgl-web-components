import type { Metadata } from "next";
import Link from "next/link";
import { fetchVersion, getIconsUrl } from "@repo/lib";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { Subtitle } from "@repo/ui/content";
import { APP_CONFIG } from "@/config";
import Head from "next/head";

export const metadata: Metadata = {
  title: `Guides – ${APP_CONFIG.title}`,
  description: `Browse all location-based guides for ${APP_CONFIG.title}, including NPCs, Intel Points, Loot Crates, and more.`,
  alternates: { canonical: "/guides" },
  openGraph: {
    url: "/guides",
  },
};

export default async function GuidesPage() {
  const version = await fetchVersion(APP_CONFIG.name);

  const guideTypes = version.data.filters.flatMap((filter) =>
    filter.values.map((v) => ({
      type: v.id,
      label: version.data.enDict[v.id],
      description: `Find all ${version.data.enDict[v.id]} locations in ${APP_CONFIG.title}.`,
      icon: v.icon as {
        name: string;
        url: string;
        x: number;
        y: number;
        width: number;
        height: number;
      },
    })),
  );

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              itemListElement: guideTypes.map((g, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: g.label,
                url: `https://${APP_CONFIG.domain}/guides/${version.data.enDict[g.type]}`,
              })),
            }),
          }}
        />
      </Head>

      <HeaderOffset full>
        <PageTitle title={`Guides – ${APP_CONFIG.title}`} />
        <ContentLayout
          id={APP_CONFIG.name}
          header={
            <>
              <Subtitle title="Explore Location-Based Guides" />
              <p className="text-sm mt-2">
                Discover all collectible and location-based types in{" "}
                <strong>{APP_CONFIG.title}</strong>. Click a category to see its
                map, spawn points, and discovery tracker.
              </p>
            </>
          }
          content={
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {guideTypes.map((guide) => (
                <li
                  key={guide.type}
                  className="border rounded-lg p-4 hover:shadow transition"
                >
                  <Link
                    href={`/guides/${version.data.enDict[guide.type]}`}
                    className="block"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        alt=""
                        className="shrink-0 object-none w-[64px] h-[64px]"
                        src={getIconsUrl(
                          APP_CONFIG.name,
                          guide.icon.url,
                          version.more.icons,
                        )}
                        width={guide.icon.width}
                        height={guide.icon.height}
                        style={{
                          objectPosition: `-${guide.icon.x}px -${guide.icon.y}px`,
                          zoom: 0.35,
                        }}
                      />
                      <h2 className="text-lg font-semibold">{guide.label}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {guide.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          }
        />
      </HeaderOffset>
    </>
  );
}
