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
import { type Metadata } from "next";
import { searchParamsToView } from "@repo/lib";
import nodes from "../coordinates/nodes.json" assert { type: "json" };
import regions from "../coordinates/regions.json" assert { type: "json" };
import filters from "../coordinates/filters.json" assert { type: "json" };

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
  title: "Once Human Interactive Map – The Hidden Gaming Lair",
  description:
    "Explore Once Human' Interactive Maps featuring Crates, Chests, Hazards, Union Strongholds, Teleportant Towers, Monololiths & more locations. Discover Blackheart, Broken Delta, Chalk Peak, Dayton Wetlands, Iron River & Lone Wolf Wastes!",
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
      regions={regions as RegionsCoordinates}
      staticNodes={nodes as NodesCoordinates}
      view={view}
    >
      <HeaderOffset full>
        <InteractiveMapDynamic />
        <MarkersSearch>
          <FloatingAds id="once-human" />
        </MarkersSearch>
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
