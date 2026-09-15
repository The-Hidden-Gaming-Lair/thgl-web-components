"use client";

import { useRef, type JSX } from "react";
import {
  SimpleWebMap,
  SimpleWebMarkers,
  type SimpleWebMapRef,
} from "../(interactive-map)";
import { type TilesConfig, type SimpleSpawn } from "@repo/lib";
import { AdditionalTooltipType } from "../(content)";

export default function SimpleMapDynamic({
  mapName,
  spawns,
  tiles,
  highlightedIds,
  appName,
  additionalTooltip,
  onClick,
}: {
  mapName: string;
  spawns: SimpleSpawn[];
  tiles: TilesConfig;
  highlightedIds?: string[];
  appName: string;
  additionalTooltip?: AdditionalTooltipType;
  /** Marker click handler, forwarded to `SimpleWebMarkers` — lets an embed
   *  deep-link a marker (e.g. DB location maps opening the full map). */
  onClick?: (spawn: SimpleSpawn) => void;
}): JSX.Element {
  const mapRef = useRef<SimpleWebMapRef | null>(null);

  return (
    <div className="h-64 md:h-96 mt-4">
      <SimpleWebMap
        mapName={mapName}
        tileOptions={tiles}
        appName={appName}
        mapRef={mapRef}
      />
      <SimpleWebMarkers
        spawns={spawns}
        appName={appName}
        highlightedIds={highlightedIds}
        iconsPath="/icons/icons.webp"
        additionalTooltip={additionalTooltip}
        mapRef={mapRef}
        onClick={onClick}
      />
    </div>
  );
}
