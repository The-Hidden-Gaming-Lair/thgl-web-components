import { MarkersSearch } from "@repo/ui/controls";
import type { FiltersCoordinates, NodesCoordinates } from "@repo/ui/providers";
import { FloatingAds } from "@repo/ui/ads";
import { CoordinatesProvider } from "@repo/ui/providers";
import { HeaderOffset } from "@repo/ui/header";
import type { Metadata } from "next";
import { searchParamsToView, type TileOptions } from "@repo/lib";
import tiles from "../coordinates/tiles.json" assert { type: "json" };
import _filters from "../coordinates/filters.json" assert { type: "json" };
import InteractiveMapClient from "@/components/interactive-map-client";

const filters = _filters as FiltersCoordinates;
const fIds = Object.values(filters).flatMap((f) => f.values.map((v) => v.id));

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: "Seekers of Skyveil Map – The Hidden Gaming Lair",
  description:
    "Explore Seekers of Skyveil' Interactive Maps featuring Creature Den, Blooming Grove, Grasslands & Heart of the Forest. Discover AirDrop, Altars, Shrines, Chests, Epic Loot, and the tunnels!",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export default async function Home(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const view = searchParamsToView(searchParams, fIds, []);
  return (
    <CoordinatesProvider
      filters={filters}
      mapNames={Object.keys(tiles)}
      regions={[]}
      view={view}
    >
      <HeaderOffset full>
        <InteractiveMapClient />
        <MarkersSearch tileOptions={tiles as unknown as TileOptions}>
          <FloatingAds id="seekers" />
        </MarkersSearch>
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
