import { useAccountStore } from "../account";
import { fetchVersion, type FiltersConfig } from "../config";
import { games, getAppIdFromPathname } from "../games";
import {
  DEFAULT_PROFILE_SETTINGS,
  getEffectiveLiveMode,
  resolveLiveModeForType,
  type LiveMode,
} from "../settings";
import { useLiveState } from "./states";

/**
 * The map/webview side of a debug snapshot: what the reporter's map is set to
 * show. The detector side (emitted actors, types) is in the snapshot already;
 * without this a "live markers are invisible" report could not tell a detector
 * bug from Predicted mode, a per-filter override or an unticked filter
 * (data-forge inbox #898: amber actors emitted, but the map side was unknown).
 */
export type MapDebugState = {
  appId: string;
  /** Which webview sent the snapshot: the game's map window or the dashboard. */
  sentFrom: "map" | "dashboard";
  mapName: string | null;
  /** Stored global live mode, and what it resolves to for this account. */
  liveMode: LiveMode;
  effectiveLiveMode: LiveMode;
  previewAccess: boolean;
  autoLiveModeWithMe: boolean;
  liveModeByFilter: Record<string, LiveMode>;
  hideOverlayByMap: Record<string, boolean>;
  hideOverlayWithoutMap: boolean;
  activeFilterCount: number;
  /** Filters the live reader can track (types_id_map targets): how many are on. */
  trackedFilterCount: number;
  trackedActiveCount: number;
  /**
   * Live-only filters (no_map_markers: they only ever show as live actors).
   * `mode` is the resolved live mode for the type: "static" = never visible.
   */
  liveOnlyFilters: Array<{
    id: string;
    group: string;
    on: boolean;
    mode: LiveMode;
  }>;
  dataVersion: string | null;
  /** Set when part of the state could not be read (no storage, fetch failed). */
  error?: string;
};

type StoredSettings = Partial<typeof DEFAULT_PROFILE_SETTINGS>;
type StoredUserState = { mapName?: string; filters?: string[] };

export function summarizeMapDebugState({
  appId,
  sentFrom,
  settings,
  user,
  filters,
  typesIdMap,
  previewAccess,
  dataVersion,
}: {
  appId: string;
  sentFrom: MapDebugState["sentFrom"];
  settings: StoredSettings;
  user: StoredUserState;
  filters: FiltersConfig;
  typesIdMap: Record<string, string>;
  previewAccess: boolean;
  dataVersion: string | null;
}): MapDebugState {
  const liveMode = settings.liveMode ?? DEFAULT_PROFILE_SETTINGS.liveMode;
  const liveModeByFilter =
    settings.liveModeByFilter ?? DEFAULT_PROFILE_SETTINGS.liveModeByFilter;
  const effectiveLiveMode = getEffectiveLiveMode(liveMode, previewAccess);
  const active = new Set(user.filters ?? []);
  const tracked = new Set(Object.values(typesIdMap));
  let trackedActiveCount = 0;
  for (const id of tracked) if (active.has(id)) trackedActiveCount++;

  const liveOnlyFilters: MapDebugState["liveOnlyFilters"] = [];
  for (const filter of filters) {
    for (const value of filter.values) {
      if (!value.no_map_markers) continue;
      liveOnlyFilters.push({
        id: value.id,
        group: filter.group,
        on: active.has(value.id),
        mode: resolveLiveModeForType(
          value.id,
          effectiveLiveMode,
          liveModeByFilter,
          previewAccess,
        ),
      });
    }
  }

  return {
    appId,
    sentFrom,
    mapName: user.mapName ?? null,
    liveMode,
    effectiveLiveMode,
    previewAccess,
    autoLiveModeWithMe:
      settings.autoLiveModeWithMe ??
      DEFAULT_PROFILE_SETTINGS.autoLiveModeWithMe,
    liveModeByFilter,
    hideOverlayByMap:
      settings.hideOverlayByMap ?? DEFAULT_PROFILE_SETTINGS.hideOverlayByMap,
    hideOverlayWithoutMap:
      settings.hideOverlayWithoutMap ??
      DEFAULT_PROFILE_SETTINGS.hideOverlayWithoutMap,
    activeFilterCount: active.size,
    trackedFilterCount: tracked.size,
    trackedActiveCount,
    liveOnlyFilters,
    dataVersion,
  };
}

function readPersistedState<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  return (JSON.parse(raw) as { state?: T }).state ?? null;
}

/** The dashboard has no app in its path: use the running game's app. */
function getRunningAppId(): string | null {
  for (const running of useLiveState.getState().runningGames ?? []) {
    const game = games.find((g) =>
      g.companion?.games.some((c) =>
        c.processNames.includes(running.processName),
      ),
    );
    if (game) return game.id;
  }
  return null;
}

/**
 * Reads the game's map state from the per-app persisted stores
 * (`thgl-settings-<appId>` / `thgl-coordinates-<appId>`, written on every
 * change), so the dashboard can report the map window's state too: the
 * snapshot button lives in both, and the dashboard's own settings store is the
 * generic one. Never throws - a snapshot must still send without it.
 */
export async function gatherMapDebugState(): Promise<MapDebugState | null> {
  if (typeof window === "undefined") return null;
  const pathAppId = getAppIdFromPathname(window.location.pathname);
  const appId = pathAppId ?? getRunningAppId();
  if (!appId) return null;
  const sentFrom = pathAppId ? "map" : "dashboard";
  const previewAccess = useAccountStore.getState().perks.previewReleaseAccess;
  const errors: string[] = [];

  let settings: StoredSettings = {};
  let user: StoredUserState = {};
  try {
    const stored = readPersistedState<{
      profiles?: Array<{ id: string; settings: StoredSettings }>;
      currentProfileId?: string;
    }>(`thgl-settings-${appId}`);
    const profile =
      stored?.profiles?.find((p) => p.id === stored.currentProfileId) ??
      stored?.profiles?.[0];
    if (profile) settings = profile.settings;
    else errors.push("no stored settings (defaults shown)");
    user =
      readPersistedState<StoredUserState>(`thgl-coordinates-${appId}`) ?? {};
    if (!user.filters) errors.push("no stored filter state");
  } catch (error) {
    errors.push(`storage: ${String(error)}`);
  }

  let filters: FiltersConfig = [];
  let typesIdMap: Record<string, string> = {};
  let dataVersion: string | null = null;
  try {
    const version = await fetchVersion(appId);
    filters = version.data.filters;
    typesIdMap = version.data.typesIdMap ?? {};
    dataVersion = version.id;
  } catch (error) {
    errors.push(`version.json: ${String(error)}`);
  }

  const state = summarizeMapDebugState({
    appId,
    sentFrom,
    settings,
    user,
    filters,
    typesIdMap,
    previewAccess,
    dataVersion,
  });
  if (errors.length) state.error = errors.join("; ");
  return state;
}
