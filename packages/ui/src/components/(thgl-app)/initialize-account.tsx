"use client";
import { THGLAccount, useAccountStore } from "@repo/lib";
import { useEffect } from "react";

export function InitializeAccount({
  account,
}: {
  account: THGLAccount | null;
}) {
  useEffect(() => {
    if (!account) {
      // Server couldn't determine the account state (token store or
      // Patreon unreachable). Keep the last persisted state instead of
      // signing the user out — see getAccount() in games-web.
      console.log("Account state unknown — keeping persisted state");
      return;
    }
    console.log("Account received:", account);
    useAccountStore.getState().setAccount(account);
  }, []);

  return null;
}
