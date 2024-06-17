"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { StoreApi } from "zustand";
import { createStore, useStore } from "zustand";
import type { PersistOptions } from "zustand/middleware";
import { persist, subscribeWithSelector } from "zustand/middleware";
import Fuse from "fuse.js";
import { useT } from ".";
import { isDebug, useGameState, useSettingsStore } from "@repo/lib";
import { CaseSensitive, Hexagon } from "lucide-react";

export type NodesCoordinates = {
  type: string;
  static?: boolean;
  spawns: {
    id?: string;
    name?: string;
    description?: string;
    address?: number;
    p: [number, number];
    mapName?: string;
    color?: string;
    icon?: {
      name: string;
      url: string;
    } | null;
    radius?: number;
    isPrivate?: boolean;
    data?: Record<string, string[]>;
  }[];
  data?: Record<string, string[]>;
}[];
export type Spawns = {
  id?: string | undefined;
  name?: string | undefined;
  description?: string | undefined;
  address?: number;
  p: [number, number];
  type: string;
  cluster?: Omit<Spawns[number], "cluster">[];
  mapName?: string;
  color?: string;
  icon?: {
    name: string;
    url: string;
  } | null;
  radius?: number;
  isPrivate?: boolean;
  data?: Record<string, string[]>;
}[];

export type RegionsCoordinates = {
  id: string;
  center: [number, number];
  border: [number, number][];
  mapName?: string;
}[];

export type FiltersCoordinates = {
  group: string;
  defaultOpen?: boolean;
  defaultOn?: boolean;
  values: {
    id: string;
    icon: string;
    size?: number;
    live_only?: boolean;
  }[];
}[];

export type GlobalFiltersCoordinates = {
  group: string;
  values: {
    id: string;
    defaultOn?: boolean;
  }[];
}[];

export type Icons = {
  id: string;
  icon: string;
  size?: number;
}[];

interface UserStoreState {
  mapName: string;
  setMapName: (mapName: string) => void;
  search: string;
  setSearch: (search: string) => void;
  filters: string[];
  setFilters: (filters: string[]) => void;
  toggleFilter: (filter: string) => void;
  center: [number, number] | undefined;
  setCenter: (center: [number, number]) => void;
  zoom: number | undefined;
  setZoom: (zoom: number) => void;
  globalFilters: string[];
  setGlobalFilters: (filters: string[]) => void;
  toggleGlobalFilter: (filter: string) => void;
}

type Write<T, U> = Omit<T, keyof U> & U;
interface StorePersist<S, Ps> {
  persist: {
    setOptions: (options: Partial<PersistOptions<S, Ps>>) => void;
    clearStorage: () => void;
    rehydrate: () => Promise<void> | void;
    hasHydrated: () => boolean;
    onHydrate: (fn: PersistListener<S>) => () => void;
    onFinishHydration: (fn: PersistListener<S>) => () => void;
    getOptions: () => Partial<PersistOptions<S, Ps>>;
  };
}
type PersistListener<S> = (state: S) => void;
type UserStore = Write<
  StoreApi<UserStoreState>,
  StorePersist<UserStoreState, UserStoreState>
>;

interface ContextValue {
  isHydrated: boolean;
  nodes: NodesCoordinates;
  regions: RegionsCoordinates;
  filters: FiltersCoordinates;
  globalFilters: GlobalFiltersCoordinates;
  allFilters: string[];
  userStore: UserStore;
  spawns: Spawns;
  icons: Icons;
  typesIdMap?: Record<string, string>;
}

const Context = createContext<ContextValue | null>(null);

export const REGION_FILTERS = [
  {
    id: "region_borders",
    Icon: Hexagon,
  },
  {
    id: "region_names",
    Icon: CaseSensitive,
  },
];
export function CoordinatesProvider({
  children,
  staticNodes,
  regions,
  filters,
  globalFilters = [],
  typesIdMap,
  mapName = "default",
  view,
}: {
  children: React.ReactNode;
  staticNodes: NodesCoordinates;
  regions: RegionsCoordinates;
  filters: FiltersCoordinates;
  globalFilters?: GlobalFiltersCoordinates;
  typesIdMap?: Record<string, string>;
  mapName?: string;
  view: { center?: [number, number]; zoom?: number; map?: string };
}): JSX.Element {
  const liveMode = useSettingsStore((state) => state.liveMode);
  const appId = useSettingsStore((state) => state.appId);
  const privateNodes = useSettingsStore((state) => state.privateNodes);
  const actors = useGameState((state) => state.actors);
  const privateDrawings = useSettingsStore((state) => state.privateDrawings);

  const nodes = useMemo<NodesCoordinates>(() => {
    const privateGroups = privateNodes.reduce<NodesCoordinates>((acc, node) => {
      const type = node.filter ?? "private_Unsorted";
      const category = acc.find((node) => node.type === type);
      if (category) {
        category.spawns.push({
          id: node.id,
          name: node.name,
          description: node.description,
          p: node.p,
          mapName: node.mapName,
          color: node.color,
          icon: node.icon,
          radius: node.radius,
          isPrivate: true,
        });
      } else {
        acc.push({
          type,
          spawns: [
            {
              id: node.id,
              name: node.name,
              description: node.description,
              p: node.p,
              mapName: node.mapName,
              color: node.color,
              icon: node.icon,
              radius: node.radius,
              isPrivate: true,
            },
          ],
        });
      }
      return acc;
    }, []);

    if (!liveMode || !typesIdMap || !appId) {
      return [...privateGroups, ...staticNodes];
    }
    const debug = isDebug();
    const targetNodes = typesIdMap
      ? actors.reduce<NodesCoordinates>((acc, actor) => {
          let id = typesIdMap[actor.type];
          if (!id || actor.hidden) {
            if (!debug) {
              return acc;
            }
            id = actor.type;
          }

          const category = acc.find((node) => node.type === id);
          if (category) {
            category.spawns.push({
              address: actor.address,
              p: [actor.x, actor.y] as [number, number],
              mapName: actor.mapName,
            });
          } else {
            acc.push({
              type: id,
              spawns: [
                {
                  address: actor.address,
                  p: [actor.x, actor.y] as [number, number],
                  mapName: actor.mapName,
                },
              ],
            });
          }
          return acc;
        }, [])
      : [];
    targetNodes.push(
      ...privateGroups,
      ...staticNodes.filter((node) => "static" in node && !!node.static)!,
    );
    return targetNodes;
  }, [liveMode, appId, actors, privateNodes]);

  const icons = useMemo(
    () => filters.flatMap((filter) => filter.values).map((value) => value),
    [filters],
  );

  const allFilters = useMemo(
    () => [
      ...filters.flatMap((filter) => filter.values.map((value) => value.id)),
      ...privateNodes.map((node) => node.filter ?? "private_Unsorted"),
      ...privateDrawings.map((drawing) => drawing.id),
      ...REGION_FILTERS.map((filter) => filter.id),
    ],
    [filters, privateNodes, privateDrawings],
  );

  const t = useT();
  const [spawns, setSpawns] = useState<Spawns>([]);
  const spreadedSpawns = useMemo(
    () =>
      nodes.flatMap((node) =>
        node.spawns.map((spawn) => ({
          type: node.type,
          data: spawn.data ?? node.data,
          ...spawn,
        })),
      ),
    [nodes],
  );

  const fuse = useMemo(
    () =>
      new Fuse(spreadedSpawns, {
        keys: [
          {
            name: "type",
            getFn: (spawn) => (spawn.isPrivate ? spawn.type : t(spawn.type)),
            weight: 1,
          },
          {
            name: "name",
            getFn: (spawn) =>
              spawn.isPrivate
                ? spawn.name ?? ""
                : spawn.id
                  ? t(spawn.id) ?? ""
                  : "",
            weight: 2,
          },
          {
            name: "tags",
            getFn: (spawn) => t(`${spawn.id ?? spawn.type}_tags`) ?? "",
            weight: 2,
          },
        ],
        shouldSort: true,
        includeScore: true,
        threshold: 0.3,
      }),
    [spreadedSpawns, t],
  );

  const userStore = useMemo(
    () =>
      createStore(
        subscribeWithSelector(
          persist<UserStoreState>(
            (set) => ({
              mapName: view.map ?? mapName,
              setMapName: (mapName) => {
                set({ mapName, center: undefined, zoom: undefined });
              },
              center: view.center,
              setCenter: (center) => {
                set({ center });
              },
              zoom: view.zoom,
              setZoom: (zoom) => {
                set({ zoom });
              },
              search: "",
              setSearch: (search) => {
                set({ search });
              },
              filters: [
                ...filters.flatMap((filter) =>
                  filter.defaultOn
                    ? filter.values.map((value) => value.id)
                    : [],
                ),
                ...REGION_FILTERS.map((filter) => filter.id),
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
              globalFilters: globalFilters.flatMap((filter) =>
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
            }),
            {
              name: "coordinates",
              skipHydration: true,
              merge: (persisted, current) => {
                if (!persisted) {
                  return current;
                }
                const result = { ...current, ...persisted };
                if (view.center) {
                  result.center = view.center;
                }
                if (view.zoom) {
                  result.zoom = view.zoom;
                }
                if (view.map) {
                  result.mapName = view.map;
                }
                return result;
              },
            },
          ),
        ),
      ),
    [],
  );
  const refreshSpawns = useCallback(
    (state: UserStoreState) => {
      let newSpawns: Spawns;
      if (state.search) {
        newSpawns = fuse.search(state.search).map((result) => result.item);
      } else {
        const hasFilter = state.filters.length !== allFilters.length;
        const hasGlobalFilter = globalFilters.length > 0;

        const filterSpawn = (spawn: Spawns[number]) => {
          let show = true;
          if (hasFilter) {
            show = state.filters.includes(spawn.type);
          }

          if (show && hasGlobalFilter) {
            for (const filter of globalFilters) {
              if (!show) {
                continue;
              }
              if (spawn.data && spawn.data[filter.group]) {
                const values = spawn.data[filter.group];
                if (!values.some((v) => state.globalFilters.includes(v))) {
                  show = false;
                }
              }
            }
          }
          return show;
        };

        if (hasFilter || hasGlobalFilter) {
          newSpawns = spreadedSpawns.filter(filterSpawn);
        } else {
          newSpawns = spreadedSpawns;
        }
      }
      const newSpawnsMap = new Map<string, Spawns[0]>();
      newSpawns.forEach((spawn) => {
        const key = `${spawn.p[0]}:${spawn.p[1]}`;
        if (!newSpawnsMap.has(key)) {
          newSpawnsMap.set(key, { ...spawn, cluster: [] });
        } else {
          newSpawnsMap.get(key)!.cluster!.push(spawn);
        }
      });
      newSpawns = Array.from(newSpawnsMap.values());
      setSpawns(newSpawns);
    },
    [fuse],
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const appId = searchParams.get("app_id");
    if (appId) {
      useSettingsStore.getState().setAppId(appId);
    }

    const rehydrate = userStore.persist.rehydrate();
    if (rehydrate) {
      rehydrate.then(() => setIsHydrated(true));
    } else {
      setIsHydrated(true);
    }
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    refreshSpawns(userStore.getState());

    const unsubscribeFilters = userStore.subscribe(
      (state) => state.filters,
      () => {
        refreshSpawns(userStore.getState());
      },
    );
    const unsubscribeSearch = userStore.subscribe(
      (state) => state.search,
      () => {
        refreshSpawns(userStore.getState());
      },
    );
    const unsubscribeGlobalFilters = userStore.subscribe(
      (state) => state.globalFilters,
      () => {
        refreshSpawns(userStore.getState());
      },
    );

    return () => {
      unsubscribeFilters();
      unsubscribeSearch();
      unsubscribeGlobalFilters();
    };
  }, [refreshSpawns]);

  return (
    <Context.Provider
      value={{
        isHydrated,
        nodes,
        regions,
        allFilters,
        filters,
        userStore,
        spawns,
        icons,
        typesIdMap,
        globalFilters,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useCoordinates = (): ContextValue => {
  const value = useContext(Context);

  if (value === null) {
    throw new Error("useCoordinates must be used within a CoordinatesProvider");
  }

  return value;
};

export function useUserStore(): UserStoreState;
export function useUserStore<T>(selector: (state: UserStoreState) => T): T;
export function useUserStore<T>(selector?: (state: UserStoreState) => T) {
  const { userStore } = useCoordinates();
  return useStore(userStore, selector!);
}

export const useIsHydrated = () => {
  const { isHydrated } = useCoordinates();
  return isHydrated;
};
