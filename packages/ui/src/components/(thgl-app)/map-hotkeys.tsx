import { useUserStoreApi } from "../(providers)";
import { useEffect } from "react";
import { useMap } from "../(interactive-map)/store";
import {
  getNodeId,
  getPositionedDiscoverTypes,
  handleOverlayFullscreenHotkey,
  isThglApp,
  resolveDiscoverMode,
  type Spawn,
  useSettingsStore,
  useGameState,
} from "@repo/lib";
import { useCoordinates, useT } from "../(providers)";
import { toast } from "sonner";
import { HOTKEYS, onWebviewMessage } from "@repo/lib/thgl-app";

export function MapHotkeys() {
  const map = useMap();
  const { nodes, searchableNodes, typesIdMap } = useCoordinates();
  const userStoreApi = useUserStoreApi();
  const t = useT();

  useEffect(() => {
    // isThglApp guard: onWebviewMessage dereferences window.chrome.webview,
    // which doesn't exist in a plain browser (dev testing) and would crash
    // the whole tree.
    if (!map || !isThglApp) {
      return;
    }

    const cleanup = onWebviewMessage((message) => {
      if (message.action === "hotkey") {
        const hotkeyAction = message.payload.action;

        if (hotkeyAction === HOTKEYS.ZOOM_IN_APP) {
          map.zoomIn();
        } else if (hotkeyAction === HOTKEYS.ZOOM_OUT_APP) {
          map.zoomOut();
        } else if (hotkeyAction === HOTKEYS.TOGGLE_LOCK_APP) {
          useSettingsStore.getState().toggleLockedWindow();
        } else if (hotkeyAction === HOTKEYS.TOGGLE_LIVE_MODE) {
          useSettingsStore.getState().cycleLiveMode();
        } else if (hotkeyAction === HOTKEYS.SHOW_LABELS) {
          // Toggle show labels state
          const current = useGameState.getState().showLabelsActive;
          useGameState.getState().setShowLabelsActive(!current);
        }
      }
    });

    return () => {
      cleanup();
    };
  }, [map]);

  // NOT map-gated: TOGGLE_OVERLAY_FULLSCREEN must keep working while the
  // overlay map is auto-hidden (the map is unmounted then, and this hotkey is
  // the way back). On a flagged map it toggles the temporary override; else
  // the normal fullscreen toggle. The isThglApp guard matters because this
  // effect runs on mount (unlike the map-gated ones): onWebviewMessage
  // dereferences window.chrome.webview, which doesn't exist in a plain
  // browser (dev testing) and would crash the whole tree.
  useEffect(() => {
    if (!isThglApp) return;
    return onWebviewMessage((message) => {
      if (
        message.action === "hotkey" &&
        message.payload.action === HOTKEYS.TOGGLE_OVERLAY_FULLSCREEN
      ) {
        handleOverlayFullscreenHotkey();
      }
    });
  }, []);

  useEffect(() => {
    if (!isThglApp) {
      return;
    }
    let lastDiscoverTime = 0;
    const DISCOVER_COOLDOWN = 500;

    const cleanup = onWebviewMessage((message) => {
      if (message.action === "hotkey") {
        const hotkeyAction = message.payload.action;
        if (hotkeyAction === HOTKEYS.DISCOVER_NODE) {
          const now = Date.now();
          if (now - lastDiscoverTime < DISCOVER_COOLDOWN) {
            return;
          }
          lastDiscoverTime = now;

          const { filters } = userStoreApi.getState();
          const { player } = useGameState.getState();
          if (!player) {
            return;
          }
          const {
            isDiscoveredNode,
            setDiscoverNode,
            hideDiscoveredNodes,
            discoverModeByFilter,
            audioAlertRange,
          } = useSettingsStore.getState();
          // Per-type Discover-Nearest mode (user override, else positioned-type
          // default). `disabled` drops the type entirely; `predicted` keeps
          // static spawns but drops live memory detections below — so a roaming
          // NPC/player on top of you can't steal the closest-node discovery.
          // Positioned types come from the full static set, so live-resolved
          // predictions still count as fixed (discoverable) in live mode.
          const positionedTypes = getPositionedDiscoverTypes(searchableNodes);
          const nodeSpawns = nodes
            .filter((node) => {
              if (node.mapName && node.mapName !== player.mapName) {
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
          // Include live actors — they bypass coordinates-provider so we
          // need to pull them in directly for the closest-node hotkey.
          if (typesIdMap) {
            const actors = useGameState.getState().actors || [];
            for (const actor of actors) {
              const displayType = typesIdMap[actor.type];
              if (!displayType) continue;
              if (!filters.includes(displayType)) continue;
              // Live memory detection: only discoverable when the type resolves
              // to `enabled` (positioned types like chests, or a user override).
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
                // Match the live-marker pipeline's id format (markers.tsx keys
                // live actors at toFixed(2)). Without an explicit id, getNodeId
                // emits full-precision coords that never match the rendered
                // marker, so discovering a live actor wouldn't hide/grey it.
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
              if (
                hideDiscoveredNodes &&
                isDiscoveredNode(getNodeId(spawn as Spawn))
              ) {
                return nearest;
              }
              const distance = Math.sqrt(
                Math.pow(player.x - spawn.p[0], 2) +
                  Math.pow(player.y - spawn.p[1], 2),
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
          // Cap discovery to the shared Proximity Range (also used by audio
          // alerts and in-range labels). Beyond it — or with no candidate at
          // all (distance stays Infinity) — report nothing nearby instead of
          // discovering a node across the map.
          if (distance > audioAlertRange) {
            toast("No nearby node found", { duration: 2000 });
            return;
          }
          // Overlapping spawns can share coordinates, and discovery state is
          // coordinate-keyed: toggling each independently makes the first
          // discover flip the next one's read to "discovered", so it gets
          // undiscovered — and the coord-match removal then wipes both, leaving
          // nothing discovered. Decide ONE target state for the whole batch up
          // front and apply it uniformly (single-node case is still a toggle).
          const targetDiscovered = !spawns.every((spawn) =>
            isDiscoveredNode(getNodeId(spawn as Spawn)),
          );
          spawns.forEach((spawn) => {
            const nodeId = getNodeId(spawn as Spawn);
            setDiscoverNode(nodeId, targetDiscovered);
            // Prefer the spawn's own name (e.g. "Chayne's Room"); fall back to
            // the filter-type label ("Location") for anonymous/live spawns.
            const label = t(spawn.id ?? spawn.type, { fallback: spawn.type });
            toast(
              (targetDiscovered ? "Discovered " : "Undiscovered ") + label,
              {
                duration: 2000,
              },
            );
          });
        }
      }
    });

    return () => {
      cleanup();
    };
  }, [nodes, searchableNodes, typesIdMap]);

  return <></>;
}
