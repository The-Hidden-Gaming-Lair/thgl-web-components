import { create } from "zustand";
import { persist } from "zustand/middleware";
import { withStorageDOMEvents } from "./dom";
import { putSharedFilters } from "./shared-nodes";

export type PrivateNode = {
  id: string;
  name?: string;
  description?: string;
  icon: {
    name: string;
    url: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } | null;
  color?: string;
  radius: number;
  p: [number, number];
  mapName: string;
};

export type Drawing = {
  id: string;
  polylines?: {
    positions: [number, number][];
    size: number;
    color: string;
    mapName: string;
  }[];
  rectangles?: {
    positions: [number, number][];
    size: number;
    color: string;
    mapName: string;
  }[];
  polygons?: {
    positions: [number, number][];
    size: number;
    color: string;
    mapName: string;
  }[];
  circles?: {
    center: [number, number];
    radius: number;
    size: number;
    color: string;
    mapName: string;
  }[];
  texts?: {
    position: [number, number];
    text: string;
    size: number;
    color: string;
    mapName: string;
  }[];
};

export type DrawingsAndNodes = {
  name: string;
  isShared?: boolean;
  url?: string;
  nodes?: PrivateNode[];
  drawing?: Drawing;
};

type SettingsStore = {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  hotkeys: Record<string, string>;
  setHotkey: (key: string, value: string) => void;
  setHotkeys: (hotkeys: Record<string, string>) => void;
  groupName: string;
  setGroupName: (groupName: string) => void;
  appId: string;
  setAppId: (lastAppId: string) => void;
  liveMode: boolean;
  setLiveMode: (liveMode: boolean) => void;
  toggleLiveMode: () => void;
  overlayMode: boolean | null;
  setOverlayMode: (overlayMode: boolean) => void;
  lockedWindow: boolean;
  toggleLockedWindow: () => void;
  transforms: Record<string, string>;
  setTransform: (id: string, transform: string) => void;
  mapTransform: {
    borderRadius: string;
    transform: string;
    width: string;
    height: string;
  } | null;
  setMapTransform: (mapTransform: {
    borderRadius: string;
    transform: string;
    width: string;
    height: string;
  }) => void;
  mapFilter: string;
  setMapFilter: (mapFilter: string) => void;
  windowOpacity: number;
  setWindowOpacity: (windowOpacity: number) => void;
  resetTransform: () => void;
  discoveredNodes: string[];
  isDiscoveredNode: (nodeId: string) => boolean;
  toggleDiscoveredNode: (nodeId: string) => void;
  setDiscoverNode: (nodeId: string, discovered: boolean) => void;
  hideDiscoveredNodes: boolean;
  toggleHideDiscoveredNodes: () => void;
  setDiscoveredNodes: (discoveredNodes: string[]) => void;
  actorsPollingRate: number;
  setActorsPollingRate: (actorsPollingRate: number) => void;
  showTraceLine: boolean;
  toggleShowTraceLine: () => void;
  traceLineLength: number;
  setTraceLineLength: (traceLineLength: number) => void;
  traceLineRate: number;
  setTraceLineRate: (traceLineRate: number) => void;
  traceLineColor: string;
  setTraceLineColor: (traceLineColor: string) => void;
  displayDiscordActivityStatus: boolean;
  setDisplayDiscordActivityStatus: (
    displayDiscordActivityStatus: boolean,
  ) => void;
  presets: Record<string, string[]>;
  addPreset: (presetName: string, filters: string[]) => void;
  removePreset: (presetName: string) => void;
  tempPrivateNode: (Partial<PrivateNode> & { filter?: string }) | null;
  setTempPrivateNode: (
    tempPrivateNode: (Partial<PrivateNode> & { filter?: string }) | null,
  ) => void;
  tempPrivateDrawing: (Partial<Drawing> & { name?: string }) | null;
  setTempPrivateDrawing: (
    tempPrivateDrawing: (Partial<Drawing> & { name?: string }) | null,
  ) => void;
  drawingColor: string;
  setDrawingColor: (drawingColor: string) => void;
  drawingSize: number;
  setDrawingSize: (drawingSize: number) => void;
  textColor: string;
  setTextColor: (textColor: string) => void;
  textSize: number;
  setTextSize: (textSize: number) => void;
  baseIconSize: number;
  setBaseIconSize: (baseIconSize: number) => void;
  fitBoundsOnChange: boolean;
  toggleFitBoundsOnChange: () => void;
  myFilters: DrawingsAndNodes[];
  setMyFilters: (myFilters: DrawingsAndNodes[]) => void;
  setMyFilter: (name: string, myFilter: Partial<DrawingsAndNodes>) => void;
  addMyFilter: (myFilter: DrawingsAndNodes) => void;
  removeMyFilter: (myFilterName: string) => void;
  removeMyNode: (nodeId: string) => void;
  showGrid: boolean;
  toggleShowGrid: () => void;
  showFilters: boolean;
  toggleShowFilters: () => void;
  expandedFilters: boolean;
  toggleExpandedFilters: () => void;
  // Deprecated
  privateNodes?: PrivateNode[];
  privateDrawings?: Drawing[];
  sharedFilters?: {
    url: string;
    filter: string;
  }[];
};

const getStorageName = () => {
  if (typeof window !== "undefined") {
    if (window.location.pathname.startsWith("/apps/")) {
      const appId = window.location.pathname.split("/")[2];
      return `thgl-settings-${appId}`;
    }
  }
  return "settings-storage";
};
export const useSettingsStore = create(
  persist<SettingsStore>(
    (set, get) => {
      const oldState = {};
      const storageName = getStorageName();
      if (storageName !== "settings-storage") {
        try {
          const oldStorage = localStorage.getItem("settings-storage");
          if (oldStorage) {
            Object.assign(oldState, JSON.parse(oldStorage).state);
            localStorage.removeItem("settings-storage");
          }
        } catch (e) {}
      }

      return {
        _hasHydrated: false,
        setHasHydrated: (state) => {
          set({
            _hasHydrated: state,
          });
        },
        hotkeys: {},
        setHotkey: (key, value) =>
          set((state) => ({
            hotkeys: {
              ...state.hotkeys,
              [key]: value,
            },
          })),
        setHotkeys: (hotkeys) => set({ hotkeys }),
        groupName: "",
        setGroupName: (groupName) => set({ groupName }),
        appId: "",
        setAppId: (appId) => set({ appId }),
        liveMode: true,
        setLiveMode: (liveMode) => set({ liveMode }),
        toggleLiveMode: () => set((state) => ({ liveMode: !state.liveMode })),
        overlayMode: null,
        setOverlayMode: (overlayMode) =>
          set({
            overlayMode,
          }),
        lockedWindow: false,
        toggleLockedWindow: () =>
          set((state) => ({ lockedWindow: !state.lockedWindow })),
        transforms: {},
        setTransform: (id, transform) =>
          set((state) => ({
            transforms: {
              ...state.transforms,
              [id]: transform,
            },
          })),
        mapTransform: null,
        setMapTransform: (mapTransform) => set({ mapTransform }),
        mapFilter: "none",
        setMapFilter: (mapFilter) => set({ mapFilter }),
        windowOpacity: 1,
        setWindowOpacity: (windowOpacity) => set({ windowOpacity }),
        resetTransform: () => {
          set({
            transforms: {},
            mapTransform: null,
          });
        },
        discoveredNodes: [],
        isDiscoveredNode: (nodeId) => {
          const { discoveredNodes } = get();
          if (nodeId.includes("@")) {
            return (
              discoveredNodes.includes(nodeId) ||
              discoveredNodes.some((id) => id === nodeId.split("@")[0])
            );
          }
          return discoveredNodes.includes(nodeId);
        },
        toggleDiscoveredNode: (nodeId) => {
          set((state) => ({
            discoveredNodes: state.isDiscoveredNode(nodeId)
              ? state.discoveredNodes.filter((id) => {
                  if (id === nodeId) {
                    return false;
                  }
                  if (nodeId.includes("@") && nodeId.split("@")[0] === id) {
                    return false;
                  }
                  return true;
                })
              : [...new Set([...state.discoveredNodes, nodeId])],
          }));
        },
        setDiscoverNode: (nodeId, discovered) =>
          set((state) => ({
            discoveredNodes: discovered
              ? [...new Set([...state.discoveredNodes, nodeId])]
              : state.discoveredNodes.filter((id) => {
                  if (id === nodeId) {
                    return false;
                  }
                  if (nodeId.includes("@") && nodeId.split("@")[0] === id) {
                    return false;
                  }
                  return true;
                }),
          })),
        hideDiscoveredNodes: false,
        toggleHideDiscoveredNodes: () =>
          set((state) => ({
            hideDiscoveredNodes: !state.hideDiscoveredNodes,
          })),
        setDiscoveredNodes: (discoveredNodes) => set({ discoveredNodes }),
        actorsPollingRate: 100,
        setActorsPollingRate: (actorsPollingRate) => set({ actorsPollingRate }),
        showTraceLine: true,
        toggleShowTraceLine: () =>
          set((state) => ({ showTraceLine: !state.showTraceLine })),
        traceLineLength: 100,
        setTraceLineLength: (traceLineLength) => set({ traceLineLength }),
        traceLineRate: 5,
        setTraceLineRate: (traceLineRate) => set({ traceLineRate }),
        traceLineColor: "#1ccdd1B3",
        setTraceLineColor: (traceLineColor) => set({ traceLineColor }),
        displayDiscordActivityStatus: true,
        setDisplayDiscordActivityStatus: (displayDiscordActivityStatus) =>
          set({ displayDiscordActivityStatus }),
        presets: {},
        addPreset: (presetName, filters) =>
          set((state) => ({
            presets: {
              ...state.presets,
              [presetName]: filters,
            },
          })),
        removePreset: (presetName) =>
          set((state) => {
            const presets = { ...state.presets };
            delete presets[presetName];
            return { presets };
          }),
        tempPrivateNode: null,
        setTempPrivateNode: (tempPrivateNode) =>
          set((state) => ({
            tempPrivateNode: tempPrivateNode
              ? { ...(state.tempPrivateNode || {}), ...tempPrivateNode }
              : null,
          })),
        tempPrivateDrawing: null,
        setTempPrivateDrawing: (tempPrivateDrawing) =>
          set((state) => ({
            tempPrivateDrawing: tempPrivateDrawing
              ? { ...(state.tempPrivateDrawing || {}), ...tempPrivateDrawing }
              : null,
          })),
        drawingColor: "#FFFFFFAA",
        setDrawingColor: (drawingColor) => set({ drawingColor }),
        drawingSize: 4,
        setDrawingSize: (drawingSize) => set({ drawingSize }),
        textColor: "#1ccdd1",
        setTextColor: (textColor) => set({ textColor }),
        textSize: 20,
        setTextSize: (textSize) => set({ textSize }),
        baseIconSize: 1,
        setBaseIconSize: (baseIconSize) => set({ baseIconSize }),
        fitBoundsOnChange: false,
        toggleFitBoundsOnChange: () =>
          set((state) => ({ fitBoundsOnChange: !state.fitBoundsOnChange })),
        myFilters: [],
        setMyFilters: (myFilters) => set({ myFilters }),
        setMyFilter: (name, myFilter) =>
          set((state) => ({
            myFilters: state.myFilters.map((filter) =>
              filter.name === name ? { ...filter, ...myFilter } : filter,
            ),
          })),
        addMyFilter: async (myFilter) => {
          if (myFilter.isShared && !myFilter.url) {
            const blob = await putSharedFilters(myFilter.name, myFilter);
            myFilter.url = blob.url;
          }
          set((state) => {
            if (
              myFilter.isShared &&
              myFilter.url &&
              state.myFilters.some(
                (filter) => filter.isShared && filter.url === myFilter.url,
              )
            ) {
              return state;
            }
            return {
              myFilters: [...state.myFilters, myFilter],
            };
          });
        },
        removeMyFilter: (myFilterName) =>
          set((state) => ({
            myFilters: state.myFilters.filter(
              (filter) => filter.name !== myFilterName,
            ),
          })),
        removeMyNode: (nodeId) =>
          set((state) => {
            const myFilter = state.myFilters.find((filter) =>
              filter.nodes?.some((node) => node.id === nodeId),
            );
            if (!myFilter) {
              return state;
            }
            myFilter.nodes = myFilter.nodes?.filter(
              (node) => node.id !== nodeId,
            );
            if (myFilter.url) {
              putSharedFilters(myFilter.url, myFilter);
            }
            return {
              myFilters: state.myFilters.map((filter) =>
                filter.name === myFilter.name ? myFilter : filter,
              ),
            };
          }),
        showGrid: false,
        toggleShowGrid: () => set((state) => ({ showGrid: !state.showGrid })),
        showFilters: true,
        toggleShowFilters: () =>
          set((state) => ({ showFilters: !state.showFilters })),
        expandedFilters: false,
        toggleExpandedFilters: () =>
          set((state) => ({ expandedFilters: !state.expandedFilters })),
        ...oldState,
      };
    },
    {
      name: getStorageName(),
      onRehydrateStorage: () => (state) => {
        if (!state?._hasHydrated) {
          state?.setHasHydrated(true);
        }
      },
      version: 3,
      // @ts-ignore
      migrate: (persistedState, version) => {
        if (version < 3) {
          const storageName = getStorageName();
          if (storageName !== "settings-storage") {
            const oldStorage = localStorage.getItem("settings-storage");
            if (oldStorage) {
              const oldState = JSON.parse(oldStorage).state;
              Object.assign(persistedState || {}, oldState);
            }
          }
        }
        return persistedState;
      },
    },
  ),
);

withStorageDOMEvents(useSettingsStore);
