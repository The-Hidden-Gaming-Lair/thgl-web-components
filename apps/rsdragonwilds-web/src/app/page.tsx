import { ContentLayout } from "@repo/ui/ads";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import type { Metadata } from "next";
import {
  type NavCardProps,
  NavGrid,
  ReleaseNotes,
  Subtitle,
} from "@repo/ui/content";
import { fetchVersion, getUpdateMessages } from "@repo/lib";
import { APP_CONFIG } from "@/config";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: `${APP_CONFIG.title} Interactive Maps & Locations – The Hidden Gaming Lair`,
  description: `Explore ${APP_CONFIG.title} interactive maps for Ashenfall Map, featuring ${APP_CONFIG.keywords!.join(", ")}, and more locations. Stay updated with the latest map updates and guides!`,
};
export default async function Home() {
  const updateMessages = await getUpdateMessages(APP_CONFIG.name);
  const version = await fetchVersion(APP_CONFIG.name);
  const mapNames = Object.keys(version.data.tiles);
  const cards = mapNames.map((map) => {
    const mapName = version.data.enDict[map];
    return {
      title: `${mapName} Map`,
      description: `Navigate ${mapName} with our interactive maps.`,
      href: `/maps/${encodeURIComponent(mapName)}`,
      iconName: "Map" as NavCardProps["iconName"],
      bgImage: `https://data.th.gl/${APP_CONFIG.name}/map-tiles/${map}/preview.webp`,
      linkText: `Explore the ${mapName}`,
    };
  });

  return (
    <HeaderOffset full>
      <PageTitle title={`${APP_CONFIG.title} Interactive Maps & Locations`} />
      <ContentLayout
        id={APP_CONFIG.name}
        header={
          <section className="space-y-4">
            <Subtitle title={`${APP_CONFIG.title} Interactive Maps`} />
            <p className="text-muted-foreground">
              Explore the Ashenfall Map, and the Dungeons and more in{" "}
              {APP_CONFIG.title} with {APP_CONFIG.keywords!.join(", ")}, plus
              more locations brought you by{" "}
              <span className="text-nowrap">The Hidden Gaming Lair</span>!
            </p>

            {APP_CONFIG.internalLinks ? (
              <NavGrid cards={APP_CONFIG.internalLinks} />
            ) : null}
            <NavGrid cards={cards} />
          </section>
        }
        content={<ReleaseNotes updateMessages={updateMessages} />}
      />
    </HeaderOffset>
  );
}
