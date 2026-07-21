"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react";
import Fuse from "fuse.js";
import { useI18n } from ".";
import {
  decodeFromBuffer,
  isLiveReadingActive,
  isOverwolf,
  resolveLiveModeForType,
  useAccountStore,
  useEffectiveLiveMode,
  useGameState,
  useSettingsStore,
  Region,
  DrawingsAndNodes,
  FiltersConfig,
  getAppUrl,
  createUserStore,
  type UserStore,
  UserStoreState,
  searchParamsToView,
  GlobalFiltersConfig,
  Spawn,
  getApiUrl,
} from "@repo/lib";
import { CaseSensitive, Hexagon } from "lucide-react";
import { useStore } from "zustand";
import { UserStoreContext } from "./user-store";
import { useStaticNodesTransformStore } from "./static-nodes-transform-store";
import useSWRImmutable from "swr/immutable";
import { toast } from "sonner";

export type NodesCoordinates = {
  type: string;
  static?: boolean;
  /**
   * Marks a node whose spawns are dynamic static predictions
   * (no live tracking confirmed). In combined mode these render muted.
   * Set at build time; pre-baked once per static-data change.
   */
  predicted?: boolean;
  /** Render this predicted node's spawns faded (resolved live mode = combined). */
  muted?: boolean;
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
    no_map_markers?: boolean;
    /** @deprecated Renamed to `no_map_markers`. Still read for back-compat. */
    live_only?: boolean;
    autoDiscover?: boolean;
    defaultOn?: boolean;
  }
>;

interface ContextValue {
  isHydrated: boolean;
  nodes: NodesCoordinates;
  /**
   * The full static node set (custom + all static spawns), independent of the
   * live-mode filtering applied to `nodes`. Use this to know which types have a
   * known position (e.g. the "Discover Nearest Node" default classification),
   * since `nodes` drops live-resolved predictions.
   */
  searchableNodes: NodesCoordinates;
  staticDrawings?: DrawingsAndNodes[];
  regions: Region[];
  filters: FiltersConfig;
  globalFilters: GlobalFiltersConfig;
  allFilters: string[];
  /**
   * Filtered static spawns rendered on the static marker layer.
   * Live actors flow imperatively into the renderer via useGameState
   * subscriptions and are NOT included here.
   */
  spawns: Spawns;
  icons: Icons;
  typesIdMap?: Record<string, string>;
  /**
   * Whether this session can receive live data at all — true in a companion
   * app (Overwolf / THGLApp WebView) or when a Peer Link teammate is streaming.
   * False on the plain web map, where live/combined mode has no source.
   */
  liveCapable: boolean;
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
// Stable refs for prop defaults — destructuring inline literals (`= []`,
// `= ["default"]`) creates a NEW reference every render, which in turn
// invalidates every useMemo / useCallback / useEffect that depends on
// the prop. That cascades into refreshSpawns → setSpawns → MarkersContent
// re-render → static-effect re-run → 10k+ markerLayer.add() calls per tick.
const EMPTY_GLOBAL_FILTERS: GlobalFiltersConfig = [];
const DEFAULT_MAP_NAMES: string[] = ["default"];

export function CoordinatesProvider({
  children,
  staticNodes: initialStaticNodes,
  staticDrawings,
  useCbor,
  regions,
  filters,
  globalFilters = EMPTY_GLOBAL_FILTERS,
  typesIdMap,
  mapNames = DEFAULT_MAP_NAMES,
  appName,
  nodesPaths,
  map,
  clusterPrecision = 0,
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
  appName: string;
  nodesPaths: Record<string, string>;
  map?: string;
  clusterPrecision?: number;
}): JSX.Element {
  const { t, dict, locale } = useI18n();
  // Create the user store once per provider instance (i.e. per request on
  // the server, per mount on the client) and share it via UserStoreContext.
  // This replaces the old module-level singleton, which leaked one tenant's
  // state into another's SSR HTML and caused hydration mismatches.
  const userStoreRef = useRef<UserStore | null>(null);
  if (!userStoreRef.current) {
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
    userStoreRef.current = createUserStore(
      view,
      mapNames,
      filters,
      globalFilters,
      REGION_FILTERS,
      staticDrawings,
    );
  }
  const userStore = userStoreRef.current;

  // Dev-only test seam: expose the stores so the map's auth-gated / live-only
  // UI can be driven from the browser console (or the Playwright MCP) without
  // the real game/app — e.g. inject synthetic actors to verify clustering.
  // See docs/THGL_FRONTEND_GUIDE.md in data-forge.
  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || typeof window === "undefined")
      return;
    (window as unknown as { __thgl?: unknown }).__thgl = {
      useGameState,
      useSettingsStore,
      useAccountStore,
      userStore,
    };
  }, [userStore]);

  const userStoreHasHydrated = useStore(
    userStore,
    (state) => state._hasHydrated,
  );
  const search = useStore(userStore, (state) => state.search);
  const settingsHasHydrated = useSettingsStore((state) => state._hasHydrated);
  const isHydrated = userStoreHasHydrated && settingsHasHydrated;
  const mapName = useStore(userStore, (state) => state.mapName);
  const setMapName = useStore(userStore, (state) => state.setMapName);

  useEffect(() => {
    if (map && map !== mapName) {
      setMapName(map);
    }
  }, [map]);

  // Keep the selected map in sync with browser Back/Forward. Map switches happen
  // via history.pushState (map-select.tsx, player.tsx, markers-search-results.tsx)
  // rather than a Next.js navigation, so popstate changes the URL but does NOT
  // re-render this provider with a new `map` prop. Without this, the store's
  // mapName — which drives the map and the map selector — would stay on the
  // last-selected map while the address bar reverts. Re-derive the map from the
  // path on popstate, mirroring the init-time URL→map resolution above.
  useEffect(() => {
    const syncMapFromLocation = () => {
      const segments = window.location.pathname.split("/");
      const mapsIndex = segments.indexOf("maps");
      if (mapsIndex === -1 || mapsIndex + 1 >= segments.length) return;
      const mapSegment = decodeURIComponent(segments[mapsIndex + 1]);
      if (!mapSegment) return;
      const key = mapNames.find(
        (k) => k === mapSegment || (dict[k] ?? k) === mapSegment,
      );
      if (!key) return;
      const state = userStore.getState();
      if (state.mapName !== key) {
        state.setMapName(key);
      }
    };
    window.addEventListener("popstate", syncMapFromLocation);
    return () => window.removeEventListener("popstate", syncMapFromLocation);
  }, [dict, mapNames, userStore]);

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
        const url = getAppUrl(appName, nodesPaths[mapName]);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch static nodes for map "${mapName}": ${response.statusText}`,
          );
        }
        const buffer = await response.arrayBuffer();
        console.log(
          `Fetched buffer for map "${mapName}" with ${buffer.byteLength} bytes, starting with ${new Uint8Array(
            buffer,
          )
            .slice(0, 10)
            .map((b) => +b.toString(16))
            .join(" ")}`,
        );
        const nodes = decodeFromBuffer<NodesCoordinates>(
          new Uint8Array(buffer),
        );
        return { [mapName]: nodes };
      }
      const response = await fetch(`/api/nodes/${mapName}`);
      const nodes = (await response.json()) as NodesCoordinates;
      return { [mapName]: nodes };
    },
    {
      onError: (error) => {
        toast.error(
          `Failed to load static nodes for map "${mapName}". Please try again later.`,
        );
        console.error(
          `Failed to load static nodes for map "${mapName}":`,
          error,
        );
      },
    },
  );

  const rawStaticNodes =
    (mapName && staticNodesByMap?.[mapName]) ||
    (emptyArray as NodesCoordinates);
  // Optional per-game rewrite of the fetched nodes (e.g. the Satisfactory
  // world-seed panel swapping resource markers). Null for every other game.
  const staticNodesTransform = useStaticNodesTransformStore((s) => s.transform);
  const staticNodes = useMemo(
    () =>
      staticNodesTransform
        ? staticNodesTransform(rawStaticNodes)
        : rawStaticNodes,
    [rawStaticNodes, staticNodesTransform],
  );

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
      const url = getApiUrl(appName, `q=${search}&locale=${locale}`);
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
      onError: (error) => {
        toast.error(
          `Failed to load public search spawns for "${search}". Please try again later.`,
        );
        console.error(
          `Failed to load public search spawns for "${search}":`,
          error,
        );
      },
    },
  );
  const publicSearchSpawns = publicSearchSpawnsByKeyword?.[search];

  useEffect(() => {
    const state = userStore.getState();
    if (state.searchIsLoading !== publicSearchIsLoading) {
      state.setSearchIsLoading(publicSearchIsLoading);
    }
  }, [publicSearchIsLoading, userStore]);

  const liveMode = useEffectiveLiveMode();
  // Per-filter live-mode overrides + preview access, used to resolve which
  // predicted nodes to keep (and fade) on a per-type basis below.
  const liveModeByFilter = useSettingsStore((state) => state.liveModeByFilter);
  const hasPreviewAccess = useAccountStore(
    (state) => state.perks.previewReleaseAccess,
  );
  // Can this session receive live data at all? Use STABLE signals — never the
  // transient player/actors, which empty out on loading screens and map
  // transitions and would otherwise make all predicted spawns flash in and out.
  //   - Companion app (Overwolf or THGLApp WebView at /apps/<id>): the user's
  //     live-mode selection is authoritative; loading-screen gaps must not flip
  //     rendering.
  //   - Peer Link connected: a teammate may stream live positions.
  // On the plain website with neither, live/combined mode has no source to
  // confirm predicted-dynamic spawns, so we fall back to showing them all.
  const isCompanionApp = useMemo(
    () =>
      isOverwolf ||
      // Match "/apps/<id>" anywhere in the path so a locale prefix
      // (e.g. "/de/apps/palia/overlay") still counts as the companion app.
      (typeof window !== "undefined" &&
        /(^|\/)apps\//.test(window.location.pathname)),
    [],
  );
  // Peer Link delivers live data through useGameState (NOT useConnectionStore —
  // that's the whiteboard/drawing-collaboration store, which Peer Link never
  // populates). peerLiveConnected is the stable "mesh joined with a Me sender"
  // signal set by StreamingReceiver.
  const peerLiveConnected = useGameState((s) => s.peerLiveConnected);
  const liveCapable = isCompanionApp || peerLiveConnected;
  const myFilters = useSettingsStore((state) => state.myFilters);
  // Actors now flow directly into markers.tsx via useGameState subscription.

  // Reverse lookup: translated icon name → current icon coords from filter config.
  // Used to fix stale sprite x,y in old private nodes that lack filterId.
  const iconNameLookup = useMemo(() => {
    const lookup = new Map<
      string,
      { x: number; y: number; width: number; height: number; filterId: string }
    >();
    for (const filter of filters) {
      for (const value of filter.values) {
        if (typeof value.icon !== "string") {
          lookup.set(t(value.id), { ...value.icon, filterId: value.id });
        }
      }
    }
    return lookup;
  }, [filters, t]);

  // User-created custom markers (from myFilters)
  const customNodes = useMemo<NodesCoordinates>(() => {
    if (!isHydrated) {
      return [] as NodesCoordinates;
    }
    return myFilters.reduce<NodesCoordinates>((acc, myFilter) => {
      myFilter.nodes?.forEach((node) => {
        const nodeMapName = node.mapName;
        // Resolve stale sprite coords for old private nodes missing filterId
        let icon = node.icon;
        if (
          icon &&
          !icon.filterId &&
          icon.name &&
          icon.url?.includes("/icons/")
        ) {
          const current = iconNameLookup.get(icon.name);
          if (current) {
            icon = {
              ...icon,
              x: current.x,
              y: current.y,
              width: current.width,
              height: current.height,
              filterId: current.filterId,
            };
          }
        }
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
            icon,
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
                icon,
                radius: node.radius,
                isPrivate: true,
              },
            ],
          });
        }
      });
      return acc;
    }, []);
  }, [isHydrated, myFilters, iconNameLookup]);

  const allFilters = useMemo(() => {
    if (!isHydrated) {
      return [];
    }

    return [
      ...filters.flatMap((filter) => filter.values.map((value) => value.id)),
      ...myFilters.map((node) => node.name),
      ...REGION_FILTERS.map((filter) => filter.id),
      ...(staticDrawings?.map((drawing) => drawing.name) ?? []),
    ];
  }, [isHydrated, filters, myFilters]);

  // Filter for permanent nodes (static: true) that always appear on the map
  // vs dynamic nodes (static: false) that appear based on actor state
  const realStaticNodes = useMemo(
    () =>
      staticNodes.filter(
        (node) =>
          ("static" in node && !!node.static) ||
          (typesIdMap && !Object.values(typesIdMap).includes(node.type)),
      ),
    [staticNodes, typesIdMap],
  );

  // Visible static node set. Recomputed only on filter/data/live-mode changes —
  // never on actor polls. Live actors flow imperatively into markers.tsx via
  // useGameState subscriptions, so they're not in here.
  //
  // Permanent landmarks (realStaticNodes) always show. Trackable dynamic-static
  // nodes are kept as predictions only when their *resolved* live mode keeps
  // them: `combined` (faded) or `static` (full opacity). A `live`-resolved type
  // drops its predictions — the imperative live pipeline renders its actors
  // instead. Resolution is per-filter (liveModeByFilter) layered on the global
  // mode, so the user can keep predictions for some filters (e.g. campsites)
  // while others go live-only (e.g. bugs/mining).
  const nodes = useMemo<NodesCoordinates>(() => {
    if (!isHydrated || !staticNodes) return emptyArray as NodesCoordinates;
    if (
      !isLiveReadingActive(liveMode) ||
      !liveCapable ||
      !typesIdMap ||
      Object.keys(typesIdMap).length === 0
    ) {
      // Static (predicted) mode — also the fallback when live/combined mode is
      // selected but this session can't receive live data (plain website, no
      // companion app and no peer link): show customNodes + ALL static spawns at
      // full opacity, since there's nothing live to confirm or mute predicted-
      // dynamic spawns. In the companion app this stays false-y so the selected
      // live mode is respected even across loading screens.
      return customNodes.concat(staticNodes);
    }
    const trackedTypes = new Set(Object.values(typesIdMap));
    const predicted: NodesCoordinates = [];
    for (const node of staticNodes) {
      const isPermanent =
        ("static" in node && !!node.static) || !trackedTypes.has(node.type);
      if (isPermanent) continue; // already covered by realStaticNodes
      const resolved = resolveLiveModeForType(
        node.type,
        liveMode,
        liveModeByFilter,
        hasPreviewAccess,
      );
      if (resolved === "live") continue; // predictions hidden; live actors show
      // Spawns passed by reference — no per-tick allocation.
      predicted.push({
        ...node,
        predicted: true,
        muted: resolved === "combined",
      });
    }
    return customNodes.concat(realStaticNodes, predicted);
  }, [
    isHydrated,
    liveMode,
    liveCapable,
    customNodes,
    staticNodes,
    realStaticNodes,
    typesIdMap,
    liveModeByFilter,
    hasPreviewAccess,
  ]);

  // Searchable nodes: static + custom (excludes live actors which change constantly)
  const searchableNodes = useMemo(
    () => customNodes.concat(staticNodes),
    [customNodes, staticNodes],
  );

  // Only rebuild Fuse.js search index when user is actively searching.
  // Depends on searchableNodes (stable) not nodes (includes actors).
  const searchIndex = useMemo(() => {
    if (!search) {
      return null;
    }
    const nodeSpawns = searchableNodes.flatMap((node) =>
      node.spawns.map((spawn) => ({
        id: spawn.id ?? node.type,
        type: node.type,
        data: spawn.data ?? node.data,
        mapName: node.mapName,
        ...spawn,
      })),
    );
    let allSearchableSpawns;

    if (initialStaticNodes) {
      const otherMapSpawns = initialStaticNodes
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
      allSearchableSpawns = [...nodeSpawns, ...otherMapSpawns];
    } else {
      allSearchableSpawns = nodeSpawns;
    }
    return new Fuse(allSearchableSpawns, {
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
  }, [search, searchableNodes, initialStaticNodes, mapName, t]);

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

  // Ref lets refreshSpawns read the latest node list without being recreated
  // on every change — the callback's identity stays stable across renders.
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  // Structural fingerprint: covers add/remove of static spawns plus edits
  // to private nodes. Filter/search/mapName changes already trigger
  // refreshSpawns via zustand subscribers, so this only catches changes to
  // the underlying static data shape (rare — mostly initial load or save).
  const nodesFingerprint = useMemo(() => {
    let fp = "";
    for (const node of nodes) {
      let privateHash = "";
      for (const s of node.spawns) {
        if (s.isPrivate) {
          privateHash += `${s.name ?? ""}:${s.description ?? ""}:${s.radius ?? ""}:${s.color ?? ""}|`;
        }
      }
      fp += `${node.type}:${node.mapName ?? ""}:${node.spawns.length}:${privateHash};`;
    }
    return fp;
  }, [nodes]);

  const clusterKey = useCallback(
    (p: number[]) => {
      if (clusterPrecision > 0) {
        const snap = (v: number) =>
          Math.round(v / clusterPrecision) * clusterPrecision;
        return `${snap(p[0])}:${snap(p[1])}`;
      }
      return `${p[0]}:${p[1]}`;
    },
    [clusterPrecision],
  );

  // Shared per-node iteration helper. Used by both static and live refresh
  // pipelines so the filter/cluster/source-tag logic stays in one place.
  // Returns a sorted, clustered Spawns array for the supplied nodes.
  const processNodes = useCallback(
    (currentNodes: NodesCoordinates, state: UserStoreState): Spawns => {
      const newSpawns: Spawn[] = [];
      const spawnsByCoordinate = new Map<string, Spawn>();
      const selectedNodeId = state.selectedNodeId;

      currentNodes.forEach((node) => {
        if (node.mapName && node.mapName !== state.mapName) return;
        const isFilterActive = state.filters.includes(node.type);

        // Filter off but a spawn in this node is selected: include just that one.
        if (!isFilterActive && selectedNodeId) {
          const selectedSpawnData = node.spawns.find((s) => {
            const sid = s.id ?? node.type;
            const nodeId = sid.includes("@")
              ? sid
              : `${sid}@${s.p[0]}:${s.p[1]}`;
            return nodeId === selectedNodeId;
          });
          if (selectedSpawnData) {
            const spawn = {
              ...selectedSpawnData,
              id: selectedSpawnData.id ?? node.type,
              mapName: node.mapName,
              type: node.type,
            } as Spawn;
            const key = clusterKey(spawn.p);
            if (!spawnsByCoordinate.has(key)) {
              spawnsByCoordinate.set(key, { ...spawn, cluster: [] });
            } else {
              spawnsByCoordinate.get(key)!.cluster!.push(spawn);
            }
            newSpawns.push(spawn);
          }
          return;
        }
        if (!isFilterActive) return;

        const nodePredicted = node.predicted;
        const nodeMuted = node.muted;
        node.spawns.forEach((s) => {
          const spawn = {
            ...s,
            id: s.id ?? node.type,
            mapName: node.mapName,
            type: node.type,
            source: s.source ?? (nodePredicted ? "static" : undefined),
            muted: nodeMuted,
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
          const key = clusterKey(spawn.p);
          if (!spawnsByCoordinate.has(key)) {
            spawnsByCoordinate.set(key, { ...spawn, cluster: [] });
          } else {
            spawnsByCoordinate.get(key)!.cluster!.push(spawn);
          }
          newSpawns.push(spawn);
        });
      });

      const result = Array.from(spawnsByCoordinate.values());
      result.sort((a, b) => {
        if (a.mapName && b.mapName) return b.mapName.localeCompare(a.mapName);
        return 0;
      });
      return result;
    },
    [clusterKey, globalFilters],
  );

  // Refresh: iterates static nodes (and search results when search is active).
  // Runs on filter/search/mapName/data changes. Live actors are NOT included
  // — they're rendered imperatively in markers.tsx and don't flow through here.
  const refreshSpawns = useCallback(
    (state: UserStoreState) => {
      if (state.search) {
        if (state.search.length < 3 || !searchIndex) {
          setSpawns([]);
          return;
        }
        const spawnsByCoordinate = new Map<string, Spawn>();
        const results: (Spawn & { score?: number })[] = searchIndex
          .search(state.search)
          .map((r) => ({ ...r.item, score: r.score }));
        const privateMapName = results[0]?.mapName;
        if (publicSearchSpawns) {
          results.push(
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
        results.forEach((spawn) => {
          const key = clusterKey(spawn.p);
          if (!spawnsByCoordinate.has(key)) {
            spawnsByCoordinate.set(key, { ...spawn, cluster: [] });
          } else {
            spawnsByCoordinate.get(key)!.cluster!.push(spawn);
          }
        });
        const sorted = Array.from(spawnsByCoordinate.values()).sort((a, b) => {
          const aScore = (a as Spawn & { score?: number }).score;
          const bScore = (b as Spawn & { score?: number }).score;
          if (aScore !== undefined && bScore !== undefined) {
            const scoreDiff = aScore - bScore;
            if (scoreDiff !== 0) return scoreDiff;
          }
          if (a.mapName && b.mapName) return b.mapName.localeCompare(a.mapName);
          return 0;
        });
        setSpawns(sorted);
        return;
      }
      setSpawns(processNodes(nodesRef.current, state));
    },
    [processNodes, searchIndex, publicSearchSpawns, clusterKey],
  );

  useEffect(() => {
    if (!isHydrated) return;
    refreshSpawns(userStore.getState());
    const unsubs = [
      userStore.subscribe(
        (s) => s.filters,
        () => refreshSpawns(userStore.getState()),
      ),
      userStore.subscribe(
        (s) => s.search,
        () => refreshSpawns(userStore.getState()),
      ),
      userStore.subscribe(
        (s) => s.globalFilters,
        () => refreshSpawns(userStore.getState()),
      ),
      userStore.subscribe(
        (s) => s.mapName,
        () => refreshSpawns(userStore.getState()),
      ),
      userStore.subscribe(
        (s) => s.selectedNodeId,
        () => refreshSpawns(userStore.getState()),
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [isHydrated, refreshSpawns, mapName, nodesFingerprint, userStore]);

  return (
    <UserStoreContext.Provider value={userStore}>
      <Context.Provider
        value={{
          isHydrated,
          nodes,
          searchableNodes,
          staticDrawings,
          regions,
          allFilters,
          filters,
          spawns,
          icons,
          typesIdMap,
          globalFilters,
          liveCapable,
        }}
      >
        {children}
      </Context.Provider>
    </UserStoreContext.Provider>
  );
}

export const useCoordinates = (): ContextValue => {
  const value = useContext(Context);

  if (value === null) {
    throw new Error("useCoordinates must be used within a CoordinatesProvider");
  }

  return value;
};
