import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

import { WindowMode } from "./apps";
import type { DriverHealth } from "./driver-health";
import { RunningGame } from "./games";
import { AppVersion, CompatRunAsAdminFlag } from "./version";
import { CloseAction, GpuFlag } from "./webview";

export type ConnectedClient = {
  id: number;
  href: string;
  role: "controller" | "dashboard" | "client";
};

export type GameSessionInfo = {
  gameId: string;
  processName: string;
  pid: number;
  status: "connecting" | "connected" | "error" | "closed";
  detectorInitialized: boolean;
  lastError?: string;
  startedAt: number;
  endedAt?: number;
};

export const useLiveState = create<{
  isTaskInstalled: boolean | null;
  setIsTaskInstalled: (isTaskInstalled: boolean) => void;
  version: AppVersion | null;
  setVersion: (version: AppVersion) => void;
  windowMode: WindowMode;
  setWindowMode: (mode: WindowMode) => void;
  gpuFlag: GpuFlag;
  setGpuFlag: (flag: GpuFlag) => void;
  runningGames: Array<RunningGame> | null;
  setRunningGames: (games: Array<RunningGame>) => void;
  connectedClients: Array<ConnectedClient> | null;
  setConnectedClients: (urls: Array<ConnectedClient>) => void;
  isRunningAsAdmin: boolean;
  setIsRunningAsAdmin: (isAdmin: boolean) => void;
  closeAction: CloseAction;
  setCloseAction: (action: CloseAction) => void;
  alwaysRunAsAdmin: boolean;
  setAlwaysRunAsAdmin: (always: boolean) => void;
  // Windows Compatibility "Run as administrator" flag state at startup:
  // "none" (or an older app), "removed" (the app stripped it — restart to
  // apply), "present" (found but not removable — the user must uncheck it).
  compatRunAsAdminFlag: CompatRunAsAdminFlag;
  setCompatRunAsAdminFlag: (state: CompatRunAsAdminFlag) => void;
  locale: string;
  setLocale: (locale: string) => void;
  // Game runs in exclusive fullscreen - the overlay can't render over it
  exclusiveFullscreen: boolean;
  setExclusiveFullscreen: (exclusive: boolean) => void;
  // State of the THGLApp -> BridgeHost -> kernel driver chain (null until the app reports it)
  driverHealth: DriverHealth | null;
  setDriverHealth: (health: DriverHealth | null) => void;
}>((set) => ({
  isTaskInstalled: null,
  setIsTaskInstalled: (isTaskInstalled) => set({ isTaskInstalled }),
  version: null,
  setVersion: (version) => set({ version }),
  windowMode: "overlay",
  setWindowMode: (mode) => set({ windowMode: mode }),
  gpuFlag: "none",
  setGpuFlag: (flag) => set({ gpuFlag: flag }),
  runningGames: null,
  setRunningGames: (games) => set({ runningGames: games }),
  connectedClients: null,
  setConnectedClients: (clients) => set({ connectedClients: clients }),
  isRunningAsAdmin: false,
  setIsRunningAsAdmin: (isAdmin) => set({ isRunningAsAdmin: isAdmin }),
  closeAction: "ask",
  setCloseAction: (action) => set({ closeAction: action }),
  alwaysRunAsAdmin: false,
  setAlwaysRunAsAdmin: (always) => set({ alwaysRunAsAdmin: always }),
  compatRunAsAdminFlag: "none",
  setCompatRunAsAdminFlag: (state) => set({ compatRunAsAdminFlag: state }),
  locale: "en",
  setLocale: (locale) => set({ locale }),
  exclusiveFullscreen: false,
  setExclusiveFullscreen: (exclusive) =>
    set({ exclusiveFullscreen: exclusive }),
  driverHealth: null,
  setDriverHealth: (health) => set({ driverHealth: health }),
}));

export const useTHGLAppState = create(
  subscribeWithSelector(
    persist<{
      _hasHydrated: boolean;
      setHasHydrated: (hydrated: boolean) => void;
      openDashboardOnStart: boolean;
      setOpenDashboardOnStart: (open: boolean) => void;
      disabledApps: Array<string>;
      toggleDisabledApp: (app: string) => void;
      autoRunGames: Record<string, boolean>;
      setAutoRunGame: (gameId: string, enabled: boolean) => void;
      sidebarExpanded: boolean;
      setSidebarExpanded: (expanded: boolean) => void;
      // game id -> epoch ms of the last time its process was detected. Drives the
      // dashboard game order (recently played first, see sortGamesByLastPlayed).
      lastPlayed: Record<string, number>;
      setLastPlayed: (gameId: string, at?: number) => void;
      gameSessions: Array<GameSessionInfo>;
      updateGameSession: (session: GameSessionInfo) => void;
      clearClosedSessions: () => void;
      cleanupStaleSessions: (activePids: number[]) => void;
    }>(
      (set) => ({
        _hasHydrated: false,
        setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
        openDashboardOnStart: true,
        setOpenDashboardOnStart: (open) => set({ openDashboardOnStart: open }),
        disabledApps: [],
        toggleDisabledApp: (app) =>
          set((state) => ({
            disabledApps: state.disabledApps.includes(app)
              ? state.disabledApps.filter((a) => a !== app)
              : [...state.disabledApps, app],
          })),
        autoRunGames: {},
        setAutoRunGame: (gameId, enabled) =>
          set((state) => ({
            autoRunGames: { ...state.autoRunGames, [gameId]: enabled },
          })),
        sidebarExpanded: true,
        setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
        lastPlayed: {},
        setLastPlayed: (gameId, at = Date.now()) =>
          set((state) => ({
            lastPlayed: { ...state.lastPlayed, [gameId]: at },
          })),
        gameSessions: [],
        updateGameSession: (session) =>
          set((state) => {
            const existing = state.gameSessions.findIndex(
              (s) => s.pid === session.pid,
            );
            if (existing >= 0) {
              const updated = [...state.gameSessions];
              updated[existing] = session;
              return { gameSessions: updated };
            }
            // Keep only last 20 sessions
            const sessions = [session, ...state.gameSessions].slice(0, 20);
            return { gameSessions: sessions };
          }),
        clearClosedSessions: () =>
          set((state) => ({
            gameSessions: state.gameSessions.filter(
              (s) => s.status !== "closed",
            ),
          })),
        cleanupStaleSessions: (activePids) =>
          set((state) => ({
            gameSessions: state.gameSessions.map((s) => {
              // If session is not closed and its PID is not in active list, mark as closed
              if (s.status !== "closed" && !activePids.includes(s.pid)) {
                return {
                  ...s,
                  status: "closed",
                  endedAt: s.endedAt ?? Date.now(),
                };
              }
              return s;
            }),
          })),
      }),
      {
        name: "thgl-app",
        version: 3,
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        },
      },
    ),
  ),
);
