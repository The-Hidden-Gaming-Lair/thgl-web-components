"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PuritySettings, RandomizationMode } from "./types";

export interface SatisfactorySeedState {
  enabled: boolean;
  seed: number; // int32
  mode: RandomizationMode;
  purity: PuritySettings;
  setEnabled: (enabled: boolean) => void;
  setSeed: (seed: number) => void;
  setMode: (mode: RandomizationMode) => void;
  setPurity: (purity: PuritySettings) => void;
  apply: (s: {
    enabled?: boolean;
    seed?: number;
    mode?: RandomizationMode;
    purity?: PuritySettings;
  }) => void;
}

// Persists to localStorage so a player's seed sticks across sessions. The URL is
// the shareable source of truth (see the panel), applied on top of this on load.
export const useSatisfactorySeedStore = create<SatisfactorySeedState>()(
  persist(
    (set) => ({
      enabled: false,
      seed: 0,
      mode: "strict",
      purity: "no_change",
      setEnabled: (enabled) => set({ enabled }),
      setSeed: (seed) => set({ seed }),
      setMode: (mode) => set({ mode }),
      setPurity: (purity) => set({ purity }),
      apply: (s) => set(s),
    }),
    { name: "thgl-satisfactory-seed" },
  ),
);
