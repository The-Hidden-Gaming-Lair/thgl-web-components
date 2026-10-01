"use client";
// Valheim per-seed map. Valheim has no fixed map: data-forge bakes ONE default seed into
// the static tiles + nodes. When the player enters their own seed this always-mounted
// component (a) overlays a tile layer rendered client-side by the world-generator worker
// and (b) swaps the static location markers for the ones the generator places for that
// seed (via the generic static-nodes transform seam).
import { TileLayer } from "@repo/lib/web-map";
import { useEffect, useRef, useState } from "react";
import { useMapStore } from "../../(interactive-map)/store";
import type { NodesCoordinates } from "../../(providers)/coordinates-provider";
import { useStaticNodesTransformStore } from "../../(providers)/static-nodes-transform-store";
import { useValheimSeedStatus, useValheimSeedStore } from "./store";
import {
  generateLocations,
  generateResources,
  generateTile,
  loadWorldgenConfig,
  type GeneratedLocation,
  type WorldgenConfig,
} from "./worldgen-client";

/** Generated tiles stop at this zoom (0.75 m/px at 512 px tiles); the map upscales past it. */
const MAX_TILE_ZOOM = 6;

/** Same spawn id scheme as data-forge (`spawnIdAt`): `${type}@${lat}:${lng}`, 0 decimals. */
const r2 = (n: number) => Math.round(n * 100) / 100;

export function buildSeedNodes(
  cfg: WorldgenConfig,
  locations: GeneratedLocation[],
) {
  const byType = new Map<string, { id: string; p: [number, number] }[]>();
  for (const l of locations) {
    const type = cfg.locationTypes[l.prefabName];
    if (!type) continue;
    const p: [number, number] = [r2(-l.z), r2(l.x)];
    if (!byType.has(type)) byType.set(type, []);
    byType
      .get(type)!
      .push({ id: `${type}@${p[0].toFixed(0)}:${p[1].toFixed(0)}`, p });
  }
  return byType;
}

export function ValheimSeedMap() {
  const map = useMapStore((s) => s.map);
  const seed = useValheimSeedStore((s) => s.seed);
  const worldGenVersion = useValheimSeedStore((s) => s.worldGenVersion);
  const setStatus = useValheimSeedStatus((s) => s.set);
  const setTransform = useStaticNodesTransformStore((s) => s.setTransform);
  const [cfg, setCfg] = useState<WorldgenConfig | null>(null);
  const layerRef = useRef<TileLayer | null>(null);

  useEffect(() => {
    loadWorldgenConfig()
      .then(setCfg)
      .catch((e) => setStatus({ phase: "error", error: String(e) }));
  }, [setStatus]);

  const custom =
    !!cfg &&
    !!seed &&
    !(seed === cfg.defaultSeed && worldGenVersion === cfg.worldGenVersion);

  // (a) generated terrain tiles above the static default-seed pyramid
  useEffect(() => {
    if (!map || !cfg || !custom || map.mapName !== cfg.mapName) return;
    const layer = new TileLayer({
      url: "",
      tileSize: cfg.tiles.tileSize,
      minNativeZoom: 0,
      maxNativeZoom: MAX_TILE_ZOOM,
      bounds: cfg.tiles.bounds,
      transformation: cfg.tiles.transformation,
      loadTileSource: ({ z, x, y }) =>
        generateTile(seed, worldGenVersion, z, x, y, cfg.tiles.tileSize),
    });
    map.addLayer(layer, { zIndex: 1 });
    layerRef.current = layer;
    return () => {
      map.removeLayer(layer);
      layerRef.current = null;
    };
  }, [map, cfg, custom, seed, worldGenVersion]);

  // (b) the seed's locations + resources replace the default seed's markers
  useEffect(() => {
    if (!cfg || !custom) {
      setTransform(null);
      setStatus({
        phase: "idle",
        locations: 0,
        resources: 0,
        error: undefined,
      });
      return;
    }
    let cancelled = false;
    const seeded = new Set([
      ...Object.values(cfg.locationTypes),
      ...cfg.resourceTypes.map((r) => r.type),
    ]);
    const install = (
      byType: Map<string, { id: string; p: [number, number] }[]>,
      resourceTypes: Set<string>,
    ) =>
      setTransform((nodes: NodesCoordinates) => [
        ...nodes.filter(
          (n) => !(n.mapName === cfg.mapName && seeded.has(n.type)),
        ),
        ...[...byType].map(([type, spawns]) => ({
          type,
          // resources deplete -> dynamic, like the static data
          static: !resourceTypes.has(type),
          mapName: cfg.mapName,
          spawns,
        })),
      ]);
    (async () => {
      setStatus({
        phase: "locations",
        locations: 0,
        resources: 0,
        error: undefined,
      });
      const locations = await generateLocations(
        seed,
        worldGenVersion,
        (n) => !cancelled && setStatus({ locations: n }),
      );
      if (cancelled) return;
      const byType = buildSeedNodes(cfg, locations);
      const resourceTypes = new Set(cfg.resourceTypes.map((r) => r.type));
      install(byType, resourceTypes);
      setStatus({
        phase: "resources",
        locations: locations.length,
        progress: 0,
      });
      const placed = await generateResources(
        seed,
        worldGenVersion,
        cfg.resourceTypes.map((r) => r.source),
        (done, total) => !cancelled && setStatus({ progress: done / total }),
        () => !cancelled,
      );
      if (cancelled) return;
      let resources = 0;
      cfg.resourceTypes.forEach((r, i) => {
        const spawns = placed[i].map(([x, z]) => {
          const p: [number, number] = [r2(-z), r2(x)];
          return { id: `${r.type}@${p[0].toFixed(0)}:${p[1].toFixed(0)}`, p };
        });
        resources += spawns.length;
        byType.set(r.type, spawns);
      });
      install(byType, resourceTypes);
      setStatus({ phase: "ready", resources });
    })().catch((e) => {
      if (!cancelled)
        setStatus({
          phase: "error",
          error: e instanceof Error ? e.message : String(e),
        });
    });
    return () => {
      cancelled = true;
    };
  }, [cfg, custom, seed, worldGenVersion, setTransform, setStatus]);
  useEffect(() => () => setTransform(null), [setTransform]);

  return <></>;
}
