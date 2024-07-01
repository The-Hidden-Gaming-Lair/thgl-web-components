"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import useSWRImmutable from "swr/immutable";

export type NodesCoordinates = {
  type: string;
  static?: boolean;
  mapName?: string;
  spawns: {
    id?: string;
    name?: string;
    description?: string;
    address?: number;
    p: [number, number];
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
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
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
  staticNodes: initialStaticNodes,
  regions,
  filters,
  globalFilters = [],
  typesIdMap,
  mapName: initialMapName = "default",
  view,
}: {
  children: React.ReactNode;
  staticNodes?: NodesCoordinates;
  regions: RegionsCoordinates;
  filters: FiltersCoordinates;
  globalFilters?: GlobalFiltersCoordinates;
  typesIdMap?: Record<string, string>;
  mapName?: string;
  view: {
    center?: [number, number];
    zoom?: number;
    map?: string;
    filters?: string[];
    globalFilters?: string[];
  };
}): JSX.Element {
  const userStore = useMemo(
    () =>
      createStore(
        subscribeWithSelector(
          persist<UserStoreState>(
            (set) => ({
              _hasHydrated: false,
              setHasHydrated: (state) => {
                set({
                  _hasHydrated: state,
                });
              },
              mapName: view.map ?? initialMapName,
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
              filters: view.filters ?? [
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
            }),
            {
              name: "coordinates",
              onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
              },
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
                if (view.filters) {
                  result.filters = view.filters;
                }
                if (view.globalFilters) {
                  result.globalFilters = view.globalFilters;
                }
                return result;
              },
            },
          ),
        ),
      ),
    [],
  );

  const userStoreHasHydrated = userStore.getState()._hasHydrated;
  const settingsHasHydrated = useSettingsStore((state) => state._hasHydrated);

  const { data } = useSWRImmutable(
    "/api/nodes",
    async () => {
      return fetch("/api/nodes").then(
        (res) => res.json() as Promise<NodesCoordinates>,
      );
    },
    {
      revalidateOnMount: !initialStaticNodes,
    },
  );

  const staticNodes = data ?? initialStaticNodes;
  const isHydrated = userStoreHasHydrated && settingsHasHydrated;

  const liveMode = useSettingsStore((state) => state.liveMode);
  const appId = useSettingsStore((state) => state.appId);
  const privateNodes = useSettingsStore((state) => state.privateNodes);
  const actors = useGameState((state) => state.actors);
  const privateDrawings = useSettingsStore((state) => state.privateDrawings);

  const privateGroups = useMemo<NodesCoordinates>(() => {
    if (!isHydrated) {
      return [];
    }
    return privateNodes.reduce<NodesCoordinates>((acc, node) => {
      const type = node.filter ?? "private_Unsorted";
      const mapName = node.mapName;
      const category = acc.find(
        (node) => node.type === type && node.mapName === mapName,
      );
      if (category) {
        category.spawns.push({
          id: node.id,
          name: node.name,
          description: node.description,
          p: node.p,
          color: node.color,
          icon: node.icon,
          radius: node.radius,
          isPrivate: true,
        });
      } else {
        acc.push({
          type,
          mapName,
          spawns: [
            {
              id: node.id,
              name: node.name,
              description: node.description,
              p: node.p,
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
  }, [isHydrated, privateNodes]);

  const nodes = useMemo<NodesCoordinates>(() => {
    if (!isHydrated || !staticNodes) {
      return [];
    }
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

          const category = acc.find(
            (node) => node.type === id && node.mapName === actor.mapName,
          );
          if (category) {
            category.spawns.push({
              address: actor.address,
              p: [actor.x, actor.y] as [number, number],
            });
          } else {
            acc.push({
              type: id,
              mapName: actor.mapName,
              spawns: [
                {
                  address: actor.address,
                  p: [actor.x, actor.y] as [number, number],
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
  }, [isHydrated, liveMode, appId, actors, privateGroups, staticNodes]);

  const icons = useMemo(
    () => filters.flatMap((filter) => filter.values).map((value) => value),
    [filters],
  );

  const allFilters = useMemo(() => {
    if (!isHydrated) {
      return [];
    }

    return [
      ...filters.flatMap((filter) => filter.values.map((value) => value.id)),
      ...privateNodes.map((node) => node.filter ?? "private_Unsorted"),
      ...privateDrawings.map((drawing) => drawing.id),
      ...REGION_FILTERS.map((filter) => filter.id),
    ];
  }, [isHydrated, filters, privateNodes, privateDrawings]);

  const t = useT();
  const [spawns, setSpawns] = useState<Spawns>([]);

  const fuse = useRef<Fuse<any> | null>(null);

  const refreshSpawns = useCallback(
    (state: UserStoreState) => {
      let newSpawns: Spawns = [];
      const newSpawnsMap = new Map<string, Spawns[0]>();
      if (state.search) {
        if (fuse.current === null) {
          console.warn("fuse is null");
          newSpawns = [];
        } else {
          newSpawns = fuse.current
            .search(state.search)
            .map((result) => result.item);
        }
        newSpawns.forEach((spawn) => {
          const key = `${spawn.p[0]}:${spawn.p[1]}`;
          if (!newSpawnsMap.has(key)) {
            newSpawnsMap.set(key, { ...spawn, cluster: [] });
          } else {
            newSpawnsMap.get(key)!.cluster!.push(spawn);
          }
        });
      } else {
        nodes.forEach((node) => {
          if (node.mapName && node.mapName !== state.mapName) {
            return;
          }
          if (!state.filters.includes(node.type)) {
            return;
          }
          node.spawns.forEach((s) => {
            const spawn = { ...s, mapName: node.mapName, type: node.type };
            if (spawn.data) {
              for (const filter of globalFilters) {
                if (spawn.data[filter.group]) {
                  const values = spawn.data[filter.group];
                  if (!values.some((v) => state.globalFilters.includes(v))) {
                    return;
                  }
                }
              }
            }
            const key = `${spawn.p[0]}:${spawn.p[1]}`;
            if (!newSpawnsMap.has(key)) {
              newSpawnsMap.set(key, { ...spawn, cluster: [] });
            } else {
              newSpawnsMap.get(key)!.cluster!.push(spawn);
            }
            newSpawns.push(spawn);
          });
        });
      }

      newSpawns = Array.from(newSpawnsMap.values());
      setSpawns(newSpawns);
    },
    [nodes],
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const appId = searchParams.get("app_id");
    if (appId) {
      useSettingsStore.getState().setAppId(appId);
    }

    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const initFuse = () => {
      if (fuse.current) {
        return;
      }
      const spreadedSpawns = nodes.flatMap((node) =>
        node.spawns.map((spawn) => ({
          type: node.type,
          data: spawn.data ?? node.data,
          mapName: node.mapName,
          ...spawn,
        })),
      );

      fuse.current = new Fuse(spreadedSpawns, {
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
      });
    };

    const state = userStore.getState();
    if (state.search) {
      initFuse();
    }
    refreshSpawns(state);

    const unsubscribeFilters = userStore.subscribe(
      (state) => state.filters,
      () => {
        refreshSpawns(userStore.getState());
      },
    );
    const unsubscribeSearch = userStore.subscribe(
      (state) => state.search,
      () => {
        initFuse();
        refreshSpawns(userStore.getState());
      },
    );
    const unsubscribeGlobalFilters = userStore.subscribe(
      (state) => state.globalFilters,
      () => {
        refreshSpawns(userStore.getState());
      },
    );
    const unsubscribeMapName = userStore.subscribe(
      (state) => state.mapName,
      () => {
        refreshSpawns(userStore.getState());
      },
    );

    return () => {
      unsubscribeFilters();
      unsubscribeSearch();
      unsubscribeGlobalFilters();
      unsubscribeMapName();
      fuse.current = null;
    };
  }, [isHydrated, refreshSpawns]);

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
