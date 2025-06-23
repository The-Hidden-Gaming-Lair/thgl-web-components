import { generateUniqueId } from "./utils";
import { AppVersion } from "./version";
import { WEBVIEW_RECEIVE_MESSAGE, WEBVIEW_RESPONSE_MESSAGE } from "./webview";

type ActionRequestMap = {
  isRunningAsAdmin: null;
  isTaskInstalled: null;
  addScheduledTask: null;
  removeScheduledTask: null;
  getVersion: null;
  openDevTools: {
    url: string;
  };
  openController: {
    url: string;
  };
  closeWebViews: {
    urls: string[];
  };
  injectOverlay: {
    processName: string;
  };
  openOverlayWebView: {
    url: string;
    title: string;
  };
  openDesktopWebView: {
    url: string;
    title: string;
  };
  updateHotkeys: {
    hotkeys: string[];
  };
};

type WebviewActionResponseMap = {
  openController: WEBVIEW_RESPONSE_MESSAGE;
  injectOverlay: WEBVIEW_RESPONSE_MESSAGE;
  openOverlayWebView: WEBVIEW_RESPONSE_MESSAGE;
  openDesktopWebView: WEBVIEW_RESPONSE_MESSAGE;
  updateHotkeys: WEBVIEW_RESPONSE_MESSAGE;
};

type ActionResponseMap = {
  isRunningAsAdmin: boolean;
  isTaskInstalled: boolean;
  addScheduledTask: boolean;
  removeScheduledTask: boolean;
  getVersion: AppVersion;
  openDevTools: boolean;
  closeWebViews: boolean;
} & WebviewActionResponseMap;

type WEBVIEW_REQUEST_MESSAGE = {
  [K in keyof WebviewActionResponseMap]: {
    action: K;
    requestId: string;
    payload: ActionRequestMap[K];
  };
}[keyof WebviewActionResponseMap];

type REQUEST_MESSAGE = {
  [K in keyof ActionRequestMap]: {
    action: K;
    requestId: string;
    payload: ActionRequestMap[K];
  };
}[keyof ActionRequestMap];

type PARTIAL_REQUEST_MESSAGE = {
  [K in keyof ActionRequestMap]: {
    action: K;
    payload: ActionRequestMap[K];
  };
}[keyof ActionRequestMap];

type WEBVIEW_ACTION_RESPONSE_MESSAGE<
  K extends keyof ActionResponseMap = keyof WebviewActionResponseMap,
> = {
  action: K;
  responseId: string;
  data: ActionResponseMap[K];
};

type RESPONSE_MESSAGE<
  K extends keyof ActionResponseMap = keyof ActionResponseMap,
> = {
  action: K;
  responseId: string;
  data: ActionResponseMap[K];
};

type FROM_MAIN_MESSAGE = null;

export type ConnectedClient = {
  id: number;
  href: string;
  role: "controller" | "dashboard" | "client";
};

type MAIN_BROADCAST_MESSAGE =
  | WEBVIEW_RECEIVE_MESSAGE
  | {
      action: "connectedClients";
      payload: ConnectedClient[];
    }
  | {
      action: "closeWebViews";
      payload: string[];
    }
  | {
      action: "openDevTools";
      payload: {
        url: string;
      };
    }
  | {
      action: "openController";
      payload: {
        url: string;
      };
    };

type WORKER_MESSAGE =
  | {
      type: "init";
      data: number;
    }
  | {
      type: "clientList";
      data: ConnectedClient[];
    }
  | {
      type: "broadcast";
      from: 0;
      data: MAIN_BROADCAST_MESSAGE;
    }
  | {
      type: "fromMain";
      from: 0;
      data: FROM_MAIN_MESSAGE;
    }
  | {
      type: "fromClient";
      from: number;
      data: REQUEST_MESSAGE;
    };

let worker: SharedWorker;
export function initMessageWorker(
  role: "controller" | "dashboard" | "client" = "client",
) {
  if (worker) {
    return;
  }
  worker = new SharedWorker(location.origin + "/worker.js");
  worker.port.postMessage({ type: "identify", href: location.href, role });

  worker.onerror = (e) => {
    console.error("Worker error", e);
  };

  window.addEventListener("beforeunload", () => {
    worker.port.postMessage({ type: "disconnect" });
  });
}

export function listenToWorkerMessages(
  callback: (msg: WORKER_MESSAGE) => void,
) {
  if (typeof SharedWorker === "undefined") {
    return () => {};
  }
  const handler = (e: MessageEvent<any>) => {
    const msg = e.data;
    const msgType = msg.type as
      | "init"
      | "clientList"
      | "broadcast"
      | "fromMain"
      | "fromClient";

    switch (msgType) {
      case "init":
        callback({ type: "init", data: msg.data });
        break;
      case "clientList":
        callback({ type: "clientList", data: msg.data });
        break;
      case "broadcast":
        callback({ type: "broadcast", from: msg.from, data: msg.data });
        break;
      case "fromMain":
        callback({ type: "fromMain", from: msg.from, data: msg.data });
        break;
      case "fromClient":
        callback({ type: "fromClient", from: msg.from, data: msg.data });
        break;
    }
  };

  worker.port.addEventListener("message", handler);
  worker.port.start();

  return () => {
    worker.port.removeEventListener("message", handler);
  };
}

export function answerRequest<K extends keyof ActionResponseMap>(
  targetClientId: number,
  request: Extract<REQUEST_MESSAGE, { action: K }>,
  data: ActionResponseMap[K],
) {
  const response: RESPONSE_MESSAGE<K> = {
    action: request.action,
    responseId: request.requestId,
    data,
  };

  worker.port.postMessage({
    type: "toClient",
    targetClientId,
    data: response,
  });
}

export async function answerWebViewRequest<
  K extends keyof WebviewActionResponseMap,
>(
  targetClientId: number,
  request: Extract<WEBVIEW_REQUEST_MESSAGE, { action: K }>,
  webviewPromise: Promise<WEBVIEW_RESPONSE_MESSAGE<any>>,
) {
  const data = await webviewPromise;
  const response: WEBVIEW_ACTION_RESPONSE_MESSAGE<K> = {
    action: request.action,
    responseId: request.requestId,
    data,
  };

  worker.port.postMessage({
    type: "toClient",
    targetClientId,
    data: response,
  });
}

export function sendBroadcast(message: MAIN_BROADCAST_MESSAGE) {
  worker.port.postMessage({
    type: "sendBroadcast",
    data: message,
  });
}

export function requestFromMain<K extends keyof ActionRequestMap>(
  message: Extract<PARTIAL_REQUEST_MESSAGE, { action: K }>,
) {
  return new Promise<RESPONSE_MESSAGE<K>>((resolve, reject) => {
    const requestId = generateUniqueId();

    // Message event handler to capture the response.
    const handler = (e: MessageEvent<any>) => {
      const msg = e.data;
      if (msg.type === "fromMain" && msg.data.responseId === requestId) {
        worker.port.removeEventListener("message", handler);
        resolve(msg.data);
      }
    };

    worker.port.addEventListener("message", handler);

    // Attach unique ID to the request
    const payload = { ...message, requestId };

    worker.port.postMessage({
      type: "toClient",
      targetClientId: 0,
      data: payload,
    });
    worker.port.start();

    setTimeout(() => {
      worker.port.removeEventListener("message", handler);
      reject(new Error(`${message.action} timed out`));
    }, 10000);
  });
}

export const requestInjectOverlay = (processName: string) =>
  requestFromMain({
    action: "injectOverlay",
    payload: { processName: processName },
  });

export const openWebView = (url: string, title: string) =>
  requestFromMain({
    action: "openDesktopWebView",
    payload: { url, title },
  });

export const closeWebViews = (urls: string[]) =>
  requestFromMain({ action: "closeWebViews", payload: { urls } });

export const requestUpdateHotkeys = (hotkeys: Record<string, string>) =>
  requestFromMain({
    action: "updateHotkeys",
    payload: {
      hotkeys: Object.values(hotkeys),
    },
  });

export const requestOpenOverlayWebView = (url: string, title: string) =>
  requestFromMain({
    action: "openOverlayWebView",
    payload: { url: url, title: title },
  });
