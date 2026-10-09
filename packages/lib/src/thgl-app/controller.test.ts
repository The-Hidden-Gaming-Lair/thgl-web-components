import { openDesktopWebView, openOverlayWebView } from "./apps";
import { initController } from "./controller";

let mockListener:
  | ((message: { action: string; payload: unknown }) => void)
  | null = null;

jest.mock("./webview", () => ({
  onWebviewMessage: (
    cb: (message: { action: string; payload: unknown }) => void,
  ) => {
    mockListener = cb;
  },
}));

jest.mock("./apps", () => ({
  getWindowMode: () => Promise.resolve({ data: "desktop" }),
  openDashboadWebView: jest.fn(),
  openDesktopWebView: jest.fn(),
  openOverlayWebView: jest.fn(),
}));

jest.mock("./version", () => ({
  // Never resolves: keeps the update check (and its interval) out of the test.
  getVersionFromWebview: () => new Promise(() => {}),
  getInitialStateFromWebview: () =>
    Promise.resolve({ data: { locale: "zh-CN" } }),
  triggerUpdate: jest.fn(),
}));

jest.mock("./states", () => {
  const live = {
    runningGames: [] as unknown[],
    setRunningGames: (games: unknown[]) => {
      live.runningGames = games;
    },
    setVersion: () => {},
    setWindowMode: () => {},
  };
  const app = {
    _hasHydrated: true,
    disabledApps: [],
    autoRunGames: {},
    setLastPlayed: () => {},
    openDashboardOnStart: false,
  };
  return {
    useLiveState: { getState: () => live },
    useTHGLAppState: { getState: () => app, subscribe: () => () => {} },
  };
});

jest.mock("../account", () => ({
  useAccountStore: { getState: () => ({ invites: [] }) },
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("initController auto-open on game start", () => {
  it("opens the companion in the app's locale (inbox #932)", async () => {
    initController({ version: "1.0.0" } as Parameters<
      typeof initController
    >[0]);
    await flush();
    mockListener!({
      action: "runningGames",
      payload: [
        {
          processName: "PaliaClient-Win64-Shipping.exe",
          exePath: "",
          pid: 1,
        },
      ],
    });
    await flush();
    expect(openDesktopWebView).toHaveBeenCalledWith(
      "/zh-CN/apps/palia",
      "Palia",
    );
    expect(openOverlayWebView).not.toHaveBeenCalled();
  });
});
