import { createStore } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { View } from "./search-params";
import { FiltersConfig, GlobalFiltersConfig } from "./config";
import { DrawingsAndNodes } from "./settings";
import { getAppIdFromPathname } from "./games";

// Which data source the sidebar search results read from: "historical" =
// the static/accumulated spawn locations, "live" = currently tracked live
// actors (companion app / Peer Link). The filter-list filtering is scope-
// independent — this only switches the results section.
export type SearchScope = "historical" | "live";

// Minimum query length before marker search results are computed/fetched.
// Shared by the coordinates provider (which empties results below it) and the
// sidebar (which renders the "type more characters" hint) so they can't drift.
export const MIN_SEARCH_QUERY_LENGTH = 3;

// A selected sidebar search result row. Selecting a row overlays exactly that
// result's spawns on the map (without touching the user's filters); clicking
// it again, clicking another row, or clearing the search deselects. `name` is
// the row identity: the translated group name for historical rows, the filter
// type id for live rows.
export type SelectedSearchResult = {
  name: string;
  mapName: string;
};

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
  selectedSearchResult: SelectedSearchResult | null;
  setSelectedSearchResult: (result: SelectedSearchResult | null) => void;
  filters: string[];
  setFilters: (filters: string[]) => void;
  toggleFilter: (filter: string) => void;
  /** Filter groups the user expanded in the sidebar (persisted; all groups
   * start collapsed — there is no per-game default anymore). */
  openGroups: string[];
  setGroupOpen: (group: string, open: boolean) => void;
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

// A per-map view is only usable if every component is a finite number — a
// NaN/Infinity camera JSON-serializes to null and would otherwise persist a
// permanently black map for that one map (until the user finds Reset
// Interface). Guard every write and heal persisted state on rehydrate.
const isValidCenter = (center: unknown): center is [number, number] =>
  Array.isArray(center) &&
  center.length === 2 &&
  Number.isFinite(center[0]) &&
  Number.isFinite(center[1]);

const sanitizeViewByMap = (
  viewByMap: UserStoreState["viewByMap"],
): UserStoreState["viewByMap"] => {
  const result: UserStoreState["viewByMap"] = {};
  for (const [mapName, view] of Object.entries(viewByMap ?? {})) {
    if (!view || typeof view !== "object") {
      continue;
    }
    const sanitized: { center?: [number, number]; zoom?: number } = {};
    if (isValidCenter(view.center)) {
      sanitized.center = view.center;
    }
    if (Number.isFinite(view.zoom)) {
      sanitized.zoom = view.zoom;
    }
    result[mapName] = sanitized;
  }
  return result;
};

const getStorageName = () => {
  if (typeof window !== "undefined") {
    // Locale-aware: /{locale}/apps/<id> must map to the SAME storage as
    // /apps/<id>, otherwise non-English languages share the generic fallback
    // while English gets the per-app storage (state "changes" with locale).
    const appId = getAppIdFromPathname(window.location.pathname);
    if (appId) {
      const name = `thgl-coordinates-${appId}`;
      // One-time seed: non-English users' state lived in the generic fallback
      // storage until the locale fix — adopt it when the per-app storage
      // doesn't exist yet, so the fix doesn't read as a reset.
      try {
        const generic = localStorage.getItem("coordinates");
        if (generic !== null && localStorage.getItem(name) === null) {
          localStorage.setItem(name, generic);
        }
      } catch {
        // Storage access can throw (privacy mode) — per-app name still works.
      }
      return name;
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
                if (isValidCenter(center)) {
                  viewByMap[mapName].center = center;
                }
                if (Number.isFinite(zoom)) {
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
              if (!isValidCenter(center) || !Number.isFinite(zoom)) {
                return;
              }
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
              // Clearing the search also deselects the selected result row.
              set(search ? { search } : { search, selectedSearchResult: null });
            },
            searchIsLoading: false,
            setSearchIsLoading: (state) => {
              set({ searchIsLoading: state });
            },
            searchScope: "historical",
            setSearchScope: (searchScope) => {
              set({ searchScope });
            },
            selectedSearchResult: null,
            setSelectedSearchResult: (selectedSearchResult) => {
              set({ selectedSearchResult });
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
            openGroups: [],
            setGroupOpen: (group, open) => {
              set((state) => {
                const isOpen = state.openGroups.includes(group);
                if (open === isOpen) {
                  return {};
                }
                return {
                  openGroups: open
                    ? [...state.openGroups, group]
                    : state.openGroups.filter((g) => g !== group),
                };
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
            // Heal corrupted persisted views (e.g. a NaN/Infinity camera that
            // serialized to null) so an affected map recovers on next load.
            result.viewByMap = sanitizeViewByMap(result.viewByMap);
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
