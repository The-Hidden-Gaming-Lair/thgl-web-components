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
  // Invite-only companion access (server-resolved from the `app_invites`
  // table, matched by Patreon user id or email): the game ids this account
  // may open when `companion.inviteOnly` is set. `undefined` = the payload
  // did not resolve invites (older server / DB hiccup) — the store KEEPS its
  // persisted list so a transient failure never flickers the gate.
  invites?: string[];
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
      invites: string[];
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
          invites: [],
          setAccount: (account) => {
            set((state) => ({
              userId: account.userId,
              decryptedUserId: account.decryptedUserId,
              email: account.email,
              perks: account.perks,
              username: account.username,
              avatarUrl: account.avatarUrl,
              isSpecial: account.isSpecial ?? false,
              // Signed out → no invites. Otherwise keep the persisted list when
              // the payload carries none (see THGLAccount.invites).
              invites:
                account.userId === null
                  ? []
                  : (account.invites ?? state.invites),
            }));
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
        version: 4,
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
          if (version <= 3) {
            // Add invite-only companion access for version 4
            persistedState.invites = [];
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
      invites?: string[];
    }
  | { status: "not-subscriber"; invites?: string[] }
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
        invites?: string[];
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
        invites: Array.isArray(body.invites) ? body.invites : undefined,
      };
    }
    if (response.status === 403) {
      // Valid account without a tier — it may still hold companion invites.
      let invites: string[] | undefined;
      try {
        const body = (await response.json()) as { invites?: unknown };
        invites = Array.isArray(body.invites)
          ? (body.invites as string[])
          : undefined;
      } catch {
        // non-JSON body — leave invites unknown
      }
      return { status: "not-subscriber", invites };
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
