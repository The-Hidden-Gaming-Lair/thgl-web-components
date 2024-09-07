import { MarkersSearch } from "@repo/ui/controls";
import type { FiltersCoordinates } from "@repo/ui/providers";
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
  title: "Night Crows Interactive Map – The Hidden Gaming Lair",
  description:
    "Explore Night Crows' Interactive Maps featuring Avilius, Bastium, Celano, & Kildebat. Discover Taylor's Crow locations, Monsters, NPC's, secrets, and dungeons like Land Of Prosperity!",
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
      regions={[]}
      view={view}
    >
      <HeaderOffset full>
        <InteractiveMapClient />
        <MarkersSearch tileOptions={tiles as unknown as TileOptions}>
          <FloatingAds id="night-crows" />
        </MarkersSearch>
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
