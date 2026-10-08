"use client";

import { defaultPerks, useAccountStore } from "@repo/lib";

/**
 * `isTebexAccount`: a Tebex purchase has no Patreon login behind it — the
 * supporter key on the account page is the only way back in, so signing out
 * asks for confirmation first.
 */
export function SignOut({
  isTebexAccount,
  zh,
}: {
  isTebexAccount?: boolean;
  zh?: boolean;
}) {
  return (
    <button
      className="text-sm whitespace-nowrap hover:underline"
      onClick={() => {
        if (
          isTebexAccount &&
          !confirm(
            zh
              ? "你保存账户密钥或付款邮箱了吗？退出登录后需要用它们重新登录。"
              : "Did you save your Account Key or purchase email? You need one of them to sign in again after signing out.",
          )
        ) {
          return;
        }
        // Clear the persisted account too, like the header dialog's Sign Out:
        // InitializeAccount's self-heal re-verifies a stored secret and
        // rewrites the cookie, which silently signed the user back in.
        useAccountStore.getState().setAccount({
          userId: null,
          decryptedUserId: null,
          email: null,
          perks: defaultPerks,
          username: null,
          avatarUrl: null,
        });
        fetch("/api/patreon", { method: "DELETE" }).then(() => {
          location.reload();
        });
      }}
    >
      {zh ? "或退出登录" : "or sign out"}
    </button>
  );
}
