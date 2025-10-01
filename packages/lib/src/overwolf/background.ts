import {
  WINDOWS,
  closeMainWindow,
  closeWindow,
  getPreferedWindowName,
  moveToOtherScreen,
  restoreWindow,
  toggleWindow,
} from "./windows";
import { getRunningGameInfo } from "./games";
import { defaultPerks, Perks, useAccountStore } from "../account";
import { HOTKEYS } from "./hotkeys";
import { useSettingsStore } from "../settings";
import { dispose, loadDiscordRPCPlugin } from "./discord";
import { logVersion } from "./manifest";
import { TH_GL_URL } from "../config";

export async function initBackground(
  gameClassId: number,
  appId: string,
  discordApplicationId: string,
) {
  logVersion();

  const openApp = async (
    event?: overwolf.extensions.AppLaunchTriggeredEvent,
  ) => {
    console.log("App launch triggered", event?.origin);

    const search = new URLSearchParams(location.search);
    const origin = event?.origin ?? search.get("source");
    const parameter = event?.parameter ?? location.search;

    handleAppLaunch(gameClassId);

    const hasHydratedSub = useAccountStore.subscribe(
      (state) => state._hasHydrated,
      (hasHydrated) => {
        if (hasHydrated) {
          refreshSubscriberStatus(appId, origin, parameter)
            .then(() => {
              console.log("Subscriber status refreshed");
            })
            .catch((err) => {
              console.error(err);
            })
            .finally(() => {
              hasHydratedSub();
            });
        }
      },
      {
        fireImmediately: true,
      },
    );
  };
  openApp();

  overwolf.extensions.onAppLaunchTriggered.addListener(openApp);

  initHotkeys();

  const discordRPCPlugin = await loadDiscordRPCPlugin(discordApplicationId);
  overwolf.games.onGameInfoUpdated.addListener(async (event) => {
    if (event.runningChanged && event.gameInfo?.classId === gameClassId) {
      const preferedWindowName = await getPreferedWindowName();
      if (event.gameInfo.isRunning) {
        if (preferedWindowName === WINDOWS.OVERLAY) {
          restoreWindow(WINDOWS.OVERLAY);
          closeWindow(WINDOWS.DESKTOP);
        } else {
          restoreWindow(WINDOWS.DESKTOP);
          closeWindow(WINDOWS.OVERLAY);
        }
      } else {
        console.log("Game stopped -> Closing App");
        await dispose(discordRPCPlugin);
        if (preferedWindowName === WINDOWS.OVERLAY) {
          closeMainWindow();
        }
      }
    }
  });
}

async function handleAppLaunch(gameClassId: number) {
  const runningGameInfo = await getRunningGameInfo(gameClassId);

  if (runningGameInfo) {
    const preferedWindowName = await getPreferedWindowName();
    const windowId = await restoreWindow(preferedWindowName);
    if (preferedWindowName === WINDOWS.DESKTOP) {
      moveToOtherScreen(windowId, runningGameInfo.monitorHandle.value);
    }
  } else {
    restoreWindow(WINDOWS.DESKTOP);
  }
}

function initHotkeys() {
  overwolf.settings.hotkeys.onPressed.addListener(async (event) => {
    if (event.name === HOTKEYS.TOGGLE_APP) {
      const preferedWindowName = await getPreferedWindowName();
      toggleWindow(preferedWindowName);
    } else if (event.name === HOTKEYS.TOGGLE_LOCK_APP) {
      useSettingsStore.getState().toggleLockedWindow();
    } else if (event.name === HOTKEYS.TOGGLE_LIVE_MODE) {
      useSettingsStore.getState().toggleLiveMode();
    }
  });
}

async function refreshSubscriberStatus(
  appId: string,
  origin: string | null,
  parameter: string,
) {
  const accountStore = useAccountStore.getState();
  let userId = accountStore.userId;
  if (origin === "urlscheme" && parameter) {
    const matchedUserId = decodeURIComponent(parameter).match("userId=([^&]*)");
    const newUserId = matchedUserId ? matchedUserId[1] : null;
    if (newUserId) {
      userId = newUserId;
      console.log(`New userId: ${newUserId}`);
    }
  }

  if (userId) {
    const response = await fetch(`${TH_GL_URL}/api/patreon/overwolf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appId,
        userId,
      }),
    });
    try {
      const body = (await response.json()) as {
        expiresIn: number;
        decryptedUserId: string;
      } & Perks;
      if (!response.ok) {
        console.warn(body, appId, userId);
        if (response.status === 403) {
          accountStore.setAccount(userId, null, defaultPerks);
        } else if (response.status === 404) {
          accountStore.setAccount(null, null, defaultPerks);
        }
      } else {
        console.log(`Patreon successfully activated`, body);
        accountStore.setAccount(userId, body.decryptedUserId, {
          adRemoval: body.adRemoval,
          previewReleaseAccess: body.previewReleaseAccess,
          comments: body.comments,
          premiumFeatures: body.premiumFeatures,
        });
      }
    } catch (err) {
      console.error(err);
      // accountStore.setAccount(userId, false, false);
    }
  }
}
