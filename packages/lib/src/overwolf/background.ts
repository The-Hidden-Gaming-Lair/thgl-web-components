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
import { useAccountStore } from "../account";
import { HOTKEYS } from "./hotkeys";
import { useSettingsStore } from "../settings";
import { dispose, loadDiscordRPCPlugin } from "./discord";

export async function initBackground(
  gameClassId: number,
  appId: string,
  discordApplicationId: string,
) {
  const openApp = async (
    event?: overwolf.extensions.AppLaunchTriggeredEvent,
  ) => {
    const search = new URLSearchParams(location.search);
    const origin = event?.origin ?? search.get("source");
    const parameter = event?.parameter ?? location.search;
    let userId = useAccountStore.getState().userId;
    if (origin === "urlscheme" && parameter) {
      const matchedUserId =
        decodeURIComponent(parameter).match("userId=([^&]*)");
      const newUserId = matchedUserId ? matchedUserId[1] : null;
      if (newUserId) {
        userId = newUserId;
      }
    }

    handleAppLaunch(gameClassId);

    if (userId) {
      const accountStore = useAccountStore.getState();
      const response = await fetch("https://www.th.gl/api/patreon/overwolf", {
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
        const body = (await response.json()) as { previewAccess: boolean };
        if (!response.ok) {
          console.warn(body);
          if (response.status === 403) {
            accountStore.setAccount(userId, false, false);
          } else if (response.status === 404) {
            accountStore.setAccount(null, false, false);
          }
        } else {
          console.log(`Patreon successfully activated`);
          accountStore.setAccount(userId, true, body.previewAccess);
        }
      } catch (err) {
        console.error(err);
        // accountStore.setAccount(userId, false, false);
      }
    }
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
    }
  });
}
