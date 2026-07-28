"use client";
import { create } from "zustand";
import { useEffect } from "react";
import { useGameState } from "./game";
import { useSettingsStore } from "./settings";

/**
 * Session-only state for the overlay auto-hide (NOT persisted).
 * `playerMap` is the last NON-EMPTY player.mapName — held so the per-map rule
 * survives brief data gaps. `currentMap` is the LIVE detection: null while no
 * map is known right now (main menu, character select) — advanced by the
 * hook's debounced sync. Two override slots, both session-only:
 * `overrideMap` forces the overlay visible on that flagged map (cleared when
 * the player moves to a different map), `overrideNoMap` forces it visible
 * while no map is detected (cleared when a map is detected).
 */
export const useOverlayMapHideSession = create<{
  playerMap: string | null;
  currentMap: string | null;
  overrideMap: string | null;
  overrideNoMap: boolean;
  setCurrentMap: (mapName: string | null) => void;
  toggleOverride: () => void;
}>((set, get) => ({
  playerMap: null,
  currentMap: null,
  overrideMap: null,
  overrideNoMap: false,
  setCurrentMap: (mapName) => {
    const s = get();
    if (!mapName) {
      if (s.currentMap !== null) set({ currentMap: null });
      return;
    }
    set({
      currentMap: mapName,
      playerMap: mapName,
      // Moving to a DIFFERENT map reverts that map's manual override.
      overrideMap: s.playerMap === mapName ? s.overrideMap : null,
      // A detected map ends the no-map state, so its override resets too.
      overrideNoMap: false,
    });
  },
  toggleOverride: () => {
    const s = get();
    const { hideOverlayByMap, hideOverlayWithoutMap } =
      useSettingsStore.getState();
    const { reason } = resolveOverlayMapHidden({
      hideOverlayByMap,
      hideOverlayWithoutMap,
      playerMap: s.playerMap,
      currentMap: s.currentMap,
      overrideMap: s.overrideMap,
      overrideNoMap: s.overrideNoMap,
    });
    if (reason === "noMap") {
      set({ overrideNoMap: !s.overrideNoMap });
    } else if (s.playerMap) {
      set({
        overrideMap: s.overrideMap === s.playerMap ? null : s.playerMap,
      });
    }
  },
}));

export function resolveOverlayMapHidden(input: {
  hideOverlayByMap: Record<string, boolean> | undefined;
  /** undefined (profile persisted before the field existed) = default ON */
  hideOverlayWithoutMap: boolean | undefined;
  playerMap: string | null;
  currentMap: string | null;
  overrideMap: string | null;
  overrideNoMap: boolean;
}): {
  /** Which auto-hide rule applies right now (independent of overrides). */
  reason: "map" | "noMap" | null;
  hidden: boolean;
  /** The held player map is flagged (drives the quick-action button state). */
  flagged: boolean;
  overridden: boolean;
} {
  const {
    hideOverlayByMap,
    hideOverlayWithoutMap,
    playerMap,
    currentMap,
    overrideMap,
    overrideNoMap,
  } = input;
  const flagged = !!(playerMap && hideOverlayByMap?.[playerMap]);
  if (!currentMap && (hideOverlayWithoutMap ?? true)) {
    return {
      reason: "noMap",
      hidden: !overrideNoMap,
      flagged,
      overridden: overrideNoMap,
    };
  }
  // With the no-map option off, keep the pre-existing behavior: the per-map
  // rule keys on the HELD playerMap, so a flagged map stays hidden through
  // loading screens / data gaps.
  if (flagged) {
    const overridden = overrideMap === playerMap;
    return { reason: "map", hidden: !overridden, flagged, overridden };
  }
  return { reason: null, hidden: false, flagged, overridden: false };
}

// Stable refs — a fresh `{}` in the selector would fail Object.is on every
// store change and re-render each consumer per tick.
const EMPTY_HIDE_BY_MAP: Record<string, boolean> = {};

/**
 * Player/map data can blip empty for moments during normal play (loading
 * screens, teleports); only a PERSISTENT absence counts as "no map detected"
 * (main menu). A detected map always applies immediately.
 */
const NO_MAP_DEBOUNCE_MS = 3000;

/**
 * Overlay auto-hide state. `hidden` = the overlay map subtree should be
 * replaced by the OverlayMapHiddenPill; `reason` says why ("map" = the player
 * is on a flagged map, "noMap" = no map detected and hideOverlayWithoutMap is
 * on). Keys on where the PLAYER is (useGameState.player.mapName), never on
 * the map the user is viewing. Only the in-game overlay windows consume the
 * gate — desktop/web are unaffected.
 */
export function useOverlayMapHidden() {
  const playerMap = useOverlayMapHideSession((s) => s.playerMap);
  const currentMap = useOverlayMapHideSession((s) => s.currentMap);
  const overrideMap = useOverlayMapHideSession((s) => s.overrideMap);
  const overrideNoMap = useOverlayMapHideSession((s) => s.overrideNoMap);
  const toggleOverride = useOverlayMapHideSession((s) => s.toggleOverride);
  const hideOverlayByMap = useSettingsStore(
    (s) => s.hideOverlayByMap ?? EMPTY_HIDE_BY_MAP,
  );
  const hideOverlayWithoutMap = useSettingsStore(
    (s) => s.hideOverlayWithoutMap ?? true,
  );

  // Track the player's map while any consumer is mounted. Multiple consumers
  // just make idempotent set calls. A non-empty map applies immediately;
  // emptiness is debounced (see NO_MAP_DEBOUNCE_MS).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sync = (mapName?: string | null) => {
      if (mapName) {
        clearTimeout(timer);
        timer = undefined;
        useOverlayMapHideSession.getState().setCurrentMap(mapName);
      } else if (timer === undefined) {
        timer = setTimeout(() => {
          timer = undefined;
          useOverlayMapHideSession.getState().setCurrentMap(null);
        }, NO_MAP_DEBOUNCE_MS);
      }
    };
    sync(useGameState.getState().player?.mapName);
    const unsub = useGameState.subscribe((s) => s.player?.mapName, sync);
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  return {
    playerMap,
    toggleOverride,
    ...resolveOverlayMapHidden({
      hideOverlayByMap,
      hideOverlayWithoutMap,
      playerMap,
      currentMap,
      overrideMap,
      overrideNoMap,
    }),
  };
}

/**
 * Shared TOGGLE_OVERLAY_FULLSCREEN behavior: while an auto-hide rule applies
 * (flagged map or no map detected) the hotkey toggles the temporary "show
 * anyway" override (the only way back once everything is hidden); elsewhere
 * it keeps its normal fullscreen toggle. Called by BOTH duplicated
 * map-hotkeys files.
 */
export function handleOverlayFullscreenHotkey() {
  const session = useOverlayMapHideSession.getState();
  const { hideOverlayByMap, hideOverlayWithoutMap } =
    useSettingsStore.getState();
  const { reason } = resolveOverlayMapHidden({
    hideOverlayByMap,
    hideOverlayWithoutMap,
    playerMap: session.playerMap,
    currentMap: session.currentMap,
    overrideMap: session.overrideMap,
    overrideNoMap: session.overrideNoMap,
  });
  if (reason) {
    session.toggleOverride();
  } else {
    useSettingsStore.getState().toggleOverlayFullscreen();
  }
}
