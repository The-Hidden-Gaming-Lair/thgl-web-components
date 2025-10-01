"use client";

import { SimpleMap, SimpleMarkers } from "@repo/ui/interactive-map";
import { type TilesConfig, type SimpleSpawn, AppConfig } from "@repo/lib";
import { AdditionalTooltipType } from "../(content)";

export default function SimpleMapDynamic({
  mapName,
  spawns,
  tiles,
  highlightedIds,
  appName,
  additionalTooltip,
}: {
  mapName: string;
  spawns: SimpleSpawn[];
  tiles: TilesConfig;
  highlightedIds?: string[];
  appName: string;
  additionalTooltip?: AdditionalTooltipType;
}): JSX.Element {
  return (
    <div className="h-64 md:h-96 mt-4">
      <SimpleMap mapName={mapName} tileOptions={tiles} appName={appName} />
      <SimpleMarkers
        spawns={spawns}
        imageSprite
        appName={appName}
        highlightedIds={highlightedIds}
        iconsPath="/icons/icons.webp"
        additionalTooltip={additionalTooltip}
      />
    </div>
  );
}
