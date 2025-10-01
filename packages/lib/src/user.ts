import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { View } from "./search-params";
import { FiltersConfig, GlobalFiltersConfig } from "./config";
import { DrawingsAndNodes } from "./settings";

export interface UserStoreState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  mapName: string;
  setMapName: (
    mapName: string,
    center?: [number, number],
    zoom?: number,
  ) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  search: string;
  setSearch: (search: string) => void;
  searchIsLoading: boolean;
  setSearchIsLoading: (state: boolean) => void;
  filters: string[];
  setFilters: (filters: string[]) => void;
  toggleFilter: (filter: string) => void;
  viewByMap: Record<string, { center?: [number, number]; zoom?: number }>;
  setViewByMap: (
    mapName: string,
    center: [number, number],
    zoom: number,
  ) => void;
  globalFilters: string[];
  setGlobalFilters: (filters: string[]) => void;
  toggleGlobalFilter: (filter: string) => void;
}

export let useUserStore: ReturnType<typeof createUserStore>;

const getStorageName = () => {
  if (typeof window !== "undefined") {
    if (window.location.pathname.startsWith("/apps/")) {
      const appId = window.location.pathname.split("/")[2];
      return `thgl-coordinates-${appId}`;
    }
  }
  return "coordinates";
};

export function createUserStore(
  view: View,
  mapNames: string[],
  filters: FiltersConfig,
  globalFilters: GlobalFiltersConfig = [],
  regionFilters: {
    id: string;
    Icon: any;
  }[] = [],
  staticDrawings?: DrawingsAndNodes[],
) {
  return create(
    subscribeWithSelector(
      persist<UserStoreState>(
        (set) => {
          return {
            _hasHydrated: false,
            setHasHydrated: (state) => {
              set({
                _hasHydrated: state,
              });
            },
            mapName: view.map ?? mapNames[0],
            setMapName: (mapName, center, zoom) => {
              if (!mapNames.includes(mapName)) {
                console.warn(`Invalid map name: ${mapName}`);
                return;
              }
              set((state) => {
                const viewByMap = {
                  ...state.viewByMap,
                  [mapName]: state.viewByMap[mapName] ?? {},
                };
                if (center) {
                  viewByMap[mapName].center = center;
                }
                if (zoom && !viewByMap[mapName].zoom) {
                  viewByMap[mapName].zoom = zoom;
                }
                return { mapName, viewByMap };
              });
            },
            viewByMap: view.map
              ? {
                  [view.map]: { center: view.center, zoom: view.zoom },
                }
              : {},
            setViewByMap: (mapName, center, zoom) => {
              set((state) => {
                const viewByMap = {
                  ...state.viewByMap,
                  [mapName]: { center, zoom },
                };
                return { viewByMap };
              });
            },
            selectedNodeId: null,
            setSelectedNodeId: (id) => {
              set({ selectedNodeId: id });
            },
            search: "",
            setSearch: (search) => {
              set({ search });
            },
            searchIsLoading: false,
            setSearchIsLoading: (state) => {
              set({ searchIsLoading: state });
            },
            filters: view.filters ?? [
              ...filters.flatMap((filter) =>
                filter.values
                  .filter((value) => value.defaultOn ?? filter.defaultOn)
                  .map((value) => value.id),
              ),
              ...regionFilters.map((filter) => filter.id),
              ...(staticDrawings?.map((drawing) => drawing.name) ?? []),
            ],
            setFilters: (filters) => {
              set({ filters });
            },
            toggleFilter: (filter) => {
              set((state) => {
                const filters = state.filters.includes(filter)
                  ? state.filters.filter((f) => f !== filter)
                  : [...state.filters, filter];
                return { filters };
              });
            },
            globalFilters:
              view.globalFilters ??
              globalFilters.flatMap((filter) =>
                filter.values.flatMap((value) =>
                  value.defaultOn ? value.id : [],
                ),
              ),
            setGlobalFilters: (globalFilters) => {
              set({ globalFilters });
            },
            toggleGlobalFilter: (filter) => {
              set((state) => {
                const globalFilters = state.globalFilters.includes(filter)
                  ? state.globalFilters.filter((f) => f !== filter)
                  : [...state.globalFilters, filter];
                return { globalFilters };
              });
            },
          };
        },
        {
          name: getStorageName(),
          onRehydrateStorage: () => (state) => {
            if (!state?._hasHydrated) {
              state?.setHasHydrated(true);
            }
          },
          version: 2,
          // @ts-ignore
          migrate: (persistedState, version) => {
            if (version < 3) {
              const storageName = getStorageName();
              if (storageName !== "coordinates") {
                const oldStorage = localStorage.getItem("coordinates");
                if (oldStorage) {
                  const oldState = JSON.parse(oldStorage).state;
                  Object.assign(persistedState || {}, oldState);
                }
              }
            }
            return persistedState;
          },
          merge: (persisted, current) => {
            if (!persisted) {
              return current;
            }
            const result = { ...current, ...persisted };
            if (view.map) {
              result.mapName = view.map;
              result.viewByMap = {
                ...result.viewByMap,
                [result.mapName]: result.viewByMap[result.mapName] ?? {},
              };
              if (view.center) {
                result.viewByMap[result.mapName].center = view.center;
              }
              if (view.zoom) {
                result.viewByMap[result.mapName].zoom = view.zoom;
              }
            }
            if (view.filters) {
              result.filters = view.filters;
            }
            if (view.globalFilters) {
              result.globalFilters = view.globalFilters;
            }
            if (result.mapName && !mapNames.includes(result.mapName)) {
              result.mapName = mapNames[0];
            }
            return result;
          },
        },
      ),
    ),
  );
}

export function initUserStore(
  view: View,
  mapNames: string[],
  filters: FiltersConfig,
  globalFilters: GlobalFiltersConfig,
  regionFilters: {
    id: string;
    Icon: any;
  }[] = [],
  staticDrawings?: DrawingsAndNodes[],
) {
  useUserStore = createUserStore(
    view,
    mapNames,
    filters,
    globalFilters,
    regionFilters,
    staticDrawings,
  );
}
