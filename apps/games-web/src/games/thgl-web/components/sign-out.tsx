"use client";

import { defaultPerks, useAccountStore } from "@repo/lib";

/**
 * `isTebexAccount`: a Tebex purchase has no Patreon login behind it — the
 * supporter key on the account page is the only way back in, so signing out
 * asks for confirmation first.
 */
export function SignOut({ isTebexAccount }: { isTebexAccount?: boolean }) {
  return (
    <button
      className="text-sm whitespace-nowrap hover:underline"
      onClick={() => {
        if (
          isTebexAccount &&
          !confirm(
            "Did you save your Supporter Key? You need it to unlock your perks again after signing out. / 你保存支持者密钥了吗？退出登录后需要它才能重新解锁权益。",
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
      or sign out
    </button>
  );
}
