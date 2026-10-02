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
 * Overwolf map-hotkeys). Separate keys instead of one toggle: discover only
 * picks undiscovered nodes (so nodes close together can be discovered one
 * after another), undiscover only picks discovered ones (so it works even with
 * "hide discovered nodes" on, where a stray press used to leave no way back).
 */
export function discoverNearestNode({
  discover,
  filters,
  nodes,
  searchableNodes,
  typesIdMap,
  tilesConfig,
  t,
}: {
  discover: boolean;
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
      // Discover skips discovered nodes, undiscover skips undiscovered ones.
      if (isDiscoveredNode(getNodeId(spawn as Spawn)) === discover) {
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
    toast(discover ? "No nearby node found" : "No discovered node nearby", {
      duration: 2000,
    });
    return;
  }
  // Overlapping spawns can share coordinates; mark the whole batch at the
  // nearest distance the same way.
  const nodeIds = spawns.map((spawn) => getNodeId(spawn as Spawn));
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
