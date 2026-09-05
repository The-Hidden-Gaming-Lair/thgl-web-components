import { useGameState } from "../game";
import type { Actor } from "../overwolf/plugin";
import { useSettingsStore } from "../settings";
import { RunningGame } from "./games";
import { useLiveState, useTHGLAppState } from "./states";
import { getInitialStateFromWebview } from "./version";
import { postWebviewMessage } from "./webview";

export type WindowMode = "overlay" | "desktop" | "both";

export function openDashboadWebView() {
  return postWebviewMessage({
    action: "openDashboardWebView",
    payload: {},
  });
}
export function openOverlayWebView(url: string, title: string) {
  let fullUrl = url;
  if (!fullUrl.startsWith("http")) {
    fullUrl = location.origin + fullUrl;
  }
  return postWebviewMessage({
    action: "openOverlayWebView",
    payload: {
      url: fullUrl,
      title,
    },
  });
}
export function showOverlay() {
  return postWebviewMessage({
    action: "showOverlay",
    payload: {},
  });
}
export function hideOverlay() {
  return postWebviewMessage({
    action: "hideOverlay",
    payload: {},
  });
}
export function updateHotkeys(hotkeys: Record<string, string>) {
  return postWebviewMessage({
    action: "updateHotkeys",
    payload: hotkeys,
  });
}

// Sync current hotkeys from settings store to C++
function syncHotkeysToNative() {
  // Outside of the native Windows THGLApp host (e.g. browser testing/dev), WebView2 IPC is unavailable
  if (typeof window === "undefined" || !window.chrome?.webview) {
    return;
  }
  const hotkeys = useSettingsStore.getState().hotkeys;
  // Filter out empty values but keep the action->combo mapping
  const filteredHotkeys: Record<string, string> = {};
  for (const [action, combo] of Object.entries(hotkeys)) {
    if (combo) {
      filteredHotkeys[action] = combo;
    }
  }
  if (Object.keys(filteredHotkeys).length > 0) {
    console.log("Syncing hotkeys to native:", filteredHotkeys);
    updateHotkeys(filteredHotkeys).catch(console.error);
  }
}

export function updateActorTypeFilters(types: string[], processName?: string) {
  return postWebviewMessage({
    action: "setActorTypeFilter",
    payload: {
      types,
      processName,
    },
  });
}

export function sendDebugSnapshot(userContext: string) {
  return postWebviewMessage({
    action: "sendDebugSnapshot",
    payload: {
      userContext,
    },
  });
}

export function openInBrowser(url: string) {
  return postWebviewMessage({
    action: "openInBrowser",
    payload: {
      url,
    },
  });
}

export function openDesktopWebView(url: string, title: string) {
  let fullUrl = url;
  if (!fullUrl.startsWith("http")) {
    fullUrl = location.origin + fullUrl;
  }
  return postWebviewMessage({
    action: "openDesktopWebView",
    payload: {
      url: fullUrl,
      title,
    },
  });
}

export function openDevTools() {
  window.chrome.webview.postMessage("openDevTools");
}

export function openDevToolsForUrl(url: string) {
  return postWebviewMessage({
    action: "openDevTools",
    payload: { url },
  });
}

export function closeWebViews(urls: string[]) {
  return postWebviewMessage({
    action: "closeWebViews",
    payload: { urls },
  });
}

export function getVersion() {
  return postWebviewMessage<{
    buildDate: string;
    buildTime: string;
    buildVersion: string;
  }>({
    action: "getVersion",
    payload: {},
  });
}

export function getIsTaskInstalled() {
  return postWebviewMessage<boolean>({
    action: "isTaskInstalled",
    payload: {},
  });
}

export function addScheduledTask() {
  return postWebviewMessage({
    action: "addScheduledTask",
    payload: {},
  });
}

export function removeScheduledTask() {
  return postWebviewMessage({
    action: "removeScheduledTask",
    payload: {},
  });
}

export function getWindowMode() {
  return postWebviewMessage<WindowMode>({
    action: "getWindowMode",
    payload: {},
  });
}

export function setWindowMode(mode: WindowMode) {
  return postWebviewMessage({
    action: "setWindowMode",
    payload: {
      mode,
    },
  });
}

let initialized = false;
let prevPlayer: {
  x: number;
  y: number;
  z: number;
  r: number | null;
  mapName?: string;
  terraformStage?: string;
} | null = null;
let prevActors: {
  address: number;
  x: number;
  y: number;
  z: number;
  hidden?: boolean;
}[] = [];
let prevStaticActors: {
  address: number;
  x: number;
  y: number;
  z: number;
  hidden?: boolean;
}[] = [];
// The native side re-broadcasts the dungeon floor plan on a slow cadence (to beat
// webview load races), so skip an identical resend — mapName + triangle count is a
// sufficient signature since the buffer is read once per dungeon entry.
let prevNavmesh: { mapName: string; triangles: number } | null = null;
let lastActorUpdateTime = 0;
// Trailing-edge throttle state: the native side broadcasts the "actors" payload
// only when it CHANGES (edge-triggered). A leading-edge-only throttle would drop
// a change that lands inside the window and never see it again (the native side
// won't re-send an unchanged payload), leaving the map stuck on the previous set
// — e.g. select NONE then Pickups and the pickups never appear. Remember the last
// throttled payload and flush it when the window elapses so no edge is ever lost.
let pendingActors: Actor[] | null = null;
let pendingActorTimer: ReturnType<typeof setTimeout> | null = null;
// Matches the native actor poll (100 ms). The old 200 ms throttle protected
// React from re-processing huge combined actor arrays; since the immobile
// subset moved to the change-gated "staticActors" channel, the per-poll
// "actors" payload is movers-only and small, so no extra delay is needed.
const ACTOR_THROTTLE_MS = 100;

function actorsChanged(
  prev: {
    address: number;
    x: number;
    y: number;
    z: number;
    hidden?: boolean;
  }[],
  next: {
    address: number;
    x: number;
    y: number;
    z: number;
    hidden?: boolean;
  }[],
): boolean {
  if (prev.length !== next.length) return true;
  for (let i = 0; i < prev.length; i++) {
    const a = prev[i];
    const b = next[i];
    if (
      a.address !== b.address ||
      a.x !== b.x ||
      a.y !== b.y ||
      a.z !== b.z ||
      a.hidden !== b.hidden
    ) {
      return true;
    }
  }
  return false;
}

export async function initializeApp(role: "client" | "dashboard" = "client") {
  if (initialized) {
    return;
  }
  initialized = true;

  const gameState = useGameState.getState();
  const liveState = useLiveState.getState();

  // Listen for direct WebView messages from C++
  if (typeof window !== "undefined" && window.chrome?.webview) {
    window.chrome.webview.addEventListener("message", (event: MessageEvent) => {
      try {
        const message =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (typeof message === "object" && typeof message.action === "string") {
          // Client (Overlay/Desktop) specific handlers
          if (role === "client") {
            if (message.action === "player") {
              const p = message.payload;
              if (
                !prevPlayer ||
                p.x !== prevPlayer.x ||
                p.y !== prevPlayer.y ||
                p.z !== prevPlayer.z ||
                p.r !== prevPlayer.r ||
                p.mapName !== prevPlayer.mapName ||
                p.terraformStage !== prevPlayer.terraformStage
              ) {
                prevPlayer = p;
                gameState.setPlayer({
                  ...p,
                  address: 0,
                  type: "player",
                });
              }
            } else if (message.action === "actors") {
              const now = performance.now();
              const actors = message.payload;
              if (actorsChanged(prevActors, actors)) {
                const elapsed = now - lastActorUpdateTime;
                if (elapsed >= ACTOR_THROTTLE_MS) {
                  // Leading edge: apply immediately and cancel any pending flush.
                  if (pendingActorTimer !== null) {
                    clearTimeout(pendingActorTimer);
                    pendingActorTimer = null;
                    pendingActors = null;
                  }
                  prevActors = actors;
                  lastActorUpdateTime = now;
                  gameState.setActors(actors);
                } else {
                  // Inside the throttle window: keep the latest payload and flush it
                  // when the window elapses, so an edge-triggered change is never lost.
                  pendingActors = actors;
                  if (pendingActorTimer === null) {
                    pendingActorTimer = setTimeout(() => {
                      pendingActorTimer = null;
                      const flush = pendingActors;
                      pendingActors = null;
                      if (flush && actorsChanged(prevActors, flush)) {
                        prevActors = flush;
                        lastActorUpdateTime = performance.now();
                        gameState.setActors(flush);
                      }
                    }, ACTOR_THROTTLE_MS - elapsed);
                  }
                }
              }
            } else if (message.action === "actorsDelta") {
              // Incremental mover update: only the actors that moved/appeared plus the
              // addresses that disappeared, instead of the full per-poll list. Applied
              // immediately — deltas arrive at most at the backend poll rate (~10/s) and
              // are small, so no throttle is needed (unlike the full-payload keyframe).
              const { changed, removed } = message.payload;
              // A full "actors" keyframe is still the source of truth for the throttle
              // gate; a delta doesn't reconstruct prevActors, so invalidate it so the
              // next keyframe isn't wrongly skipped as "unchanged".
              prevActors = [];
              gameState.applyActorsDelta(changed ?? [], removed ?? []);
            } else if (message.action === "staticActorsDelta") {
              // Incremental update: a harvest is one removed address, a respawn
              // wave a few added actors — no full-payload parse or re-render.
              const { added, removed } = message.payload;
              prevStaticActors = []; // full-payload guard no longer representative
              gameState.applyStaticActorsDelta(added ?? [], removed ?? []);
            } else if (message.action === "staticActors") {
              // Fixed-position actors (foliage resource nodes etc.) — sent on
              // change plus a periodic catch-up re-send; skip identical payloads
              // so the re-send doesn't trigger pointless re-renders.
              const staticActors = message.payload;
              if (actorsChanged(prevStaticActors, staticActors)) {
                prevStaticActors = staticActors;
                gameState.setStaticActors(staticActors);
              }
            } else if (message.action === "characterData") {
              gameState.setCharacter(message.payload);
            } else if (message.action === "dungeonNavmesh") {
              // Floor plan for the dungeon the player is in, re-sent on a slow cadence.
              // Skip identical resends; apply only when the dungeon (or its triangle
              // count) changes. The NavmeshLayer scopes it to payload.mapName and clears
              // when the player leaves that map (see interactive-map / LiveNavmesh).
              const nm = message.payload;
              if (
                !prevNavmesh ||
                prevNavmesh.mapName !== nm.mapName ||
                prevNavmesh.triangles !== nm.triangles
              ) {
                prevNavmesh = { mapName: nm.mapName, triangles: nm.triangles };
                gameState.setDungeonNavmesh(nm);
              }
            } else if (message.action === "windowModeChanged") {
              liveState.setWindowMode(message.payload);
            } else if (message.action === "alwaysRunAsAdminChanged") {
              liveState.setAlwaysRunAsAdmin(message.payload);
            } else if (message.action === "exclusiveFullscreenChanged") {
              liveState.setExclusiveFullscreen(message.payload);
            }
          }
          // Dashboard specific handlers - receive directly from C++
          if (role === "dashboard") {
            if (message.action === "runningGames") {
              liveState.setRunningGames(message.payload);
              // Cleanup stale sessions - mark sessions as closed if their PID is no longer active
              const activePids = message.payload.map((g: RunningGame) => g.pid);
              useTHGLAppState.getState().cleanupStaleSessions(activePids);
            } else if (message.action === "gameSession") {
              useTHGLAppState.getState().updateGameSession(message.payload);
            } else if (message.action === "connectedClients") {
              liveState.setConnectedClients(message.payload);
            } else if (message.action === "version") {
              liveState.setVersion(message.payload);
            } else if (message.action === "isTaskInstalled") {
              liveState.setIsTaskInstalled(message.payload);
            } else if (message.action === "windowModeChanged") {
              liveState.setWindowMode(message.payload);
            } else if (message.action === "alwaysRunAsAdminChanged") {
              liveState.setAlwaysRunAsAdmin(message.payload);
            } else if (message.action === "closeActionChanged") {
              liveState.setCloseAction(message.payload);
            } else if (message.action === "exclusiveFullscreenChanged") {
              liveState.setExclusiveFullscreen(message.payload);
            }
          }
          // Client (Overlay/Desktop) handlers for DevTools and close requests
          if (role === "client") {
            if (message.action === "openDevTools") {
              if (message.payload.url === location.href) {
                openDevTools();
              }
            } else if (message.action === "closeWebViews") {
              if (message.payload.includes(location.href)) {
                postWebviewMessage({
                  action: "clickthroughOverlayWebView",
                  payload: {
                    clickthrough: true,
                  },
                }).catch(() => {});
                window.chrome.webview.postMessage("close");
              }
            }
          }
        }
      } catch (e) {
        // Ignore parse errors for non-JSON messages
      }
    });
    console.log("Direct WebView message listener registered for", role);
  }

  // Native WebView2 bridge check - outside of THGLApp (e.g. browser dev testing),
  // C++ IPC calls are unavailable.
  if (typeof window === "undefined" || !window.chrome?.webview) {
    return;
  }

  // For dashboard role, request initial state from C++ when ready
  if (role === "dashboard") {
    const fetchInitialState = async (
      retries = 3,
      delay = 500,
    ): Promise<void> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const res = await getInitialStateFromWebview();
          const data = res.data;
          liveState.setVersion(data.version);
          // isTaskInstalled is fetched separately to avoid blocking
          if (data.isTaskInstalled !== null) {
            liveState.setIsTaskInstalled(data.isTaskInstalled);
          }
          liveState.setWindowMode(data.windowMode);
          liveState.setGpuFlag(data.gpuFlag);
          liveState.setIsRunningAsAdmin(data.isRunningAsAdmin ?? false);
          liveState.setAlwaysRunAsAdmin(data.alwaysRunAsAdmin ?? false);
          liveState.setExclusiveFullscreen(data.exclusiveFullscreen ?? false);
          liveState.setCloseAction(data.closeAction ?? "ask");
          liveState.setLocale(data.locale ?? "en");
          if (data.connectedClients) {
            liveState.setConnectedClients(data.connectedClients);
          }
          if (data.compatRunAsAdminFlagRemoved) {
            // Surfaced as a toast by CompatFlagNotice (ui layer) — this
            // package can't import sonner directly.
            window.dispatchEvent(
              new CustomEvent("thgl-app:compat-flag-removed"),
            );
          }
          console.log("Dashboard received initial state:", data);

          // Cleanup stale sessions on startup - use current running games if available, else empty
          const currentRunningGames = liveState.runningGames ?? [];
          const activePids = currentRunningGames.map((g) => g.pid);
          useTHGLAppState.getState().cleanupStaleSessions(activePids);
          return; // Success, exit
        } catch (e) {
          console.warn(
            `Failed to get initial state (attempt ${attempt}/${retries}):`,
            e,
          );
          if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
      console.error("Failed to get initial state after all retries");
    };
    fetchInitialState();
  }

  // For client role, fetch window mode and close action from C++
  if (role === "client") {
    getWindowMode()
      .then((res) => {
        liveState.setWindowMode(res.data);
      })
      .catch(console.error);

    getInitialStateFromWebview()
      .then((res) => {
        liveState.setCloseAction(res.data.closeAction ?? "ask");
        liveState.setExclusiveFullscreen(res.data.exclusiveFullscreen ?? false);
      })
      .catch(console.error);

    // Sync hotkeys to C++ after store hydration and on changes.
    // Uses a delayed confirmation re-sync to handle WebView2 IPC timing.
    let prevHotkeys = useSettingsStore.getState().hotkeys;
    let hasSynced = false;
    let confirmTimer: ReturnType<typeof setTimeout> | null = null;
    const syncWithConfirm = () => {
      syncHotkeysToNative();
      if (confirmTimer) clearTimeout(confirmTimer);
      confirmTimer = setTimeout(syncHotkeysToNative, 300);
    };
    const trySyncInitial = () => {
      if (!hasSynced && useSettingsStore.getState()._hasHydrated) {
        hasSynced = true;
        prevHotkeys = useSettingsStore.getState().hotkeys;
        syncWithConfirm();
      }
    };
    trySyncInitial();
    useSettingsStore.subscribe((state) => {
      trySyncInitial();
      if (hasSynced && state.hotkeys !== prevHotkeys) {
        prevHotkeys = state.hotkeys;
        syncWithConfirm();
      }
    });
  }
}
