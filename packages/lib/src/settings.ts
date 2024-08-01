import { create } from "zustand";
import { persist } from "zustand/middleware";
import { withStorageDOMEvents } from "./dom";
import { putSharedFilters } from "./shared-nodes";

export type PrivateNode = {
  id: string;
  filter: string;
  name?: string;
  description?: string;
  icon: {
    name: string;
    url: string;
  } | null;
  color?: string;
  radius: number;
  p: [number, number];
  mapName: string;
};

export type PrivateDrawing = {
  id: string;
  name: string;
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

export type MyFilter = {
  name: string;
  isShared?: boolean;
  url?: string;
  nodes?: PrivateNode[];
  drawing?: PrivateDrawing;
};

type SettingsStore = {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
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
  mapTransform: Record<string, string> | null;
  setMapTransform: (mapTransform: Record<string, string>) => void;
  mapFilter: string;
  setMapFilter: (mapFilter: string) => void;
  windowOpacity: number;
  setWindowOpacity: (windowOpacity: number) => void;
  resetTransform: () => void;
  discoveredNodes: string[];
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
  tempPrivateNode: Partial<PrivateNode> | null;
  setTempPrivateNode: (tempPrivateNode: Partial<PrivateNode> | null) => void;
  tempPrivateDrawing: Partial<PrivateDrawing> | null;
  setTempPrivateDrawing: (
    tempPrivateDrawing: Partial<PrivateDrawing> | null,
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
  myFilters: MyFilter[];
  setMyFilters: (myFilters: MyFilter[]) => void;
  setMyFilter: (myFilter: MyFilter) => void;
  addMyFilter: (myFilter: MyFilter) => void;
  removeMyFilter: (myFilterName: string) => void;
  removeMyNode: (nodeId: string) => void;
  // Deprecated
  privateNodes?: PrivateNode[];
  privateDrawings?: PrivateDrawing[];
  sharedFilters?: {
    url: string;
    filter: string;
  }[];
};

export const useSettingsStore = create(
  persist<SettingsStore>(
    (set) => {
      return {
        _hasHydrated: false,
        setHasHydrated: (state) => {
          set({
            _hasHydrated: state,
          });
        },
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
        toggleDiscoveredNode: (nodeId) => {
          set((state) => ({
            discoveredNodes: state.discoveredNodes.includes(nodeId)
              ? state.discoveredNodes.filter((id) => id !== nodeId)
              : [...state.discoveredNodes, nodeId],
          }));
        },
        setDiscoverNode: (nodeId, discovered) =>
          set((state) => ({
            discoveredNodes: discovered
              ? [...state.discoveredNodes, nodeId]
              : state.discoveredNodes.filter((id) => id !== nodeId),
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
        setMyFilter: (myFilter) =>
          set((state) => {
            const myFilters = state.myFilters.map((filter) =>
              filter.name === myFilter.name ? myFilter : filter,
            );
            return { myFilters };
          }),
        addMyFilter: async (myFilter) => {
          if (myFilter.isShared && !myFilter.url) {
            const blob = await putSharedFilters(myFilter.name, myFilter);
            myFilter.url = blob.url;
          }
          set((state) => {
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
      };
    },
    {
      name: "settings-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      version: 1,
      migrate: (persistedState, version) => {
        const newState = persistedState as SettingsStore;
        if (version === 0) {
          newState.myFilters = [];
          newState.privateNodes?.forEach((node) => {
            const filterName = `my_${Date.now()}_${
              node.filter?.replace("private_", "").replace(/shared_\d+_/, "") ??
              "Unsorted"
            }`;
            const url = newState.sharedFilters?.find(
              (f) => f.filter === filterName,
            )?.url;
            newState.myFilters.push({
              name: filterName,
              url,
              nodes: [node],
            });
          });
          newState.privateDrawings?.forEach((drawing) => {
            const filterName = `my_${Date.now()}_${drawing.name}`;
            const myFilter = newState.myFilters.find(
              (filter) => filter.name === filterName,
            );
            if (myFilter) {
              myFilter.drawing = drawing;
            } else {
              newState.myFilters.push({
                name: filterName,
                nodes: [],
                drawing: drawing,
              });
            }
          });
          delete newState.privateNodes;
          delete newState.privateDrawings;
          delete newState.sharedFilters;
        }

        return newState;
      },
    },
  ),
);

withStorageDOMEvents(useSettingsStore);
