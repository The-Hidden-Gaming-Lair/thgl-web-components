import { MarkersSearch } from "@repo/ui/controls";
import { FloatingAds } from "@repo/ui/ads";
import { CoordinatesProvider } from "@repo/ui/providers";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import type { Metadata } from "next";
import {
  type GlobalFiltersConfig,
  type FiltersConfig,
  type RegionsConfig,
  type TilesConfig,
} from "@repo/lib";
import tiles from "../coordinates/tiles.json" assert { type: "json" };
import regions from "../coordinates/regions.json" assert { type: "json" };
import _filters from "../coordinates/filters.json" assert { type: "json" };
import _globalFilters from "../coordinates/global-filters.json" assert { type: "json" };
import InteractiveMapClient from "@/components/interactive-map-client";

const globalFilters = _globalFilters as GlobalFiltersConfig;
const filters = _filters as FiltersConfig;

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: "Stormgate Interactive Map – The Hidden Gaming Lair",
  description:
    "Explore Stormgate with these Interactive Maps! Showcasing secrets, camps, upgrades, and more!",
  openGraph: {
    url: `/`,
  },
};

export default function Home() {
  return (
    <CoordinatesProvider
      filters={filters}
      mapNames={Object.keys(tiles)}
      regions={regions as unknown as RegionsConfig}
      globalFilters={globalFilters}
    >
      <HeaderOffset full>
        <PageTitle title={`Stormgate Interactive Map`} />
        <InteractiveMapClient />
        <MarkersSearch tileOptions={tiles as unknown as TilesConfig}>
          <FloatingAds id="stormgate" />
        </MarkersSearch>
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
