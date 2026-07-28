import { RunningGame } from "./games";
import { generateUniqueId } from "./utils";
declare global {
  interface WebviewEvent extends MessageEvent {
    // You can add additional type definitions for your events if needed.
  }

  interface ChromeWebview {
    addEventListener(
      type: string,
      listener: (event: WebviewEvent) => void,
    ): void;
    removeEventListener(
      type: string,
      listener: (event: WebviewEvent) => void,
    ): void;
    postMessage(message: any): void;
  }

  interface Chrome {
    webview: ChromeWebview;
  }

  interface Window {
    chrome: Chrome;
  }
}

export type Player = {
  x: number;
  y: number;
  z: number;
  r: number;
  path: string;
  mapName?: string;
};

export type Actor = {
  address: number;
  type: string;
  x: number;
  y: number;
  z: number;
  r: number;
  hidden: boolean;
  path: string;
  mapName?: string;
  // Memory reader flags this actor as already collected (e.g. a picked-up
  // Palworld effigy). The frontend permanently marks the node discovered.
  discovered?: boolean;
};

export type GameSessionUpdate = {
  gameId: string;
  processName: string;
  pid: number;
  status: "connecting" | "connected" | "error" | "closed";
  detectorInitialized: boolean;
  lastError?: string;
  startedAt: number;
  endedAt?: number;
};

export type WEBVIEW_RECEIVE_MESSAGE =
  | {
      action: "runningGames";
      payload: Array<RunningGame>;
    }
  | {
      action: "player";
      payload: Player;
    }
  | {
      action: "actors";
      payload: Array<Actor>;
    }
  | {
      action: "staticActors";
      payload: Array<Actor>;
    }
  | {
      action: "staticActorsDelta";
      payload: { added: Array<Actor>; removed: Array<string> };
    }
  | {
      action: "characterData";
      game: string;
      processName: string;
      payload: Record<string, any> | null;
    }
  | {
      action: "gameSpecific";
      payload: any;
    }
  | {
      action: "dungeonNavmesh";
      payload: {
        mapName: string;
        // Flat x,y triangle vertices in the marker frame (same frame as player/actors),
        // ready to project + fill as the walkable dungeon floor plan.
        verts: number[];
        triangles: number;
      };
    }
  | {
      action: "hotkey";
      payload: {
        key: string;
        action: string; // e.g., "toggle_app", "toggle_lock_app", "toggle_live_mode"
      };
    }
  | {
      action: "gameSession";
      payload: GameSessionUpdate;
    }
  | {
      action: "windowModeChanged";
      payload: "overlay" | "desktop" | "both";
    }
  | {
      action: "alwaysRunAsAdminChanged";
      payload: boolean;
    }
  | {
      action: "closeActionChanged";
      payload: CloseAction;
    }
  | {
      action: "exclusiveFullscreenChanged";
      payload: boolean;
    };

export type WEBVIEW_RESPONSE_MESSAGE<T = undefined> = {
  status: "success" | "error";
  message: string;
  responseId: string;
  data: T;
};

export type WEBVIEW_SEND_MESSAGE =
  | {
      action: "isTaskInstalled";
      payload: {};
    }
  | {
      action: "addScheduledTask";
      payload: {};
    }
  | {
      action: "removeScheduledTask";
      payload: {};
    }
  | {
      action: "getVersion";
      payload: {};
    }
  | {
      action: "getInitialState";
      payload: {};
    }
  | {
      action: "triggerUpdate";
      payload: {};
    }
  | {
      action: "openDevTools";
      payload: {
        url: string;
      };
    }
  | {
      action: "closeWebViews";
      payload: {
        urls: string[];
      };
    }
  | {
      action: "openDashboardWebView";
      payload: {};
    }
  | {
      action: "openDesktopWebView";
      payload: {
        url: string;
        title: string;
      };
    }
  | {
      action: "openOverlayWebView";
      payload: {
        url: string;
        title: string;
      };
    }
  | {
      action: "updateHotkeys";
      payload: Record<string, string>; // { "toggle_app": "F6", "toggle_lock_app": "F9", ... }
    }
  | {
      action: "clickthroughOverlayWebView";
      payload: {
        clickthrough: boolean;
      };
    }
  | {
      action: "inputFocus";
      payload: {
        value: boolean;
      };
    }
  | {
      action: "setActorTypeFilter";
      payload: {
        types: string[];
        processName?: string;
      };
    }
  | {
      action: "sendDebugSnapshot";
      payload: {
        userContext: string;
      };
    }
  | {
      action: "openInBrowser";
      payload: {
        url: string;
      };
    }
  | {
      action: "getWindowMode";
      payload: {};
    }
  | {
      action: "setWindowMode";
      payload: {
        mode: "overlay" | "desktop" | "both";
      };
    }
  | {
      action: "getGpuFlag";
      payload: {};
    }
  | {
      action: "setGpuFlag";
      payload: {
        flag: GpuFlag;
      };
    }
  | {
      action: "setAlwaysRunAsAdmin";
      payload: {
        always: boolean;
      };
    }
  | {
      action: "relaunchAsAdmin";
      payload: {};
    }
  | {
      action: "closeElevationPrompt";
      payload: {
        gameId: string;
        openDesktop?: boolean;
      };
    }
  | {
      action: "setCloseAction";
      payload: {
        closeAction: CloseAction;
      };
    }
  | {
      action: "setLocale";
      payload: {
        locale: string;
      };
    }
  | {
      action: "showOverlay";
      payload: {};
    }
  | {
      action: "hideOverlay";
      payload: {};
    }
  | {
      action: "captureGameScreenshot";
      payload: {};
    };

// GPU acceleration flags for WebView2
// These flags help troubleshoot display issues on multi-monitor setups
export type GpuFlag =
  | "none" // Default - full hardware acceleration
  | "disable-gpu-compositing" // Disable GPU compositing (may help with flickering)
  | "disable-direct-composition-video" // Only disable DirectComposition for video (least impact)
  | "disable-gpu"; // Full software rendering (slowest, use as last resort)

// Close button behavior
export type CloseAction =
  | "ask" // Show dialog asking user (default)
  | "closeWindow" // Close this window (destroy it, app keeps running)
  | "exit"; // Exit the application

export function onWebviewMessage(
  callback: (data: WEBVIEW_RECEIVE_MESSAGE) => void,
) {
  const handler = (event: MessageEvent) => {
    if (event.data && event.data.action) {
      callback(event.data as WEBVIEW_RECEIVE_MESSAGE);
    }
  };

  window.chrome.webview.addEventListener("message", handler);
  return () => {
    window.chrome.webview.removeEventListener("message", handler);
  };
}

export function postWebviewMessage<T>(
  message: WEBVIEW_SEND_MESSAGE,
  timeout = 5000,
) {
  let promise: Promise<WEBVIEW_RESPONSE_MESSAGE<T>>;
  if (typeof window === "undefined" || !window.chrome?.webview) {
    // No host bridge (plain-browser dev, SSR) — fail fast instead of
    // dereferencing the missing bridge / waiting out the timeout.
    promise = Promise.reject(
      new Error(`${message.action} unavailable outside THGLApp`),
    );
  } else {
    promise = new Promise<WEBVIEW_RESPONSE_MESSAGE<T>>((resolve, reject) => {
      const requestId = generateUniqueId();
      const timer = setTimeout(() => {
        window.chrome.webview.removeEventListener("message", handler);
        reject(new Error(`${message.action} timed out`));
      }, timeout);
      // Message event handler to capture the response.
      const handler = (event: WebviewEvent) => {
        // Check if the response matches the request ID.
        if (event.data && event.data.responseId === requestId) {
          clearTimeout(timer);
          window.chrome.webview.removeEventListener("message", handler);
          if (event.data.status === "error") {
            reject(new Error(event.data.message));
          }
          resolve(event.data);
        }
      };

      window.chrome.webview.addEventListener("message", handler);

      // Attach unique ID to the request
      const payload = { ...message, requestId };

      // Send the message to the host.
      window.chrome.webview.postMessage(payload);
    });
  }
  // IPC failures (no bridge, host timeout) are expected operational noise for
  // the many fire-and-forget senders (clickthrough toggles, hotkey sync):
  // mark the rejection handled so they don't spam unhandledRejection. Callers
  // that care still receive it via their own await/.catch.
  promise.catch(() => {});
  return promise;
}
