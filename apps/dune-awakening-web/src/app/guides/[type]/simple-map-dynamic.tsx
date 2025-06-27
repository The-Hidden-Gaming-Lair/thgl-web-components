"use client";

import { SimpleMap, SimpleMarkers } from "@repo/ui/interactive-map";
import { type TilesConfig, type SimpleSpawn } from "@repo/lib";
import { APP_CONFIG } from "@/config";

export default function SimpleMapDynamic({
  mapName,
  spawns,
  tiles,
  highlightedIds,
}: {
  mapName: string;
  spawns: SimpleSpawn[];
  tiles: TilesConfig;
  highlightedIds?: string[];
}): JSX.Element {
  return (
    <div className="h-64 md:h-96 mt-4">
      <SimpleMap
        mapName={mapName}
        tileOptions={tiles}
        appName={APP_CONFIG.name}
      />
      <SimpleMarkers
        spawns={spawns}
        imageSprite
        appName={APP_CONFIG.name}
        highlightedIds={highlightedIds}
      />
    </div>
  );
}
