"use client";
import { defaultPerks, THGLAccount, useAccountStore } from "@repo/lib";
import { useEffect } from "react";

export function InitializeAccount({ account }: { account: THGLAccount }) {
  useEffect(() => {
    const setAccount = useAccountStore.getState().setAccount;
    if (account) {
      console.log("Account received:", account);
      setAccount(account.userId, account.decryptedUserId, account.perks);
    } else {
      console.log("No account received");
      setAccount(null, null, defaultPerks);
    }
  }, []);

  return null;
}
