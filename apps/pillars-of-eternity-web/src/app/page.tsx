import { MarkersSearch } from "@repo/ui/controls";
import { FloatingAds } from "@repo/ui/ads";
import { CoordinatesProvider } from "@repo/ui/providers";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import type { Metadata } from "next";
import { fetchVersion } from "@repo/lib";
import { FullMapDynamic } from "@repo/ui/full-map-dynamic";
import { APP_CONFIG } from "@/config";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: `${APP_CONFIG.title} Interactive Map – The Hidden Gaming Lair`,
  description: `Explore ${APP_CONFIG.title}' Interactive Maps featuring Whimstar, Dew of Inspiration, crates, lost notebooks, and more!`,
};
export default async function Home() {
  const version = await fetchVersion(APP_CONFIG.name);

  return (
    <CoordinatesProvider
      appName={APP_CONFIG.name}
      staticDrawings={version.data.drawings}
      filters={version.data.filters}
      mapNames={Object.keys(version.data.tiles)}
      useCbor
      regions={version.data.regions}
      typesIdMap={version.data.typesIdMap}
      nodesPaths={version.more.nodes}
    >
      <HeaderOffset full>
        <PageTitle title={`${APP_CONFIG.title} Interactive Map`} />
        <FullMapDynamic
          appConfig={APP_CONFIG}
          tilesConfig={version.data.tiles}
          iconsPath={version.more.icons}
        />
        <MarkersSearch
          lastMapUpdate={version.createdAt}
          tileOptions={version.data.tiles}
          appName={APP_CONFIG.name}
          iconsPath={version.more.icons}
        >
          <FloatingAds id={APP_CONFIG.name} />
        </MarkersSearch>
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
