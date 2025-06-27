"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Fuse from "fuse.js";
import { useI18n } from ".";
import {
  decodeFromBuffer,
  isDebug,
  useGameState,
  useSettingsStore,
  Region,
  DrawingsAndNodes,
  FiltersConfig,
  getAppUrl,
  initUserStore,
  useUserStore,
  UserStoreState,
  searchParamsToView,
  GlobalFiltersConfig,
  Spawn,
} from "@repo/lib";
import { CaseSensitive, Hexagon } from "lucide-react";
import useSWRImmutable from "swr/immutable";

export type NodesCoordinates = {
  type: string;
  static?: boolean;
  mapName?: string;
  spawns: (Omit<Spawn, "type" | "id"> & { id?: string })[];
  data?: Record<string, string[]>;
}[];
export type Spawns = Spawn[];

export type Icons = Map<
  string,
  {
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
  }
>;

interface ContextValue {
  isHydrated: boolean;
  nodes: NodesCoordinates;
  staticDrawings?: DrawingsAndNodes[];
  regions: Region[];
  filters: FiltersConfig;
  globalFilters: GlobalFiltersConfig;
  allFilters: string[];
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
  staticDrawings,
  useCbor,
  regions,
  filters,
  globalFilters = [],
  typesIdMap,
  mapNames = ["default"],
  appName,
  nodesPaths,
  map,
}: {
  children: React.ReactNode;
  staticNodes?: NodesCoordinates;
  staticDrawings?: DrawingsAndNodes[];
  useCbor?: boolean;
  regions: Region[];
  filters: FiltersConfig;
  globalFilters?: GlobalFiltersConfig;
  typesIdMap?: Record<string, string>;
  mapNames: string[];
  appName?: string;
  nodesPaths?: Record<string, string>;
  map?: string;
}): JSX.Element {
  const { t, dict } = useI18n();
  if (!useUserStore) {
    const fIds = Object.values(filters).flatMap((f) =>
      f.values.map((v) => v.id),
    );
    const targetSearchParams: Record<string, string | string[] | undefined> =
      {};
    if (typeof window !== "undefined") {
      // This will throw an hydration error if search params are set (which is fine)
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.forEach((value, key) => {
        targetSearchParams[key] = value;
      });
      const params = window.location.pathname.split("/");
      if (params.length > 2) {
        const termEntry = Object.entries(dict).find(
          ([, value]) => value === decodeURIComponent(params[2]),
        );
        if (termEntry) {
          targetSearchParams.map = termEntry[0];
        }
      }
    }
    const view = searchParamsToView(targetSearchParams, fIds);
    if (map) {
      view.map = map;
    }
    initUserStore(view, mapNames, filters, globalFilters, REGION_FILTERS);
  }

  const userStoreHasHydrated = useUserStore((state) => state._hasHydrated);
  const search = useUserStore((state) => state.search);
  const settingsHasHydrated = useSettingsStore((state) => state._hasHydrated);
  const isHydrated = userStoreHasHydrated && settingsHasHydrated;
  const mapName = useUserStore((state) => state.mapName);
  const setMapName = useUserStore((state) => state.setMapName);

  useEffect(() => {
    if (map && map !== mapName) {
      setMapName(map);
    }
  }, [map]);

  const { data: staticNodesByMap } = useSWRImmutable(
    mapName ? ["/api/nodes", mapName] : null,
    async () => {
      if (!mapName) {
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
        let url;
        if (nodesPaths && appName) {
          url = getAppUrl(appName, nodesPaths[mapName]);
        } else if (appName) {
          url = getAppUrl(appName, `/nodes/${mapName}.cbor`);
        } else {
          url = `/nodes/${mapName}.cbor`;
        }
        const response = await fetch(url);
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
      const url = appName
        ? `https://data.th.gl/api/${appName}/search?q=${search}`
        : `/api/nodes/search?q=${search}`;
      const response = await fetch(url);
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
    const state = useUserStore.getState();
    if (state.searchIsLoading !== publicSearchIsLoading) {
      state.setSearchIsLoading(publicSearchIsLoading);
    }
  }, [publicSearchIsLoading]);

  const liveMode = useSettingsStore((state) => state.liveMode);
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
    () =>
      staticNodes.filter(
        (node) =>
          ("static" in node && !!node.static) ||
          (typesIdMap && !Object.values(typesIdMap).includes(node.type)),
      ),
    [staticNodes],
  );

  const nodes = useMemo<NodesCoordinates>(() => {
    if (!isHydrated || !staticNodes) {
      return emptyArray as NodesCoordinates;
    }
    if (!liveMode || !typesIdMap) {
      return privateGroups.concat(staticNodes);
    }
    const debug = isDebug();

    const actorNodes: NodesCoordinates = [];
    const actorMap = new Map<string, NodesCoordinates[number]>();
    actorLoop: for (const actor of actors) {
      let id = typesIdMap[actor.type];
      if (!id || actor.hidden) {
        if (!debug) continue;
        id = actor.type;
      }

      const mapName = actor.mapName;
      const staticNode = realStaticNodes.find(
        (n) => n.type === id && (!n.mapName || n.mapName === mapName),
      );

      if (staticNode && staticNode.spawns.length) {
        for (let i = 0; i < staticNode.spawns.length; i++) {
          const spawn = staticNode.spawns[i];
          const dx = spawn.p[0] - actor.x;
          const dy = spawn.p[1] - actor.y;
          if (dx > -1 && dx < 1 && dy > -1 && dy < 1) continue actorLoop;
        }
      }

      const key = `${id}::${mapName ?? ""}`;
      let category = actorMap.get(key);

      if (!category) {
        category = {
          type: id,
          mapName: mapName,
          spawns: [],
        };
        actorMap.set(key, category);
        actorNodes.push(category);
      }

      const spawn = {
        id: `${id}@${actor.x}:${actor.y}`,
        address: actor.address,
        p: actor.z != null ? [actor.x, actor.y, actor.z] : [actor.x, actor.y],
      } as Spawn;

      category.spawns.push(spawn);
    }

    return privateGroups.concat(realStaticNodes, actorNodes);
  }, [isHydrated, liveMode, actors, privateGroups, staticNodes]);

  useEffect(() => {
    if (!typesIdMap) {
      return;
    }
    const { setDiscoverNode, isDiscoveredNode } = useSettingsStore.getState();

    const filterValues = filters.flatMap((filter) => filter.values);
    actors.forEach((actor) => {
      if (typeof actor.hidden === "undefined") {
        return;
      }
      const id = typesIdMap[actor.type];
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
          const nodeId = spawn.id?.includes("@")
            ? spawn.id
            : `${spawn.id || staticNode.type}@${spawn.p[0]}:${spawn.p[1]}`;
          if (isDiscoveredNode(nodeId) !== actor.hidden) {
            setDiscoverNode(nodeId, actor.hidden);
          }
          return;
        }
      }
      const nodeId = `${id}@${actor.x}:${actor.y}`;
      if (isDiscoveredNode(nodeId) !== actor.hidden) {
        setDiscoverNode(nodeId, actor.hidden);
      }
    });
  }, [typesIdMap, actors]);

  const privateFuse = useMemo(() => {
    const nodeSpawns = nodes.flatMap((node) =>
      node.spawns.map((spawn) => ({
        id: spawn.id ?? node.type,
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
            id: spawn.id ?? node.type,
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
          getFn: (spawn) =>
            t(`${spawn.id ?? spawn.type}_tags`)
              ?.split(",")
              .map((tag) => tag.trim()) ?? [],
          weight: 2,
        },
      ],
      shouldSort: true,
      includeScore: true,
      threshold: 0.3,
    });
  }, [nodes, initialStaticNodes]);

  const icons = useMemo(
    () =>
      new Map(
        filters
          .flatMap((filter) => filter.values)
          .map((value) => [value.id, value]),
      ),
    [filters],
  );

  const [spawns, setSpawns] = useState<Spawns>([]);

  const refreshSpawns = useCallback(
    (state: UserStoreState) => {
      let newSpawns: (Spawns[number] & { score?: number })[] = [];
      const newSpawnsMap = new Map<string, Spawn>();
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
            ...publicSearchSpawns
              .filter((n) => n.mapName !== privateMapName)
              .map((spawn) => ({
                ...spawn,
                id: spawn.id ?? spawn.type,
                mapName: spawn.mapName,
                type: spawn.type,
              })),
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
            const spawn = {
              ...s,
              id: s.id ?? node.type,
              mapName: node.mapName,
              type: node.type,
            } as Spawn;
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
    if (!isHydrated) {
      return;
    }

    const state = useUserStore.getState();
    refreshSpawns(state);

    const unsubscribeFilters = useUserStore.subscribe(
      (state) => state.filters,
      () => {
        refreshSpawns(useUserStore.getState());
      },
    );
    const unsubscribeSearch = useUserStore.subscribe(
      (state) => state.search,
      () => {
        refreshSpawns(useUserStore.getState());
      },
    );
    const unsubscribeGlobalFilters = useUserStore.subscribe(
      (state) => state.globalFilters,
      () => {
        refreshSpawns(useUserStore.getState());
      },
    );
    const unsubscribeMapName = useUserStore.subscribe(
      (state) => state.mapName,
      () => {
        refreshSpawns(useUserStore.getState());
      },
    );

    return () => {
      unsubscribeFilters();
      unsubscribeSearch();
      unsubscribeGlobalFilters();
      unsubscribeMapName();
    };
  }, [isHydrated, refreshSpawns, mapName]);

  return (
    <Context.Provider
      value={{
        isHydrated,
        nodes,
        staticDrawings,
        regions,
        allFilters,
        filters,
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
