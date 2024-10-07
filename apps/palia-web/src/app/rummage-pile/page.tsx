import { ExternalAnchor, HeaderOffset } from "@repo/ui/header";
import { type Metadata } from "next";
import { ContentLayout } from "@repo/ui/ads";
import { Button } from "@repo/ui/controls";
import Image from "next/image";
import _enDict from "../../dicts/en.json" assert { type: "json" };
import Filter from "./filter.webp";
import Map from "./map.webp";
import PileMapClient from "@/components/pile-map-client";

export const metadata: Metadata = {
  alternates: {
    canonical: "/rummage-pile",
  },
  title: "Palia Rummage Pile and Chapaa Pile – The Hidden Gaming Lair",
  description:
    "Discover Rummage Pile and Chapaa Pile locations in Palia. Find the Baharai Rummage Pile and Kilima Rummage Pile to collect valuable resources and items.",
};

export default async function RummagePile() {
  const respone = await fetch(
    "https://palia-api.th.gl/nodes?type=timedLootPiles",
    {
      next: { tags: ["rummage-pile"] },
    },
  );
  const data = (await respone.json()) as TimedLootPiles;
  return (
    <HeaderOffset full>
      <ContentLayout
        id="palia"
        header={
          <>
            <h2 className="text-2xl">Rummage Piles</h2>
            <p className="text-sm">
              Discover Rummage Pile and Chapaa Pile locations in Palia. Select
              between Bahari Bay and Kilima Village to find valuable resources
              and items.
            </p>
          </>
        }
        content={
          <>
            <PileMapClient timedLootPiles={data} />
            <div className="flex flex-col gap-2 items-center">
              <h3 className="text-xl font-semibold text-primary mb-4">
                In-Game App
              </h3>
              <p>
                Unlock the full potential by installing the In-Game app to
                discover the Rummage Pile locations in real-time!
              </p>
              <p>1: Install the In-Game app from the Overwolf App Store</p>
              <Button asChild>
                <ExternalAnchor href="https://www.overwolf.com/app/Leon_Machens-Palia_Map">
                  Overwolf App Store
                </ExternalAnchor>
              </Button>
              <p>2: Play Palia and select the Rummage Pile in the filters</p>
              <Image src={Filter} alt="Rummage Piles Filter" />
              <p>3: See the Pile and much more on the map</p>
              <Image src={Map} alt="Map View" />
            </div>
          </>
        }
      />
    </HeaderOffset>
  );
}

export interface TimedLootPiles {
  BP_ChapaaPile_C: {
    mapName: string;
    position: number[];
    timestamp: number;
  };
  BP_BeachPile_C: {
    mapName: string;
    position: number[];
    timestamp: number;
  };
}
