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
import _nodes from "../../coordinates/nodes.json" assert { type: "json" };
import filters from "../../coordinates/filters.json" assert { type: "json" };
import tiles from "../../coordinates/tiles.json" assert { type: "json" };
import regions from "../../coordinates/regions.json" assert { type: "json" };

const nodes = _nodes as NodesCoordinates;

const InteractiveMapDynamic = dynamic(
  () => import("@/components/interactive-map-dynamic"),
  {
    ssr: false,
  }
);

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: "Pax Dei Interactive Map – The Hidden Gaming Lair",
  description:
    "Explore Pax Dei' Interactive Maps featuring Merrie, Kerys, Inis Gallia, Lyonesse & Ancien. Discover locations of Edible Plants, Mushrooms, Plants, Cooking Ingredients, Textile Materials, and Grains!",
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
        <MarkersSearch tileOptions={tiles as unknown as TileOptions}>
          <FloatingAds id="pax-dei" />
        </MarkersSearch>
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
