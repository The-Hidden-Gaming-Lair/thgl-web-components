import { promisifyOverwolf } from "./promisify";
import { OverlayWindowMode, useSettingsStore } from "../settings";
import { getRunningGameInfo } from "./games";

export const WINDOWS = {
  BACKGROUND: "background",
  DESKTOP: "desktop",
  OVERLAY: "overlay",
};

export async function obtainDeclaredWindow(
  windowName: string,
): Promise<overwolf.windows.WindowInfo> {
  const overwolfWindow = await promisifyOverwolf<
    string,
    overwolf.windows.WindowResult
  >(overwolf.windows.obtainDeclaredWindow)(windowName);

  if (!overwolfWindow.window) {
    throw new Error(`Window ${windowName} not found`);
  }
  return overwolfWindow.window;
}

export function getMonitors() {
  return promisifyOverwolf(overwolf.utils.getMonitorsList)();
}

// Resolve the effective window mode, auto-detecting (and persisting) on first
// run. The new tri-state `windowMode` wins; falls back to the legacy
// `overlayMode` boolean for older profiles; else picks by the monitor count.
export async function resolveWindowMode(): Promise<OverlayWindowMode> {
  const state = useSettingsStore.getState();
  if (state.windowMode) {
    return state.windowMode;
  }
  if (state.overlayMode !== null) {
    const mode: OverlayWindowMode = state.overlayMode ? "overlay" : "desktop";
    state.setWindowMode(mode);
    return mode;
  }

  const monitors = await getMonitors();
  const hasSecondScreen = monitors.displays.length > 1;
  const mode: OverlayWindowMode = hasSecondScreen ? "desktop" : "overlay";
  state.setWindowMode(mode);
  return mode;
}

// The declared windows that should be open for a given mode.
export function windowsForMode(mode: OverlayWindowMode): string[] {
  if (mode === "both") {
    return [WINDOWS.OVERLAY, WINDOWS.DESKTOP];
  }
  return mode === "overlay" ? [WINDOWS.OVERLAY] : [WINDOWS.DESKTOP];
}

// The primary window to focus / toggle / move. `both` favors the overlay.
export async function getPreferedWindowName(): Promise<string> {
  const mode = await resolveWindowMode();
  return mode === "desktop" ? WINDOWS.DESKTOP : WINDOWS.OVERLAY;
}

export async function restoreWindow(windowName: string): Promise<string> {
  console.log("Restoring window", windowName);
  const declaredWindow = await obtainDeclaredWindow(windowName);
  if (!declaredWindow.isVisible) {
    await promisifyOverwolf(overwolf.windows.restore)(windowName);
  }
  await promisifyOverwolf<string, overwolf.windows.WindowIdResult>(
    overwolf.windows.bringToFront,
  )(windowName);
  return declaredWindow.id;
}

export async function moveToOtherScreen(
  windowId: string,
  monitorHandleValue: number,
) {
  console.log("Moving window to other screen", windowId, monitorHandleValue);
  const monitors = await getMonitors();
  if (monitors.displays.length <= 1) {
    return null;
  }
  const desktopWindow = await obtainDeclaredWindow(WINDOWS.DESKTOP);
  const otherScreens = monitors.displays.filter(
    (monitor) => monitor.handle.value !== monitorHandleValue,
  );
  const secondScreen =
    otherScreens.find(
      (secondScreen) => desktopWindow.monitorId === secondScreen.id,
    ) || otherScreens[0];

  if (desktopWindow.monitorId === secondScreen.id) {
    return null;
  }

  const x =
    secondScreen.x +
    Math.floor(secondScreen.width / 2 - desktopWindow.width / 2);
  const y =
    secondScreen.y +
    Math.floor(secondScreen.height / 2 - desktopWindow.height / 2);
  return promisifyOverwolf(overwolf.windows.changePosition)(windowId, x, y);
}

export async function toggleWindow(windowName: string) {
  const declaredWindow = await obtainDeclaredWindow(windowName);
  if (
    ["normal", "maximized"].includes(declaredWindow.stateEx) &&
    declaredWindow.isVisible
  ) {
    return promisifyOverwolf(overwolf.windows.hide)(declaredWindow.id);
  } else {
    return restoreWindow(declaredWindow.name);
  }
}

export async function closeWindow(windowName: string) {
  console.log("Closing window", windowName);
  const backgroundWindow = await obtainDeclaredWindow(windowName);
  return promisifyOverwolf(overwolf.windows.close)(backgroundWindow.id);
}

export function closeMainWindow() {
  return closeWindow(WINDOWS.BACKGROUND);
}

// Open exactly the windows the current mode calls for and close the rest.
// The overlay window is `in_game_only`, so it's only opened while the game is
// running; the desktop window can always show. Call after changing the mode.
export async function applyWindowMode(gameClassId: number) {
  const mode = await resolveWindowMode();
  const runningGameInfo = await getRunningGameInfo(gameClassId);
  const wanted = windowsForMode(mode);

  const toOpen = wanted.filter(
    (name) => name !== WINDOWS.OVERLAY || Boolean(runningGameInfo),
  );
  const toClose = [WINDOWS.OVERLAY, WINDOWS.DESKTOP].filter(
    (name) => !toOpen.includes(name),
  );

  for (const name of toOpen) {
    const windowId = await restoreWindow(name);
    if (name === WINDOWS.DESKTOP && runningGameInfo) {
      await moveToOtherScreen(windowId, runningGameInfo.monitorHandle.value);
    }
  }
  for (const name of toClose) {
    await closeWindow(name).catch(() => {});
  }
}

// Show/hide every window for the current mode (the TOGGLE_APP hotkey).
export async function toggleActiveWindows() {
  const mode = await resolveWindowMode();
  for (const name of windowsForMode(mode)) {
    await toggleWindow(name);
  }
}

export async function getCurrentWindow() {
  const currentWindow = await promisifyOverwolf(
    overwolf.windows.getCurrentWindow,
  )();
  return currentWindow.window;
}

export async function setInputPassThrough(inputPassThrough: boolean) {
  const currentWindow = await getCurrentWindow();
  console.log("Setting input pass through", inputPassThrough);

  if (inputPassThrough) {
    return promisifyOverwolf(overwolf.windows.setWindowStyle)(
      currentWindow.id,
      "InputPassThrough" as overwolf.windows.enums.WindowStyle.InputPassThrough,
    );
  }

  return promisifyOverwolf(overwolf.windows.removeWindowStyle)(
    currentWindow.id,
    "InputPassThrough" as overwolf.windows.enums.WindowStyle.InputPassThrough,
  );
}
