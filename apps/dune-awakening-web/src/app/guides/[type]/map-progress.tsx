"use client";

import { Subtitle } from "@repo/ui/content";
import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@repo/ui/data";
import Link from "next/link";
import { Button } from "@repo/ui/controls";
import { SpawnsList } from "./spawns-list";
import { useT } from "@repo/ui/providers";
import { TilesConfig, type SimpleSpawn } from "@repo/lib";

const SimpleMapDynamic = dynamic(() => import("./simple-map-dynamic"), {
  ssr: false,
  loading: () => <Skeleton className="h-60 md:h-96 mt-4" />,
});

export default function MapProgress({
  map,
  spawns,
  tiles,
}: {
  map: string;
  spawns: SimpleSpawn[];
  tiles: TilesConfig;
}) {
  const t = useT();
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);

  return (
    <section key={map} className="mb-8">
      <Subtitle title={`${t(map)} Progress Tracker`} order={3} />

      <Suspense>
        <SimpleMapDynamic
          spawns={spawns}
          mapName={map}
          tiles={tiles}
          highlightedIds={highlightedIds}
        />
      </Suspense>
      <div className="mb-4">
        <Link href={`/maps/${t(map)}`} passHref>
          <Button variant="link">Show Full {t(map)} Map</Button>
        </Link>
      </div>
      <div className="flex flex-col gap-4 grow items-center ">
        <p className="text-sm text-muted-foreground">
          Track your discoveries and progress for each spawn. Right-Click on the
          icon on the map to mark it as discovered or undiscovered.
        </p>
        <SpawnsList
          spawns={spawns}
          onShowClick={setHighlightedIds}
          highlightedIds={highlightedIds}
        />
      </div>
    </section>
  );
}
