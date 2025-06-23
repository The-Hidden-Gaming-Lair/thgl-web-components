"use client";
import {
  closeWebViews,
  HOTKEYS,
  listenToWorkerMessages,
  openWebView,
  requestInjectOverlay,
  requestOpenOverlayWebView,
  requestUpdateHotkeys,
  useLiveState,
} from "@repo/lib/thgl-app";
import { InitializeApp } from "./initialize-app";
import { useEffect, useMemo, useRef, useState } from "react";
import { THGLAppConfig, useSettingsStore } from "@repo/lib";

export function Controller({
  title,
  controllerURL,
  desktopURL,
  overlayURL,
  gameProcessNames,
  defaultHotkeys,
}: {
  title: string;
  controllerURL: string;
  desktopURL: string;
  overlayURL?: string;
  gameProcessNames: string[];
  defaultHotkeys: THGLAppConfig["defaultHotkeys"];
}) {
  const runningGames = useLiveState((state) => state.runningGames);

  const hasHydrated = useSettingsStore((state) => state._hasHydrated);
  const overlayMode = useSettingsStore((state) => state.overlayMode);
  const hotkeys = useSettingsStore((state) => state.hotkeys);
  const [isInjected, setIsInjected] = useState(false);
  const previouslyRunning = useRef(false);
  const initializedRef = useRef(false);

  const { fullDesktopUrl, fullOverlayUrl } = useMemo(
    () => ({
      fullDesktopUrl:
        typeof location === "undefined" || desktopURL.startsWith("http")
          ? desktopURL
          : location.origin + desktopURL,
      fullOverlayUrl: overlayURL
        ? typeof location === "undefined" || overlayURL.startsWith("http")
          ? overlayURL
          : location.origin + overlayURL
        : "",
    }),
    [desktopURL, overlayURL],
  );

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    if (Object.keys(hotkeys).length === 0) {
      useSettingsStore.getState().setHotkeys(defaultHotkeys);
    }
  }, [hasHydrated, hotkeys]);

  const processName = useMemo(
    () =>
      runningGames === null
        ? runningGames
        : runningGames.find((game) =>
            gameProcessNames.includes(game.processName),
          )?.processName,
    [runningGames],
  );

  useEffect(() => {
    if (!hasHydrated || processName === null) {
      return;
    }
    console.log("Running game", processName);

    const handleRun = () => {
      initializedRef.current = true;

      const gameIsRunning = !!processName;
      const wasRunning = previouslyRunning.current;
      previouslyRunning.current = gameIsRunning;

      if (gameIsRunning) {
        if (!fullOverlayUrl) {
          openWebView(fullDesktopUrl, `${title} Desktop`)
            .then(() => {
              console.log(`Opened desktop window for ${title}`);
            })
            .catch((e) => console.error(e));
          return;
        }
        if (overlayMode === false) {
          closeWebViews([fullOverlayUrl]).catch((e) => console.error(e));
        } else {
          closeWebViews([fullDesktopUrl]).catch((e) => console.error(e));
        }

        requestInjectOverlay(processName)
          .then(() => {
            console.log(`Injected overlay for ${title}`);
            if (overlayMode === false) {
              openWebView(fullDesktopUrl, `${title} Desktop`)
                .then(() => {
                  console.log(`Opened desktop window for ${title}`);
                })
                .catch((e) => console.error(e));
            } else {
              requestOpenOverlayWebView(fullOverlayUrl, `${title} Overlay`)
                .then(() => {
                  console.log(`Opened overlay window for ${title}`);
                })
                .catch((e) => console.error(e));
            }
            setIsInjected(true);
          })
          .catch((e) => console.error(e));
      } else {
        if (isInjected) {
          setIsInjected(false);
        }
        if (wasRunning) {
          console.log("Game was previously running. Skipping desktop window.");
          return;
        }

        if (fullOverlayUrl) {
          closeWebViews([fullOverlayUrl]).catch((e) => console.error(e));
        }

        openWebView(fullDesktopUrl, `${title} Desktop`)
          .then(() => {
            console.log(`Opened desktop window for ${title}`);
          })
          .catch((e) => console.error(e));
      }
    };

    handleRun();

    const handleHotkey = (key: string) => {
      const hotkeys = useSettingsStore.getState().hotkeys;
      if (key === hotkeys[HOTKEYS.TOGGLE_APP]) {
        if (initializedRef.current) {
          closeWebViews([fullOverlayUrl, fullDesktopUrl]);
          initializedRef.current = false;
        } else {
          handleRun();
        }
      } else if (key === hotkeys[HOTKEYS.TOGGLE_LOCK_APP]) {
        useSettingsStore.getState().toggleLockedWindow();
      } else if (key === hotkeys[HOTKEYS.TOGGLE_LIVE_MODE]) {
        useSettingsStore.getState().toggleLiveMode();
      }
    };

    const cleanup = listenToWorkerMessages((msg) => {
      switch (msg.type) {
        case "init":
          console.log("Worker initialized with ID: ", msg.data);
          break;
        case "broadcast":
          switch (msg.data.action) {
            case "openController":
              if (msg.data.payload.url === controllerURL) {
                handleRun();
              }
              break;
            case "hotkey":
              handleHotkey(msg.data.payload.key);
              break;
          }
          break;
      }
    });

    return () => {
      cleanup();
    };
  }, [hasHydrated, processName, overlayMode]);

  useEffect(() => {
    if (!isInjected) {
      return;
    }
    requestUpdateHotkeys(hotkeys).catch((e) => console.error(e));
  }, [isInjected, hotkeys]);

  return <InitializeApp />;
}
