import { useEffect } from "react";
import { useMap } from "../(interactive-map)/store";
import { useGameState, useSettingsStore, useUserStore } from "@repo/lib";
import { useCoordinates, useT } from "../(providers)";
import { toast } from "sonner";
import { HOTKEYS, listenToWorkerMessages } from "@repo/lib/thgl-app";

export function MapHotkeys() {
  const map = useMap();
  const { nodes } = useCoordinates();
  const t = useT();
  const hotkeys = useSettingsStore((state) => state.hotkeys);

  useEffect(() => {
    if (!map) {
      return;
    }

    const cleanup = listenToWorkerMessages((message) => {
      if (message.type === "broadcast") {
        if (message.data.action === "hotkey") {
          if (message.data.payload.key === hotkeys[HOTKEYS.ZOOM_IN_APP]) {
            map.zoomIn();
          } else if (
            message.data.payload.key === hotkeys[HOTKEYS.ZOOM_OUT_APP]
          ) {
            map.zoomOut();
          }
        }
      }
    });

    return () => {
      cleanup();
    };
  }, [map, hotkeys]);

  useEffect(() => {
    const cleanup = listenToWorkerMessages((message) => {
      if (message.type === "broadcast") {
        if (message.data.action === "hotkey") {
          if (message.data.payload.key === hotkeys[HOTKEYS.DISCOVER_NODE]) {
            const { filters } = useUserStore.getState();
            const { player } = useGameState.getState();
            if (!player) {
              return;
            }
            const { isDiscoveredNode, setDiscoverNode } =
              useSettingsStore.getState();
            const nodeSpawns = nodes
              .filter((node) => {
                if (node.mapName && node.mapName !== player.mapName) {
                  return false;
                }
                if (!filters.includes(node.type)) {
                  return false;
                }
                return true;
              })
              .flatMap((n) => n.spawns.map((s) => ({ ...s, type: n.type })));
            const { spawns } = nodeSpawns.reduce(
              (nearest, spawn) => {
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
            spawns.forEach((spawn) => {
              const nodeId = spawn.isPrivate
                ? spawn.id!
                : spawn.id?.includes("@")
                  ? spawn.id
                  : `${spawn.id ?? spawn.type}@${spawn.p[0]}:${spawn.p[1]}`;
              const isDiscovered = isDiscoveredNode(nodeId);
              setDiscoverNode(nodeId, !isDiscovered);
              toast(
                (!isDiscovered ? "Discovered " : "Undiscovered ") +
                  t(spawn.type),
                { duration: 2000 },
              );
            });
          }
        }
      }
    });

    return () => {
      cleanup();
    };
  }, [nodes, hotkeys]);

  return <></>;
}
