"use client";

import { useEffect, useRef } from "react";
import { useUserStore } from "../(providers)";
import { getNodeId, isOverwolf, Spawn } from "@repo/lib";
import { useCoordinates, useT } from "../(providers)";
import { useMapStore } from "../(interactive-map)";
import { trackPageview } from "../(header)/plausible-tracker";

export function getMarkerDisplayName(
  spawn: { name?: string; id?: string; type: string },
  t: ReturnType<typeof useT>,
): string {
  const termId = (spawn.name ?? spawn.id ?? spawn.type).replace(/my_\d+_/, "");
  return t(termId, { fallback: spawn.type });
}

/** Find a spawn by selectedNodeId, with fallback for coordinate mismatches from clustering */
function findSpawn(selectedNodeId: string, spawns: Spawn[]): Spawn | null {
  // Pass 1: exact match
  for (const s of spawns) {
    if (getNodeId(s) === selectedNodeId) return s;
    if (s.cluster) {
      for (const c of s.cluster) {
        if (getNodeId(c) === selectedNodeId) return c;
      }
    }
  }
  // Pass 2: match by id prefix (before @) — handles coordinate mismatch from clustering
  const atIdx = selectedNodeId.indexOf("@");
  if (atIdx > 0) {
    const idPart = selectedNodeId.slice(0, atIdx);
    for (const s of spawns) {
      const sid = s.id?.includes("@")
        ? s.id.slice(0, s.id.indexOf("@"))
        : s.id || s.type;
      if (sid === idPart) return s;
      if (s.cluster) {
        for (const c of s.cluster) {
          const cid = c.id?.includes("@")
            ? c.id.slice(0, c.id.indexOf("@"))
            : c.id || c.type;
          if (cid === idPart) return c;
        }
      }
    }
  }
  return null;
}

export function useMarkerUrlSync(markerSlug: string | undefined) {
  const { spawns, nodes } = useCoordinates();
  const t = useT();
  const selectedNodeId = useUserStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useUserStore((state) => state.setSelectedNodeId);
  const mapName = useUserStore((state) => state.mapName);
  const hasResolved = useRef(false);
  // No-marker fallback: the map instance it centered + the map it was opened on.
  const fallback = useRef<{ map: unknown; mapName: string } | null>(null);
  const resolvedSlug = useRef<string | undefined>(undefined);
  const initialTitle = useRef<string>("");

  // Reset when markerSlug changes
  if (markerSlug !== resolvedSlug.current) {
    hasResolved.current = false;
    fallback.current = null;
  }

  // Store the original document title on mount
  useEffect(() => {
    initialTitle.current = document.title;
  }, []);

  // Resolve markerSlug to nodeId on initial load
  // Search raw nodes (unfiltered) so markers work even if filter is disabled
  useEffect(() => {
    if (!markerSlug || hasResolved.current || !nodes.length) return;

    const findInNodes = (): Spawn | null => {
      const searchParams = new URLSearchParams(location.search);
      const idParam = searchParams.get("id");
      const target = idParam || (markerSlug?.includes("@") ? markerSlug : null);

      // Pass 1: exact nodeId match (most reliable)
      if (target) {
        for (const node of nodes) {
          if (node.mapName && node.mapName !== mapName) continue;
          for (const s of node.spawns) {
            const spawn = {
              ...s,
              id: s.id ?? node.type,
              type: node.type,
            } as Spawn;
            if (getNodeId(spawn) === target) return spawn;
          }
        }
      }

      // Pass 2: coordinate-tolerant match for ?id= (handles "6024.00" vs "6024")
      if (target && target.includes("@")) {
        const [targetId, targetCoords] = target.split("@");
        const [tx, ty] = targetCoords.split(":").map(Number);
        if (!isNaN(tx) && !isNaN(ty)) {
          for (const node of nodes) {
            if (node.mapName && node.mapName !== mapName) continue;
            for (const s of node.spawns) {
              const sid = s.id ?? node.type;
              if (sid !== targetId) continue;
              if (Math.abs(s.p[0] - tx) < 0.1 && Math.abs(s.p[1] - ty) < 0.1) {
                return { ...s, id: sid, type: node.type } as Spawn;
              }
            }
          }
        }
      }

      // Pass 3: match by translated name
      if (!target && markerSlug) {
        for (const node of nodes) {
          if (node.mapName && node.mapName !== mapName) continue;
          for (const s of node.spawns) {
            const spawn = {
              ...s,
              id: s.id ?? node.type,
              type: node.type,
            } as Spawn;
            const name = getMarkerDisplayName(spawn, t);
            if (name === markerSlug) return spawn;
          }
        }
      }

      return null;
    };

    const match = findInNodes();
    let coords: [number, number];
    if (match) {
      // Select immediately
      hasResolved.current = true;
      resolvedSlug.current = markerSlug;
      setSelectedNodeId(getNodeId(match));
      coords = [match.p[0], match.p[1]];
    } else {
      // A codex "Found at" pin can name a spot that is no marker (a villager schedule spot, a
      // shop register): still open the map THERE. Tracked per map INSTANCE — the map can be
      // rebuilt right after load, keeping its old view — and only on the map the link opened
      // (a later map switch is the user's). Not marked resolved, so a marker that turns up in
      // later nodes is still selected.
      const target = new URLSearchParams(location.search).get("id");
      const [x, y] = (target?.split("@")[1]?.split(":") ?? []).map(Number);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      if (fallback.current && fallback.current.mapName !== mapName) return;
      resolvedSlug.current = markerSlug;
      coords = [x, y];
    }

    // Center and zoom map on spawn
    const tryCenter = () => {
      const map = useMapStore.getState().map;
      if (!map) return false;
      // Zoom in to ~70% of max zoom so the marker is easy to find
      const minZoom = (map as any).minZoom ?? 0;
      const maxZoom = (map as any).maxZoom ?? 10;
      const targetZoom = Math.round(minZoom + (maxZoom - minZoom) * 0.7);
      const currentZoom = map.getZoom();
      map.setCenter(coords);
      if (currentZoom < targetZoom) {
        map.setZoom(targetZoom);
      }
      return true;
    };

    if (!match) {
      const centerInstance = () => {
        const map = useMapStore.getState().map;
        if (!map || fallback.current?.map === map) return;
        if (tryCenter()) fallback.current = { map, mapName };
      };
      centerInstance();
      return useMapStore.subscribe(centerInstance);
    }
    if (!tryCenter()) {
      const unsub = useMapStore.subscribe(() => {
        if (tryCenter()) unsub();
      });
      return unsub;
    }
  }, [markerSlug, nodes, mapName, t, setSelectedNodeId]);

  // Sync URL and document.title when selectedNodeId changes
  useEffect(() => {
    if (isOverwolf) return;
    if (typeof window === "undefined") return;
    if (!location.pathname.includes("/maps/")) return;

    const mapsIdx = location.pathname.indexOf("/maps/");
    const afterMaps = location.pathname.slice(mapsIdx + 6);
    const mapSlug = afterMaps.split("/")[0];
    if (!mapSlug) return;
    const basePath = location.pathname.slice(0, mapsIdx + 6) + mapSlug;

    if (selectedNodeId && spawns.length) {
      const spawn = findSpawn(selectedNodeId, spawns);
      if (spawn) {
        const name = getMarkerDisplayName(spawn, t);
        const typeName = t(spawn.type, { fallback: spawn.type });
        const canonicalNodeId = getNodeId(spawn);
        // Use human name in path if the spawn has a translated/readable name
        const rawId = (spawn.name ?? spawn.id ?? spawn.type).replace(
          /my_\d+_/,
          "",
        );
        const hasSpecificName = name !== rawId && name !== typeName;
        const slug = hasSpecificName
          ? encodeURIComponent(name)
          : encodeURIComponent(canonicalNodeId);
        const query = hasSpecificName
          ? `?id=${encodeURIComponent(canonicalNodeId)}`
          : "";
        const newPath = `${basePath}/${encodeURIComponent(typeName)}/${slug}${query}`;
        if (
          decodeURIComponent(location.pathname + location.search) !==
          decodeURIComponent(newPath)
        ) {
          history.replaceState({}, "", newPath);
          // Only update title for interactive selections (URL changed),
          // not for SSR-loaded markers where the server already set the localized title
          document.title = `${name} - ${t(mapName)} | ${document.title.split(" | ").pop() ?? ""}`;
          trackPageview();
        }
      }
    } else if (!selectedNodeId) {
      // Deselected — restore base URL and title
      // But skip if we have a pending slug that hasn't resolved yet
      if (markerSlug && !hasResolved.current) return;
      if (
        decodeURIComponent(location.pathname) !== decodeURIComponent(basePath)
      ) {
        history.replaceState({}, "", basePath);
      }
      if (initialTitle.current) {
        document.title = initialTitle.current;
      }
    }
  }, [selectedNodeId, spawns, t, mapName]);
}
