"use client";

import { SimpleSpawn, TilesConfig } from "@repo/lib";
import MapProgress from "./map-progress";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Button } from "@repo/ui/controls";
import Link from "next/link";
import { useT } from "@repo/ui/providers";

export default function MapGuides({
  maps,
  simpleSpawns,
  tiles,
}: {
  maps: string[];
  simpleSpawns: SimpleSpawn[];
  tiles: TilesConfig;
}) {
  const t = useT();
  const searchParams = useSearchParams();
  const mapParam = searchParams.get("map");
  const currentMap = mapParam || maps[0];

  useEffect(() => {
    if (!mapParam) {
      history.replaceState(
        null,
        "",
        `${window.location.pathname}?map=${currentMap}`,
      );
    }
  }, []);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  const mapSpawns = simpleSpawns.filter((s) => s.mapName === currentMap);

  return (
    <>
      <div className="flex items-center justify-center gap-4">
        {maps.map((map) => (
          <Button
            key={map}
            variant={map === currentMap ? "default" : "secondary"}
            asChild
          >
            <Link href={`?${createQueryString("map", map)}`}>{t(map)}</Link>
          </Button>
        ))}
      </div>
      <MapProgress spawns={mapSpawns} map={currentMap} tiles={tiles} />
    </>
  );
}
