"use client";

import {
  SimpleMap,
  SimpleMarkers,
  type SimpleSpawn,
} from "@repo/ui/interactive-map";
import { type TileOptions } from "@repo/lib";
import tiles from "../coordinates/tiles.json" assert { type: "json" };

export default function PileMapDynamic({
  mapName,
  spawns,
}: {
  mapName: string;
  spawns: SimpleSpawn[];
}): JSX.Element {
  return (
    <div className="h-60 md:h-96 mt-4">
      <SimpleMap
        mapName={mapName}
        tileOptions={tiles as unknown as TileOptions}
      />
      <SimpleMarkers spawns={spawns} />
    </div>
  );
}
