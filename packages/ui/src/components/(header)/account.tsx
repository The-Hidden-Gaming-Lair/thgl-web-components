"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";
import {
  API_FORGE_URL,
  defaultPerks,
  Perks,
  reverifyAccountSecret,
  TH_GL_URL,
  useAccountStore,
  useSettingsStore,
} from "@repo/lib";
import { restoreUserIdCookie } from "./user-id-cookie";

async function fetchProfile(token: string) {
  try {
    const res = await fetch(
      `${API_FORGE_URL}/users?userId=${encodeURIComponent(token)}`,
    );
    if (res.ok) {
      const profile = (await res.json()) as {
        userId: string;
        username: string | null;
        generatedUsername: string | null;
        avatarUrl: string | null;
      };
      return {
        decryptedUserId: profile.userId,
        username: profile.username ?? profile.generatedUsername,
        avatarUrl: profile.avatarUrl,
      };
    }
  } catch (err) {
    console.warn("Failed to fetch user profile:", err);
  }
  return { decryptedUserId: null, username: null, avatarUrl: null };
}

export function Account() {
  const accountHasHydrated = useAccountStore((state) => state._hasHydrated);
  const settingsHasHydrated = useSettingsStore((state) => state._hasHydrated);

  useEffect(() => {
    if (!accountHasHydrated) {
      return;
    }
    let userId = Cookies.get("userId");
    const refreshState = async () => {
      const state = useAccountStore.getState();
      if (!userId) {
        // Cookie is gone but the persisted secret may still be valid — the
        // WebView2 cookie store is wiped by any cross-Windows-account launch
        // (DPAPI churn), and cookies also just expire. Re-verify via the
        // cookie-free endpoint before signing the user out.
        const storedSecret = state.userId;
        if (storedSecret) {
          const result = await reverifyAccountSecret(storedSecret);
          const store = useAccountStore.getState();
          if (result.status === "ok") {
            console.log(
              "Account healed from persisted secret (cookie was lost)",
            );
            store.setAccount({
              userId: result.userId,
              decryptedUserId: result.decryptedUserId,
              email: result.email,
              perks: result.perks,
              username: store.username,
              avatarUrl: store.avatarUrl,
              isSpecial: result.isSpecial,
            });
            restoreUserIdCookie(result.userId);
            return;
          }
          if (result.status === "not-subscriber") {
            store.setAccount({
              userId: storedSecret,
              decryptedUserId: store.decryptedUserId,
              email: null,
              perks: defaultPerks,
              username: store.username,
              avatarUrl: store.avatarUrl,
            });
            return;
          }
          if (result.status === "unknown") {
            // Transient — keep the persisted state, retry on next load.
            return;
          }
          // "invalid": the secret is dead — fall through to the sign-out.
        }
        if (
          state.userId ||
          state.perks.adRemoval ||
          state.perks.premiumFeatures ||
          state.perks.previewReleaseAccess
        ) {
          state.setAccount({
            userId: null,
            decryptedUserId: null,
            email: null,
            perks: defaultPerks,
            username: null,
            avatarUrl: null,
          });
        }
        return;
      }

      // Fetch profile for any authenticated user (regardless of subscription)
      const profile = await fetchProfile(userId);

      // Dev: hit the current host so the host-scoped cookie travels.
      // Prod: round-trip to www.th.gl (or wherever TH_GL_URL points).
      // The .th.gl-wide cookie carries either way in prod.
      const patreonUrl =
        process.env.NODE_ENV === "development"
          ? "/api/patreon"
          : `${TH_GL_URL}/api/patreon`;
      const response = await fetch(patreonUrl, {
        credentials: "include",
      });
      try {
        const body = (await response.json()) as {
          expiresIn: number;
          decryptedUserId: string;
          email: string;
          isSpecial?: boolean;
        } & Perks;
        if (!response.ok) {
          console.warn(body);
          if (response.status === 403) {
            state.setAccount({
              userId,
              decryptedUserId: profile.decryptedUserId,
              email: null,
              perks: defaultPerks,
              username: profile.username,
              avatarUrl: profile.avatarUrl,
            });
          } else if (response.status === 404 || response.status === 400) {
            state.setAccount({
              userId: null,
              decryptedUserId: null,
              email: null,
              perks: defaultPerks,
              username: null,
              avatarUrl: null,
            });
            Cookies.remove("userId");
          }
        } else {
          console.log(`Patreon successfully activated`, body);

          state.setAccount({
            userId,
            decryptedUserId: body.decryptedUserId,
            email: body.email,
            perks: {
              adRemoval: body.adRemoval,
              previewReleaseAccess: body.previewReleaseAccess,
              comments: body.comments,
              premiumFeatures: body.premiumFeatures,
            },
            username: profile.username,
            avatarUrl: profile.avatarUrl,
            isSpecial: body.isSpecial ?? false,
          });
        }
      } catch (err) {
        console.error(err);
        state.setAccount({
          userId,
          decryptedUserId: profile.decryptedUserId,
          email: null,
          perks: defaultPerks,
          username: profile.username,
          avatarUrl: profile.avatarUrl,
        });
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
    if (peerCode && settingsHasHydrated) {
      const settingsStore = useSettingsStore.getState();
      settingsStore.setAutoJoinPeer(true);
      settingsStore.setPeerCode(peerCode);
      window.history.replaceState(null, "", window.location.pathname);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [accountHasHydrated, settingsHasHydrated]);

  return <></>;
}
