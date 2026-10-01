"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ValheimSeedState {
  /** The user's world seed; "" = the default seed baked into the static map data. */
  seed: string;
  /** Saved worlds keep the terrain generation version they were created with (0-2). */
  worldGenVersion: number;
  setSeed: (seed: string) => void;
  setWorldGenVersion: (v: number) => void;
}

// Persists so a player's seed sticks across sessions. The URL (?seed=&wgv=) is the
// shareable source of truth and is applied on top of this on load (see the panel).
export const useValheimSeedStore = create<ValheimSeedState>()(
  persist(
    (set) => ({
      seed: "",
      worldGenVersion: 2,
      setSeed: (seed) => set({ seed: seed.trim() }),
      setWorldGenVersion: (worldGenVersion) => set({ worldGenVersion }),
    }),
    { name: "thgl-valheim-seed" },
  ),
);

type Phase = "idle" | "locations" | "resources" | "ready" | "error";
interface Status {
  phase: Phase;
  locations: number;
  resources: number;
  /** resource pass progress 0..1 */
  progress: number;
  error?: string;
}

/** Transient generation status (not persisted). */
export const useValheimSeedStatus = create<
  Status & { set: (s: Partial<Status>) => void }
>((set) => ({
  phase: "idle",
  locations: 0,
  resources: 0,
  progress: 0,
  set: (s) => set(s),
}));
