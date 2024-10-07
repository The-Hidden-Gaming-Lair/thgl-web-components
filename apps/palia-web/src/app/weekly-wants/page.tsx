import { ExternalAnchor, HeaderOffset } from "@repo/ui/header";
import { type Metadata } from "next";
import { ContentLayout } from "@repo/ui/ads";
import { Button } from "@repo/ui/controls";
import Image from "next/image";
import _enDict from "../../dicts/en.json" assert { type: "json" };
import WeeklyWantsGuide from "./weekly-wants.webp";
import Villagers from "./villagers.webp";

export const metadata: Metadata = {
  alternates: {
    canonical: "/weekly-wants",
  },
  title: "Palia Weekly Wants Tracker – The Hidden Gaming Lair",
  description:
    "Track the Palia Weekly Wants for Ashura, Auni, Badruu, Caleri, Chayne, Delaila, Einar, Elouisa, Ehse, Hassian, Hekla, Hodari, Jel, Jina, Kenli, Kenyatta, Nai'o, Najuma, Reth, Sifuu, Subira, Tamala, Tau, Tish and Zeki.",
};

export default function WeeklyWants() {
  return (
    <HeaderOffset full>
      <ContentLayout
        id="palia"
        header={
          <>
            <h2 className="text-2xl">Weekly Wants Tracker</h2>
            <p className="text-sm">
              Automatically track the Palia Weekly Wants for Ashura, Auni,
              Badruu, Caleri, Chayne, Delaila, Einar, Elouisa, Ehse, Hassian,
              Hekla, Hodari, Jel, Jina, Kenli, Kenyatta, Nai'o, Najuma, Reth,
              Sifuu, Subira, Tamala, Tau, Tish and Zeki.
            </p>
          </>
        }
        content={
          <div className="flex flex-col gap-2 items-center">
            <p>1: Install the In-Game app from the Overwolf App Store</p>
            <Button asChild>
              <ExternalAnchor href="https://www.overwolf.com/app/Leon_Machens-Palia_Map">
                Overwolf App Store
              </ExternalAnchor>
            </Button>
            <p>2: Play Palia and click on "Weekly Wants" in the filters</p>
            <Image src={WeeklyWantsGuide} alt="Weekly Wants Guide" />
            <p>3: Check and automatically track the Villager's Weekly Wants</p>
            <Image src={Villagers} alt="Villagers" />
          </div>
        }
      />
    </HeaderOffset>
  );
}
