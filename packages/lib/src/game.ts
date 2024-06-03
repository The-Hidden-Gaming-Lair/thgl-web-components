import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { ActorPlayer, Actor } from "./overwolf/plugin";

export const useGameState = create(
  subscribeWithSelector<{
    player: ActorPlayer | null;
    setPlayer: (player: ActorPlayer | null) => void;
    actors: Actor[];
    setActors: (actors: Actor[]) => void;
    error: string | null;
    setError: (error: string | null) => void;
    highlightSpawnIDs: string[];
    addHighlightSpawnIDs: (id: string[]) => void;
    removeHighlightSpawnIDs: (id: string[]) => void;
  }>((set) => ({
    windowInfo: null,
    isOverlay: null,
    player: null,
    setPlayer: (player) => set({ player }),
    actors: [],
    setActors: (actors) => set({ actors }),
    error: null,
    setError: (error) => set({ error }),
    highlightSpawnIDs: [],
    addHighlightSpawnIDs: (id) =>
      set((state) => ({
        highlightSpawnIDs: Array.from(
          new Set([...state.highlightSpawnIDs, ...id])
        ),
      })),
    removeHighlightSpawnIDs: (id) =>
      set((state) => ({
        highlightSpawnIDs: state.highlightSpawnIDs.filter(
          (i) => !id.includes(i)
        ),
      })),
  }))
);
