import type { Map } from "leaflet";
import { create } from "zustand";

export type LeafletMap = Map & { _mapPane: HTMLElement; mapName: string };
export const useMapStore = create<{
  map: LeafletMap | null;
  setMap: (map: LeafletMap | null) => void;
  leaflet: typeof import("leaflet") | null;
  setLeaflet: (leaflet: typeof import("leaflet")) => void;
}>((set) => ({
  map: null,
  setMap: (map) => {
    set({ map });
  },
  leaflet: null,
  setLeaflet: (leaflet) => {
    set({ leaflet });
  },
}));

export function useMap(): LeafletMap | null {
  return useMapStore((store) => store.map);
}
