"use client";
import { useMemo } from "react";
import { useAccountStore } from "./account";
import { isPointInsidePolygon, type Region } from "./coordinates";
import { games, type CompactOverlayWidget } from "./games";
import { useAccountGate } from "./hooks";
import { useSettingsStore } from "./settings";

const NO_WIDGETS: CompactOverlayWidget[] = [];

/**
 * The overlay's "Widgets Only" mode for one game. `offered` = the game lists
 * `compactOverlay` widgets. `available` = offered AND the account has Preview
 * Release Access (Elite Supporter preview); `locked` = offered but denied (the
 * UI shows it with a lock + upsell). `active` = available and switched on;
 * only the in-game overlay window consumes it (desktop/web keep the map).
 */
export function useCompactOverlay(appName: string) {
  const widgets = useMemo(
    () =>
      games.find((game) => game.id === appName)?.compactOverlay ?? NO_WIDGETS,
    [appName],
  );
  const hasPreviewAccess = useAccountStore(
    (state) => state.perks.previewReleaseAccess,
  );
  const gate = useAccountGate(hasPreviewAccess);
  const enabled = useSettingsStore((state) => state.compactOverlay ?? false);
  const toggle = useSettingsStore((state) => state.toggleCompactOverlay);
  const offered = widgets.length > 0;
  const available = offered && gate === "allow";
  return {
    widgets,
    offered,
    available,
    locked: offered && gate === "deny",
    active: available && enabled,
    toggle,
  };
}

/**
 * The area the player is in, from the game's regions on the player's map:
 * the region whose border contains the point (`inside: true`), else — for
 * games whose regions are only label points (no border) — the nearest
 * region label (`inside: false`, shown as "near ...").
 */
export function findPlayerRegion(
  regions: Region[],
  mapName: string | undefined,
  point: [number, number],
): { region: Region; inside: boolean } | null {
  let nearest: Region | null = null;
  let nearestDistSq = Infinity;
  for (const region of regions) {
    if (mapName && region.mapName && region.mapName !== mapName) continue;
    if (region.border.length >= 3) {
      if (isPointInsidePolygon(point, region.border)) {
        return { region, inside: true };
      }
      continue;
    }
    const distSq =
      (region.center[0] - point[0]) ** 2 + (region.center[1] - point[1]) ** 2;
    if (distSq < nearestDistSq) {
      nearest = region;
      nearestDistSq = distSq;
    }
  }
  return nearest ? { region: nearest, inside: false } : null;
}

/**
 * Grid cell label ("F7") of a point, matching GridLayer's default labels:
 * the letter counts along lng (A = min lng), the number along lat (1 = min
 * lat). null outside the grid.
 */
export function gridCellAt(
  bounds: [[number, number], [number, number]],
  divisions: number,
  point: [number, number],
): string | null {
  const [[minLat, minLng], [maxLat, maxLng]] = bounds;
  const col = Math.floor(((point[1] - minLng) / (maxLng - minLng)) * divisions);
  const row = Math.floor(((point[0] - minLat) / (maxLat - minLat)) * divisions);
  if (col < 0 || col >= divisions || row < 0 || row >= divisions) return null;
  return `${String.fromCharCode(65 + col)}${row + 1}`;
}
