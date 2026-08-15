import semver from "semver";
import {
  getWindowMode,
  openDashboadWebView,
  openDesktopWebView,
  openOverlayWebView,
  WindowMode,
} from "./apps";
import { handleRunningGames } from "./games";
import { useLiveState, useTHGLAppState } from "./states";
import {
  CurrentVersion,
  getVersionFromWebview,
  triggerUpdate,
} from "./version";
import { onWebviewMessage } from "./webview";
import { games, hasReleasedCompanion } from "../games";

let initialized = false;
let activeGames: string[] = []; // Track running games for update check logic
let updateCheckInterval: NodeJS.Timeout | null = null;
let updateTriggered = false;
let currentWindowMode: WindowMode = "overlay";
let windowModeReady: Promise<void> = Promise.resolve();

// Wait for persistent state to hydrate from storage
function waitForHydration(): Promise<void> {
  return new Promise((resolve) => {
    if (useTHGLAppState.getState()._hasHydrated) {
      resolve();
      return;
    }
    const unsub = useTHGLAppState.subscribe(
      (state) => state._hasHydrated,
      (hasHydrated) => {
        if (hasHydrated) {
          unsub();
          resolve();
        }
      },
    );
  });
}

// Wait for window mode to be loaded from C++
function waitForWindowMode(): Promise<void> {
  return windowModeReady;
}

// Minimum required app version - force update if below this version
// This is used when breaking changes are introduced that require a new app version
const MINIMUM_REQUIRED_VERSION = "3.0.0";

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

function startPeriodicUpdateCheck(
  currentVersion: CurrentVersion,
  intervalMinutes: number = 30,
) {
  // Clear any existing interval
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
  }

  // Ensure minimum interval of 5 minutes to avoid too frequent checks
  const safeInterval = Math.max(5, intervalMinutes);

  // Start periodic check
  updateCheckInterval = setInterval(
    () => {
      checkForUpdates(currentVersion);
    },
    safeInterval * 60 * 1000,
  );

  console.log(`Started periodic update check every ${safeInterval} minutes`);
}

export async function initController(currentVersion: CurrentVersion) {
  if (initialized) {
    return;
  }
  initialized = true;

  // Listen for messages from C++ (runningGames, windowModeChanged, etc.)
  onWebviewMessage((message) => {
    switch (message.action) {
      case "runningGames":
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
          async (runningGame) => {
            // Wait for persistent state to hydrate before checking settings
            await waitForHydration();
            // Wait for window mode to be loaded from C++ to avoid race condition
            await waitForWindowMode();

            const { disabledApps, autoRunGames } = useTHGLAppState.getState();
            console.log(
              "Game started:",
              runningGame,
              "windowMode:",
              currentWindowMode,
            );

            games.forEach((game) => {
              const companion = game.companion;
              // Skip `inDevelopment` companions (e.g. Enshrouded) — they must not
              // auto-open the overlay/desktop when their process is detected. The
              // direct /apps/<id> route still works for manual testing.
              if (!hasReleasedCompanion(game)) {
                return;
              }
              if (
                companion?.games.some((g) =>
                  g.processNames.includes(runningGame.processName),
                )
              ) {
                // Check if auto-run is enabled for this game (defaults to true)
                const autoRunEnabled = autoRunGames[game.id] ?? true;

                if (disabledApps.includes(game.id)) {
                  console.log("App disabled:", game.id);
                } else if (!autoRunEnabled) {
                  console.log("Auto-run disabled for:", game.id);
                } else {
                  // Open windows based on window mode setting from C++
                  console.log(
                    "Opening window(s) for:",
                    game.id,
                    "mode:",
                    currentWindowMode,
                  );

                  if (
                    currentWindowMode === "overlay" ||
                    currentWindowMode === "both"
                  ) {
                    openOverlayWebView(companion.overlayURL, `${game.title}`);
                  }
                  if (
                    currentWindowMode === "desktop" ||
                    currentWindowMode === "both"
                  ) {
                    openDesktopWebView(companion.desktopURL, `${game.title}`);
                  }
                }
              }
            });
          },
          (runningGame) => {
            console.log("Game closed:", runningGame.processName);
          },
        );
        break;
      case "gameSession":
        console.log("Game session update:", message.payload);
        break;
      case "windowModeChanged":
        currentWindowMode = message.payload;
        useLiveState.getState().setWindowMode(message.payload);
        console.log("Window mode changed:", message.payload);
        break;
    }
  });

  // Initial version check
  getVersionFromWebview()
    .then((response) => {
      useLiveState.getState().setVersion(response.data);
      console.log("Version received:", response.data);

      const appVersion = response.data.buildVersion ?? "0.0.0";

      // Check if app version is below minimum required version
      // This forces an update even if a game is running (breaking changes)
      if (semver.lt(appVersion, MINIMUM_REQUIRED_VERSION)) {
        console.log(
          `App version ${appVersion} is below minimum required ${MINIMUM_REQUIRED_VERSION} - forcing update`,
        );
        if (!updateTriggered) {
          updateTriggered = true;
          triggerUpdate()
            .then(() => {
              console.log(
                "Forced update triggered due to minimum version requirement.",
              );
            })
            .catch((e) => {
              console.error("Failed to trigger forced update", e);
              updateTriggered = false;
            });
        }
        // Don't start periodic checks - we're forcing an update
        return;
      }

      const comparedVersion = semver.compare(
        appVersion,
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
          console.log(
            "Update available but game is running, will check again later",
          );
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

  // Load window mode from C++ config
  windowModeReady = getWindowMode()
    .then((response) => {
      currentWindowMode = response.data;
      useLiveState.getState().setWindowMode(response.data);
      console.log("Window mode loaded:", response.data);
    })
    .catch((e) => {
      console.error(
        "Failed to get window mode, using default:",
        currentWindowMode,
      );
    });

  // Wait for hydration before checking dashboard preference
  waitForHydration().then(() => {
    const { openDashboardOnStart } = useTHGLAppState.getState();
    if (openDashboardOnStart) {
      openDashboadWebView();
    }
  });
}
