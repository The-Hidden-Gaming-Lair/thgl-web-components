import dynamic from "next/dynamic";
import { MarkersSearch } from "@repo/ui/controls";
import type { FiltersCoordinates, NodesCoordinates } from "@repo/ui/providers";
import { FloatingAds } from "@repo/ui/ads";
import { CoordinatesProvider } from "@repo/ui/providers";
import { HeaderOffset } from "@repo/ui/header";
import type { Metadata } from "next";
import { searchParamsToView, type TileOptions } from "@repo/lib";
import _nodes from "../coordinates/nodes.json" assert { type: "json" };
import filters from "../coordinates/filters.json" assert { type: "json" };
import tiles from "../coordinates/tiles.json" assert { type: "json" };

const nodes = _nodes as NodesCoordinates;

const InteractiveMapDynamic = dynamic(
  () => import("@/components/interactive-map-dynamic"),
  {
    ssr: false,
  },
);

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: "Seekers of Skyveil Map – The Hidden Gaming Lair",
  description:
    "Explore Seekers of Skyveil' Interactive Maps featuring Creature Den, Blooming Grove, Grasslands & Heart of the Forest. Discover AirDrop, Altars, Shrines, Chests, Epic Loot, and the tunnels!",
};

export default function Home({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): JSX.Element {
  const view = searchParamsToView(searchParams);
  return (
    <CoordinatesProvider
      filters={filters as FiltersCoordinates}
      mapName={Object.keys(tiles)[0]}
      regions={[]}
      staticNodes={nodes}
      view={view}
    >
      <HeaderOffset full>
        <InteractiveMapDynamic />
        <MarkersSearch tileOptions={tiles as unknown as TileOptions}>
          <FloatingAds id="seekers" />
        </MarkersSearch>
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
