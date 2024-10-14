"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Button } from "@repo/ui/controls";
import Link from "next/link";
import { type SimpleSpawn } from "@repo/ui/interactive-map";
import { useT } from "@repo/ui/providers";
import { Skeleton } from "@repo/ui/data";
import { type TimedLootPiles } from "@/app/rummage-pile/page";

const PileMapDynamic = dynamic(() => import("./pile-map-dynamic"), {
  ssr: false,
  loading: () => <Skeleton className="h-60 md:h-96 mt-4" />,
});

export default function PileMapClient({
  timedLootPiles,
}: {
  timedLootPiles: TimedLootPiles;
}): JSX.Element {
  const t = useT();
  const searchParams = useSearchParams();
  const mapParam = searchParams.get("map");
  const isBahariBay = mapParam === "bahari-bay";
  const isKillimaValley = !isBahariBay;

  useEffect(() => {
    if (!mapParam) {
      history.pushState(
        null,
        "",
        `${window.location.pathname}?map=kilima-valley`,
      );
    }
  }, []);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  const chapaaPile: SimpleSpawn = {
    id: "kilima_pile",
    name: t("kilima_pile"),
    icon: "/icons/other_player.webp",
    p: [
      timedLootPiles.BP_ChapaaPile_C.position[0],
      timedLootPiles.BP_ChapaaPile_C.position[1],
    ],
  };
  const beachPile: SimpleSpawn = {
    id: "beach_pile",
    name: t("beach_pile"),
    icon: "/icons/other_player.webp",
    p: [
      timedLootPiles.BP_BeachPile_C.position[0],
      timedLootPiles.BP_BeachPile_C.position[1],
    ],
  };

  const target = isKillimaValley ? chapaaPile : beachPile;
  const timestamp = isKillimaValley
    ? timedLootPiles.BP_ChapaaPile_C.timestamp
    : timedLootPiles.BP_BeachPile_C.timestamp;

  function formatDate(date: Date) {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }

  const mapName = isBahariBay ? "AdventureZoneWorld" : "VillageWorld";

  return (
    <>
      <div className="flex items-center justify-center gap-4">
        <Button variant={isKillimaValley ? "default" : "secondary"} asChild>
          <Link href={`?${createQueryString("map", "kilima-valley")}`}>
            Kilima Valley
          </Link>
        </Button>
        <Button variant={isBahariBay ? "default" : "secondary"} asChild>
          <Link href={`?${createQueryString("map", "bahari-bay")}`}>
            Bahari Bay
          </Link>
        </Button>
      </div>
      <PileMapDynamic spawns={[target]} mapName={mapName} />
      <p className="text-zinc-200 text-sm">
        Updated at {formatDate(new Date(timestamp))}
      </p>
    </>
  );
}
