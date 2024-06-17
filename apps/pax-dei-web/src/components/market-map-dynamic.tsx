"use client";
import {
  SimpleMap,
  SimpleMarkers,
  type SimpleSpawn,
} from "@repo/ui/interactive-map";
import type { TileOptions } from "@repo/lib";
import tiles from "../coordinates/tiles.json" assert { type: "json" };

export default function MarketMapDynamic({
  mapName,
  spawns,
}: {
  mapName: string;
  spawns: SimpleSpawn[];
}): JSX.Element {
  return (
    <>
      <SimpleMap
        mapName={mapName}
        tileOptions={tiles as unknown as TileOptions}
      />
      <SimpleMarkers
        spawns={spawns}
        onClick={(spawn) => {
          const url = spawn.description.match(/href="([^"]+)"/);
          if (url) {
            window.open(url[1], "_blank");
          }
        }}
      />
    </>
  );
}
