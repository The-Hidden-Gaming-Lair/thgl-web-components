"use client";

import { getIconsUrl, useGameState } from "@repo/lib";
import { useEffect, useState } from "react";
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "../(controls)";
import { CircleCheckBig, Gift, Heart } from "lucide-react";
import { useT } from "../(providers)";
import _villagers from "./palia-villagers.json";
import _itemIcons from "./palia-item-icons.json";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";

export const villagers = _villagers;
export const itemIcons = _itemIcons;

export function PaliaWeeklyWants() {
  const [targetPopover, setTargetPopover] = useState<null | string>(null);
  const character = useGameState(
    (state) => state.character as ValeriaCharacter | null,
  );
  const [data, setData] = useState<WEEKLY_WANTS | null>(null);

  useEffect(() => {
    fetchWeeklyWants().then(setData).catch(console.error);
  }, []);

  const totalGifts = Object.values(data?.weeklyWants ?? {}).length;
  const totalGifted =
    character?.giftHistory.filter((g) => {
      const villager = villagers.find(
        (v) => v.villagerCoreId === g.villagerCoreId,
      );
      return (
        villager &&
        g.associatedPreferenceVersion === data?.version &&
        data.weeklyWants[villager.type]?.some(
          (t) => t.itemPersistId === g.itemPersistId,
        )
      );
    }).length ?? 0;

  return (
    <Sheet
      open={!!targetPopover}
      onOpenChange={(isOpen) => {
        if (isOpen) {
          setTargetPopover("open");
        } else {
          setTargetPopover(null);
        }
      }}
    >
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost" className="w-full">
          <Gift className="mr-2 h-4 w-4" />
          <span className="grow text-left">Weekly Wants</span>
          {totalGifted} of {totalGifts}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Villager's Weekly Wants</SheetTitle>
          <SheetDescription>
            The progress of the weekly wants is tracked automatically when you
            are in-game.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea>
          {data ? (
            <VillagersWeeklyWants data={data} character={character} />
          ) : (
            <div>Loading...</div>
          )}
        </ScrollArea>
        <SheetDescription>
          <p className="text-gray-300 text-sm">
            Last Update: {data && new Date(data.timestamp).toLocaleDateString()}
          </p>
        </SheetDescription>
      </SheetContent>
    </Sheet>
  );
}

export function VillagersWeeklyWants({
  data,
  character,
  showGifts = true,
}: {
  data: WEEKLY_WANTS;
  character?: ValeriaCharacter | null;
  showGifts?: boolean;
}) {
  const t = useT();
  return (
    <div className="space-y-1">
      {villagers.map((villager) => {
        return (
          <div key={villager.persistId} className={`flex items-center`}>
            <Tooltip delayDuration={200}>
              <TooltipTrigger>
                <Avatar>
                  <AvatarImage
                    src={getIconsUrl("palia", `/icons/${villager.icon}`)}
                    alt={t(villager.type)}
                  />
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{t(villager.type)}</TooltipContent>
            </Tooltip>
            <div className="mx-4 space-x-2">
              {data?.weeklyWants[villager.type]?.map((item) => {
                const isGifted = character?.giftHistory.find(
                  (g) =>
                    g.itemPersistId === item.itemPersistId &&
                    g.villagerCoreId === villager.villagerCoreId &&
                    g.associatedPreferenceVersion === data.version,
                );
                return (
                  <Tooltip delayDuration={200} key={item.itemPersistId}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={"ghost"}
                        size="icon"
                        className="relative"
                      >
                        <img
                          className="h-6 w-6"
                          src={getIconsUrl(
                            "palia",
                            `/icons/${itemIcons[item.objectId as keyof typeof itemIcons]}`,
                          )}
                          alt={item.objectId}
                        />
                        {item.rewardLevel === "Love" && (
                          <Heart className="absolute top-0 right-0 h-2 w-2 text-red-600 fill-red-600" />
                        )}
                        {isGifted && (
                          <CircleCheckBig className="absolute bottom-0 right-0 h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t(item.objectId)}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            {showGifts && (
              <Tooltip delayDuration={200}>
                <TooltipTrigger>
                  <Badge variant="outline">
                    <Gift className="h-4 w-4 mr-2" />
                    {character?.giftHistory.filter(
                      (g) => g.villagerCoreId === villager.villagerCoreId,
                    ).length ?? 0}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Total number of how many times you gifted this villager
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      })}
    </div>
  );
}

export async function fetchWeeklyWants(): Promise<WEEKLY_WANTS> {
  const response = await fetch("https://palia-api.th.gl/weekly-wants");
  const data = (await response.json()) as API_WEEKLY_WANTS;
  const weeklyWants = Object.entries(data.preferences).reduce(
    (acc, [key, wants]) => {
      acc[key] = wants
        .flatMap((value) => {
          if (!value) {
            return [];
          }
          return [
            {
              itemPersistId: value.itemPersistId,
              objectId: value.objectId,
              rewardLevel: value.rewardLevel as REWARD_LEVEL,
            },
          ];
        })
        .reverse();
      return acc;
    },
    {} as Record<
      string,
      {
        itemPersistId: number;
        objectId: string;
        rewardLevel: REWARD_LEVEL;
      }[]
    >,
  );
  const result = {
    version: data.version,
    timestamp: data.timestamp,
    weeklyWants,
  };
  return result;
}

export type REWARD_LEVEL = "Like" | "Love";
export type WEEKLY_WANTS = {
  version: number;
  timestamp: number;
  weeklyWants: Record<
    string,
    {
      itemPersistId: number;
      objectId: string;
      rewardLevel: REWARD_LEVEL;
    }[]
  >;
};
type ITEMS = Array<{
  objectId: string;
  persistId: number;
  itemPersistId: number;
  rewardLevel: string;
}>;
export type API_WEEKLY_WANTS = {
  version: number;
  timestamp: number;
  preferences: {
    theinnkeeper: ITEMS;
    deliveryboy: ITEMS;
    thefarmer: ITEMS;
    fisherman: ITEMS;
    themagistrate: ITEMS;
    thehunter: ITEMS;
    thenanny: ITEMS;
    thetailor: ITEMS;
    themayor: ITEMS;
    themayorsdaughter: ITEMS;
    thedemolitionist: ITEMS;
    thefarmboy: ITEMS;
    thecook: ITEMS;
    theblacksmith: ITEMS;
    thealchemist: ITEMS;
    thecarpenter: ITEMS;
    thesalesman: ITEMS;
    therancher: ITEMS;
    theminer: ITEMS;
    thelibrarian: ITEMS;
    thecurator: ITEMS;
    thehealer: ITEMS;
    thearcheologist: ITEMS;
    theplumehound: ITEMS;
    thewatcher: ITEMS;
  };
};

type VillagerGiftHistory = {
  villagerCoreId: number;
  itemPersistId: number;
  lastGiftedMs: number;
  associatedPreferenceVersion: number;
};

type SkillLevels = {
  type: string;
  level: number;
  xpGainedThisLevel: number;
};

type ValeriaCharacter = {
  name: string;
  guid: string;
  giftHistory: VillagerGiftHistory[];
  skillLevels: SkillLevels[];
  lastKnownPrimaryHousingPlotValue: number;
};
