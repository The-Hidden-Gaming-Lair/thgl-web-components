"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@repo/ui/data";
import type { SimpleSpawn, TilesConfig, FiltersConfig } from "@repo/lib";

/** Resolve a spawn `type` to its filter value's sprite icon (same lookup the
 *  location map uses), so embedded map markers render the real map icons. */
function getIconFromFilters(filters: FiltersConfig | undefined, id: string) {
  return (
    filters
      ?.find((f) => f.values.some((v) => v.id === id))
      ?.values.find((v) => v.id === id)?.icon ?? null
  );
}

const SimpleMapDynamic = dynamic(() => import("./simple-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 md:h-96 mt-4" />,
});

/** One embed marker (teleporter / NPC / interactive object) on a level map. */
export type EmbeddedMapSpawn = {
  id: string;
  type: string;
  name: string;
  /** [y, x] in the absolute world px the tiles were registered against. */
  p: [number, number];
};

/**
 * Embeds an interactive view of a whole level (its tile pyramid) with the
 * level's teleporters and interactive objects plotted, so a map's DB page can
 * show where the exits and NPCs are — teleporters included.
 */
export function DbEmbeddedMap({
  mapName,
  spawns,
  tiles,
  appName,
  filters,
}: {
  mapName: string;
  spawns: EmbeddedMapSpawn[];
  tiles: TilesConfig;
  appName: string;
  filters?: FiltersConfig;
}) {
  // No tiles registered for this map → nothing to embed.
  if (!tiles?.[mapName]) return null;
  const mapSpawns: SimpleSpawn[] = spawns.map((s) => ({
    id: s.id,
    name: s.name,
    // The DB layout ships a sliced dict without obj_*/teleporter terms, so pass
    // the data-forge-resolved name as a literal label the tooltip shows verbatim.
    label: s.name,
    type: s.type,
    icon: getIconFromFilters(filters, s.type),
    p: s.p,
    color:
      s.type === "secret_teleporter"
        ? "#c084fc"
        : s.type === "fast_travel"
          ? "#4ade80"
          : s.type === "teleporter"
            ? "#7dd3fc"
            : "#fcd34d",
  }));
  return (
    <SimpleMapDynamic
      spawns={mapSpawns}
      mapName={mapName}
      tiles={tiles}
      appName={appName}
    />
  );
}
