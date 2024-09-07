import { MarkersSearch } from "@repo/ui/controls";
import type {
  FiltersCoordinates,
  RegionsCoordinates,
} from "@repo/ui/providers";
import { FloatingAds } from "@repo/ui/ads";
import { CoordinatesProvider } from "@repo/ui/providers";
import { HeaderOffset } from "@repo/ui/header";
import type { Metadata } from "next";
import { NIGHTINGALE, searchParamsToView } from "@repo/lib";
import InteractiveMapClient from "@/components/interactive-map-client";
import regions from "../coordinates/regions.json" assert { type: "json" };
import _filters from "../coordinates/filters.json" assert { type: "json" };

const filters = _filters as FiltersCoordinates;
const fIds = Object.values(filters).flatMap((f) => f.values.map((v) => v.id));

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: "Nightingale Interactive Map – The Hidden Gaming Lair",
  description:
    "Explore the dark and mysterious realm of Nightingale with the Nightingale Interactive Map. Uncover hidden codex, track creatures, and navigate the Gaslamp Fantasy world like never before. Join the adventure today!",
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
      mapNames={Object.keys(NIGHTINGALE.tileOptions)}
      regions={regions as RegionsCoordinates}
      view={view}
    >
      <HeaderOffset full>
        <InteractiveMapClient />
        <MarkersSearch tileOptions={NIGHTINGALE.tileOptions}>
          <FloatingAds id="nightingale" />
        </MarkersSearch>
      </HeaderOffset>
    </CoordinatesProvider>
  );
}
