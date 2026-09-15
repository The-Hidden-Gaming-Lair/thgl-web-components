"use client";

import {
  decodeFromBuffer,
  getApiUrl,
  getNodeId,
  type SimpleSpawn,
  type TilesConfig,
} from "@repo/lib";
import MapProgress from "./map-progress";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import useSWRImmutable from "swr/immutable";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { useT, type Spawns } from "../(providers)";
import { AdditionalTooltipType } from "../(content)";

export default function MapGuides({
  appName,
  locale,
  queries,
  typeLabels,
  typeIcons,
  defaultMapName,
  maps,
  mapLabels,
  tiles,
  additionalTooltip,
  typeGroupLabels,
}: {
  appName: string;
  locale: string;
  /**
   * Search-API queries (`type=…` / `group=…`) whose spawns make up this guide.
   * Loaded here on the client: the server render only carries the count and
   * the maps, so a type with tens of thousands of spawns stays a small page.
   */
  queries: string[];
  /** type id → display label, resolved server-side with the full game dict. */
  typeLabels: Record<string, string>;
  /** type id → filter icon, for spawns without their own icon. */
  typeIcons: Record<string, SimpleSpawn["icon"]>;
  defaultMapName: string;
  maps: string[];
  /**
   * Pre-resolved display labels for each map key, computed server-side.
   * Required for multi-tenant deployments whose client dict only ships
   * UI strings (map names live in the full game dict).
   */
  mapLabels?: Record<string, string>;
  tiles: TilesConfig;
  additionalTooltip?: AdditionalTooltipType;
  typeGroupLabels?: Record<string, string>;
}) {
  const t = useT();
  const searchParams = useSearchParams();
  const mapParam = searchParams.get("map");
  const currentMap = mapParam || maps[0];

  // Defensive fallback for legacy callers that don't pass mapLabels
  // (single-tenant apps shipping the full dict still translate via t()).
  const labelFor = (m: string) => mapLabels?.[m] ?? t(m);

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

  // `names=1` attaches the locale's name to spawns that own a dict term; the
  // rest fall back to the type label below.
  const { data: spawns } = useSWRImmutable(
    ["guide-spawns", appName, locale, ...queries],
    async () => {
      const results = await Promise.all(
        queries.map(async (query) => {
          const url = getApiUrl(appName, `${query}&locale=${locale}&names=1`);
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
          }
          const buffer = await response.arrayBuffer();
          return decodeFromBuffer<Spawns>(new Uint8Array(buffer));
        }),
      );
      return results.flat();
    },
    {
      onError: (error) => {
        toast.error("Failed to load the locations. Please try again later.");
        console.error("Failed to load guide spawns:", error);
      },
    },
  );

  const simpleSpawns = useMemo<SimpleSpawn[]>(
    () =>
      (spawns ?? []).map((s) => {
        const typeLabel = typeLabels[s.type] ?? s.type;
        // A spawn's own term (named NPC/chest) wins; unnamed spawns group into
        // one list row under the type name.
        const name = s.name || typeLabel;
        return {
          id: getNodeId(s),
          p: s.p,
          mapName: s.mapName || defaultMapName,
          type: s.type,
          name,
          // The client dict only ships UI strings, so the tooltip can't
          // re-translate `name` — hand it the resolved label verbatim.
          label: name,
          typeLabel,
          icon: s.icon || typeIcons[s.type] || null,
          description: s.description,
          data: s.data,
        };
      }),
    [spawns, typeLabels, typeIcons, defaultMapName],
  );

  const mapSpawns = simpleSpawns.filter((s) => s.mapName === currentMap);

  return (
    <>
      <ScrollArea orientation="horizontal" className="w-full max-w-[90vw]">
        <div
          className="flex items-center justify-center gap-4"
          role="tablist"
          aria-label="Maps"
        >
          {maps.map((map) => (
            <Button
              key={map}
              variant={map === currentMap ? "default" : "secondary"}
              role="tab"
              aria-selected={map === currentMap}
              asChild
            >
              <Link href={`?${createQueryString("map", map)}`}>
                {labelFor(map)}
              </Link>
            </Button>
          ))}
        </div>
      </ScrollArea>
      {spawns ? (
        <MapProgress
          spawns={mapSpawns}
          map={currentMap}
          mapLabel={labelFor(currentMap)}
          tiles={tiles}
          appName={appName}
          additionalTooltip={additionalTooltip}
          typeGroupLabels={typeGroupLabels}
        />
      ) : (
        <section className="mb-8" aria-busy="true">
          <Skeleton className="h-64 md:h-96 mt-4" />
          <Skeleton className="h-10 mt-4 max-w-2xl mx-auto" />
        </section>
      )}
    </>
  );
}
