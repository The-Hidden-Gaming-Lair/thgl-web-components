"use client";

/**
 * `isTebexAccount`: a Tebex purchase has no Patreon login behind it — the
 * supporter key on the account page is the only way back in, so signing out
 * asks for confirmation first.
 */
export function SignOut({ isTebexAccount }: { isTebexAccount?: boolean }) {
  return (
    <button
      className="text-sm hover:underline"
      onClick={() => {
        if (
          isTebexAccount &&
          !confirm(
            "Did you save your Supporter Key? You need it to unlock your perks again after signing out.",
          )
        ) {
          return;
        }
        fetch("/api/patreon", { method: "DELETE" }).then(() => {
          location.reload();
        });
      }}
    >
      or sign out
    </button>
  );
}
