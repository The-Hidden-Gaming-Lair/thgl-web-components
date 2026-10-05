"use client";

import { AdditionalTooltipType, Subtitle } from "../(content)";
import { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { Button } from "../ui/button";
import { SpawnsList } from "./spawns-list";
import { useLocale, useT } from "../(providers)";
import { localizePath, TilesConfig, type SimpleSpawn } from "@repo/lib";

const SimpleMapDynamic = dynamic(() => import("./simple-map-dynamic"), {
  ssr: false,
  loading: () => <Skeleton className="h-60 md:h-96 mt-4" />,
});

export default function MapProgress({
  map,
  mapLabel,
  spawns,
  tiles,
  appName,
  additionalTooltip,
  typeGroupLabels,
}: {
  map: string;
  /**
   * Pre-resolved display label for `map`. Computed server-side from the
   * full dict because the client-shipped dict only carries UI strings.
   */
  mapLabel?: string;
  spawns: SimpleSpawn[];
  tiles: TilesConfig;
  appName: string;
  additionalTooltip?: AdditionalTooltipType;
  typeGroupLabels?: Record<string, string>;
}) {
  const t = useT();
  const locale = useLocale();
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);

  // Defensive: if no server-resolved label was passed, try the client
  // dict (works for legacy single-tenant apps that ship the full dict).
  const resolvedMap = mapLabel ?? t(map);

  return (
    <section key={map} className="mb-8">
      <Subtitle
        title={t("guide.mapProgress.title", {
          vars: {
            map: resolvedMap,
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
          fitToSpawns
        />
      </Suspense>
      <div className="mb-4">
        <Link
          href={localizePath(
            `/maps/${tiles[map]?.defaultTitle || resolvedMap}`,
            locale,
          )}
          passHref
        >
          <Button variant="link">
            {t("guide.mapProgress.full", {
              vars: {
                map: resolvedMap,
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
          typeGroupLabels={typeGroupLabels}
          appName={appName}
        />
      </div>
    </section>
  );
}
