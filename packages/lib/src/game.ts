import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { ActorPlayer, Actor } from "./overwolf/plugin";

/**
 * A live-read dungeon floor plan: the walkable navmesh polygons (fan-triangulated
 * by the companion app) in the map's marker frame, ready to fill in WebGL. Scoped
 * to `mapName` so it only renders on the dungeon it was read from.
 */
export interface DungeonNavmesh {
  mapName: string;
  /** Flat x,y triangle vertices (already in the marker frame the player/actors use). */
  verts: number[];
  triangles: number;
  /**
   * Rendering hint. "mesh" = a StaticMeshActor footprint (overlapping box scatter) that the
   * layer fuses into a smooth connected silhouette (blur + threshold). "navmesh" (default) =
   * crisp edge-to-edge floor polys, filled as-is.
   */
  style?: "mesh" | "navmesh";
}

// `player` updates at the memory-read rate (~16×/s while moving), so any
// component that subscribes to it re-renders that often. Most consumers only
// need a coarse position (audio alerts, height arrows, follow-recentre): they
// should subscribe to `throttledPlayer`, which `setPlayer` advances at most
// ~1×/s. Only the things that must look smooth (the player marker, trace line)
// subscribe to the raw `player`. Generalizes to other high-frequency state.
const THROTTLED_PLAYER_MS = 1000;
let _lastThrottledPlayerAt = 0;

// The native app broadcasts movers ("actors", per poll) and fixed-position
// actors ("staticActors", full replace only when their content changes —
// e.g. tens of thousands of foliage resource nodes) as separate messages so
// the big static set isn't re-serialized every tick. `actors` stays the
// combined array, so consumers are unaffected. Sources without the split
// (Overwolf, Peer Link) just never call setStaticActors.
let _mobileActors: Actor[] = [];
let _staticActors: Actor[] = [];

export const useGameState = create(
  subscribeWithSelector<{
    player: ActorPlayer | null;
    /** `player` throttled to ~1Hz (advanced inside setPlayer). */
    throttledPlayer: ActorPlayer | null;
    setPlayer: (player: ActorPlayer | null) => void;
    character: Record<string, any> | null;
    setCharacter: (character: Record<string, any> | null) => void;
    /** Combined view: movers (per-poll) + static actors (on-change). */
    actors: Actor[];
    /** Sets the mover subset (or the full list for sources without the split). */
    setActors: (actors: Actor[]) => void;
    /** Applies an incremental change to the mover subset (upsert `changed` by
     * address, drop `removed`). Paired with `setActors` keyframes. */
    applyActorsDelta: (changed: Actor[], removed: string[]) => void;
    /** Sets the fixed-position subset (foliage resource nodes etc.). */
    setStaticActors: (actors: Actor[]) => void;
    /** Applies an incremental change to the fixed-position subset. */
    applyStaticActorsDelta: (added: Actor[], removed: string[]) => void;
    error: string | null;
    setError: (error: string | null) => void;
    highlightSpawnIDs: string[];
    addHighlightSpawnIDs: (id: string[]) => void;
    removeHighlightSpawnIDs: (id: string[]) => void;
    isUpdatingApp: boolean;
    setIsUpdatingApp: (isUpdatingApp: boolean) => void;
    showLabelsActive: boolean;
    setShowLabelsActive: (active: boolean) => void;
    /**
     * True when a live data source is feeding this session via Peer Link
     * (mesh joined with a "Me" sender selected). Companion apps feed actors
     * directly and signal liveness via their own context, so they don't set
     * this. Consumed by the map to decide whether live/combined mode has a
     * real source — without it, predicted spawns are shown unconfirmed.
     */
    peerLiveConnected: boolean;
    setPeerLiveConnected: (peerLiveConnected: boolean) => void;
    /**
     * The live-read dungeon floor plan for the current dungeon, or null when not in
     * a dungeon / not yet read. Cleared on dungeon exit (player.mapName leaves the
     * navmesh's map). Consumed by the interactive map's NavmeshLayer.
     */
    dungeonNavmesh: DungeonNavmesh | null;
    setDungeonNavmesh: (navmesh: DungeonNavmesh | null) => void;
  }>((set) => ({
    windowInfo: null,
    isOverlay: null,
    player: null,
    throttledPlayer: null,
    setPlayer: (player) => {
      set({ player });
      const now = Date.now();
      if (
        player === null ||
        now - _lastThrottledPlayerAt >= THROTTLED_PLAYER_MS
      ) {
        _lastThrottledPlayerAt = now;
        set({ throttledPlayer: player });
      }
    },
    character: null,
    setCharacter: (character) => set({ character }),
    actors: [],
    setActors: (actors) => {
      _mobileActors = actors;
      set({
        actors: _staticActors.length
          ? [..._mobileActors, ..._staticActors]
          : actors,
      });
    },
    applyActorsDelta: (changed, removed) => {
      // Upsert by address: a moved actor arrives in `changed` and replaces its prior
      // entry; a new actor is appended; `removed` addresses are dropped. Addresses are
      // normalized to String to match the mixed number/string wire type.
      const drop = removed.length > 0 ? new Set(removed.map(String)) : null;
      const upsert = new Set(changed.map((a) => String(a.address)));
      _mobileActors = _mobileActors
        .filter((a) => {
          const key = String(a.address);
          return !upsert.has(key) && !(drop && drop.has(key));
        })
        .concat(changed);
      set({ actors: [..._mobileActors, ..._staticActors] });
    },
    setStaticActors: (actors) => {
      _staticActors = actors;
      set({ actors: [..._mobileActors, ..._staticActors] });
    },
    applyStaticActorsDelta: (added, removed) => {
      if (removed.length > 0) {
        const rm = new Set(removed);
        _staticActors = _staticActors.filter((a) => !rm.has(String(a.address)));
      }
      if (added.length > 0) {
        _staticActors = _staticActors.concat(added);
      }
      set({ actors: [..._mobileActors, ..._staticActors] });
    },
    error: null,
    setError: (error) => set({ error }),
    highlightSpawnIDs: [],
    addHighlightSpawnIDs: (id) =>
      set((state) => ({
        highlightSpawnIDs: Array.from(
          new Set([...state.highlightSpawnIDs, ...id]),
        ),
      })),
    removeHighlightSpawnIDs: (id) =>
      set((state) => ({
        highlightSpawnIDs: state.highlightSpawnIDs.filter(
          (i) => !id.includes(i),
        ),
      })),
    isUpdatingApp: false,
    setIsUpdatingApp: (isUpdatingApp) => set({ isUpdatingApp }),
    showLabelsActive: false,
    setShowLabelsActive: (active) => set({ showLabelsActive: active }),
    peerLiveConnected: false,
    setPeerLiveConnected: (peerLiveConnected) => set({ peerLiveConnected }),
    dungeonNavmesh: null,
    setDungeonNavmesh: (dungeonNavmesh) => set({ dungeonNavmesh }),
  })),
);
