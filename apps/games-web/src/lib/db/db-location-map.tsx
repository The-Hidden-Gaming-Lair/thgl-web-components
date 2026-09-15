"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Skeleton } from "@repo/ui/data";
import {
  localizePath,
  type SimpleSpawn,
  type TilesConfig,
  type FiltersConfig,
} from "@repo/lib";

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

/** Deep link to one location on the full map — the same URL the no-tiles
 *  fallback list in `generic-view.tsx` builds. */
function mapHref(loc: DbLocation, locale: string) {
  const node = encodeURIComponent(loc.node);
  return localizePath(
    `/maps/${loc.map}/${loc.type}/${node}?id=${node}`,
    locale,
  );
}

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
  locale = "en",
}: {
  locations: DbLocation[];
  mapName: string;
  tiles: TilesConfig;
  appName: string;
  filters?: FiltersConfig;
  locale?: string;
}) {
  const router = useRouter();
  const spawns: SimpleSpawn[] = locations.map((l) => ({
    id: l.node,
    name: l.label,
    // The DB layout ships a sliced client dict without the game's spawn terms, so
    // pass the data-forge-resolved name as a literal label the tooltip prints
    // verbatim — otherwise it treats `name` as a dict key, misses, and falls back
    // to the raw type id ("medic", "manual"). Same reason as `db-embedded-map.tsx`.
    label: l.label,
    type: l.type,
    icon: getIconFromFilters(filters, l.type),
    // The map renderer expects [lat, lng]-style [y, x]; data-forge stores
    // x = worldX, y = worldY, and the node id is `type@y:x`.
    p: [l.y, l.x],
    color: l.type === "chest_rune" ? "#c084fc" : "#fcd34d",
  }));
  // Marker click → that exact node on the full map. Markers already render a
  // pointer cursor on hover; until now nothing was wired to the click.
  const hrefByNode = useMemo(
    () => new Map(locations.map((l) => [l.node, mapHref(l, locale)])),
    [locations, locale],
  );
  return (
    <>
      <SimpleMapDynamic
        spawns={spawns}
        mapName={mapName}
        tiles={tiles}
        appName={appName}
        onClick={(spawn) => {
          const href = hrefByNode.get(spawn.id);
          if (href) router.push(href);
        }}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Click a marker to open it on the full map.
      </p>
    </>
  );
}
