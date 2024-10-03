"use client";

import { cn, useGameState } from "@repo/lib";
import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../(controls)";
import { Gift } from "lucide-react";

type REWARD_LEVEL = "Like" | "Love";
type WEEKLY_WANTS = {
  version: number;
  timestamp: number;
  weeklyWants: Record<
    string,
    {
      id: number;
      item: string;
      name: string;
      description?: string;
      rewardLevel: REWARD_LEVEL;
    }[]
  >;
};

const villagers = [
  {
    persistId: 13337,
    configId: "theinnkeeper",
    className: "BP_VillagerTheInnKeeper_C",
    name: "Ashura",
    icon: "Ashura_Icon",
  },
  {
    persistId: 19327,
    configId: "deliveryboy",
    className: "BP_VillagerDeliveryBoy_C",
    name: "Auni",
    icon: "Auni_Icon",
  },
  {
    persistId: 8663,
    configId: "thefarmer",
    className: "BP_Villager_Farmer_C",
    name: "Badruu",
    icon: "Badru_Icon",
  },
  {
    persistId: 20124,
    configId: "thelibrarian",
    className: "BP_Villager_TheLibrarian_C",
    name: "Caleri",
    icon: "Calere_Icon",
  },
  {
    persistId: 20862,
    configId: "thehealer",
    className: "BP_Villager_Healer_C",
    name: "Chayne",
    icon: "Chane_Icon",
  },
  {
    persistId: 19151,
    configId: "therancher",
    className: "BP_Villager_Rancher_C",
    name: "Delaila",
    icon: "Dalila_Icon",
  },
  {
    persistId: 3801,
    configId: "fisherman",
    className: "BP_VillagerFisherman_C",
    name: "Einar",
    icon: "Einar_Icon",
  },
  {
    persistId: 1897,
    configId: "thecurator",
    className: "BP_Villager_Elouisa_C",
    name: "Elouisa",
    icon: "Elouisa_Icon1",
  },
  {
    persistId: 1142,
    configId: "themagistrate",
    className: "BP_Villager_TheMagistrate_C",
    name: "Eshe",
    icon: "Eshe_Icon",
  },
  {
    persistId: 14351,
    configId: "thehunter",
    className: "BP_VillagerTheHunter_C",
    name: "Hassian",
    icon: "Hassian_Icon",
  },
  {
    persistId: 6515,
    configId: "thenanny",
    className: "BP_Villager_Hekla_C",
    name: "Hekla",
    icon: "Hekla_Icon",
  },
  {
    persistId: 1419,
    configId: "theminer",
    className: "BP_Villager_Miner_C",
    name: "Hodari",
    icon: "Hodari_Icon",
  },
  {
    persistId: 10502,
    configId: "thetailor",
    className: "BP_Villager_Jel_C",
    name: "Jel",
    icon: "Jel_Icon",
  },
  {
    persistId: 8919,
    configId: "thearcheologist",
    className: "BP_VillagerTheArchaeologist_C",
    name: "Jina",
    icon: "Jina_Icon",
  },
  {
    persistId: 30076,
    configId: "themayor",
    className: "BP_Villager_Mayor_C",
    name: "Kenli",
    icon: "Kenji_Icon",
  },
  {
    persistId: 21224,
    configId: "themayorsdaughter",
    className: "BP_Villager_Kenyatta_C",
    name: "Kenyatta",
    icon: "Icon_Villager_Kenyatta",
  },
  {
    persistId: 5802,
    configId: "thefarmboy",
    className: "BP_Villager_Farmboy_C",
    name: "Nai'o",
    icon: "Nyo_Icon",
  },
  {
    persistId: 21355,
    configId: "thedemolitionist",
    className: "BP_VillagerTheDemolitionist_C",
    name: "Najuma",
    icon: "Najuma_Icon",
  },
  {
    persistId: 10215,
    configId: "thecook",
    className: "BP_Villager_Cook_C",
    name: "Reth",
    icon: "Reth_icon",
  },
  {
    persistId: 4701,
    configId: "theblacksmith",
    className: "BP_Villager_Blacksmith_C",
    name: "Sifuu",
    icon: "Sefu_Icon",
  },
  {
    persistId: 5586,
    configId: "thewatcher",
    className: "BP_VillagerTheWatcher_C",
    name: "Subira",
    icon: "WT_Subira_Portrait",
  },
  {
    persistId: 13260,
    configId: "thealchemist",
    className: "BP_Villager_Tamala_C",
    name: "Tamala",
    icon: "Tamala_Icon",
  },
  {
    persistId: 500,
    configId: "theplumehound",
    className: "BP_Villager_Tau_C",
    name: "Tau",
    icon: "WT_Tau_portrait",
  },
  {
    persistId: 19881,
    configId: "thecarpenter",
    className: "BP_Villager_Tish_C",
    name: "Tish",
    icon: "Tish_Icon",
  },
  {
    persistId: 6680,
    configId: "thesalesman",
    className: "BP_Villager_Zeki_C",
    name: "Zeki",
    icon: "Zeki_Icon",
  },
];

export function PaliaWeeklyWants({ data }: { data?: WEEKLY_WANTS }) {
  const [targetPopover, setTargetPopover] = useState<null | string>(null);
  const character = useGameState((state) => state.character);

  const progress = useMemo<Record<string, number[]>>(() => {
    if (!data) {
      return {};
    }
    if (character) {
      return character.giftHistory.reduce(
        (
          acc: { [x: string]: any[] },
          curr: {
            associatedPreferenceVersion: number;
            villagerCoreId: any;
            itemPersistId: any;
          },
        ) => {
          if (curr.associatedPreferenceVersion === data.version) {
            const villagerId = curr.villagerCoreId;
            acc[villagerId] = acc[villagerId] || [];
            acc[villagerId].push(curr.itemPersistId);
          }
          return acc;
        },
        {} as Record<string, number[]>,
      );
    }
    return {};
  }, [character?.giftHistory, data?.version]);

  return (
    <Popover
      open={!!targetPopover}
      onOpenChange={(isOpen) => {
        if (isOpen) {
          setTargetPopover("open");
        } else {
          setTargetPopover(null);
        }
      }}
    >
      <PopoverTrigger>
        <Button size="sm" variant="secondary">
          <Gift className="mr-2 h-4 w-4" /> Weekly Wants
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="container max-w-lg w-[95vw] text-center space-y-2 border rounded border-gray-600 bg-neutral-900 p-2">
          <div className="flex flex-wrap gap-2 justify-center">
            {villagers.map((villager) => {
              return (
                <button
                  key={villager.persistId}
                  className={`text-gray-200 text-sm text-shadow rounded-full border border-gray-600 hover:bg-zinc-800 whitespace-nowrap  flex items-center`}
                  aria-label={villager.name}
                >
                  <div className="relative">
                    <img
                      src={`/icons/Icons_Characters/${villager.icon}.webp`}
                      width={40}
                      height={40}
                      alt={villager.name}
                      title={villager.name}
                      draggable={false}
                    />
                    {progress[villager.persistId]?.length >= 4 && (
                      <svg
                        className="absolute -right-1 top-0"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        strokeWidth="4"
                        stroke="#3de5af"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12l5 5l10 -10" />
                      </svg>
                    )}
                  </div>
                  <span className="truncate px-2 mr-1">{villager.name}</span>
                </button>
              );
            })}
          </div>
          <p className="text-gray-300 text-sm">
            Last Update: {data && new Date(data.timestamp).toLocaleDateString()}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
