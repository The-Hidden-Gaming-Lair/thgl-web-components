"use client";

import { SimpleMap, SimpleMarkers } from "@repo/ui/interactive-map";
import { SimpleSpawn, type TilesConfig } from "@repo/lib";

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
