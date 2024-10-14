import { MarkersSearch } from "@repo/ui/controls";
import type {
  FiltersCoordinates,
  GlobalFiltersCoordinates,
  RegionsCoordinates,
} from "@repo/ui/providers";
import { CoordinatesProvider } from "@repo/ui/providers";
import { HeaderOffset } from "@repo/ui/header";
import type { Metadata } from "next";
import { searchParamsToView, type TileOptions } from "@repo/lib";
import tiles from "../coordinates/tiles.json" assert { type: "json" };
import regions from "../coordinates/regions.json" assert { type: "json" };
import _filters from "../coordinates/filters.json" assert { type: "json" };
import _globalFilters from "../coordinates/global-filters.json" assert { type: "json" };
import _typesIdMap from "../coordinates/types_id_map.json" assert { type: "json" };
import InteractiveMapClient from "@/components/interactive-map-client";

const globalFilters = _globalFilters as GlobalFiltersCoordinates;
const filters = _filters as FiltersCoordinates;
const fIds = Object.values(filters).flatMap((f) => f.values.map((v) => v.id));
const gIds = Object.values(globalFilters).flatMap((g) =>
  g.values.map((v) => v.id),
);
const typesIdMap = _typesIdMap as Record<string, string>;

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: "Gray Zone Warfare Interactive Map – The Hidden Gaming Lair",
  description:
    "Explore Gray Zone Warfare with this Interactive Map! Showcasing all chapters, secrets, items, and more!",
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
      mapNames={Object.keys(tiles)}
      regions={regions as unknown as RegionsCoordinates}
      globalFilters={globalFilters}
      view={view}
      typesIdMap={typesIdMap}
      useCbor
    >
      <HeaderOffset full>
        <InteractiveMapClient />
        <MarkersSearch tileOptions={tiles as unknown as TileOptions} />
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
