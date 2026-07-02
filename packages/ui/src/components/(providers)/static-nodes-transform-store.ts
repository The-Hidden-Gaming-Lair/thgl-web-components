"use client";
import { create } from "zustand";
import type { NodesCoordinates } from "./coordinates-provider";

/**
 * Generic seam for rewriting the fetched static nodes before the coordinates
 * provider renders them. A game-specific client component (e.g. the Satisfactory
 * world-seed panel) installs a transform here; the provider applies it. Default
 * is null (identity) so games that don't use it are completely unaffected.
 */
export type StaticNodesTransform = (
  nodes: NodesCoordinates,
) => NodesCoordinates;

export const useStaticNodesTransformStore = create<{
  transform: StaticNodesTransform | null;
  setTransform: (transform: StaticNodesTransform | null) => void;
}>((set) => ({
  transform: null,
  setTransform: (transform) => set({ transform }),
}));
