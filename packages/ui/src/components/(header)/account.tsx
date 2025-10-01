"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";
import {
  defaultPerks,
  Perks,
  TH_GL_URL,
  useAccountStore,
  useSettingsStore,
} from "@repo/lib";

export function Account() {
  useEffect(() => {
    let userId = Cookies.get("userId");
    const refreshState = async () => {
      const state = useAccountStore.getState();
      if (!userId) {
        if (
          state.userId ||
          state.perks.adRemoval ||
          state.perks.premiumFeatures ||
          state.perks.previewReleaseAccess
        ) {
          state.setAccount(null, null, defaultPerks);
        }
        return;
      }
      const response = await fetch(TH_GL_URL + "/api/patreon", {
        credentials: "include",
      });
      try {
        const body = (await response.json()) as {
          expiresIn: number;
          decryptedUserId: string;
        } & Perks;
        if (!response.ok) {
          console.warn(body);
          if (response.status === 403) {
            state.setAccount(userId, null, defaultPerks);
          } else if (response.status === 404) {
            state.setAccount(null, null, defaultPerks);
            Cookies.remove("userId");
          } else if (response.status === 400) {
            state.setAccount(null, null, defaultPerks);
            Cookies.remove("userId");
          }
        } else {
          console.log(`Patreon successfully activated`, body);
          state.setAccount(userId, body.decryptedUserId, {
            adRemoval: body.adRemoval,
            previewReleaseAccess: body.previewReleaseAccess,
            comments: body.comments,
            premiumFeatures: body.premiumFeatures,
          });
        }
      } catch (err) {
        console.error(err);
        state.setAccount(userId, null, defaultPerks);
      }
    };
    refreshState();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const newUserId = Cookies.get("userId");
        if (newUserId !== userId) {
          userId = newUserId;
          refreshState();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const searchParams = new URLSearchParams(location.search);
    const peerCode = searchParams.get("peer_code");
    if (peerCode) {
      const settingsStore = useSettingsStore.getState();
      settingsStore.setAutoJoinPeer(true);
      settingsStore.setPeerCode(peerCode);
      window.history.replaceState(null, "", window.location.pathname);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return <></>;
}
