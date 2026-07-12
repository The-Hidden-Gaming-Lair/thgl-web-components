import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { useAccountStore } from "./account";
import {
  buildDiscoveryLookup,
  checkNodeDiscovered,
  coordsMatch,
  type DiscoverMode,
} from "./coordinates";
import { withStorageDOMEvents } from "./dom";
import {
  apiDeleteFilter,
  apiListFilters,
  apiPutFilter,
  FiltersApiError,
  serverFilterToLocal,
} from "./filters-api";
import { getCurrentGameId } from "./games";

export type LiveMode = "static" | "live" | "combined";

export const LIVE_MODE_VALUES: readonly LiveMode[] = [
  "static",
  "combined",
  "live",
] as const;

/**
 * Live modes gated behind the preview-release (Elite) perk. Currently empty —
 * `combined` is public. Re-add a mode here to gate it again; every consumer
 * (global control, per-filter override, mode resolution) reads this set, so
 * gating/ungating is a one-line change.
 */
export const PREVIEW_LIVE_MODES: ReadonlySet<LiveMode> = new Set<LiveMode>();

export function isLiveReadingActive(liveMode: LiveMode): boolean {
  return liveMode !== "static";
}

export function nextLiveMode(current: LiveMode): LiveMode {
  const idx = LIVE_MODE_VALUES.indexOf(current);
  return LIVE_MODE_VALUES[(idx + 1) % LIVE_MODE_VALUES.length];
}

/**
 * Read the live mode the user is currently entitled to.
 * Silently downgrades preview-gated modes ('combined') to 'live' for
 * users without preview access — keeps the heavy combined-mode render
 * path off the free tier even if their stored setting is 'combined'
 * (legacy or auto-set by peer sync).
 */
/**
 * Pure variant of {@link useEffectiveLiveMode} for non-React call sites
 * (e.g. the imperative live-actor pipeline). Applies the same preview gate.
 */
export function getEffectiveLiveMode(
  liveMode: LiveMode,
  hasPreview: boolean,
): LiveMode {
  if (!hasPreview && PREVIEW_LIVE_MODES.has(liveMode)) return "live";
  return liveMode;
}

export function useEffectiveLiveMode(): LiveMode {
  const liveMode = useSettingsStore((s) => s.liveMode);
  const hasPreview = useAccountStore((s) => s.perks.previewReleaseAccess);
  return getEffectiveLiveMode(liveMode, hasPreview);
}

/**
 * Resolve the live mode for a single filter type, honoring the per-filter
 * override (`liveModeByFilter`) on top of the global effective mode.
 *
 * - When live reading is globally off (`static`), every type stays predicted —
 *   the live plugin isn't running, so per-filter overrides can't show live data.
 * - Otherwise the per-filter override wins, falling back to the global mode.
 * - A resolved `combined` is preview-gated, downgrading to `live` without access
 *   (same rule as the global control).
 */
export function resolveLiveModeForType(
  type: string,
  globalEffectiveMode: LiveMode,
  liveModeByFilter: Record<string, LiveMode> | undefined,
  hasPreview: boolean,
): LiveMode {
  if (globalEffectiveMode === "static") return "static";
  const mode = liveModeByFilter?.[type] ?? globalEffectiveMode;
  if (!hasPreview && PREVIEW_LIVE_MODES.has(mode)) return "live";
  return mode;
}

export type PrivateNode = {
  id: string;
  name?: string;
  description?: string;
  icon: {
    name: string;
    url: string;
    filterId?: string;
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

// The reusable style of a private node (everything except its position and id).
// A capped list of the most recent ones is persisted so the "Add Node" dialog
// can offer them as one-click starting points when creating new nodes.
export const MAX_RECENT_PRIVATE_NODE_STYLES = 10;
export type PrivateNodeStyle = {
  filter?: string;
  name?: string;
  description?: string;
  icon: PrivateNode["icon"];
  color?: string;
  radius: number;
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
    fillColor?: string;
    mapName: string;
  }[];
  polygons?: {
    positions: [number, number][];
    size: number;
    color: string;
    fillColor?: string;
    mapName: string;
  }[];
  circles?: {
    center: [number, number];
    radius: number;
    size: number;
    color: string;
    fillColor?: string;
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
  // New server-managed fields. Populated for filters synced to the
  // Bunny DB (signed-in users). Anonymous filters have neither.
  id?: string;
  game?: string;
  visibility?: "private" | "public";
  shareCode?: string;
  voteCount?: number;
  commentCount?: number;
  updatedAt?: number;
  // Legacy fields kept so existing localStorage data renders. New code
  // doesn't read them — they're inert after the shared-filters rework.
  isShared?: boolean;
  url?: string;
  nodes?: PrivateNode[];
  drawing?: Drawing;
};

export type ColorBlindMode =
  | "none"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia";

export type LabelMode = "off" | "always" | "inRange" | "hotkey";

export type MapTransform = {
  borderRadius: string;
  transform: string;
  width: string;
  height: string;
};

export const DEFAULT_PROFILE_SETTINGS: ProfileSettings = {
  hotkeys: {
    toggle_app: "F6",
    zoom_in_app: "F7",
    zoom_out_app: "F8",
    toggle_lock_app: "F9",
    discover_node: "F10",
    toggle_live_mode: "F5",
    toggle_overlay_fullscreen: "Shift+F9",
    show_labels: "Shift+F5",
  },
  groupName: "",
  // Default to pure live (predicted hidden). Combined (predicted + live) is
  // opt-in. Before Combined was public it was downgraded to live for non-elite
  // users anyway, so this keeps the out-of-box experience consistent.
  liveMode: "live",
  overlayMode: null,
  overlayFullscreen: false,
  lockedWindow: false,
  colorBlindMode: "none",
  colorBlindSeverity: 1,
  highContrastMode: false,
  highContrastColor: "#FFFFFFCC",
  highContrastThickness: 2,
  transforms: {},
  mapTransform: null,
  mapFilter: "none",
  windowOpacity: 1,
  discoveredNodes: [],
  hideDiscoveredNodes: false,
  autoDiscoveredNodes: [],
  autoDiscoverCollected: true,
  actorsPollingRate: 100,
  showTraceLine: true,
  followPlayer: true,
  traceLineLength: 100,
  traceLineRate: 5,
  traceLineColor: "#1ccdd1B3",
  traceLineStyle: "dots" as "dots" | "line",
  audioAlertsMuted: false,
  audioAlertNotifications: false,
  audioAlertRange: 5000,
  audioAlertSound: "chime" as const,
  audioAlertVolume: 0.5,
  showAudioAlertRange: false,
  audioAlertByFilter: {},
  labelModeByFilter: {},
  liveModeByFilter: {},
  discoverModeByFilter: {},
  labelTextSize: 1,
  showLabelsHotkey: "l",
  displayDiscordActivityStatus: true,
  presets: {},
  tempPrivateNode: null,
  recentPrivateNodeStyles: [],
  tempPrivateDrawing: null,
  drawingColor: "#FFFFFFAA",
  drawingFillColor: "#FFFFFF33",
  drawingSize: 4,
  textColor: "#1ccdd1",
  textSize: 20,
  baseIconSize: 1,
  dynamicIconSize: true,
  dynamicIconSizeFactor: 0.2,
  playerIconSize: 1,
  iconSizeByGroup: {},
  iconSizeByFilter: {},
  fitBoundsOnChange: false,
  myFilters: [],
  showGrid: false,
  showFilters: true,
  // Peer Link / Mesh settings
  peerCode: "",
  lastMeSenderId: "",
  playerName: "",
  playerColor: "#38bdf8",
  showPeerLabels: true,
  autoJoinPeer: false,
  autoLiveModeWithMe: true,
};

export const DEFAULT_PROFILE = {
  id: "default",
  name: "Default",
  settings: DEFAULT_PROFILE_SETTINGS,
};

// A saved preset. Originally just an array of active filter ids; now each
// category is captured independently — presence of a field means "this preset
// controls it". So a preset can be filters-only, alerts-only, or any mix, and
// applying it restores exactly the captured categories (others are left alone).
// The icon-size trio (baseIconSize/byGroup/byFilter) is captured as one unit;
// `iconSizeByGroup !== undefined` is the canonical "sizes captured" signal.
// The bare-array form is still accepted (legacy presets = filters only).
export type FilterPreset = {
  filters?: string[];
  baseIconSize?: number;
  iconSizeByGroup?: Record<string, number>;
  iconSizeByFilter?: Record<string, number>;
  audioAlertByFilter?: Record<string, boolean>;
};

export type ProfileSettings = {
  hotkeys: Record<string, string>;
  groupName: string;
  liveMode: LiveMode;
  overlayMode: boolean | null;
  overlayFullscreen: boolean;
  lockedWindow: boolean;
  colorBlindMode: ColorBlindMode;
  colorBlindSeverity: number;
  highContrastMode: boolean;
  highContrastColor: string;
  highContrastThickness: number;
  transforms: Record<string, string>;
  mapTransform: MapTransform | null;
  mapFilter: string;
  windowOpacity: number;
  discoveredNodes: string[];
  hideDiscoveredNodes: boolean;
  // Nodes auto-marked discovered from live memory (a subset of discoveredNodes),
  // tracked separately so the UI can flag them as auto-discovered and so opting
  // out can undo exactly those without touching manually-discovered nodes.
  autoDiscoveredNodes: string[];
  // User opt-out for memory-driven auto-discovery of collected items.
  autoDiscoverCollected: boolean;
  actorsPollingRate: number;
  showTraceLine: boolean;
  followPlayer: boolean;
  traceLineLength: number;
  traceLineRate: number;
  traceLineColor: string;
  traceLineStyle: "dots" | "line";
  audioAlertsMuted: boolean;
  audioAlertNotifications: boolean;
  audioAlertRange: number;
  audioAlertSound: "chime" | "ping" | "beacon" | "soft";
  audioAlertVolume: number;
  showAudioAlertRange: boolean;
  audioAlertByFilter: Record<string, boolean>;
  labelModeByFilter: Record<string, LabelMode>;
  /**
   * Per-filter live-mode override. Absent key = inherit the global live mode.
   * Lets a user keep predictions for some filters (e.g. campsites) while
   * showing others live-only (e.g. bugs/mining). See {@link resolveLiveModeForType}.
   */
  liveModeByFilter: Record<string, LiveMode>;
  /**
   * Per-filter override for the "Discover Nearest Node" hotkey. Absent key =
   * inherit the static-flag-derived default (fixed types `enabled`, live/dynamic
   * types `predicted`). See {@link resolveDiscoverMode}.
   */
  discoverModeByFilter: Record<string, DiscoverMode>;
  labelTextSize: number;
  showLabelsHotkey: string;
  displayDiscordActivityStatus: boolean;
  presets: Record<string, string[] | FilterPreset>;
  tempPrivateNode: (Partial<PrivateNode> & { filter?: string }) | null;
  recentPrivateNodeStyles: PrivateNodeStyle[];
  tempPrivateDrawing: (Partial<Drawing> & { name?: string }) | null;
  drawingColor: string;
  drawingFillColor: string;
  drawingSize: number;
  textColor: string;
  textSize: number;
  baseIconSize: number;
  dynamicIconSize: boolean;
  dynamicIconSizeFactor: number;
  playerIconSize: number;
  iconSizeByGroup: Record<string, number>;
  iconSizeByFilter: Record<string, number>;
  fitBoundsOnChange: boolean;
  myFilters: DrawingsAndNodes[];
  showGrid: boolean;
  showFilters: boolean;
  // Peer Link / Mesh settings
  peerCode: string;
  lastMeSenderId: string;
  playerName: string;
  playerColor: string;
  showPeerLabels: boolean;
  autoJoinPeer: boolean;
  autoLiveModeWithMe: boolean;

  // Deprecated
  privateNodes?: PrivateNode[];
  privateDrawings?: Drawing[];
  sharedFilters?: {
    url: string;
    filter: string;
  }[];
};

export interface ProfileActions {
  setHotkey: (key: string, value: string) => void;
  setHotkeys: (hotkeys: Record<string, string>) => void;
  setGroupName: (groupName: string) => void;
  setLiveMode: (liveMode: LiveMode) => void;
  cycleLiveMode: () => void;
  setOverlayMode: (overlayMode: boolean) => void;
  toggleOverlayFullscreen: () => void;
  toggleLockedWindow: () => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  setColorBlindSeverity: (severity: number) => void;
  toggleHighContrastMode: () => void;
  setHighContrastColor: (color: string) => void;
  setHighContrastThickness: (thickness: number) => void;
  setTransform: (id: string, transform: string) => void;
  setMapTransform: (mapTransform: MapTransform | null) => void;
  setMapFilter: (mapFilter: string) => void;
  setWindowOpacity: (windowOpacity: number) => void;
  resetTransform: () => void;
  resetInterface: () => void;
  isDiscoveredNode: (nodeId: string) => boolean;
  // True if the node was auto-discovered from live memory (vs manually marked).
  isAutoDiscoveredNode: (nodeId: string) => boolean;
  toggleDiscoveredNode: (nodeId: string) => void;
  setDiscoverNode: (nodeId: string, discovered: boolean) => void;
  toggleHideDiscoveredNodes: () => void;
  setDiscoveredNodes: (discoveredNodes: string[]) => void;
  // Mark nodes discovered from live memory — adds to BOTH discoveredNodes (so all
  // discovery logic applies) and autoDiscoveredNodes (so the UI can flag them).
  markAutoDiscovered: (nodeIds: string[]) => void;
  setAutoDiscoverCollected: (enabled: boolean) => void;
  setActorsPollingRate: (actorsPollingRate: number) => void;
  toggleShowTraceLine: () => void;
  toggleFollowPlayer: () => void;
  setTraceLineLength: (traceLineLength: number) => void;
  setTraceLineRate: (traceLineRate: number) => void;
  setTraceLineColor: (traceLineColor: string) => void;
  setTraceLineStyle: (style: "dots" | "line") => void;
  toggleAudioAlertsMuted: () => void;
  toggleAudioAlertNotifications: () => void;
  setAudioAlertRange: (range: number) => void;
  setAudioAlertSound: (sound: "chime" | "ping" | "beacon" | "soft") => void;
  setAudioAlertVolume: (volume: number) => void;
  toggleShowAudioAlertRange: () => void;
  toggleAudioAlertByFilter: (filterId: string) => void;
  setAudioAlertByFilters: (filterIds: string[], enabled: boolean) => void;
  resetAudioAlerts: () => void;
  setLabelModeByFilter: (filterId: string, mode: LabelMode) => void;
  setLabelModeByFilters: (filterIds: string[], mode: LabelMode) => void;
  // `"default"` clears the override so the filter inherits the global live mode.
  setLiveModeByFilter: (filterId: string, mode: LiveMode | "default") => void;
  setLiveModeByFilters: (
    filterIds: string[],
    mode: LiveMode | "default",
  ) => void;
  // Per-filter Discover-Nearest override. `"default"` clears the override so the
  // filter inherits the static-flag-derived default (see resolveDiscoverMode).
  setDiscoverModeByFilter: (
    filterId: string,
    mode: DiscoverMode | "default",
  ) => void;
  setDiscoverModeByFilters: (
    filterIds: string[],
    mode: DiscoverMode | "default",
  ) => void;
  setLabelTextSize: (size: number) => void;
  setShowLabelsHotkey: (key: string) => void;
  setDisplayDiscordActivityStatus: (
    displayDiscordActivityStatus: boolean,
  ) => void;
  addPreset: (presetName: string, preset: FilterPreset) => void;
  removePreset: (presetName: string) => void;
  // Rebuild the presets map in the given key order (presets render in
  // insertion order). Names not listed are appended, keeping them safe.
  reorderPresets: (orderedNames: string[]) => void;
  // Replace icon sizes and/or per-filter audio alerts wholesale (used when
  // applying a preset, so unset entries revert to defaults instead of
  // lingering). Only the provided categories are touched.
  applyPresetSettings: (settings: {
    iconSizes?: {
      baseIconSize: number;
      iconSizeByGroup: Record<string, number>;
      iconSizeByFilter: Record<string, number>;
    };
    audioAlertByFilter?: Record<string, boolean>;
  }) => void;
  setTempPrivateNode: (
    tempPrivateNode: (Partial<PrivateNode> & { filter?: string }) | null,
  ) => void;
  pushRecentPrivateNodeStyle: (style: PrivateNodeStyle) => void;
  setTempPrivateDrawing: (
    tempPrivateDrawing: (Partial<Drawing> & { name?: string }) | null,
  ) => void;
  setDrawingColor: (drawingColor: string) => void;
  setDrawingFillColor: (drawingFillColor: string) => void;
  setDrawingSize: (drawingSize: number) => void;
  setTextColor: (textColor: string) => void;
  setTextSize: (textSize: number) => void;
  setBaseIconSize: (baseIconSize: number) => void;
  toggleDynamicIconSize: () => void;
  setDynamicIconSizeFactor: (factor: number) => void;
  setPlayerIconSize: (playerIconSize: number) => void;
  setIconSizeByGroup: (group: string, size: number) => void;
  setIconSizeByFilter: (id: string, size: number) => void;
  toggleFitBoundsOnChange: () => void;
  setMyFilters: (myFilters: DrawingsAndNodes[]) => void;
  setMyFilter: (name: string, myFilter: Partial<DrawingsAndNodes>) => void;
  addMyFilter: (myFilter: DrawingsAndNodes) => void;
  removeMyFilter: (myFilterName: string) => void;
  removeMyNode: (nodeId: string) => void;
  /**
   * Replace this game's filters in local state with the server's view.
   * Local filters without an `id` (anonymous / not yet synced) are
   * preserved. Called on signed-in mount per game tenant.
   */
  hydrateFiltersFromServer: (game: string) => Promise<void>;
  toggleShowGrid: () => void;
  toggleShowFilters: () => void;
  // Peer Link / Mesh settings
  setPeerCode: (code: string) => void;
  setLastMeSenderId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setPlayerColor: (color: string) => void;
  setShowPeerLabels: (show: boolean) => void;
  setAutoJoinPeer: (autoJoin: boolean) => void;
  setAutoLiveModeWithMe: (autoLiveMode: boolean) => void;
}

export type Profile = {
  id: string;
  name: string;
  settings: ProfileSettings;
  createdAt: number;
  updatedAt: number;
};

class ProfileManager {
  static createProfileId() {
    return `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDefaultProfile(): Profile {
    const defaultProfile = {
      id: DEFAULT_PROFILE.id,
      name: DEFAULT_PROFILE.name,
      settings: JSON.parse(JSON.stringify(DEFAULT_PROFILE_SETTINGS)),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return defaultProfile;
  }

  static createProfile(name: string): Profile {
    const newProfile = {
      id: this.createProfileId(),
      name,
      settings: JSON.parse(JSON.stringify(DEFAULT_PROFILE_SETTINGS)),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return newProfile;
  }

  static duplicateProfile(profile: Profile, name: string): Profile {
    // Deep clone the profile object
    const newProfile: Profile = JSON.parse(JSON.stringify(profile));
    newProfile.name = name;
    newProfile.id = this.createProfileId();
    newProfile.createdAt = Date.now();
    newProfile.updatedAt = Date.now();
    return newProfile;
  }
}

// SettingsStore now has flattened ProfileSettings at root level
export interface SettingsStore extends ProfileSettings, ProfileActions {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // Profile Management (only profiles array and currentProfileId are persisted)
  profiles: Profile[];
  currentProfileId: string;
  createProfile: (name: string) => void;
  switchProfile: (profileId: string) => void;
  renameProfile: (profileId: string, newName: string) => void;
  deleteProfile: (profileId: string) => void;
  exportProfile: (profileId: string) => Profile | null;
  importProfile: (profile: Profile) => void;
  duplicateProfile: (profileId: string, name: string) => void;
}

const getStorageName = () => {
  if (typeof window !== "undefined") {
    if (window.location.pathname.startsWith("/apps/")) {
      const appId = window.location.pathname.split("/")[2];
      return `thgl-settings-${appId}`;
    }
  }
  return "settings-storage";
};

const SYNC_DEBOUNCE_MS = 1000;
const syncTimers = new Map<string, ReturnType<typeof setTimeout>>();

function isSignedIn(): boolean {
  return !!useAccountStore.getState().decryptedUserId;
}

/**
 * Schedule a debounced PUT for a filter that already has a server `id`.
 * Coalesces rapid edits (drawing nodes, dragging shapes) into one
 * round-trip per second per filter. Anonymous users (no server id) are
 * no-ops — filters stay local.
 */
function scheduleFilterSync(filter: DrawingsAndNodes) {
  if (!filter.id) return;
  if (!isSignedIn()) return;
  const id = filter.id;
  const existing = syncTimers.get(id);
  if (existing) clearTimeout(existing);
  syncTimers.set(
    id,
    setTimeout(() => {
      syncTimers.delete(id);
      const game = filter.game ?? getCurrentGameId();
      if (!game) {
        console.error("[filter sync] no game id, skipping put", id);
        return;
      }
      void apiPutFilter(id, {
        game,
        name: filter.name,
        payload: { nodes: filter.nodes, drawing: filter.drawing },
        visibility: filter.visibility ?? "private",
      }).catch((err) => {
        // Account switched on this device (or somehow we have a stale
        // server id we don't own). Strip the local id so the filter
        // visibly drops back to local-only and the user can choose
        // to re-save it under their current account.
        if (err instanceof FiltersApiError && err.status === 403) {
          const state = useSettingsStore.getState();
          const updatedFilters = state.myFilters.map((f) =>
            f.id === id
              ? {
                  ...f,
                  id: undefined,
                  visibility: undefined,
                  shareCode: undefined,
                  voteCount: undefined,
                  commentCount: undefined,
                }
              : f,
          );
          state.setMyFilters(updatedFilters);
          console.warn(
            `[filter sync] ${id} owned by another account; demoting to local-only`,
          );
          return;
        }
        console.error("[filter sync] put failed", id, err);
      });
    }, SYNC_DEBOUNCE_MS),
  );
}

/** Immediate (non-debounced) server delete. Anonymous = no-op. */
function fireFilterDelete(id: string) {
  if (!isSignedIn()) return;
  // Cancel any pending PUT for this id so we don't race the delete.
  const existing = syncTimers.get(id);
  if (existing) {
    clearTimeout(existing);
    syncTimers.delete(id);
  }
  void apiDeleteFilter(id).catch((err) => {
    // 404 means it was never on the server (anonymous-created local-only
    // filter, never synced). That's not an error.
    if (err && typeof err === "object" && "status" in err && err.status === 404)
      return;
    console.error("[filter sync] delete failed", id, err);
  });
}

// Cache for isDiscoveredNode results - invalidated when discoveredNodes changes
let discoveredCache: Map<string, boolean> | null = null;
let discoveryLookup: ReturnType<typeof buildDiscoveryLookup> | null = null;
let cachedDiscoveredNodes: string[] | null = null;
// Parallel cache for isAutoDiscoveredNode (auto-discovered-from-memory subset).
let autoDiscoveredCache: Map<string, boolean> | null = null;
let autoDiscoveryLookup: ReturnType<typeof buildDiscoveryLookup> | null = null;
let cachedAutoDiscoveredNodes: string[] | null = null;

export const useSettingsStore = create(
  subscribeWithSelector(
    persist<SettingsStore>(
      (set, get) => {
        // Helper to update both flat state and profiles array
        const updateSettings = (settings: Partial<ProfileSettings>) => {
          const state = get();
          const updatedProfiles = state.profiles.map((p) =>
            p.id === state.currentProfileId
              ? {
                  ...p,
                  settings: { ...p.settings, ...settings },
                  updatedAt: Date.now(),
                }
              : p,
          );

          set({
            ...settings,
            profiles: updatedProfiles,
          });
        };

        return {
          _hasHydrated: false,
          setHasHydrated: (state) => {
            set({
              _hasHydrated: state,
            });
          },

          // Profile Management
          currentProfileId: DEFAULT_PROFILE.id,
          profiles: [ProfileManager.getDefaultProfile()],

          createProfile: (name: string) => {
            const state = get();
            const newProfile = ProfileManager.createProfile(name);
            set({
              profiles: [...state.profiles, newProfile],
              currentProfileId: newProfile.id,
              ...newProfile.settings, // Flatten new profile settings to root
            });
          },

          switchProfile: (profileId: string) => {
            const state = get();
            const profile = state.profiles.find((p) => p.id === profileId);
            if (!profile) return;

            set({
              currentProfileId: profileId,
              ...profile.settings, // Flatten switched profile settings to root
            });
          },

          renameProfile: (profileId: string, newName: string) => {
            set((state) => ({
              profiles: state.profiles.map((p) =>
                p.id === profileId
                  ? { ...p, name: newName, updatedAt: Date.now() }
                  : p,
              ),
            }));
          },

          deleteProfile: (profileId: string) => {
            const state = get();
            if (state.profiles.length <= 1) return; // Don't delete the last profile

            const newProfiles = state.profiles.filter(
              (p) => p.id !== profileId,
            );
            const newCurrentProfileId =
              state.currentProfileId === profileId
                ? newProfiles[0].id
                : state.currentProfileId;

            // If we're switching to a different profile, load its settings
            if (newCurrentProfileId !== state.currentProfileId) {
              const newProfile = newProfiles.find(
                (p) => p.id === newCurrentProfileId,
              );
              if (newProfile) {
                set({
                  profiles: newProfiles,
                  currentProfileId: newCurrentProfileId,
                  ...newProfile.settings, // Flatten settings to root
                });
                return;
              }
            }

            set({
              profiles: newProfiles,
              currentProfileId: newCurrentProfileId,
            });
          },

          exportProfile: (profileId: string) => {
            const state = get();
            const profile = state.profiles.find((p) => p.id === profileId);
            if (!profile) return null;

            // If exporting the current profile, sync flat state into the
            // profile to guard against any desync between root and array.
            if (profileId === state.currentProfileId) {
              const synced: Partial<ProfileSettings> = {};
              for (const key of Object.keys(DEFAULT_PROFILE_SETTINGS)) {
                if (key in state) {
                  (synced as any)[key] = (state as any)[key];
                }
              }
              return {
                ...profile,
                settings: { ...profile.settings, ...synced },
              };
            }

            return profile;
          },

          importProfile: (profile: Profile) => {
            const state = get();
            // Check if profile with same ID already exists
            const exists = state.profiles.some((p) => p.id === profile.id);
            if (exists) {
              // Generate new ID
              profile.id = ProfileManager.createProfileId();
            }
            set({
              profiles: [...state.profiles, profile],
              currentProfileId: profile.id,
              ...profile.settings, // Flatten imported profile settings to root
            });
          },

          duplicateProfile: (profileId: string, name: string) => {
            const state = get();
            const profile = state.profiles.find((p) => p.id === profileId);
            if (!profile) return;

            const newProfile = ProfileManager.duplicateProfile(profile, name);

            set({
              profiles: [...state.profiles, newProfile],
              currentProfileId: newProfile.id,
              ...newProfile.settings, // Flatten new profile settings to root
            });
          },

          // Flattened ProfileSettings (initial values from DEFAULT_PROFILE_SETTINGS)
          ...DEFAULT_PROFILE_SETTINGS,

          // Actions for updating settings (update both flat state and profiles array)
          setHotkey: (key, value) => {
            const state = get();
            updateSettings({
              hotkeys: { ...state.hotkeys, [key]: value },
            });
          },

          setHotkeys: (hotkeys) => {
            updateSettings({ hotkeys });
          },

          setGroupName: (groupName) => {
            updateSettings({ groupName });
          },

          setLiveMode: (liveMode) => {
            updateSettings({ liveMode });
          },

          cycleLiveMode: () => {
            const state = get();
            updateSettings({
              liveMode: nextLiveMode(state.liveMode),
            });
          },

          setOverlayMode: (overlayMode) => {
            updateSettings({ overlayMode });
          },

          toggleOverlayFullscreen: () => {
            const state = get();
            updateSettings({
              overlayFullscreen: !state.overlayFullscreen,
            });
          },

          toggleLockedWindow: () => {
            const state = get();
            updateSettings({
              lockedWindow: !state.lockedWindow,
            });
          },

          setColorBlindMode: (mode) => {
            updateSettings({ colorBlindMode: mode });
          },

          setColorBlindSeverity: (severity: number) => {
            updateSettings({
              colorBlindSeverity: Math.max(0, Math.min(1, severity)),
            });
          },

          toggleHighContrastMode: () => {
            const state = get();
            updateSettings({
              highContrastMode: !state.highContrastMode,
            });
          },

          setHighContrastColor: (color: string) => {
            updateSettings({ highContrastColor: color });
          },

          setHighContrastThickness: (thickness: number) => {
            updateSettings({
              highContrastThickness: Math.max(1, Math.min(6, thickness)),
            });
          },

          setTransform: (id: string, transform: string) => {
            const state = get();
            updateSettings({
              transforms: {
                ...state.transforms,
                [id]: transform,
              },
            });
          },

          setMapTransform: (mapTransform) => {
            updateSettings({ mapTransform });
          },

          setMapFilter: (mapFilter) => {
            updateSettings({ mapFilter });
          },

          setWindowOpacity: (windowOpacity) => {
            updateSettings({ windowOpacity });
          },

          resetTransform: () => {
            updateSettings({
              transforms: {},
              mapTransform: null,
              playerIconSize: 1,
              baseIconSize: 1,
              dynamicIconSize: true,
              dynamicIconSizeFactor: 0.2,
              iconSizeByFilter: {},
              iconSizeByGroup: {},
            });
          },

          resetInterface: () => {
            updateSettings({
              // Icon sizes & transforms
              transforms: {},
              mapTransform: null,
              playerIconSize: 1,
              baseIconSize: 1,
              dynamicIconSize: true,
              dynamicIconSizeFactor: 0.2,
              iconSizeByFilter: {},
              iconSizeByGroup: {},
              // Accessibility
              colorBlindMode: "none",
              colorBlindSeverity: 1,
              highContrastMode: false,
              highContrastColor: "#FFFFFFCC",
              highContrastThickness: 2,
              // Trace line
              showTraceLine: true,
              followPlayer: true,
              traceLineLength: 100,
              traceLineRate: 5,
              traceLineColor: "#1ccdd1B3",
              traceLineStyle: "dots",
              // Audio alerts
              audioAlertsMuted: false,
              audioAlertNotifications: false,
              audioAlertRange: 5000,
              audioAlertSound: "chime",
              audioAlertVolume: 0.5,
              showAudioAlertRange: false,
              audioAlertByFilter: {},
              // Labels
              labelModeByFilter: {},
              liveModeByFilter: {},
              discoverModeByFilter: {},
              labelTextSize: 1,
              // Map behavior
              fitBoundsOnChange: false,
            });
          },

          isDiscoveredNode: (nodeId) => {
            const state = get();
            const discoveredNodes = state.discoveredNodes;

            // Invalidate cache and rebuild the shared lookup if discoveredNodes
            // changed. Matching (exact / base-id / coordinate-with-tolerance)
            // lives in coordinates.ts so this selector, the marker render path,
            // and the discover/undiscover writes all agree.
            if (cachedDiscoveredNodes !== discoveredNodes) {
              cachedDiscoveredNodes = discoveredNodes;
              discoveredCache = new Map();
              discoveryLookup = buildDiscoveryLookup(discoveredNodes);
            }

            // Return cached result if available
            const cached = discoveredCache!.get(nodeId);
            if (cached !== undefined) {
              return cached;
            }

            const result = checkNodeDiscovered(nodeId, discoveryLookup!);
            discoveredCache!.set(nodeId, result);
            return result;
          },

          isAutoDiscoveredNode: (nodeId) => {
            const state = get();
            const autoDiscoveredNodes = state.autoDiscoveredNodes;
            if (autoDiscoveredNodes.length === 0) return false;
            if (cachedAutoDiscoveredNodes !== autoDiscoveredNodes) {
              cachedAutoDiscoveredNodes = autoDiscoveredNodes;
              autoDiscoveredCache = new Map();
              autoDiscoveryLookup = buildDiscoveryLookup(autoDiscoveredNodes);
            }
            const cached = autoDiscoveredCache!.get(nodeId);
            if (cached !== undefined) return cached;
            const result = checkNodeDiscovered(nodeId, autoDiscoveryLookup!);
            autoDiscoveredCache!.set(nodeId, result);
            return result;
          },

          toggleDiscoveredNode: (nodeId: string) => {
            const state = get();
            const discoveredNodes = state.discoveredNodes;
            const isDiscovered = state.isDiscoveredNode(nodeId);

            // Parse nodeId once for coordinate matching
            const nodeCoords = nodeId.includes("@")
              ? nodeId.slice(nodeId.indexOf("@") + 1)
              : null;

            const updatedNodes = isDiscovered
              ? discoveredNodes.filter((id) => {
                  // Exact match
                  if (id === nodeId) {
                    return false;
                  }
                  // Base ID match (type without coordinates)
                  if (nodeId.includes("@") && nodeId.split("@")[0] === id) {
                    return false;
                  }
                  // Coordinate match (backward compat + tolerance) so
                  // undiscovering matches a node stored at a slightly different
                  // float (live memory read vs static extracted coords).
                  if (nodeCoords && id.includes("@")) {
                    const idCoords = id.slice(id.indexOf("@") + 1);
                    if (coordsMatch(idCoords, nodeCoords)) {
                      return false;
                    }
                  }
                  return true;
                })
              : [...new Set([...discoveredNodes, nodeId])];

            updateSettings({ discoveredNodes: updatedNodes });
          },

          setDiscoverNode: (nodeId, discovered) => {
            const state = get();

            // Parse nodeId once for coordinate matching
            const nodeCoords = nodeId.includes("@")
              ? nodeId.slice(nodeId.indexOf("@") + 1)
              : null;

            updateSettings({
              discoveredNodes: discovered
                ? [...new Set([...state.discoveredNodes, nodeId])]
                : state.discoveredNodes.filter((id) => {
                    // Exact match
                    if (id === nodeId) {
                      return false;
                    }
                    // Base ID match (type without coordinates)
                    if (nodeId.includes("@") && nodeId.split("@")[0] === id) {
                      return false;
                    }
                    // Coordinate match (backward compat + tolerance) so
                    // undiscovering matches a node stored at a slightly
                    // different float (live memory read vs static coords).
                    if (nodeCoords && id.includes("@")) {
                      const idCoords = id.slice(id.indexOf("@") + 1);
                      if (coordsMatch(idCoords, nodeCoords)) {
                        return false;
                      }
                    }
                    return true;
                  }),
            });
          },

          toggleHideDiscoveredNodes: () => {
            const state = get();
            updateSettings({
              hideDiscoveredNodes: !state.hideDiscoveredNodes,
            });
          },

          setDiscoveredNodes: (discoveredNodes: string[]) => {
            updateSettings({ discoveredNodes });
          },

          markAutoDiscovered: (nodeIds: string[]) => {
            const state = get();
            updateSettings({
              discoveredNodes: [
                ...new Set([...state.discoveredNodes, ...nodeIds]),
              ],
              autoDiscoveredNodes: [
                ...new Set([...state.autoDiscoveredNodes, ...nodeIds]),
              ],
            });
          },

          setAutoDiscoverCollected: (enabled: boolean) => {
            const state = get();
            if (enabled) {
              updateSettings({ autoDiscoverCollected: true });
              return;
            }
            // Opting out un-discovers exactly what auto-discovery added (tracked in
            // autoDiscoveredNodes) so those nodes reappear, and clears the tag set.
            // Manually-discovered nodes are untouched.
            const auto = new Set(state.autoDiscoveredNodes);
            updateSettings({
              autoDiscoverCollected: false,
              discoveredNodes: state.discoveredNodes.filter(
                (id) => !auto.has(id),
              ),
              autoDiscoveredNodes: [],
            });
          },

          setActorsPollingRate: (actorsPollingRate: number) => {
            updateSettings({ actorsPollingRate });
          },

          toggleShowTraceLine: () => {
            const state = get();
            updateSettings({
              showTraceLine: !state.showTraceLine,
            });
          },

          toggleFollowPlayer: () => {
            const state = get();
            updateSettings({
              followPlayer: !state.followPlayer,
            });
          },

          setTraceLineLength: (traceLineLength: number) => {
            updateSettings({ traceLineLength });
          },

          setTraceLineRate: (traceLineRate: number) => {
            updateSettings({ traceLineRate });
          },

          setTraceLineColor: (traceLineColor: string) => {
            updateSettings({ traceLineColor });
          },

          setTraceLineStyle: (traceLineStyle: "dots" | "line") => {
            updateSettings({ traceLineStyle });
          },

          toggleAudioAlertsMuted: () => {
            const state = get();
            updateSettings({ audioAlertsMuted: !state.audioAlertsMuted });
          },

          toggleAudioAlertNotifications: () => {
            const state = get();
            updateSettings({
              audioAlertNotifications: !state.audioAlertNotifications,
            });
          },

          setAudioAlertRange: (range: number) => {
            updateSettings({ audioAlertRange: range });
          },

          setAudioAlertSound: (sound) => {
            updateSettings({ audioAlertSound: sound });
          },

          setAudioAlertVolume: (volume: number) => {
            updateSettings({
              audioAlertVolume: Math.max(0, Math.min(1, volume)),
            });
          },

          toggleShowAudioAlertRange: () => {
            const state = get();
            updateSettings({ showAudioAlertRange: !state.showAudioAlertRange });
          },

          toggleAudioAlertByFilter: (filterId: string) => {
            const state = get();
            const current = state.audioAlertByFilter[filterId] ?? false;
            updateSettings({
              audioAlertByFilter: {
                ...state.audioAlertByFilter,
                [filterId]: !current,
              },
            });
          },

          setAudioAlertByFilters: (filterIds: string[], enabled: boolean) => {
            const state = get();
            const updates = filterIds.reduce(
              (acc, id) => {
                acc[id] = enabled;
                return acc;
              },
              {} as Record<string, boolean>,
            );
            updateSettings({
              audioAlertByFilter: { ...state.audioAlertByFilter, ...updates },
            });
          },

          resetAudioAlerts: () => {
            // Clear every per-filter audio alert back to off. Distinct from the
            // global mute (audioAlertsMuted), which only silences without
            // changing the per-filter toggles.
            updateSettings({ audioAlertByFilter: {} });
          },

          setDiscoverModeByFilter: (filterId, mode) => {
            const state = get();
            const next = { ...state.discoverModeByFilter };
            if (mode === "default") {
              delete next[filterId];
            } else {
              next[filterId] = mode;
            }
            updateSettings({ discoverModeByFilter: next });
          },

          setDiscoverModeByFilters: (filterIds, mode) => {
            const state = get();
            const next = { ...state.discoverModeByFilter };
            for (const id of filterIds) {
              if (mode === "default") {
                delete next[id];
              } else {
                next[id] = mode;
              }
            }
            updateSettings({ discoverModeByFilter: next });
          },

          setLabelModeByFilter: (filterId: string, mode: LabelMode) => {
            const state = get();
            updateSettings({
              labelModeByFilter: {
                ...state.labelModeByFilter,
                [filterId]: mode,
              },
            });
          },

          setLabelModeByFilters: (filterIds: string[], mode: LabelMode) => {
            const state = get();
            const updates = filterIds.reduce(
              (acc, id) => {
                acc[id] = mode;
                return acc;
              },
              {} as Record<string, LabelMode>,
            );
            updateSettings({
              labelModeByFilter: { ...state.labelModeByFilter, ...updates },
            });
          },

          setLiveModeByFilter: (filterId, mode) => {
            const state = get();
            const next = { ...state.liveModeByFilter };
            if (mode === "default") {
              delete next[filterId];
            } else {
              next[filterId] = mode;
            }
            updateSettings({ liveModeByFilter: next });
          },

          setLiveModeByFilters: (filterIds, mode) => {
            const state = get();
            const next = { ...state.liveModeByFilter };
            for (const id of filterIds) {
              if (mode === "default") {
                delete next[id];
              } else {
                next[id] = mode;
              }
            }
            updateSettings({ liveModeByFilter: next });
          },

          setLabelTextSize: (size: number) => {
            updateSettings({ labelTextSize: size });
          },

          setShowLabelsHotkey: (key: string) => {
            updateSettings({ showLabelsHotkey: key });
          },

          setDisplayDiscordActivityStatus: (
            displayDiscordActivityStatus: boolean,
          ) => {
            updateSettings({ displayDiscordActivityStatus });
          },

          addPreset: (presetName: string, preset: FilterPreset) => {
            const state = get();
            updateSettings({
              presets: {
                ...state.presets,
                [presetName]: preset,
              },
            });
          },

          removePreset: (presetName: string) => {
            const state = get();
            const newPresets = { ...state.presets };
            delete newPresets[presetName];
            updateSettings({ presets: newPresets });
          },

          reorderPresets: (orderedNames: string[]) => {
            const state = get();
            const next: Record<string, string[] | FilterPreset> = {};
            for (const name of orderedNames) {
              if (name in state.presets) next[name] = state.presets[name];
            }
            // Keep any preset not in the list (defensive) at the end.
            for (const name of Object.keys(state.presets)) {
              if (!(name in next)) next[name] = state.presets[name];
            }
            updateSettings({ presets: next });
          },

          applyPresetSettings: (settings) => {
            const update: Partial<ProfileSettings> = {};
            if (settings.iconSizes) {
              update.baseIconSize = settings.iconSizes.baseIconSize;
              update.iconSizeByGroup = settings.iconSizes.iconSizeByGroup;
              update.iconSizeByFilter = settings.iconSizes.iconSizeByFilter;
            }
            if (settings.audioAlertByFilter) {
              update.audioAlertByFilter = settings.audioAlertByFilter;
            }
            updateSettings(update);
          },

          setTempPrivateNode: (tempPrivateNode) => {
            const state = get();
            updateSettings({
              tempPrivateNode: tempPrivateNode
                ? {
                    ...(state.tempPrivateNode ?? {}),
                    ...tempPrivateNode,
                  }
                : null,
            });
          },

          pushRecentPrivateNodeStyle: (style) => {
            const state = get();
            const signature = (s: PrivateNodeStyle) =>
              JSON.stringify({
                filter: s.filter ?? "",
                name: s.name ?? "",
                description: s.description ?? "",
                color: s.color ?? "",
                icon: s.icon ?? null,
                radius: s.radius,
              });
            const sig = signature(style);
            // Move an identical style to the front instead of duplicating it.
            const deduped = (state.recentPrivateNodeStyles ?? []).filter(
              (s) => signature(s) !== sig,
            );
            updateSettings({
              recentPrivateNodeStyles: [style, ...deduped].slice(
                0,
                MAX_RECENT_PRIVATE_NODE_STYLES,
              ),
            });
          },

          setTempPrivateDrawing: (tempPrivateDrawing) => {
            const state = get();
            updateSettings({
              tempPrivateDrawing: tempPrivateDrawing
                ? {
                    ...(state.tempPrivateDrawing ?? {}),
                    ...tempPrivateDrawing,
                  }
                : null,
            });
          },

          setDrawingColor: (drawingColor) => {
            updateSettings({ drawingColor });
          },

          setDrawingFillColor: (drawingFillColor) => {
            updateSettings({ drawingFillColor });
          },

          setDrawingSize: (drawingSize) => {
            updateSettings({ drawingSize });
          },

          setTextColor: (textColor) => {
            updateSettings({ textColor });
          },

          setTextSize: (textSize) => {
            updateSettings({ textSize });
          },

          setBaseIconSize: (baseIconSize) => {
            updateSettings({ baseIconSize });
          },

          toggleDynamicIconSize: () => {
            updateSettings({ dynamicIconSize: !get().dynamicIconSize });
          },

          setDynamicIconSizeFactor: (dynamicIconSizeFactor) => {
            updateSettings({
              dynamicIconSizeFactor: Math.max(
                0,
                Math.min(1, dynamicIconSizeFactor),
              ),
            });
          },

          setPlayerIconSize: (playerIconSize) => {
            updateSettings({ playerIconSize });
          },

          setIconSizeByGroup: (group, size) => {
            const state = get();
            updateSettings({
              iconSizeByGroup: {
                ...state.iconSizeByGroup,
                [group]: size,
              },
            });
          },

          setIconSizeByFilter: (id, size) => {
            const state = get();
            updateSettings({
              iconSizeByFilter: {
                ...state.iconSizeByFilter,
                [id]: size,
              },
            });
          },

          toggleFitBoundsOnChange: () => {
            const state = get();
            updateSettings({
              fitBoundsOnChange: !state.fitBoundsOnChange,
            });
          },

          setMyFilters: (myFilters) => {
            updateSettings({ myFilters });
          },

          setMyFilter: (name, myFilter) => {
            const state = get();
            const updatedFilters = state.myFilters.map((filter) =>
              filter.name === name ? { ...filter, ...myFilter } : filter,
            );
            updateSettings({ myFilters: updatedFilters });
            const updatedFilter = updatedFilters.find((f) => f.name === name);
            if (updatedFilter) scheduleFilterSync(updatedFilter);
          },

          addMyFilter: async (myFilter) => {
            // For signed-in users without a server id yet, assign one
            // locally so subsequent edits can sync. The first PUT will
            // create the row server-side via the upsert.
            if (isSignedIn() && !myFilter.id) {
              myFilter = { ...myFilter, id: crypto.randomUUID() };
            }
            if (isSignedIn() && !myFilter.game) {
              const inferred = getCurrentGameId();
              if (inferred) myFilter = { ...myFilter, game: inferred };
            }

            const state = get();
            // Dedupe by server id when available (importing a public
            // filter twice = no-op).
            if (
              myFilter.id &&
              state.myFilters.some((f) => f.id === myFilter.id)
            ) {
              return;
            }

            updateSettings({
              myFilters: [...state.myFilters, myFilter],
            });
            scheduleFilterSync(myFilter);
          },

          removeMyFilter: (myFilterName: string) => {
            const state = get();
            const target = state.myFilters.find((f) => f.name === myFilterName);
            const updatedFilters = state.myFilters.filter(
              (filter) => filter.name !== myFilterName,
            );
            updateSettings({ myFilters: updatedFilters });
            if (target?.id) fireFilterDelete(target.id);
          },

          removeMyNode: async (nodeId: string) => {
            const state = get();
            const myFilter = state.myFilters.find((filter) =>
              filter.nodes?.some((node) => node.id === nodeId),
            );
            if (!myFilter) return;
            const updated: DrawingsAndNodes = {
              ...myFilter,
              nodes: myFilter.nodes?.filter((node) => node.id !== nodeId),
            };
            updateSettings({
              myFilters: state.myFilters.map((filter) =>
                filter.name === updated.name ? updated : filter,
              ),
            });
            scheduleFilterSync(updated);
          },

          hydrateFiltersFromServer: async (game: string) => {
            if (!isSignedIn()) return;
            let serverFilters;
            try {
              serverFilters = await apiListFilters(game);
            } catch (err) {
              console.error("[filter hydrate] failed", err);
              return;
            }
            const state = get();
            // Keep local filters that aren't on the server (anonymous /
            // local-only / wrong game) untouched. Replace any that have a
            // server `id` with the server's view.
            const serverById = new Map(
              serverFilters.map((f) => [f.id, serverFilterToLocal(f)]),
            );
            const merged: DrawingsAndNodes[] = [];
            const seenIds = new Set<string>();
            const hasData = (f: DrawingsAndNodes) =>
              (f.nodes?.length ?? 0) > 0 || !!f.drawing;
            for (const local of state.myFilters) {
              if (local.id && serverById.has(local.id)) {
                const server = serverById.get(local.id)!;
                // Guard against destroying local markers/drawings that never
                // finished uploading (e.g. an edit made just before reload, or
                // data from before node edits were synced): if the server copy
                // is empty but the local one has content, keep local and push
                // it back up so the two converge. Trade-off: a filter genuinely
                // emptied on another device won't clear here, but preserving
                // the user's data is preferable to silently losing it.
                if (hasData(local) && !hasData(server)) {
                  merged.push(local);
                  scheduleFilterSync(local);
                } else {
                  merged.push(server);
                }
                seenIds.add(local.id);
              } else {
                merged.push(local);
              }
            }
            // Append server-only filters (created on another device).
            for (const [id, filter] of serverById) {
              if (!seenIds.has(id)) merged.push(filter);
            }
            updateSettings({ myFilters: merged });
          },

          toggleShowGrid: () => {
            const state = get();
            updateSettings({
              showGrid: !state.showGrid,
            });
          },

          toggleShowFilters: () => {
            const state = get();
            updateSettings({
              showFilters: !state.showFilters,
            });
          },

          // Peer Link / Mesh settings
          setPeerCode: (code: string) => {
            updateSettings({ peerCode: code });
          },

          setLastMeSenderId: (id: string) => {
            updateSettings({ lastMeSenderId: id });
          },

          setPlayerName: (name: string) => {
            updateSettings({ playerName: name });
          },

          setPlayerColor: (color: string) => {
            updateSettings({ playerColor: color });
          },

          setShowPeerLabels: (show: boolean) => {
            updateSettings({ showPeerLabels: show });
          },

          setAutoJoinPeer: (autoJoin: boolean) => {
            updateSettings({ autoJoinPeer: autoJoin });
          },

          setAutoLiveModeWithMe: (autoLiveMode: boolean) => {
            updateSettings({ autoLiveModeWithMe: autoLiveMode });
          },
        };
      },
      {
        name: getStorageName(),
        // Only persist profiles array and currentProfileId (not flattened settings)
        partialize: (state) =>
          ({
            profiles: state.profiles,
            currentProfileId: state.currentProfileId,
          }) as SettingsStore,
        merge: (persistedState, currentState) => {
          // Merge persisted profiles and currentProfileId with current state
          const merged = {
            ...currentState,
            ...(persistedState as any),
          };

          // Flatten current profile settings to root level during merge
          if (merged.profiles?.length) {
            const currentProfile = merged.profiles.find(
              (p: Profile) => p.id === merged.currentProfileId,
            );
            if (currentProfile) {
              Object.assign(merged, currentProfile.settings);
            }
          }

          return merged;
        },
        onRehydrateStorage: () => (state) => {
          if (!state) return;

          if (!state._hasHydrated) {
            state.setHasHydrated(true);
          }
        },
        version: 5,
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

          if (version < 4) {
            // Initialize profiles from existing settings
            const state = persistedState as any;

            // Create or update the default profile with existing settings
            let defaultProfile: Profile;
            let isNewProfile = false;

            if (!state.profiles?.length) {
              // No profiles exist - create new one
              defaultProfile = ProfileManager.getDefaultProfile();
              isNewProfile = true;
            } else {
              // Profiles exist - use the current one or first one
              const currentProfileId =
                state.currentProfileId || state.profiles[0]?.id;
              defaultProfile =
                state.profiles.find(
                  (p: Profile) => p.id === currentProfileId,
                ) || state.profiles[0];
            }

            // Preserve existing settings from version 3 root level
            Object.keys(DEFAULT_PROFILE_SETTINGS).forEach((key) => {
              if (key in state && state[key] !== undefined) {
                // @ts-ignore
                defaultProfile.settings[key] = state[key];
              }
            });

            if (isNewProfile) {
              state.profiles = [defaultProfile];
              state.currentProfileId = defaultProfile.id;
            } else {
              // Update the existing profile in the array
              state.profiles = state.profiles.map((p: Profile) =>
                p.id === defaultProfile.id ? defaultProfile : p,
              );
              state.currentProfileId = defaultProfile.id;
            }
          }

          if (version < 5) {
            // liveMode boolean → tri-state: true→'combined', false→'static'
            const state = persistedState as any;
            const convert = (v: unknown): LiveMode =>
              typeof v === "string"
                ? (v as LiveMode)
                : v
                  ? "combined"
                  : "static";
            if ("liveMode" in state) {
              state.liveMode = convert(state.liveMode);
            }
            if (Array.isArray(state.profiles)) {
              state.profiles = state.profiles.map((p: Profile) => ({
                ...p,
                settings: {
                  ...p.settings,
                  liveMode: convert(p.settings?.liveMode),
                },
              }));
            }
          }

          return persistedState;
        },
      },
    ),
  ),
);

withStorageDOMEvents(useSettingsStore);
