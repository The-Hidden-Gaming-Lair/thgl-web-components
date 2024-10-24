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
import {
  decodeFromBuffer,
  isDebug,
  useGameState,
  useSettingsStore,
} from "@repo/lib";
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
    p: [number, number] | [number, number, number];
    color?: string;
    icon?: {
      name: string;
      url: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
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
  p: [number, number] | [number, number, number];
  type: string;
  cluster?: Omit<Spawns[number], "cluster">[];
  mapName?: string;
  color?: string;
  icon?: {
    name: string;
    url: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
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
    icon:
      | string
      | {
          name: string;
          url: string;
          x: number;
          y: number;
          width: number;
          height: number;
        };
    size?: number;
    live_only?: boolean;
    autoDiscover?: boolean;
    defaultOn?: boolean;
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
  icon:
    | string
    | {
        name: string;
        url: string;
        x: number;
        y: number;
        width: number;
        height: number;
      };
  size?: number;
}[];

interface UserStoreState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  mapName: string;
  setMapName: (
    mapName: string,
    center?: [number, number],
    zoom?: number,
  ) => void;
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
const emptyArray: any[] = [];
const emptyObject: any = {};
export function CoordinatesProvider({
  children,
  staticNodes: initialStaticNodes,
  useCbor,
  regions,
  filters,
  globalFilters = [],
  typesIdMap,
  mapNames = ["default"],
  view,
}: {
  children: React.ReactNode;
  staticNodes?: NodesCoordinates;
  useCbor?: boolean;
  regions: RegionsCoordinates;
  filters: FiltersCoordinates;
  globalFilters?: GlobalFiltersCoordinates;
  typesIdMap?: Record<string, string>;
  mapNames: string[];
  view: {
    center?: [number, number];
    zoom?: number;
    map?: string;
    filters?: string[];
    globalFilters?: string[];
  };
}): JSX.Element {
  const t = useT();

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
      ),
    [],
  );

  const userStoreHasHydrated = useStore(
    userStore,
    (state) => state._hasHydrated,
  );
  const settingsHasHydrated = useSettingsStore((state) => state._hasHydrated);
  const search = useStore(userStore, (state) => state.search);
  const isHydrated = userStoreHasHydrated && settingsHasHydrated;
  const stateMapName = useStore(userStore, (state) => state.mapName);
  const mapName = userStoreHasHydrated ? stateMapName : null;

  const { data: staticNodesByMap } = useSWRImmutable(
    ["/api/nodes", mapName],
    async () => {
      if (!userStoreHasHydrated || !mapName) {
        return emptyObject as Record<string, NodesCoordinates>;
      }
      if (initialStaticNodes) {
        return {
          [mapName]: initialStaticNodes.filter(
            (node) => !node.mapName || node.mapName === mapName,
          ),
        };
      }
      if (useCbor) {
        const response = await fetch(`/nodes/${mapName}.cbor`);
        const buffer = await response.arrayBuffer();
        const nodes = decodeFromBuffer<NodesCoordinates>(
          new Uint8Array(buffer),
        );
        return { [mapName]: nodes };
      }
      const response = await fetch(`/api/nodes/${mapName}`);
      const nodes = (await response.json()) as NodesCoordinates;
      return { [mapName]: nodes };
    },
  );
  const staticNodes =
    (mapName && staticNodesByMap?.[mapName]) ||
    (emptyArray as NodesCoordinates);

  const {
    data: publicSearchSpawnsByKeyword,
    isLoading: publicSearchIsLoading,
  } = useSWRImmutable(
    ["/api/search", search],
    async () => {
      if (
        mapNames.length === 1 ||
        !userStoreHasHydrated ||
        !search ||
        initialStaticNodes ||
        search.length < 3
      ) {
        return { [search]: emptyArray as Spawns };
      }
      const response = await fetch(`/api/nodes/search?q=${search}`);
      if (useCbor) {
        const buffer = await response.arrayBuffer();
        const spawns = decodeFromBuffer<Spawns>(new Uint8Array(buffer));
        return { [search]: spawns };
      }
      const spawns = (await response.json()) as Spawns;
      return { [search]: spawns };
    },
    {
      revalidateOnMount: !search,
    },
  );
  const publicSearchSpawns = publicSearchSpawnsByKeyword?.[search];

  useEffect(() => {
    const state = userStore.getState();
    if (state.searchIsLoading !== publicSearchIsLoading) {
      state.setSearchIsLoading(publicSearchIsLoading);
    }
  }, [publicSearchIsLoading]);

  const liveMode = useSettingsStore((state) => state.liveMode);
  const appId = useSettingsStore((state) => state.appId);
  const myFilters = useSettingsStore((state) => state.myFilters);
  const actors = useGameState((state) => state.actors);

  const privateGroups = useMemo<NodesCoordinates>(() => {
    if (!isHydrated || !mapName) {
      return [] as NodesCoordinates;
    }
    return myFilters.reduce<NodesCoordinates>((acc, myFilter) => {
      myFilter.nodes?.forEach((node) => {
        const nodeMapName = node.mapName;
        const category = acc.find(
          (node) => node.type === myFilter.name && node.mapName === nodeMapName,
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
            type: myFilter.name,
            mapName: nodeMapName,
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
      });
      return acc;
    }, []);
  }, [isHydrated, myFilters]);
  const normalizedTypesIdMap = useMemo(() => {
    if (!typesIdMap) {
      return typesIdMap;
    }
    return Object.entries(typesIdMap).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        acc[key.toLowerCase()] = value;
        return acc;
      },
      {},
    );
  }, [typesIdMap]);

  const allFilters = useMemo(() => {
    if (!isHydrated) {
      return [];
    }

    return [
      ...filters.flatMap((filter) => filter.values.map((value) => value.id)),
      ...myFilters.map((node) => node.name),
      ...REGION_FILTERS.map((filter) => filter.id),
    ];
  }, [isHydrated, filters, myFilters]);

  const realStaticNodes = useMemo(
    () => staticNodes.filter((node) => "static" in node && !!node.static)!,
    [staticNodes],
  );

  const nodes = useMemo<NodesCoordinates>(() => {
    if (!isHydrated || !staticNodes) {
      return emptyArray as NodesCoordinates;
    }
    if (!liveMode || !normalizedTypesIdMap || !appId) {
      return [...privateGroups, ...staticNodes];
    }
    const debug = isDebug();

    const actorNodes = normalizedTypesIdMap
      ? actors.reduce<NodesCoordinates>((acc, actor) => {
          let id = normalizedTypesIdMap[actor.type.toLowerCase()];
          if (!id) {
            if (!debug) {
              return acc;
            }
            id = actor.type;
          }
          const staticNode = realStaticNodes.find(
            (n) => n.type === id && (!n.mapName || n.mapName === actor.mapName),
          );
          if (staticNode) {
            if (
              staticNode.spawns.some(
                (spawn) =>
                  Math.abs(spawn.p[0] - actor.x) < 1 &&
                  Math.abs(spawn.p[1] - actor.y) < 1,
              )
            ) {
              return acc;
            }
          }

          const category = acc.find(
            (node) =>
              node.type === id &&
              (!node.mapName || node.mapName === actor.mapName),
          );
          if (category) {
            category.spawns.push({
              address: actor.address,
              p: actor.z
                ? ([actor.x, actor.y, actor.z] as [number, number, number])
                : ([actor.x, actor.y] as [number, number]),
            });
          } else {
            acc.push({
              type: id,
              mapName: actor.mapName,
              spawns: [
                {
                  address: actor.address,
                  p: actor.z
                    ? ([actor.x, actor.y, actor.z] as [number, number, number])
                    : ([actor.x, actor.y] as [number, number]),
                },
              ],
            });
          }
          return acc;
        }, [])
      : [];
    const targetNodes = [...privateGroups, ...realStaticNodes, ...actorNodes];
    return targetNodes;
  }, [isHydrated, liveMode, appId, actors, privateGroups, staticNodes]);

  useEffect(() => {
    if (!normalizedTypesIdMap) {
      return;
    }
    const { setDiscoverNode, discoveredNodes } = useSettingsStore.getState();

    const filterValues = filters.flatMap((filter) => filter.values);
    actors.forEach((actor) => {
      if (typeof actor.hidden === "undefined") {
        return;
      }
      const id = normalizedTypesIdMap[actor.type.toLowerCase()];
      if (!id) {
        return;
      }
      const filterValue = filterValues.find((f) => f.id === id);
      if (!filterValue || !filterValue.autoDiscover) {
        return;
      }

      const staticNode = realStaticNodes.find(
        (n) => n.type === id && (!n.mapName || n.mapName === actor.mapName),
      );
      if (staticNode) {
        const spawn = staticNode.spawns.find(
          (spawn) =>
            Math.abs(spawn.p[0] - actor.x) < 1 &&
            Math.abs(spawn.p[1] - actor.y) < 1,
        );
        if (spawn) {
          const nodeId = `${spawn.id ?? staticNode.type}@${spawn.p[0]}:${spawn.p[1]}`;
          if (discoveredNodes.includes(nodeId) !== actor.hidden) {
            setDiscoverNode(nodeId, actor.hidden);
          }
          return;
        }
      }
      const nodeId = `${id}@${actor.x}:${actor.y}`;
      if (discoveredNodes.includes(nodeId) !== actor.hidden) {
        setDiscoverNode(nodeId, actor.hidden);
      }
    });
  }, [normalizedTypesIdMap, actors]);

  const privateFuse = useMemo(() => {
    const nodeSpawns = nodes.flatMap((node) =>
      node.spawns.map((spawn) => ({
        type: node.type,
        data: spawn.data ?? node.data,
        mapName: node.mapName,
        ...spawn,
      })),
    );
    let spreadedSpawns;

    if (initialStaticNodes) {
      const initialSpawns = initialStaticNodes
        .filter((n) => n.mapName && n.mapName !== mapName)
        .flatMap((node) =>
          node.spawns.map((spawn) => ({
            type: node.type,
            data: spawn.data ?? node.data,
            mapName: node.mapName,
            ...spawn,
          })),
        );
      spreadedSpawns = [...nodeSpawns, ...initialSpawns];
    } else {
      spreadedSpawns = nodeSpawns;
    }

    return new Fuse(spreadedSpawns, {
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
              ? (spawn.name ?? "")
              : spawn.id
                ? (t(spawn.id) ?? "")
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
  }, [nodes]);

  const icons = useMemo(
    () => filters.flatMap((filter) => filter.values).map((value) => value),
    [filters],
  );

  const [spawns, setSpawns] = useState<Spawns>([]);

  const refreshSpawns = useCallback(
    (state: UserStoreState) => {
      let newSpawns: (Spawns[number] & { score?: number })[] = [];
      const newSpawnsMap = new Map<string, Spawns[0]>();
      if (state.search) {
        if (state.search.length < 3) {
          setSpawns(newSpawns);
          return;
        }
        newSpawns = privateFuse
          .search(state.search)
          .map((result) => ({ ...result.item, score: result.score }));
        const privateMapName = newSpawns[0]?.mapName;

        if (publicSearchSpawns) {
          newSpawns.push(
            ...publicSearchSpawns.filter((n) => n.mapName !== privateMapName),
          );
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
        const debug = isDebug();

        nodes.forEach((node) => {
          if (node.mapName && node.mapName !== state.mapName) {
            return;
          }
          if (!state.filters.includes(node.type) && !debug) {
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
      newSpawns.sort((a, b) => {
        const res = a.score! - b.score!;
        if (res !== 0) {
          return res;
        }
        if (a.mapName && b.mapName) {
          return b.mapName.localeCompare(a.mapName);
        }
        return 0;
      });

      setSpawns(newSpawns);
    },
    [nodes, privateFuse, publicSearchSpawns],
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

    const state = userStore.getState();
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
        typesIdMap: normalizedTypesIdMap,
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
