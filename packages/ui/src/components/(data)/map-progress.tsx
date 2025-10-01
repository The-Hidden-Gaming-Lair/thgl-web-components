"use client";

import { AdditionalTooltipType, Subtitle } from "@repo/ui/content";
import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@repo/ui/data";
import Link from "next/link";
import { Button } from "@repo/ui/controls";
import { SpawnsList } from "./spawns-list";
import { useLocale, useT } from "@repo/ui/providers";
import { localizePath, TilesConfig, type SimpleSpawn } from "@repo/lib";

const SimpleMapDynamic = dynamic(() => import("./simple-map-dynamic"), {
  ssr: false,
  loading: () => <Skeleton className="h-60 md:h-96 mt-4" />,
});

export default function MapProgress({
  map,
  spawns,
  tiles,
  appName,
  additionalTooltip,
}: {
  map: string;
  spawns: SimpleSpawn[];
  tiles: TilesConfig;
  appName: string;
  additionalTooltip?: AdditionalTooltipType;
}) {
  const t = useT();
  const locale = useLocale();
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);

  return (
    <section key={map} className="mb-8">
      <Subtitle
        title={t("guide.mapProgress.title", {
          vars: {
            map: t(map),
          },
        })}
        order={3}
      />

      <Suspense>
        <SimpleMapDynamic
          spawns={spawns}
          mapName={map}
          tiles={tiles}
          highlightedIds={highlightedIds}
          appName={appName}
          additionalTooltip={additionalTooltip}
        />
      </Suspense>
      <div className="mb-4">
        <Link
          href={localizePath(
            `/maps/${tiles[map]?.defaultTitle || t(map)}`,
            locale,
          )}
          passHref
        >
          <Button variant="link">
            {t("guide.mapProgress.full", {
              vars: {
                map: t(map),
              },
            })}
          </Button>
        </Link>
      </div>
      <div className="flex flex-col gap-4 grow items-center ">
        <p className="text-sm text-muted-foreground">
          {t("guide.mapProgress.description")}
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
