import dynamic from "next/dynamic";
import { MarkersSearch } from "@repo/ui/controls";
import type {
  FiltersCoordinates,
  NodesCoordinates,
  RegionsCoordinates,
} from "@repo/ui/providers";
import { FloatingAds } from "@repo/ui/ads";
import { CoordinatesProvider } from "@repo/ui/providers";
import { HeaderOffset } from "@repo/ui/header";
import type { Metadata } from "next";
import { searchParamsToView, type TileOptions } from "@repo/lib";
import { Diablo4Events } from "@repo/ui/data";
import _nodes from "../coordinates/nodes.json" assert { type: "json" };
import filters from "../coordinates/filters.json" assert { type: "json" };
import tiles from "../coordinates/tiles.json" assert { type: "json" };
import regions from "../coordinates/regions.json" assert { type: "json" };

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
  title: "Diablo IV Interactive Map – The Hidden Gaming Lair",
  description:
    "Explore Sanctuary with this Diablo IV Interactive Map! Discover Helltide Chests, Altars of Lilith, Bosses, and more with real-time position tracking.",
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
      regions={regions as RegionsCoordinates}
      staticNodes={nodes}
      view={view}
    >
      <HeaderOffset full>
        <InteractiveMapDynamic />
        <MarkersSearch
          tileOptions={tiles as unknown as TileOptions}
          additionalFilters={<Diablo4Events />}
        >
          <FloatingAds id="diablo4" />
        </MarkersSearch>
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
