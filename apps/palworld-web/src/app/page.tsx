import dynamic from "next/dynamic";
import { MarkersSearch } from "@repo/ui/controls";
import type {
  FiltersCoordinates,
  RegionsCoordinates,
} from "@repo/ui/providers";
import { FloatingAds } from "@repo/ui/ads";
import { CoordinatesProvider } from "@repo/ui/providers";
import { HeaderOffset } from "@repo/ui/header";
import type { Metadata } from "next";
import { searchParamsToView } from "@repo/lib";
import tiles from "../coordinates/tiles.json" assert { type: "json" };
import regions from "../coordinates/regions.json" assert { type: "json" };
import _typesIdMap from "../coordinates/types_id_map.json" assert { type: "json" };
import _filters from "../coordinates/filters.json" assert { type: "json" };

const filters = _filters as FiltersCoordinates;
const fIds = Object.values(filters).flatMap((f) => f.values.map((v) => v.id));

const typesIdMap = _typesIdMap as Record<string, string>;

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
  title: "Palworld Interactive Map – The Hidden Gaming Lair",
  description:
    "Explore Palworld with our interactive map, showcasing spawn locations of adorable Pals. Daily updates, real-time tracking, and more to enhance your Palworld adventure!",
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
      typesIdMap={typesIdMap}
      view={view}
    >
      <HeaderOffset full>
        <InteractiveMapDynamic />
        <MarkersSearch>
          <FloatingAds id="palworld" />
        </MarkersSearch>
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
