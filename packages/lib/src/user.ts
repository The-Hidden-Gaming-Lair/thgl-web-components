import { createStore } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { View } from "./search-params";
import { FiltersConfig, GlobalFiltersConfig } from "./config";
import { DrawingsAndNodes } from "./settings";

// Which data source the sidebar search results read from: "historical" =
// the static/accumulated spawn locations, "live" = currently tracked live
// actors (companion app / Peer Link). The filter-list filtering is scope-
// independent — this only switches the results section.
export type SearchScope = "historical" | "live";

// Minimum query length before marker search results are computed/fetched.
// Shared by the coordinates provider (which empties results below it) and the
// sidebar (which renders the "type more characters" hint) so they can't drift.
export const MIN_SEARCH_QUERY_LENGTH = 3;

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
  selectedZone: { name: string; desc: string; group: string } | null;
  setSelectedZone: (
    zone: { name: string; desc: string; group: string } | null,
  ) => void;
  search: string;
  setSearch: (search: string) => void;
  searchIsLoading: boolean;
  setSearchIsLoading: (state: boolean) => void;
  searchScope: SearchScope;
  setSearchScope: (scope: SearchScope) => void;
  filters: string[];
  setFilters: (filters: string[]) => void;
  toggleFilter: (filter: string) => void;
  /** Idempotent "switch this filter on" — no-op when already active. */
  enableFilter: (filter: string) => void;
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
  return createStore<UserStoreState>()(
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
                if (zoom) {
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
              set({
                selectedNodeId: id,
                ...(id ? { selectedZone: null } : {}),
              });
            },
            selectedZone: null,
            setSelectedZone: (zone) => {
              set({
                selectedZone: zone,
                ...(zone ? { selectedNodeId: null } : {}),
              });
            },
            search: "",
            setSearch: (search) => {
              set({ search });
            },
            searchIsLoading: false,
            setSearchIsLoading: (state) => {
              set({ searchIsLoading: state });
            },
            searchScope: "historical",
            setSearchScope: (searchScope) => {
              set({ searchScope });
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
            enableFilter: (filter) => {
              set((state) =>
                state.filters.includes(filter)
                  ? state
                  : { filters: [...state.filters, filter] },
              );
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

export type UserStore = ReturnType<typeof createUserStore>;

// The React context + hooks that share this per-request store live in
// @repo/ui (packages/ui/src/components/(providers)/user-store.tsx). They use
// `createContext`, which is client-only and must NOT be pulled into this
// server-importable barrel — keep only the framework-agnostic factory here.
