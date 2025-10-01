import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

import { RunningGame } from "./games";
import { AppVersion } from "./version";
import { ConnectedClient } from "./worker";

export const useLiveState = create<{
  isRunningAsAdmin: boolean | null;
  setIsRunningAsAdmin: (isRunningAsAdmin: boolean) => void;
  isTaskInstalled: boolean | null;
  setIsTaskInstalled: (isTaskInstalled: boolean) => void;
  version: AppVersion | null;
  setVersion: (version: AppVersion) => void;
  runningGames: Array<RunningGame> | null;
  setRunningGames: (games: Array<RunningGame>) => void;
  connectedClients: Array<ConnectedClient> | null;
  setConnectedClients: (urls: Array<ConnectedClient>) => void;
}>((set) => ({
  isRunningAsAdmin: null,
  setIsRunningAsAdmin: (isRunningAsAdmin) => set({ isRunningAsAdmin }),
  isTaskInstalled: null,
  setIsTaskInstalled: (isTaskInstalled) => set({ isTaskInstalled }),
  version: null,
  setVersion: (version) => set({ version }),
  runningGames: null,
  setRunningGames: (games) => set({ runningGames: games }),
  connectedClients: null,
  setConnectedClients: (clients) => set({ connectedClients: clients }),
}));

export const usePersistentState = create(
  subscribeWithSelector(
    persist<{
      openDashboardOnStart: boolean;
      setOpenDashboardOnStart: (open: boolean) => void;
      disabledApps: Array<string>;
      toggleDisabledApp: (app: string) => void;
    }>(
      (set) => ({
        openDashboardOnStart: true,
        setOpenDashboardOnStart: (open) => set({ openDashboardOnStart: open }),
        disabledApps: [],
        toggleDisabledApp: (app) =>
          set((state) => ({
            disabledApps: state.disabledApps.includes(app)
              ? state.disabledApps.filter((a) => a !== app)
              : [...state.disabledApps, app],
          })),
      }),
      {
        name: "thgl-app",
        version: 1,
      },
    ),
  ),
);
