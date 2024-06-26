import dynamic from "next/dynamic";
import { MarkersSearch } from "@repo/ui/controls";
import type {
  FiltersCoordinates,
  GlobalFiltersCoordinates,
  RegionsCoordinates,
} from "@repo/ui/providers";
import { FloatingAds } from "@repo/ui/ads";
import { CoordinatesProvider } from "@repo/ui/providers";
import { HeaderOffset } from "@repo/ui/header";
import type { Metadata } from "next";
import { searchParamsToView, type TileOptions } from "@repo/lib";
import tiles from "../coordinates/tiles.json" assert { type: "json" };
import regions from "../coordinates/regions.json" assert { type: "json" };
import _filters from "../coordinates/filters.json" assert { type: "json" };
import _globalFilters from "../coordinates/global-filters.json" assert { type: "json" };

const globalFilters = _globalFilters as GlobalFiltersCoordinates;
const filters = _filters as FiltersCoordinates;
const fIds = Object.values(filters).flatMap((f) => f.values.map((v) => v.id));
const gIds = Object.values(globalFilters).flatMap((g) =>
  g.values.map((v) => v.id),
);

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
  title: "Hogwarts Legacy Interactive Map – The Hidden Gaming Lair",
  description:
    "Explore Hogwarts Legacy with this Interactive Map! Showcasing all fast travel, sphinx puzzle spawn and other locations in Hogwarts, Hogsmeade and in the Overland!",
};

export default function Home({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): JSX.Element {
  const view = searchParamsToView(searchParams, fIds, gIds);

  return (
    <CoordinatesProvider
      filters={filters}
      mapName={Object.keys(tiles)[0]}
      regions={regions as unknown as RegionsCoordinates}
      globalFilters={globalFilters}
      view={view}
    >
      <HeaderOffset full>
        <InteractiveMapDynamic />
        <MarkersSearch tileOptions={tiles as unknown as TileOptions}>
          <FloatingAds id="hogwarts" />
        </MarkersSearch>
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
