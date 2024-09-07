import { MarkersSearch } from "@repo/ui/controls";
import type {
  FiltersCoordinates,
  RegionsCoordinates,
} from "@repo/ui/providers";
import { FloatingAds } from "@repo/ui/ads";
import { CoordinatesProvider } from "@repo/ui/providers";
import { HeaderOffset } from "@repo/ui/header";
import type { Metadata } from "next";
import { searchParamsToView, type TileOptions } from "@repo/lib";
import { Diablo4Events } from "@repo/ui/data";
import tiles from "../../coordinates/tiles.json" assert { type: "json" };
import regions from "../../coordinates/regions.json" assert { type: "json" };
import _filters from "../../coordinates/filters.json" assert { type: "json" };
import InteractiveMapClient from "@/components/interactive-map-client";

const filters = _filters as FiltersCoordinates;
const fIds = Object.values(filters).flatMap((f) => f.values.map((v) => v.id));

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: "Diablo IV Interactive Map – The Hidden Gaming Lair",
  description:
    "Explore Sanctuary with this Diablo IV Interactive Map! Discover Infernal Hordes, Helltide Chests, Altars of Lilith, Bosses, and more with real-time position tracking.",
};

export default function Home({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): JSX.Element {
  const view = searchParamsToView(searchParams, fIds, []);
  return (
    <CoordinatesProvider
      filters={filters}
      mapNames={Object.keys(tiles)}
      regions={regions as RegionsCoordinates}
      view={view}
    >
      <HeaderOffset full>
        <InteractiveMapClient />
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
