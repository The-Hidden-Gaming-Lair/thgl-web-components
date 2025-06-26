"use client";

import {
  SimpleMap,
  SimpleMarkers,
  type SimpleSpawn,
} from "@repo/ui/interactive-map";
import { type TilesConfig } from "@repo/lib";
import { APP_CONFIG } from "@/config";

export default function PileMapDynamic({
  mapName,
  spawns,
  tiles,
}: {
  mapName: string;
  spawns: SimpleSpawn[];
  tiles: TilesConfig;
}): JSX.Element {
  const pileSpawns = spawns.filter((spawn) => spawn.name.includes("Pile"));
  const center = pileSpawns.reduce(
    (acc, curr) => {
      acc[0] += curr.p[0];
      acc[1] += curr.p[1];
      return acc;
    },
    [0, 0] as [number, number],
  );
  center[0] /= pileSpawns.length;
  center[1] /= pileSpawns.length;
  return (
    <div className="h-64 md:h-96 mt-4">
      <SimpleMap
        mapName={mapName}
        tileOptions={tiles}
        appName={APP_CONFIG.name}
        view={{
          center: center,
          zoom: 0,
        }}
      />
      <SimpleMarkers
        spawns={spawns}
        imageSprite
        appName={APP_CONFIG.name}
        highlightedMarkerId={spawns.length === 1 ? spawns[0].id : undefined}
      />
    </div>
  );
}
