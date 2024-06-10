import { promisifyOverwolf } from "./promisify";
import { useSettingsStore } from "../settings";
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

export async function getPreferedWindowName(): Promise<string> {
  const { overlayMode, setOverlayMode } = useSettingsStore.getState();
  if (overlayMode !== null) {
    return overlayMode ? WINDOWS.OVERLAY : WINDOWS.DESKTOP;
  }

  const monitors = await getMonitors();
  const hasSecondScreen = monitors.displays.length > 1;
  const newOverlayMode = hasSecondScreen ? WINDOWS.DESKTOP : WINDOWS.OVERLAY;
  setOverlayMode(newOverlayMode === WINDOWS.OVERLAY);
  return newOverlayMode;
}

export async function restoreWindow(windowName: string): Promise<string> {
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
  const backgroundWindow = await obtainDeclaredWindow(windowName);
  return promisifyOverwolf(overwolf.windows.close)(backgroundWindow.id);
}

export function closeMainWindow() {
  return closeWindow(WINDOWS.BACKGROUND);
}

export async function togglePreferedWindow(gameClassId: number) {
  const preferedWindowName = await getPreferedWindowName();
  const overlayMode = preferedWindowName === WINDOWS.OVERLAY;
  useSettingsStore.getState().setOverlayMode(overlayMode);
  if (overlayMode) {
    const runningGameInfo = await getRunningGameInfo(gameClassId);
    if (runningGameInfo) {
      await restoreWindow(WINDOWS.OVERLAY);
      await closeWindow(WINDOWS.DESKTOP);
    }
  } else {
    await restoreWindow(WINDOWS.DESKTOP);
    await closeWindow(WINDOWS.OVERLAY);
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
