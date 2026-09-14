/**
 * The decision table behind every account-derived gate (Elite preview access,
 * invite-only companions, …). Kept as a pure, dependency-free function so the
 * ordering — which is the whole point — can be unit-tested; `useAccountGate`
 * (hooks.ts) is the thin React wrapper that feeds it.
 */
export type AccountGate = "allow" | "deny" | "pending";

export function resolveAccountGate({
  mounted,
  devBypass,
  hasHydrated,
  hasPermission,
}: {
  /** `useHasMounted()` — false during SSR and the first client render. */
  mounted: boolean;
  /** `isLocalDev || isDebug()` — browser-only, so ALWAYS false on the server. */
  devBypass: boolean;
  /** The persisted account store finished rehydrating. */
  hasHydrated: boolean;
  /** The account-derived flag being gated on (a perk, an invite, …). */
  hasPermission: boolean;
}): AccountGate {
  // `mounted` FIRST. `devBypass` and the persisted account only exist in the
  // browser; deciding on them during the first client render makes that render
  // disagree with the server HTML, which React reports as "Hydration failed
  // because the server rendered HTML didn't match the client" and repairs by
  // re-rendering the whole subtree — visibly, the server's version of the UI
  // (the lock) flashes and is replaced.
  if (!mounted) return "pending";
  if (devBypass) return "allow";
  // Account not loaded yet: still unknown, NOT a denial — otherwise the paywall
  // flashes at users who do have access.
  if (!hasHydrated) return "pending";
  return hasPermission ? "allow" : "deny";
}
