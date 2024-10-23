import { MarkersSearch } from "@repo/ui/controls";
import type {
  FiltersCoordinates,
  RegionsCoordinates,
} from "@repo/ui/providers";
import { FloatingAds } from "@repo/ui/ads";
import { CoordinatesProvider } from "@repo/ui/providers";
import { HeaderOffset } from "@repo/ui/header";
import { type Metadata } from "next";
import { searchParamsToView, type TileOptions } from "@repo/lib";
import InteractiveMapClient from "@/components/interactive-map-client";
import regions from "../coordinates/regions.json" assert { type: "json" };
import _typesIdMap from "../coordinates/types_id_map.json" assert { type: "json" };
import _filters from "../coordinates/filters.json" assert { type: "json" };
import tiles from "../coordinates/tiles.json" assert { type: "json" };

const filters = _filters as FiltersCoordinates;
const fIds = Object.values(filters).flatMap((f) => f.values.map((v) => v.id));

const typesIdMap = _typesIdMap as Record<string, string>;

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: "Once Human Interactive Map – The Hidden Gaming Lair",
  description:
    "Explore Once Human Interactive Maps for The Way Of Winter, Prismverse's Clash, Manibus, and Evolution's Call, featuring Ores, Riddles, Crates, Chests, Strongholds, Teleportant Towers, Monololiths & more locations. Discover Blackheart, Broken Delta, Chalk Peak, Dayton Wetlands, Iron River & Lone Wolf Wastes!",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export default async function Home(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;

  const view = searchParamsToView(searchParams, fIds, []);
  return (
    <CoordinatesProvider
      filters={filters}
      mapNames={Object.keys(tiles)}
      useCbor
      regions={regions as RegionsCoordinates}
      typesIdMap={typesIdMap}
      view={view}
    >
      <HeaderOffset full>
        <InteractiveMapClient />
        <MarkersSearch tileOptions={tiles as unknown as TileOptions}>
          <FloatingAds id="once-human" />
        </MarkersSearch>
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
