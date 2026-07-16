"use client";

import { useEffect, useRef, type JSX } from "react";
import { useGameState } from "@repo/lib";
import { NavmeshLayer } from "@repo/lib/web-map";
import { useMap } from "./store";
import { rotateCoordinate } from "./rotation";

/**
 * Renders the live-read dungeon walkable navmesh (floor plan) as a translucent
 * WebGL fill beneath the markers. The companion app (THGLApp) reads the runtime
 * Detour navmesh on dungeon entry and broadcasts the fan-triangulated vertex
 * buffer (already in the marker frame); we project + fill it here. Scoped to the
 * dungeon's own map, so it disappears automatically when the player leaves and the
 * map switches away — no explicit "left the dungeon" message needed.
 */
export function LiveNavmesh(): JSX.Element {
  const map = useMap();
  const navmesh = useGameState((state) => state.dungeonNavmesh);
  const layerRef = useRef<NavmeshLayer | null>(null);

  useEffect(() => {
    if (!map) return;

    const remove = () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };

    // Only draw when we have a navmesh for THIS map (the dungeon it was read from).
    if (!navmesh || !navmesh.verts?.length || navmesh.mapName !== map.mapName) {
      remove();
      return;
    }

    // The player marker rotates its coordinate by the map's tile rotation before
    // projecting; mirror that here so the floor plan lands under the marker. Done
    // once per dungeon entry (not per frame).
    const rotationDegrees = map._rotationDegrees;
    const rotationCenter = map._rotationCenter;
    const src = navmesh.verts;
    const out = new Float32Array(src.length);
    if (rotationDegrees && rotationCenter) {
      for (let i = 0; i < src.length; i += 2) {
        const [rx, ry] = rotateCoordinate(
          [src[i], src[i + 1]],
          rotationDegrees,
          rotationCenter,
        );
        out[i] = rx;
        out[i + 1] = ry;
      }
    } else {
      out.set(src);
    }

    if (!layerRef.current) {
      layerRef.current = new NavmeshLayer({ verts: out });
      // Above the (blank) dungeon tile, below zone overlays (20) and the markers.
      map.addLayer(layerRef.current, { zIndex: 5 });
    } else {
      layerRef.current.setVerts(out);
    }

    return remove;
  }, [map, map?.mapName, navmesh]);

  return <></>;
}
