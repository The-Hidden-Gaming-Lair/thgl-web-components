"use client";

import dynamic from "next/dynamic";
import { notFound, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Button } from "@repo/ui/controls";
import Link from "next/link";
import { type SimpleSpawn } from "@repo/ui/interactive-map";
import { type Spawns, useT } from "@repo/ui/providers";
import { Skeleton } from "@repo/ui/data";
import { type TilesConfig, type FiltersConfig } from "@repo/lib";
import { type TimedLootPiles } from "@/app/rummage-pile/page";

const PileMapDynamic = dynamic(() => import("./pile-map-dynamic"), {
  ssr: false,
  loading: () => <Skeleton className="h-60 md:h-96 mt-4" />,
});

export default function PileMapClient({
  timedLootPiles,
  stableNodes,
  icon,
  stableNodeIcon,
  tiles,
}: {
  timedLootPiles: TimedLootPiles;
  stableNodes: Spawns;
  icon: FiltersConfig[number]["values"][number]["icon"];
  stableNodeIcon: FiltersConfig[number]["values"][number]["icon"];
  tiles: TilesConfig;
}): JSX.Element {
  const t = useT();
  const searchParams = useSearchParams();
  const mapParam = searchParams.get("map");
  const isBahariBay = mapParam === "bahari-bay";
  const isElderwood = mapParam === "elderwood";
  const isKillimaValley = !isBahariBay && !isElderwood;

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

  let targetSpawns: SimpleSpawn[];
  let mapName;
  let timestamp;
  if (isKillimaValley) {
    targetSpawns = timedLootPiles.BP_ChapaaPile_C
      ? [
          {
            id: "kilima_pile",
            name: t("kilima_pile"),
            icon,
            p: timedLootPiles.BP_ChapaaPile_C.positions[0],
          },
        ]
      : [];
    mapName = "VillageWorld";
    timestamp = timedLootPiles.BP_ChapaaPile_C.timestamp;
  } else if (isBahariBay) {
    targetSpawns = timedLootPiles.BP_BeachPile_C
      ? [
          {
            id: "beach_pile",
            name: t("beach_pile"),
            icon,
            p: timedLootPiles.BP_BeachPile_C.positions[0],
          },
        ]
      : [];
    mapName = "AdventureZoneWorld";
    timestamp = timedLootPiles.BP_BeachPile_C.timestamp;
  } else if (isElderwood) {
    targetSpawns =
      timedLootPiles.BP_RummagePile_Breakable_Elderwood_C?.positions.map(
        (p, i) => ({
          id: "elderwood_pile_" + i,
          name: t("elderwood_pile"),
          icon,
          p: p,
        }),
      ) || [];
    mapName = "AZ2_Root";
    timestamp = timedLootPiles.BP_RummagePile_Breakable_Elderwood_C.timestamp;
  } else {
    notFound();
  }

  const stableSpawns = stableNodes
    .filter((s) => s.mapName === mapName)
    .map((s) => ({
      id: s.id,
      name: t(s.id),
      p: s.p,
      icon: stableNodeIcon,
    }));

  function formatDate(date: Date) {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }

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
        <Button variant={isElderwood ? "default" : "secondary"} asChild>
          <Link href={`?${createQueryString("map", "elderwood")}`}>
            Elderwood
          </Link>
        </Button>
      </div>
      <PileMapDynamic
        spawns={[...targetSpawns, ...stableSpawns]}
        mapName={mapName}
        tiles={tiles}
      />
      <p className="text-zinc-200 text-sm">
        Updated at {formatDate(new Date(timestamp))}
      </p>
    </>
  );
}
