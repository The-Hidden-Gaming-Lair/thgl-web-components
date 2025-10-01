"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@repo/ui/data";
import { type TilesConfig, type SimpleSpawn } from "@repo/lib";

const SimpleMapDynamic = dynamic(() => import("./simple-map-dynamic"), {
  ssr: false,
  loading: () => <Skeleton className="h-60 md:h-96 mt-4" />,
});

export default function SimpleMapClient({
  spawns,
  tiles,
}: {
  spawns: SimpleSpawn[];
  tiles: TilesConfig;
}): JSX.Element {
  return <SimpleMapDynamic spawns={spawns} mapName="default" tiles={tiles} />;
}
