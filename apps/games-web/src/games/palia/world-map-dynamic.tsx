"use client";

import { useRef, type JSX } from "react";
import {
  SimpleWebMap,
  SimpleWebMarkers,
  type SimpleWebMapRef,
} from "@repo/ui/interactive-map";
import { PaliaWebGrid } from "@repo/ui/data";
import { type TilesConfig, type SimpleSpawn } from "@repo/lib";

// A single world's event locations on the relevant Palia map. Mirrors the
// rummage-pile map (SimpleWebMap + SimpleWebMarkers) but plots the live
// Flow Tree / Palium spots reported for one world.
export default function WorldMapDynamic({
  mapName,
  spawns,
  tiles,
  icons,
}: {
  mapName: string;
  spawns: SimpleSpawn[];
  tiles: TilesConfig;
  icons: string;
}): JSX.Element {
  const mapRef = useRef<SimpleWebMapRef | null>(null);
  const center =
    spawns.length > 0
      ? ([spawns[0]!.p[0], spawns[0]!.p[1]] as [number, number])
      : undefined;

  return (
    <div className="h-64 md:h-80">
      <SimpleWebMap
        mapName={mapName}
        tileOptions={tiles}
        appName="palia"
        view={center ? { center, zoom: 0 } : undefined}
        mapRef={mapRef}
      />
      <SimpleWebMarkers
        spawns={spawns}
        iconsPath={icons}
        appName="palia"
        withoutDiscoveredNodes
        mapRef={mapRef}
      />
      <PaliaWebGrid mapName={mapName} mapRef={mapRef} force />
    </div>
  );
}
