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
  fitToSpawns,
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
  /** Zoom to the spawns instead of the whole map (see SimpleWebMarkers). */
  fitToSpawns?: boolean;
}): JSX.Element {
  const mapRef = useRef<SimpleWebMapRef | null>(null);
  // Bounding box of the spawns, padded by 10% so edge markers aren't clipped.
  let bounds: [[number, number], [number, number]] | undefined;
  if (fitToSpawns && spawns.length > 0) {
    const lats = spawns.map((s) => s.p[0]);
    const lngs = spawns.map((s) => s.p[1]);
    const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
    const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
    const padLat = (maxLat - minLat) * 0.1 || 1;
    const padLng = (maxLng - minLng) * 0.1 || 1;
    bounds = [
      [minLat - padLat, minLng - padLng],
      [maxLat + padLat, maxLng + padLng],
    ];
  }

  return (
    <div className="h-64 md:h-96 mt-4">
      <SimpleWebMap
        mapName={mapName}
        tileOptions={tiles}
        appName={appName}
        mapRef={mapRef}
        fitBounds={bounds}
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
