import type { Map } from "leaflet";
import { create } from "zustand";

export const useMapStore = create<{
  map: Map | null;
  setMap: (map: Map | null) => void;
}>((set) => ({
  map: null,
  setMap: (map) => {
    set({ map });
  },
}));

export function useMap(): Map | null {
  return useMapStore((store) => store.map);
}
