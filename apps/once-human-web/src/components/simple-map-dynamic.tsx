"use client";

import {
  SimpleMap,
  SimpleMarkers,
  type SimpleSpawn,
} from "@repo/ui/interactive-map";
import { type TilesConfig } from "@repo/lib";

export default function SimpleMapDynamic({
  mapName,
  spawns,
  tiles,
}: {
  mapName: string;
  spawns: SimpleSpawn[];
  tiles: TilesConfig;
}): JSX.Element {
  return (
    <div className="h-60 md:h-96 mt-4">
      <SimpleMap mapName={mapName} tileOptions={tiles} />
      <SimpleMarkers spawns={spawns} />
    </div>
  );
}
