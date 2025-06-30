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
  description: `Explore  ${APP_CONFIG.title}' Interactive Maps featuring Merrie, Kerys, Inis Gallia, Lyonesse & Ancien. Discover locations of Edible Plants, Mushrooms, Plants, Cooking Ingredients, Textile Materials, and Grains!`,
  openGraph: {
    url: `/`,
  },
};
export default async function Home() {
  const version = await fetchVersion(APP_CONFIG.name);

  return (
    <CoordinatesProvider
      appName={APP_CONFIG.name}
      filters={version.data.filters}
      staticDrawings={version.data.drawings}
      mapNames={Object.keys(version.data.tiles)}
      useCbor
      regions={version.data.regions}
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
