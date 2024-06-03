import { promisifyOverwolf } from "@repo/lib/overwolf";
import { useEffect, useState } from "react";

export function useCurrentWindow() {
  const [currentWindow, setCurrentWindow] =
    useState<overwolf.windows.WindowInfo | null>(null);

  useEffect(() => {
    if (typeof overwolf === "undefined") {
      return;
    }
    let currentWindowName = "";
    const getCurrentWindow = promisifyOverwolf(
      overwolf.windows.getCurrentWindow
    );
    overwolf.windows.onStateChanged.addListener((event) => {
      if (event.window_name === currentWindowName) {
        getCurrentWindow().then((currentWindow) => {
          setCurrentWindow(currentWindow.window);
        });
      }
    });

    getCurrentWindow().then((currentWindow) => {
      currentWindowName = currentWindow.window.name;
      setCurrentWindow(currentWindow.window);
    });
  }, []);
  return currentWindow;
}
