import semver from "semver";
import {
  injectOverlay,
  openControllerWebView,
  openDashboadWebView,
  openDesktopWebView,
  openDevTools,
  openOverlayWebView,
  updateActorTypeFilters,
  updateHotkeys,
} from "./apps";
import { handleRunningGames } from "./games";
import {
  answerRequest,
  answerWebViewRequest,
  initMessageWorker,
  listenToWorkerMessages,
  sendBroadcast,
} from "./worker";
import { useLiveState, usePersistentState } from "./states";
import {
  addScheduledTaskFromWebview,
  CurrentVersion,
  getVersionFromWebview,
  isRunningAsAdminFromWebview,
  isTaskInstalledFromWebview,
  removeScheduledTaskFromWebview,
  triggerUpdate,
} from "./version";
import { Actor, onWebviewMessage, Player } from "./webview";
import { games } from "../games";

let initialized = false;
let firstPlayerReceived = false;
let firstActorsReceived = false;
let firstCharacterDataReceived = false;
let firstGameSpecificReceived = false;
let activeGames: string[] = [];
let updateCheckInterval: NodeJS.Timeout | null = null;
let updateTriggered = false;

async function checkForUpdates(currentVersion: CurrentVersion) {
  // Don't check for updates if already triggered
  if (updateTriggered) {
    console.log("Update already triggered, skipping check");
    return;
  }
  
  // Don't check for updates if a game is running
  if (activeGames.length > 0) {
    console.log("Skipping update check - game is running:", activeGames);
    return;
  }

  try {
    const response = await getVersionFromWebview();
    const comparedVersion = semver.compare(
      response.data.buildVersion ?? "0.0.0",
      currentVersion.version,
    );
    
    if (comparedVersion === -1 && !updateTriggered) {
      console.log("Update available - triggering update");
      updateTriggered = true;
      await triggerUpdate();
      // Stop further checks since update is triggered
      if (updateCheckInterval) {
        clearInterval(updateCheckInterval);
        updateCheckInterval = null;
      }
    }
  } catch (error) {
    console.error("Failed to check for updates:", error);
  }
}

function startPeriodicUpdateCheck(currentVersion: CurrentVersion, intervalMinutes: number = 30) {
  // Clear any existing interval
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
  }
  
  // Ensure minimum interval of 5 minutes to avoid too frequent checks
  const safeInterval = Math.max(5, intervalMinutes);
  
  // Start periodic check
  updateCheckInterval = setInterval(() => {
    checkForUpdates(currentVersion);
  }, safeInterval * 60 * 1000);
  
  console.log(`Started periodic update check every ${safeInterval} minutes`);
}

export async function initController(currentVersion: CurrentVersion) {
  if (initialized) {
    return;
  }
  initialized = true;
  initMessageWorker("controller");

  let prevPlayer: Player | null;
  let lastActors: Array<Actor> = [];
  let lastGameSpecific: any = null;

  // @ts-ignore
  window.getClosestActors = function () {
    if (!prevPlayer) {
      return null;
    }
    const closestActors = lastActors
      .map((actor) => {
        const dx = actor.x - prevPlayer!.x;
        const dy = actor.y - prevPlayer!.y;
        const dz = actor.z - prevPlayer!.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return { ...actor, distance };
      })
      .sort((a, b) => a.distance - b.distance);
    return {
      player: prevPlayer,
      actors: closestActors,
      gameSpecific: lastGameSpecific,
    };
  };
  onWebviewMessage((message) => {
    switch (message.action) {
      case "runningGames":
        sendBroadcast(message);
        
        // Store previous game count to detect when games close
        const previousGameCount = activeGames.length;
        
        // Update active games list
        activeGames = message.payload.map((game: any) => game.processName);
        
        // Check for updates when all games have closed
        if (previousGameCount > 0 && activeGames.length === 0) {
          setTimeout(() => {
            console.log("Checking for updates after game closed");
            checkForUpdates(currentVersion);
          }, 5000);
        }
        
        handleRunningGames(
          message.payload,
          (runningGame) => {
            const { disabledApps } = usePersistentState.getState();
            console.log("Game started:", runningGame);
            games.forEach((game) => {
              const companion = game.companion;
              if (
                companion?.games.some((g) =>
                  g.processNames.includes(runningGame.processName),
                )
              ) {
                if (!disabledApps.includes(game.id)) {
                  console.log("Opening controller for:", game.id);
                  openControllerWebView(companion.controllerURL);
                } else {
                  console.log("Controller disabled:", game.id);
                }
              }
            });
          },
          (runningGame) => {
            console.log("Game closed:", runningGame.processName);
          },
        );
        break;
      case "player":
        sendBroadcast(message);
        if (!firstPlayerReceived) {
          firstPlayerReceived = true;
          console.log("Player received:", message.payload);
        }
        prevPlayer = message.payload;
        break;
      case "actors":
        sendBroadcast(message);
        if (!firstActorsReceived && message.payload.length > 0) {
          firstActorsReceived = true;
          console.log("Actors received:", message.payload);
        }
        lastActors = message.payload;
        break;
      case "characterData":
        sendBroadcast(message);
        if (!firstCharacterDataReceived) {
          firstCharacterDataReceived = true;
          console.log("Character data received:", message.payload);
        }
        break;
      case "gameSpecific":
        sendBroadcast(message);
        if (!firstGameSpecificReceived) {
          firstGameSpecificReceived = true;
          console.log("Game Specific received:", message.payload);
        }
        lastGameSpecific = message.payload;
        break;
      case "hotkey":
        sendBroadcast(message);
        console.log("Hotkey received:", message.payload.key);
        break;
    }
  });

  // Initial version check
  getVersionFromWebview()
    .then((response) => {
      useLiveState.getState().setVersion(response.data);
      console.log("Version received:", response.data);

      const comparedVersion = semver.compare(
        response.data.buildVersion ?? "0.0.0",
        currentVersion.version,
      );
      if (comparedVersion === 1) {
        console.log("Version is newer than current version.");
      } else if (comparedVersion === -1) {
        console.log("Version is older than current version.");
        
        // Only trigger update if no game is running and not already triggered
        if (activeGames.length === 0 && !updateTriggered) {
          updateTriggered = true;
          triggerUpdate()
            .then(() => {
              console.log("Update triggered.");
            })
            .catch((e) => {
              console.error("Failed to trigger update", e);
              // Reset flag on error so it can be retried
              updateTriggered = false;
            });
        } else if (activeGames.length > 0) {
          console.log("Update available but game is running, will check again later");
        } else {
          console.log("Update already triggered, skipping");
        }
      } else {
        console.log("Version is equal to current version.");
      }
      
      // Start periodic update check (every 30 minutes by default)
      startPeriodicUpdateCheck(currentVersion, 30);
    })
    .catch((e) => {
      console.error("Failed to get version", e);
      // Start periodic check even if initial check fails
      startPeriodicUpdateCheck(currentVersion, 30);
    });

  isRunningAsAdminFromWebview()
    .then((response) => {
      useLiveState.getState().setIsRunningAsAdmin(response.data);
      console.log("Running as admin:", response.data);
    })
    .catch((e) => {
      console.error("Failed to check running as admin", e);
    });

  isTaskInstalledFromWebview()
    .then((response) => {
      useLiveState.getState().setIsTaskInstalled(response.data);
      console.log("Is task installed:", response.data);
    })
    .catch((e) => {
      console.error("Failed to check if task is installed", e);
    });

  listenToWorkerMessages((msg) => {
    switch (msg.type) {
      case "init":
        console.log("Worker initialized with ID: ", msg.data);
        break;
      case "clientList":
        console.log("Client list received: ", msg.data);
        sendBroadcast({
          action: "connectedClients",
          payload: msg.data,
        });
        break;
      case "fromClient":
        switch (msg.data.action) {
          case "isRunningAsAdmin":
            const isRunningAsAdmin = useLiveState.getState().isRunningAsAdmin;
            if (isRunningAsAdmin !== null) {
              answerRequest(msg.from, msg.data, isRunningAsAdmin);
            }
            break;
          case "isTaskInstalled":
            const isTaskInstalled = useLiveState.getState().isTaskInstalled;
            if (isTaskInstalled !== null) {
              answerRequest(msg.from, msg.data, isTaskInstalled);
            }
            break;
          case "addScheduledTask":
            addScheduledTaskFromWebview()
              .then((response) => {
                useLiveState.getState().setIsTaskInstalled(true);
                answerRequest(msg.from, msg.data, response.data);
              })
              .catch((e) => {
                console.error("Failed to add scheduled task", e);
              });
            break;
          case "removeScheduledTask":
            removeScheduledTaskFromWebview()
              .then((response) => {
                useLiveState.getState().setIsTaskInstalled(false);
                answerRequest(msg.from, msg.data, response.data);
              })
              .catch((e) => {
                console.error("Failed to remove scheduled task", e);
              });
            break;
          case "getVersion":
            const version = useLiveState.getState().version;
            if (version) {
              answerRequest(msg.from, msg.data, version);
            }
            break;
          case "openDevTools":
            if (msg.data.payload.url === location.href) {
              openDevTools();
            } else {
              sendBroadcast({
                action: "openDevTools",
                payload: { url: msg.data.payload.url },
              });
            }
            answerRequest(msg.from, msg.data, true);
            break;
          case "closeWebViews":
            sendBroadcast({
              action: "closeWebViews",
              payload: msg.data.payload.urls,
            });
            answerRequest(msg.from, msg.data, true);
            break;
          case "openController":
            answerWebViewRequest(
              msg.from,
              msg.data,
              openControllerWebView(msg.data.payload.url),
            );
            sendBroadcast({
              action: "openController",
              payload: { url: msg.data.payload.url },
            });
            break;
          case "injectOverlay":
            answerWebViewRequest(
              msg.from,
              msg.data,
              injectOverlay(msg.data.payload.processName),
            );
            // window.chrome.webview.postMessage({
            //   requestId: "1",
            //   action: "injectDumper",
            //   payload: {
            //     processName: "X6Game-Win64-Shipping.exe",
            //     dllPath: String.raw`C:\dev\Dumper-7\x64\Release\Dumper-7.dll`,
            //   },
            // });
            break;
          case "openDesktopWebView":
            answerWebViewRequest(
              msg.from,
              msg.data,
              openDesktopWebView(msg.data.payload.url, msg.data.payload.title),
            );
            break;
          case "openOverlayWebView":
            answerWebViewRequest(
              msg.from,
              msg.data,
              openOverlayWebView(msg.data.payload.url, msg.data.payload.title),
            );
            break;
          case "updateHotkeys":
            answerWebViewRequest(
              msg.from,
              msg.data,
              updateHotkeys(msg.data.payload.hotkeys),
            );
            break;
          case "setActorTypeFilter":
            answerWebViewRequest(
              msg.from,
              msg.data,
              updateActorTypeFilters(msg.data.payload.types, msg.data.payload.processName),
            );
            break;
        }
        break;
    }
  });

  const { openDashboardOnStart } = usePersistentState.getState();
  if (openDashboardOnStart) {
    openDashboadWebView();
  }
}
