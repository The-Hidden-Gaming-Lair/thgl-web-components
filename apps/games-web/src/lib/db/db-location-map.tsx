"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@repo/ui/data";
import type { SimpleSpawn, TilesConfig, FiltersConfig } from "@repo/lib";

/** Resolve a spawn `type` to its filter value's sprite icon (same lookup guide pages use), so DB
 * location maps render the real map icons instead of the plain white-circle fallback. */
function getIconFromFilters(filters: FiltersConfig | undefined, id: string) {
  return (
    filters
      ?.find((f) => f.values.some((v) => v.id === id))
      ?.values.find((v) => v.id === id)?.icon ?? null
  );
}

// Leaflet doesn't render in SSR — dynamic-import the map with ssr:false and a
// skeleton placeholder (mirrors the once-human EntryMap pattern).
const SimpleMapDynamic = dynamic(() => import("./simple-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 md:h-96 mt-4" />,
});

/** One map location for a DB entry (e.g. a chest), produced by data-forge. */
type DbLocation = {
  map: string;
  type: string;
  node: string;
  x: number;
  y: number;
  label: string;
};

/**
 * Embeds an interactive map pinning every location a DB entry is found at
 * (e.g. the chests holding an item), instead of a flat list of coordinates.
 */
export function DbLocationMap({
  locations,
  mapName,
  tiles,
  appName,
  filters,
}: {
  locations: DbLocation[];
  mapName: string;
  tiles: TilesConfig;
  appName: string;
  filters?: FiltersConfig;
}) {
  const spawns: SimpleSpawn[] = locations.map((l) => ({
    id: l.node,
    name: l.label,
    type: l.type,
    icon: getIconFromFilters(filters, l.type),
    // The map renderer expects [lat, lng]-style [y, x]; data-forge stores
    // x = worldX, y = worldY, and the node id is `type@y:x`.
    p: [l.y, l.x],
    color: l.type === "chest_rune" ? "#c084fc" : "#fcd34d",
  }));
  return (
    <SimpleMapDynamic
      spawns={spawns}
      mapName={mapName}
      tiles={tiles}
      appName={appName}
    />
  );
}
