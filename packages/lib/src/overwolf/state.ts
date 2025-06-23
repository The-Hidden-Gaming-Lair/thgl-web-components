import { create } from "zustand";
import { promisifyOverwolf } from "./promisify";
import { WINDOWS } from "./windows";

export const useOverwolfState = create<{
  windowInfo: overwolf.windows.WindowInfo | null;
  isOverlay: boolean | null;
}>((set, get) => {
  const getCurrentWindow = promisifyOverwolf(overwolf.windows.getCurrentWindow);
  overwolf.windows.onStateChanged.addListener(async (event) => {
    if (event.window_name === get().windowInfo?.name) {
      const currentWindow = await getCurrentWindow();
      set({
        windowInfo: currentWindow.window,
        isOverlay: currentWindow.window.name === WINDOWS.OVERLAY,
      });
    }
  });

  getCurrentWindow().then((currentWindow) => {
    set({
      windowInfo: currentWindow.window,
      isOverlay: currentWindow.window.name === WINDOWS.OVERLAY,
    });
  });

  return {
    windowInfo: null,
    isOverlay: null,
  };
});
