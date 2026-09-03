"use client";
import {
  defaultPerks,
  reverifyAccountSecret,
  THGLAccount,
  useAccountStore,
} from "@repo/lib";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { restoreUserIdCookie } from "../(header)/user-id-cookie";

export function InitializeAccount({
  account,
}: {
  account: THGLAccount | null;
}) {
  const hasHydrated = useAccountStore((state) => state._hasHydrated);

  useEffect(() => {
    // The persisted store is the healing source below — don't judge
    // "signed out" against a store that hasn't rehydrated yet.
    if (!hasHydrated) {
      return;
    }
    if (!account) {
      // Server couldn't determine the account state (token store or
      // Patreon unreachable). Keep the last persisted state instead of
      // signing the user out — see getAccount() in games-web.
      console.log("Account state unknown — keeping persisted state");
      return;
    }
    if (account.userId) {
      console.log("Account received:", account);
      useAccountStore.getState().setAccount(account);
      return;
    }

    // Server verdict is "signed out" — but that verdict is keyed on the
    // `userId` cookie, and THGLApp's WebView2 cookie store is wiped by any
    // cross-Windows-account launch (DPAPI churn; e.g. Compatibility-forced
    // "Run as administrator" through a second admin account) while the
    // localStorage secret survives. Re-verify the stored secret via the
    // cookie-free endpoint before accepting the sign-out.
    const storedSecret = useAccountStore.getState().userId;
    if (!storedSecret) {
      console.log("Account received:", account);
      useAccountStore.getState().setAccount(account);
      return;
    }

    let cancelled = false;
    (async () => {
      const result = await reverifyAccountSecret(storedSecret);
      if (cancelled) {
        return;
      }
      const store = useAccountStore.getState();
      if (result.status === "ok") {
        console.log("Account healed from persisted secret (cookie was lost)");
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
      } else if (result.status === "not-subscriber") {
        // Valid secret, subscription lapsed — keep the identity, drop perks.
        store.setAccount({
          userId: storedSecret,
          decryptedUserId: store.decryptedUserId,
          email: null,
          perks: defaultPerks,
          username: store.username,
          avatarUrl: store.avatarUrl,
        });
      } else if (result.status === "invalid") {
        // The stored secret itself is dead — the sign-out is real.
        Cookies.remove("userId");
        store.setAccount(account);
      } else {
        // Transient failure — keep the persisted state, retry next launch.
        console.log("Account re-verify unavailable — keeping persisted state");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasHydrated]);

  return null;
}
