import { useGameState } from "../game";
import { useLiveState } from "./states";
import { postWebviewMessage } from "./webview";
import {
  initMessageWorker,
  listenToWorkerMessages,
  requestFromMain,
} from "./worker";

export function injectOverlay(processName: string) {
  return postWebviewMessage(
    {
      action: "injectOverlay",
      payload: {
        processName,
      },
    },
    10000,
  );
}

export function openDashboadWebView() {
  return postWebviewMessage({
    action: "openDashboardWebView",
    payload: {},
  });
}
export function openOverlayWebView(url: string, title: string) {
  let fullUrl = url;
  if (!fullUrl.startsWith("http")) {
    fullUrl = location.origin + fullUrl;
  }
  return postWebviewMessage({
    action: "openOverlayWebView",
    payload: {
      url: fullUrl,
      title,
    },
  });
}
export function updateHotkeys(hotkeys: string[]) {
  return postWebviewMessage({
    action: "updateHotkeys",
    payload: hotkeys,
  });
}

export function openDesktopWebView(url: string, title: string) {
  let fullUrl = url;
  if (!fullUrl.startsWith("http")) {
    fullUrl = location.origin + fullUrl;
  }
  return postWebviewMessage({
    action: "openDesktopWebView",
    payload: {
      url: fullUrl,
      title,
    },
  });
}

export function openDevTools() {
  window.chrome.webview.postMessage("openDevTools");
}

export function openControllerWebView(url: string) {
  let fullUrl = url;
  if (!fullUrl.startsWith("http")) {
    fullUrl = location.origin + fullUrl;
  }
  return postWebviewMessage({
    action: "openControllerWebView",
    payload: {
      url: fullUrl,
    },
  });
}

let initialized = false;
export function initializeApp(role: "client" | "dashboard" = "client") {
  if (initialized) {
    return;
  }
  initialized = true;

  initMessageWorker(role);

  const gameState = useGameState.getState();
  const liveState = useLiveState.getState();

  listenToWorkerMessages((msg) => {
    switch (msg.type) {
      case "init":
        console.log("Worker initialized with ID: ", msg.data);
        break;
      case "broadcast":
        if (
          typeof msg.data === "object" &&
          typeof msg.data.action === "string"
        ) {
          if (msg.data.action === "player") {
            gameState.setPlayer({
              ...msg.data.payload,
              address: 0,
              type: "player",
            });
          } else if (msg.data.action === "actors") {
            gameState.setActors(msg.data.payload);
          } else if (msg.data.action === "runningGames") {
            liveState.setRunningGames(msg.data.payload);
          } else if (msg.data.action === "connectedClients") {
            liveState.setConnectedClients(msg.data.payload);
          } else if (msg.data.action === "openDevTools") {
            if (msg.data.payload.url === location.href) {
              openDevTools();
            }
          } else if (msg.data.action === "closeWebViews") {
            if (msg.data.payload.includes(location.href)) {
              postWebviewMessage({
                action: "clickthroughOverlayWebView",
                payload: {
                  clickthrough: true,
                },
              }).catch(() => {});
              window.chrome.webview.postMessage("close");
            }
          }
        }
        break;
    }
  });

  if (role === "dashboard") {
    requestFromMain({ action: "isRunningAsAdmin", payload: null })
      .then((res) => {
        liveState.setIsRunningAsAdmin(res.data);
      })
      .catch(console.error);
    requestFromMain({ action: "isTaskInstalled", payload: null })
      .then((res) => {
        liveState.setIsTaskInstalled(res.data);
      })
      .catch(console.error);
    requestFromMain({ action: "getVersion", payload: null })
      .then((res) => {
        liveState.setVersion(res.data);
      })
      .catch(console.error);
  }
}
