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
      action: "gameSpecific";
      payload: any;
    }
  | {
      action: "hotkey";
      payload: {
        key: string;
      };
    };

export type WEBVIEW_RESPONSE_MESSAGE<T = undefined> = {
  status: "success" | "error";
  message: string;
  responseId: string;
  data: T;
};

export type WEBVIEW_SEND_MESSAGE =
  | {
      action: "isRunningAsAdmin";
      payload: {};
    }
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
      action: "triggerUpdate";
      payload: {};
    }
  | {
      action: "openDevTools";
      payload: {};
    }
  | {
      action: "openControllerWebView";
      payload: {
        url: string;
      };
    }
  | {
      action: "injectOverlay";
      payload: {
        processName: string;
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
      payload: string[];
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
    };

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
  return new Promise<WEBVIEW_RESPONSE_MESSAGE<T>>((resolve, reject) => {
    const requestId = generateUniqueId();
    // Message event handler to capture the response.
    const handler = (event: WebviewEvent) => {
      // Check if the response matches the request ID.
      if (event.data && event.data.responseId === requestId) {
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

    // Optionally, set a timeout to reject if no response arrives.
    setTimeout(() => {
      window.chrome.webview.removeEventListener("message", handler);
      reject(new Error(`${message.action} timed out`));
    }, timeout);
  });
}
