import {
  WINDOWS,
  applyWindowMode,
  closeMainWindow,
  closeWindow,
  resolveWindowMode,
  restoreWindow,
  toggleActiveWindows,
} from "./windows";
import { getRunningGameInfo } from "./games";
import { defaultPerks, Perks, useAccountStore } from "../account";
import { HOTKEYS } from "./hotkeys";
import { useSettingsStore } from "../settings";
import { dispose, loadDiscordRPCPlugin } from "./discord";
import { logVersion } from "./manifest";
import { TH_GL_URL } from "../config";
import { promisifyOverwolf } from "./promisify";

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
      if (event.gameInfo.isRunning) {
        await applyWindowMode(gameClassId);
      } else {
        console.log("Game stopped");
        await dispose(discordRPCPlugin);
        const mode = await resolveWindowMode();
        if (mode === "overlay") {
          // Overlay-only mode has no desktop window to fall back to -> quit.
          closeMainWindow();
        } else {
          // Desktop / both: the in-game-only overlay is gone with the game;
          // keep the desktop window open.
          closeWindow(WINDOWS.OVERLAY).catch(() => {});
        }
      }
    }
  });
}

async function handleAppLaunch(gameClassId: number) {
  const runningGameInfo = await getRunningGameInfo(gameClassId);

  if (runningGameInfo) {
    await applyWindowMode(gameClassId);
  } else {
    // Game not running: only the desktop window can show (overlay is
    // in_game_only), regardless of the configured mode.
    restoreWindow(WINDOWS.DESKTOP);
  }
}

function initHotkeys() {
  overwolf.settings.hotkeys.onPressed.addListener(async (event) => {
    if (event.name === HOTKEYS.TOGGLE_APP) {
      toggleActiveWindows();
    } else if (event.name === HOTKEYS.TOGGLE_LOCK_APP) {
      useSettingsStore.getState().toggleLockedWindow();
    } else if (event.name === HOTKEYS.TOGGLE_LIVE_MODE) {
      useSettingsStore.getState().cycleLiveMode();
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
        email: string;
        secret?: string;
      } & Perks;
      if (!response.ok) {
        console.warn(body, appId, userId);
        if (response.status === 403) {
          accountStore.setAccount({
            userId,
            decryptedUserId: null,
            email: null,
            perks: defaultPerks,
            username: null,
            avatarUrl: null,
          });
        } else if (response.status === 404) {
          accountStore.setAccount({
            userId: null,
            decryptedUserId: null,
            email: null,
            perks: defaultPerks,
            username: null,
            avatarUrl: null,
          });
        }
      } else {
        console.log(`Patreon successfully activated`, body);
        accountStore.setAccount({
          // Prefer the server-minted enriched secret (carries the
          // rotated Patreon token) so unlocking survives token-store
          // outages. Falls back to the secret we sent.
          userId: body.secret ?? userId,
          decryptedUserId: body.decryptedUserId,
          email: body.email,
          perks: {
            adRemoval: body.adRemoval,
            previewReleaseAccess: body.previewReleaseAccess,
            comments: body.comments,
            premiumFeatures: body.premiumFeatures,
          },
          username: null,
          avatarUrl: null,
        });

        // Send hashed email to Overwolf for better ad targeting
        if (body.email && !body.adRemoval) {
          promisifyOverwolf(
            overwolf.extensions.current.generateUserEmailHashes,
          )(body.email)
            .then(() => {
              console.log("[Overwolf] Hashed email tracking enabled");
            })
            .catch((error) => {
              console.error("Failed to send email to Overwolf:", error);
            });
        }
      }
    } catch (err) {
      console.error(err);
      // accountStore.setAccount(userId, false, false);
    }
  }
}
