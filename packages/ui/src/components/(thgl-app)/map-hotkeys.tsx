import { useUserStoreApi } from "../(providers)";
import { useEffect } from "react";
import { useMap } from "../(interactive-map)/store";
import {
  handleOverlayFullscreenHotkey,
  isThglApp,
  type TilesConfig,
  useSettingsStore,
  useGameState,
} from "@repo/lib";
import { useCoordinates, useT } from "../(providers)";
import { cycleMapTransparency } from "../(desktop)/map-container";
import { cycleFilterPreset } from "../(providers)/preset-auto-apply";
import { discoverNearestNode } from "../(controls)/discover-nearest";
import { HOTKEYS, onWebviewMessage } from "@repo/lib/thgl-app";

export function MapHotkeys({ tilesConfig }: { tilesConfig: TilesConfig }) {
  const map = useMap();
  const { nodes, searchableNodes, typesIdMap, globalFilters } =
    useCoordinates();
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
        } else if (hotkeyAction === HOTKEYS.CYCLE_MAP_TRANSPARENCY) {
          cycleMapTransparency();
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

  // Not map-gated either: switching presets doesn't need the map instance.
  useEffect(() => {
    if (!isThglApp) return;
    return onWebviewMessage((message) => {
      if (
        message.action === "hotkey" &&
        message.payload.action === HOTKEYS.CYCLE_FILTER_PRESET
      ) {
        cycleFilterPreset({ userStore: userStoreApi, globalFilters, t });
      }
    });
  }, [userStoreApi, globalFilters, t]);

  useEffect(() => {
    if (!isThglApp) {
      return;
    }
    let lastDiscoverTime = 0;
    const DISCOVER_COOLDOWN = 500;

    const cleanup = onWebviewMessage((message) => {
      if (message.action !== "hotkey") return;
      const hotkeyAction = message.payload.action;
      if (
        hotkeyAction !== HOTKEYS.DISCOVER_NODE &&
        hotkeyAction !== HOTKEYS.UNDISCOVER_NODE
      ) {
        return;
      }
      const now = Date.now();
      if (now - lastDiscoverTime < DISCOVER_COOLDOWN) {
        return;
      }
      lastDiscoverTime = now;
      discoverNearestNode({
        mode: hotkeyAction === HOTKEYS.DISCOVER_NODE ? "toggle" : "undiscover",
        filters: userStoreApi.getState().filters,
        nodes,
        searchableNodes,
        typesIdMap,
        tilesConfig,
        t,
      });
    });

    return () => {
      cleanup();
    };
  }, [nodes, searchableNodes, typesIdMap, tilesConfig, t, userStoreApi]);

  return <></>;
}
