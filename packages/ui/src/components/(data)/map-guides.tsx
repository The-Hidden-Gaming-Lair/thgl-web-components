"use client";

import { SimpleSpawn, TilesConfig } from "@repo/lib";
import MapProgress from "./map-progress";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Button, ScrollArea } from "@repo/ui/controls";
import Link from "next/link";
import { useT } from "@repo/ui/providers";
import { AdditionalTooltipType } from "../(content)";

export default function MapGuides({
  maps,
  simpleSpawns,
  tiles,
  appName,
  additionalTooltip,
}: {
  maps: string[];
  simpleSpawns: SimpleSpawn[];
  tiles: TilesConfig;
  appName: string;
  additionalTooltip?: AdditionalTooltipType;
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
      <ScrollArea orientation="horizontal" className="w-full max-w-[90vw]">
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
      </ScrollArea>
      <MapProgress
        spawns={mapSpawns}
        map={currentMap}
        tiles={tiles}
        appName={appName}
        additionalTooltip={additionalTooltip}
      />
    </>
  );
}
