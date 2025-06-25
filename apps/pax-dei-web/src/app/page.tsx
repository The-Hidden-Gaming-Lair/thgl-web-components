import { MarkersSearch } from "@repo/ui/controls";
import { FloatingAds } from "@repo/ui/ads";
import { CoordinatesProvider } from "@repo/ui/providers";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import type { Metadata } from "next";
import {
  fetchDrawings,
  fetchFilters,
  fetchRegions,
  fetchTiles,
} from "@repo/lib";
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
  const [drawings, filters, regions, tiles] = await Promise.all([
    fetchDrawings(APP_CONFIG.name),
    fetchFilters(APP_CONFIG.name),
    fetchRegions(APP_CONFIG.name),
    fetchTiles(APP_CONFIG.name),
  ]);

  return (
    <CoordinatesProvider
      appName={APP_CONFIG.name}
      filters={filters}
      staticDrawings={drawings}
      mapNames={Object.keys(tiles)}
      useCbor
      regions={regions}
    >
      <HeaderOffset full>
        <PageTitle title={`${APP_CONFIG.title} Interactive Map`} />
        <FullMapDynamic appConfig={APP_CONFIG} tilesConfig={tiles} />
        <MarkersSearch tileOptions={tiles} appName={APP_CONFIG.name}>
          <FloatingAds id={APP_CONFIG.name} />
        </MarkersSearch>
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
