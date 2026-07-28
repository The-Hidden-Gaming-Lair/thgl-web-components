"use client";
import { create } from "zustand";
import { useEffect } from "react";
import { useGameState } from "./game";
import { useSettingsStore } from "./settings";

/**
 * Session-only state for the per-map overlay auto-hide (NOT persisted).
 * `playerMap` is the last NON-EMPTY player.mapName — held through loading
 * screens, where live player state briefly empties (stable-signal rule).
 * `overrideMap` is the map the user forced visible; leaving that map clears
 * it, so the persisted setting takes over again ("reverts upon exit").
 */
export const useOverlayMapHideSession = create<{
  playerMap: string | null;
  overrideMap: string | null;
  setPlayerMap: (mapName: string) => void;
  toggleOverride: () => void;
}>((set, get) => ({
  playerMap: null,
  overrideMap: null,
  setPlayerMap: (mapName) => {
    if (mapName === get().playerMap) return;
    set({ playerMap: mapName, overrideMap: null });
  },
  toggleOverride: () => {
    const { playerMap, overrideMap } = get();
    if (!playerMap) return;
    set({ overrideMap: overrideMap === playerMap ? null : playerMap });
  },
}));

export function resolveOverlayMapHidden(
  hideOverlayByMap: Record<string, boolean> | undefined,
  playerMap: string | null,
  overrideMap: string | null,
): { flagged: boolean; overridden: boolean; hidden: boolean } {
  const flagged = !!(playerMap && hideOverlayByMap?.[playerMap]);
  const overridden = flagged && overrideMap === playerMap;
  return { flagged, overridden, hidden: flagged && !overridden };
}

// Stable ref — a fresh `{}` in the selector would fail Object.is on every
// store change and re-render each consumer per tick.
const EMPTY_HIDE_BY_MAP: Record<string, boolean> = {};

/**
 * Per-map overlay auto-hide state. `hidden` = the overlay map subtree should
 * be replaced by the OverlayMapHiddenPill. Keys on where the PLAYER is
 * (useGameState.player.mapName), never on the map the user is viewing. On the
 * plain web there is no live player, so `hidden` stays false.
 */
export function useOverlayMapHidden() {
  const playerMap = useOverlayMapHideSession((s) => s.playerMap);
  const overrideMap = useOverlayMapHideSession((s) => s.overrideMap);
  const toggleOverride = useOverlayMapHideSession((s) => s.toggleOverride);
  const hideOverlayByMap = useSettingsStore(
    (s) => s.hideOverlayByMap ?? EMPTY_HIDE_BY_MAP,
  );

  // Track the player's map while any consumer is mounted. Multiple consumers
  // just make idempotent set calls. Empty mapName (loading screen) is ignored
  // so the overlay doesn't flash in/out on loads.
  useEffect(() => {
    const sync = (mapName?: string | null) => {
      if (mapName) useOverlayMapHideSession.getState().setPlayerMap(mapName);
    };
    sync(useGameState.getState().player?.mapName);
    return useGameState.subscribe((s) => s.player?.mapName, sync);
  }, []);

  return {
    playerMap,
    toggleOverride,
    ...resolveOverlayMapHidden(hideOverlayByMap, playerMap, overrideMap),
  };
}

/**
 * Shared TOGGLE_OVERLAY_FULLSCREEN behavior: on a map flagged for overlay
 * auto-hide the hotkey toggles the temporary "show anyway" override (the only
 * way back once everything is hidden); elsewhere it keeps its normal
 * fullscreen toggle. Called by BOTH duplicated map-hotkeys files.
 */
export function handleOverlayFullscreenHotkey() {
  const { playerMap, overrideMap } = useOverlayMapHideSession.getState();
  const { flagged } = resolveOverlayMapHidden(
    useSettingsStore.getState().hideOverlayByMap,
    playerMap,
    overrideMap,
  );
  if (flagged) {
    useOverlayMapHideSession.getState().toggleOverride();
  } else {
    useSettingsStore.getState().toggleOverlayFullscreen();
  }
}
