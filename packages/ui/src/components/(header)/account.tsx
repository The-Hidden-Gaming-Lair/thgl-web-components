"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";
import { useAccountStore } from "@repo/lib";

export function Account({ appId }: { appId: string }) {
  useEffect(() => {
    let userId = Cookies.get("userId");
    const refreshState = async () => {
      const state = useAccountStore.getState();
      if (!userId) {
        if (state.userId || state.adRemoval || state.previewReleaseAccess) {
          state.setAccount(null, false, false);
        }
        return;
      }

      const response = await fetch(
        `https://www.th.gl/api/patreon?appId=${appId}`,
        { credentials: "include" }
      );
      try {
        const body = (await response.json()) as { previewAccess: boolean };
        if (!response.ok) {
          console.warn(body);
          state.setAccount(userId, false, false);
        } else {
          console.log(`Patreon successfully activated`);
          state.setAccount(userId, true, body.previewAccess);
        }
      } catch (err) {
        console.error(err);
        state.setAccount(userId, false, false);
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

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return <></>;
}
