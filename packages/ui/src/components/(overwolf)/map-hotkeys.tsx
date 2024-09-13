import { HOTKEYS } from "@repo/lib/overwolf";
import { useEffect } from "react";
import { useMap } from "../(interactive-map)/store";
import { useGameState, useSettingsStore } from "@repo/lib";
import { Spawns, useCoordinates, useT } from "../(providers)";
import { toast } from "sonner";

export function MapHotkeys() {
  const map = useMap();
  const { spawns } = useCoordinates();
  const t = useT();

  useEffect(() => {
    if (!map) {
      return;
    }

    const handleHotkey = (event: overwolf.settings.hotkeys.OnPressedEvent) => {
      if (event.name === HOTKEYS.ZOOM_IN_APP) {
        map.zoomIn();
      } else if (event.name === HOTKEYS.ZOOM_OUT_APP) {
        map.zoomOut();
      }
    };
    overwolf.settings.hotkeys.onPressed.addListener(handleHotkey);

    return () => {
      overwolf.settings.hotkeys.onPressed.removeListener(handleHotkey);
    };
  }, [map]);

  useEffect(() => {
    const handleHotkey = (event: overwolf.settings.hotkeys.OnPressedEvent) => {
      if (event.name === HOTKEYS.DISCOVER_NODE) {
        const { player } = useGameState.getState();
        if (!player) {
          return;
        }
        const { discoveredNodes, setDiscoverNode } =
          useSettingsStore.getState();
        const { distance, spawn } = spawns.reduce(
          (nearest, spawn) => {
            if (spawn.mapName !== player.mapName) {
              return nearest;
            }
            let distance;
            if (player.z && spawn.p[2]) {
              distance = Math.sqrt(
                Math.pow(player.x - spawn.p[0], 2) +
                  Math.pow(player.y - spawn.p[1], 2) +
                  Math.pow(player.z - spawn.p[2], 2),
              );
            } else {
              distance = Math.sqrt(
                Math.pow(player.x - spawn.p[0], 2) +
                  Math.pow(player.y - spawn.p[1], 2),
              );
            }
            if (distance < nearest.distance) {
              return { distance, spawn };
            }
            return nearest;
          },
          { distance: Infinity, spawn: null } as {
            distance: number;
            spawn: Spawns[number] | null;
          },
        );
        if (!spawn) {
          return;
        }
        const nodeId = spawn.isPrivate
          ? spawn.id!
          : `${spawn.id ?? spawn.type}@${spawn.p[0]}:${spawn.p[1]}`;
        const isCluster = Boolean(spawn.cluster && spawn.cluster.length > 0);
        let isDiscovered = isCluster
          ? discoveredNodes.includes(nodeId) &&
            !spawn.cluster!.some(
              (a) =>
                !discoveredNodes.includes(
                  `${a.id ?? t(a.type)}@${a.p[0]}:${a.p[1]}`,
                ),
            )
          : discoveredNodes.includes(nodeId);
        isDiscovered = !isDiscovered;

        if (isCluster) {
          spawn.cluster!.forEach((s) => {
            setDiscoverNode(
              `${s.id ?? t(s.type)}@${s.p[0]}:${s.p[1]}`,
              isDiscovered,
            );
          });
        }
        setDiscoverNode(nodeId, isDiscovered);
        toast(
          (isDiscovered ? "Discovered " : "Undiscovered ") + t(spawn.type),
          { duration: 2000 },
        );
      }
    };

    overwolf.settings.hotkeys.onPressed.addListener(handleHotkey);

    return () => {
      overwolf.settings.hotkeys.onPressed.removeListener(handleHotkey);
    };
  }, [spawns]);

  return <></>;
}
