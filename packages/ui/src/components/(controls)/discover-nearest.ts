import {
  getNodeId,
  getPositionedDiscoverTypes,
  isSameWorld,
  resolveDiscoverMode,
  type Spawn,
  type TilesConfig,
  useGameState,
  useSettingsStore,
} from "@repo/lib";
import { toast } from "sonner";
import type { NodesCoordinates, useT } from "../(providers)";

/**
 * The "Discover Nearest Node" / "Undiscover Nearest Node" hotkeys (THGLApp +
 * Overwolf map-hotkeys). Discover TOGGLES the nearest node: pressed on an
 * undiscovered node it discovers it, on a discovered one it undiscovers it.
 * With "hide discovered nodes" on it only picks undiscovered nodes, so a
 * hidden discovered node next to you can't be undiscovered by a press you
 * can't see the target of. Undiscover only picks discovered nodes and works
 * with hidden ones too (the way back from a stray press).
 */
export function discoverNearestNode({
  mode,
  filters,
  nodes,
  searchableNodes,
  typesIdMap,
  tilesConfig,
  t,
}: {
  mode: "toggle" | "undiscover";
  filters: string[];
  nodes: NodesCoordinates;
  searchableNodes: NodesCoordinates;
  typesIdMap?: Record<string, string>;
  tilesConfig: TilesConfig;
  t: ReturnType<typeof useT>;
}): void {
  const { player } = useGameState.getState();
  if (!player) {
    return;
  }
  const {
    isDiscoveredNode,
    setDiscoverNode,
    discoverModeByFilter,
    audioAlertRange,
    hideDiscoveredNodes,
  } = useSettingsStore.getState();
  // Per-type Discover-Nearest mode (user override, else positioned-type
  // default). `disabled` drops the type entirely; `predicted` keeps static
  // spawns but drops live memory detections below — so a roaming NPC/player on
  // top of you can't steal the closest-node discovery. Positioned types come
  // from the full static set, so live-resolved predictions still count as
  // fixed (discoverable) in live mode.
  const positionedTypes = getPositionedDiscoverTypes(
    searchableNodes,
    typesIdMap,
  );
  const nodeSpawns = nodes
    .filter((node) => {
      // In the player's world = on the player's map OR a layer of it (the
      // Underground reuses the player's coordinates). Lets the hotkey mark
      // layered nodes while viewing the Underground, but never a node on a
      // completely different map.
      if (
        node.mapName &&
        !isSameWorld(node.mapName, player.mapName, tilesConfig)
      ) {
        return false;
      }
      if (!filters.includes(node.type)) {
        return false;
      }
      if (
        resolveDiscoverMode(
          node.type,
          positionedTypes,
          discoverModeByFilter,
        ) === "disabled"
      ) {
        return false;
      }
      return true;
    })
    .flatMap((n) => n.spawns.map((s) => ({ ...s, type: n.type })));
  // Include live actors — they bypass coordinates-provider so we need to pull
  // them in directly for the closest-node hotkey.
  if (typesIdMap) {
    const actors = useGameState.getState().actors || [];
    for (const actor of actors) {
      const displayType =
        typesIdMap[actor.type] ?? typesIdMap[actor.type.split("_Variant.")[0]];
      if (!displayType) continue;
      if (!filters.includes(displayType)) continue;
      // Live memory detection: only discoverable when the type resolves to
      // `enabled` (positioned types like chests, or a user override).
      if (
        resolveDiscoverMode(
          displayType,
          positionedTypes,
          discoverModeByFilter,
        ) !== "enabled"
      ) {
        continue;
      }
      if (actor.mapName && actor.mapName !== player.mapName) continue;
      nodeSpawns.push({
        // Match the live-marker pipeline's id format (markers.tsx keys live
        // actors at toFixed(2)). Without an explicit id, getNodeId emits
        // full-precision coords that never match the rendered marker, so
        // discovering a live actor wouldn't hide/grey it.
        id: `${displayType}@${actor.x.toFixed(2)}:${actor.y.toFixed(2)}`,
        type: displayType,
        p:
          actor.z != null
            ? ([actor.x, actor.y, actor.z] as [number, number, number])
            : ([actor.x, actor.y] as [number, number]),
      });
    }
  }
  const { spawns, distance } = nodeSpawns.reduce(
    (nearest, spawn) => {
      // Undiscover skips undiscovered nodes; the toggle skips discovered
      // ones only while they are hidden.
      const discovered = isDiscoveredNode(getNodeId(spawn as Spawn));
      if (
        mode === "undiscover" ? !discovered : discovered && hideDiscoveredNodes
      ) {
        return nearest;
      }
      const distance = Math.sqrt(
        Math.pow(player.x - spawn.p[0], 2) + Math.pow(player.y - spawn.p[1], 2),
      );
      if (distance < nearest.distance) {
        return { distance, spawns: [spawn] };
      }
      if (distance === nearest.distance) {
        return { distance, spawns: [...nearest.spawns, spawn] };
      }
      return nearest;
    },
    { distance: Infinity, spawns: [] } as {
      distance: number;
      spawns: typeof nodeSpawns;
    },
  );
  // Cap to the shared Proximity Range (also used by audio alerts and in-range
  // labels). Beyond it — or with no candidate at all (distance stays Infinity)
  // — report nothing nearby instead of marking a node across the map.
  if (distance > audioAlertRange) {
    toast(
      mode === "toggle" ? "No nearby node found" : "No discovered node nearby",
      {
        duration: 2000,
      },
    );
    return;
  }
  // Overlapping spawns can share coordinates; mark the whole batch at the
  // nearest distance the same way (the first one's state decides).
  const nodeIds = spawns.map((spawn) => getNodeId(spawn as Spawn));
  const discover = mode === "toggle" && !isDiscoveredNode(nodeIds[0]!);
  nodeIds.forEach((nodeId) => setDiscoverNode(nodeId, discover));
  spawns.forEach((spawn, index) => {
    // Prefer the spawn's own name (e.g. "Chayne's Room"); fall back to the
    // filter-type label ("Location") for anonymous/live spawns.
    const label = t(spawn.id ?? spawn.type, { fallback: spawn.type });
    toast((discover ? "Discovered " : "Undiscovered ") + label, {
      duration: 4000,
      // A stray press is one click away from undone, whichever key it was.
      action: {
        label: t("common.undo", { fallback: "Undo" }),
        onClick: () => setDiscoverNode(nodeIds[index]!, !discover),
      },
    });
  });
}
