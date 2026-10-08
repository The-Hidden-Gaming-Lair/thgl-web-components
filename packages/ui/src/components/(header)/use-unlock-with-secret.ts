import { useState } from "react";
import { toast } from "sonner";
import {
  defaultPerks,
  isOverwolf,
  type Perks,
  TH_GL_URL,
  useAccountStore,
} from "@repo/lib";
import { restoreUserIdCookie } from "./user-id-cookie";

/**
 * Signs in with a pasted account secret: an Overwolf secret from the web
 * account page, or a Supporter Key (accounts without a Patreon login, e.g.
 * Tebex purchases). Shared by the header sign-in dialog (web) and the
 * Companion App's account dialog.
 *
 * /api/patreon/overwolf: 200 = supporter (perks), 403 = valid account
 * without a paid tier (still signed in), 404 = unknown secret.
 */
export function useUnlockWithSecret() {
  const account = useAccountStore();
  const [loading, setLoading] = useState(false);

  const unlock = async (userId: string) => {
    if (loading) return;
    setLoading(true);
    const response = await fetch(`${TH_GL_URL}/api/patreon/overwolf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    try {
      const body = (await response.json()) as {
        expiresIn: number;
        decryptedUserId: string;
        email: string;
        secret?: string;
        invites?: string[];
      } & Perks;
      // Invite-only companion access rides on both the ok and the 403 body.
      const invites = Array.isArray(body.invites) ? body.invites : undefined;
      if (!response.ok) {
        if (response.status === 403) {
          account.setAccount({
            userId,
            decryptedUserId: null,
            email: null,
            perks: defaultPerks,
            username: null,
            avatarUrl: null,
            invites,
          });
          // 403 = a valid account without a paid tier (e.g. a free Tebex
          // account) - still signed in, so server pages need the cookie too.
          if (!isOverwolf) restoreUserIdCookie(userId);
          toast("User is not a subscriber");
        } else if (response.status === 404) {
          account.setAccount({
            userId: null,
            decryptedUserId: null,
            email: null,
            perks: defaultPerks,
            username: null,
            avatarUrl: null,
          });
          toast("Invalid secret");
        } else if ("error" in body && typeof body.error === "string") {
          toast(body.error);
        }
      } else {
        account.setAccount({
          // Prefer the server-minted enriched secret (carries the
          // rotated Patreon token) — keeps unlocking working when the
          // token store is unreachable.
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
          invites,
        });
        // Web / Companion App: server-rendered pages read the cookie, so
        // write it now instead of waiting for the next-load self-heal.
        if (!isOverwolf) restoreUserIdCookie(body.secret ?? userId);
        toast("Subscription enabled");
      }
    } catch {
      toast("An error occurred. Please try again later.");
    }
    setLoading(false);
  };

  return { unlock, loading };
}
