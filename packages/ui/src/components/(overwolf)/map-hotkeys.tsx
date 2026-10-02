import { useUserStoreApi } from "../(providers)";
import { HOTKEYS } from "@repo/lib/overwolf";
import { useEffect } from "react";
import { useMap } from "../(interactive-map)/store";
import {
  handleOverlayFullscreenHotkey,
  type TilesConfig,
  useGameState,
} from "@repo/lib";
import { useCoordinates, useT } from "../(providers)";
import { cycleMapTransparency } from "../(desktop)/map-container";
import { cycleFilterPreset } from "../(providers)/preset-auto-apply";
import { resetDiscoveredNodes } from "../(controls)/reset-discovered";
import { discoverNearestNode } from "../(controls)/discover-nearest";

export function MapHotkeys({ tilesConfig }: { tilesConfig: TilesConfig }) {
  const map = useMap();
  const { nodes, searchableNodes, typesIdMap, globalFilters } =
    useCoordinates();
  const userStoreApi = useUserStoreApi();
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
      } else if (event.name === HOTKEYS.SHOW_LABELS) {
        // Toggle show labels state
        const current = useGameState.getState().showLabelsActive;
        useGameState.getState().setShowLabelsActive(!current);
      } else if (event.name === HOTKEYS.CYCLE_MAP_TRANSPARENCY) {
        cycleMapTransparency();
      }
    };
    overwolf.settings.hotkeys.onPressed.addListener(handleHotkey);

    return () => {
      overwolf.settings.hotkeys.onPressed.removeListener(handleHotkey);
    };
  }, [map]);

  // NOT map-gated: must keep working while the overlay map is auto-hidden
  // (the map is unmounted then). Flagged map → temporary override toggle;
  // else the normal fullscreen toggle.
  useEffect(() => {
    const handleHotkey = (event: overwolf.settings.hotkeys.OnPressedEvent) => {
      if (event.name === HOTKEYS.TOGGLE_OVERLAY_FULLSCREEN) {
        handleOverlayFullscreenHotkey();
      }
    };
    overwolf.settings.hotkeys.onPressed.addListener(handleHotkey);
    return () => {
      overwolf.settings.hotkeys.onPressed.removeListener(handleHotkey);
    };
  }, []);

  // Not map-gated either: switching presets / resetting discovered nodes
  // doesn't need the map instance.
  useEffect(() => {
    const handleHotkey = (event: overwolf.settings.hotkeys.OnPressedEvent) => {
      if (event.name === HOTKEYS.CYCLE_FILTER_PRESET) {
        cycleFilterPreset({ userStore: userStoreApi, globalFilters, t });
      } else if (event.name === HOTKEYS.RESET_DISCOVERED_NODES) {
        resetDiscoveredNodes(t);
      }
    };
    overwolf.settings.hotkeys.onPressed.addListener(handleHotkey);
    return () => {
      overwolf.settings.hotkeys.onPressed.removeListener(handleHotkey);
    };
  }, [userStoreApi, globalFilters, t]);

  useEffect(() => {
    let lastDiscoverTime = 0;
    const DISCOVER_COOLDOWN = 500;

    const handleHotkey = (event: overwolf.settings.hotkeys.OnPressedEvent) => {
      if (
        event.name !== HOTKEYS.DISCOVER_NODE &&
        event.name !== HOTKEYS.UNDISCOVER_NODE
      ) {
        return;
      }
      const now = Date.now();
      if (now - lastDiscoverTime < DISCOVER_COOLDOWN) {
        return;
      }
      lastDiscoverTime = now;
      discoverNearestNode({
        discover: event.name === HOTKEYS.DISCOVER_NODE,
        filters: userStoreApi.getState().filters,
        nodes,
        searchableNodes,
        typesIdMap,
        tilesConfig,
        t,
      });
    };

    overwolf.settings.hotkeys.onPressed.addListener(handleHotkey);

    return () => {
      overwolf.settings.hotkeys.onPressed.removeListener(handleHotkey);
    };
  }, [nodes, searchableNodes, typesIdMap, tilesConfig, t, userStoreApi]);

  return <></>;
}
