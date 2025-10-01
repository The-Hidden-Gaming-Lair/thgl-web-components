import type { WebMap } from "@repo/lib/web-map";
import { create } from "zustand";
import type { WebMapDrawingAdapter } from "./webmap-drawing-adapter";

export type InteractiveMap = WebMap & {
  mapName: string;
  bounds: [[number, number], [number, number]];
  pm?: WebMapDrawingAdapter;
};

export const useMapStore = create<{
  map: InteractiveMap | null;
  setMap: (map: InteractiveMap | null) => void;
}>((set) => ({
  map: null,
  setMap: (map) => {
    set({ map });
  },
}));

export function useMap(): InteractiveMap | null {
  return useMapStore((store) => store.map);
}
