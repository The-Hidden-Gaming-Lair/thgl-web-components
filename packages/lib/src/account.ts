import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { withStorageDOMEvents } from "./dom";
import { TH_GL_URL } from "./env";

export type Perks = {
  adRemoval: boolean;
  previewReleaseAccess: boolean;
  comments: boolean;
  premiumFeatures: boolean;
};

export type THGLAccount = {
  userId: string | null;
  decryptedUserId: string | null;
  email: string | null;
  perks: Perks;
  username: string | null;
  avatarUrl: string | null;
  // PATREON_SPECIAL_USERS member (server-resolved). Only servers know the
  // list, so it rides on the account payload — the dialogs show "Special"
  // instead of a perk-derived tier name.
  isSpecial?: boolean;
};

export const defaultPerks: Perks = {
  adRemoval: false,
  comments: false,
  premiumFeatures: false,
  previewReleaseAccess: false,
};

export const useAccountStore = create(
  subscribeWithSelector(
    persist<{
      _hasHydrated: boolean;
      setHasHydrated: (state: boolean) => void;
      userId: string | null;
      decryptedUserId: string | null;
      email: string | null;
      perks: Perks;
      username: string | null;
      avatarUrl: string | null;
      isSpecial: boolean;
      setAccount: (account: THGLAccount) => void;
      setProfile: (username: string | null, avatarUrl: string | null) => void;
      showUserDialog: boolean;
      setShowUserDialog: (showUserDialog: boolean) => void;
    }>(
      (set) => {
        if (typeof window !== "undefined") {
          try {
            JSON.parse(localStorage.getItem("account-storage") || "");
          } catch (e) {
            localStorage.removeItem("account-storage");
          }
        }

        return {
          _hasHydrated: false,
          setHasHydrated: (state) => {
            set({ _hasHydrated: state });
          },
          userId: null,
          decryptedUserId: null,
          email: null,
          perks: defaultPerks,
          username: null,
          avatarUrl: null,
          isSpecial: false,
          setAccount: (account) => {
            set({
              userId: account.userId,
              decryptedUserId: account.decryptedUserId,
              email: account.email,
              perks: account.perks,
              username: account.username,
              avatarUrl: account.avatarUrl,
              isSpecial: account.isSpecial ?? false,
            });
          },
          setProfile: (username, avatarUrl) => {
            set({ username, avatarUrl });
          },
          showUserDialog: false,
          setShowUserDialog: (showUserDialog) => {
            set({ showUserDialog });
          },
        };
      },
      {
        name: "account-storage",
        onRehydrateStorage: () => (state) => {
          if (!state?._hasHydrated) {
            state?.setHasHydrated(true);
          }
        },
        version: 3,
        migrate: (persistedState: any, version) => {
          if (version === 0) {
            persistedState.perks = {
              adRemoval: persistedState.adRemoval ?? false,
              comments: persistedState.adRemoval ?? false,
              premiumFeatures: persistedState.adRemoval ?? false,
              previewReleaseAccess:
                persistedState.previewReleaseAccess ?? false,
            };
            delete persistedState.adRemoval;
            delete persistedState.previewReleaseAccess;
          }
          if (version <= 1) {
            // Add email field for version 2
            persistedState.email = null;
          }
          if (version <= 2) {
            // Add profile fields for version 3
            persistedState.username = null;
            persistedState.avatarUrl = null;
          }
          return persistedState;
        },
      },
    ),
  ),
);

withStorageDOMEvents(useAccountStore);

export type ReverifiedAccount =
  | {
      status: "ok";
      userId: string;
      decryptedUserId: string | null;
      email: string | null;
      perks: Perks;
      isSpecial: boolean;
    }
  | { status: "not-subscriber" }
  | { status: "invalid" }
  | { status: "unknown" };

/**
 * Re-verify a stored account secret against /api/patreon/overwolf — the
 * cookie-FREE verification path (the secret itself is the credential).
 *
 * Why this exists: the signed-in session is otherwise keyed on the `userId`
 * cookie, and in THGLApp the WebView2 cookie store is DPAPI-bound to the
 * Windows account — any cross-identity launch (Windows Compatibility "Run as
 * administrator" elevating through a second admin account, SYSTEM contexts)
 * silently regenerates the os_crypt key and wipes ALL cookies, while
 * localStorage (this store) survives. The persisted secret can therefore heal
 * the session where the cookie alone would sign the user out.
 *
 * "unknown" = transient (network/5xx/503) — callers must KEEP the persisted
 * state, mirroring the token-store-outage rule in getAccount()/api/patreon.
 */
export async function reverifyAccountSecret(
  secret: string,
): Promise<ReverifiedAccount> {
  try {
    const response = await fetch(`${TH_GL_URL}/api/patreon/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: secret }),
    });
    if (response.ok) {
      const body = (await response.json()) as {
        decryptedUserId: string;
        email: string;
        secret?: string;
        isSpecial?: boolean;
      } & Perks;
      return {
        status: "ok",
        // Prefer the re-minted enriched secret (carries the rotated Patreon
        // token) so the stored credential self-updates like the web cookie.
        userId: body.secret ?? secret,
        decryptedUserId: body.decryptedUserId ?? null,
        email: body.email ?? null,
        perks: {
          adRemoval: body.adRemoval ?? false,
          previewReleaseAccess: body.previewReleaseAccess ?? false,
          comments: body.comments ?? false,
          premiumFeatures: body.premiumFeatures ?? false,
        },
        isSpecial: body.isSpecial ?? false,
      };
    }
    if (response.status === 403) {
      return { status: "not-subscriber" };
    }
    if (response.status === 404 || response.status === 400) {
      // "invalid" (→ sign-out) only for a real API verdict. A missing route
      // (server not yet deployed) also 404s but with an HTML body — that must
      // stay transient, never destroy the session.
      try {
        const body = (await response.json()) as { error?: unknown };
        if (typeof body.error === "string") {
          return { status: "invalid" };
        }
      } catch {
        // non-JSON body — fall through to "unknown"
      }
      return { status: "unknown" };
    }
    return { status: "unknown" };
  } catch {
    return { status: "unknown" };
  }
}
