"use client";
// Everything here is a React hook, and `useHasMounted` needs useState/useEffect —
// those are Client-Component-only, and this module is re-exported from the
// `@repo/lib` barrel that server components import (same reason
// `overlay-map-hide.ts` carries the directive).
import { useMemo, useCallback, useEffect, useState } from "react";
import { useSettingsStore } from "./settings";
import { useAccountStore } from "./account";
import { buildDiscoveryLookup, checkNodeDiscovered } from "./coordinates";
import { isDebug, isLocalDev } from "./env";
import { resolveAccountGate, type AccountGate } from "./account-gate";

/**
 * False during SSR **and during the first client render**, true from the second
 * render on (a `useEffect` flips it right after hydration).
 *
 * Use this to guard ANY render-time value that only exists in the browser —
 * `isLocalDev`, `isDebug()`, `isThglApp`, `window.*`, a persisted store that
 * rehydrates synchronously. Reading such a value directly while rendering makes
 * the first client render disagree with the server HTML, which is exactly what
 * React reports as "Hydration failed because the server rendered HTML didn't
 * match the client" — and React then throws away the server markup and
 * re-renders the whole subtree (visibly: the server's version of the UI flashes
 * and is replaced).
 */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * Resolve an account-derived permission into allow / deny / **pending**, in a
 * way that is safe to branch on while rendering.
 *
 * - "pending" — SSR and the first client render (and afterwards until the
 *   persisted account store has rehydrated). Render the neutral state; NEVER
 *   render the locked state for "pending", or the lock ends up in the server
 *   HTML and flashes.
 * - "allow"   — the account has the permission, or we're on a dev/debug host.
 * - "deny"    — the account is known and lacks the permission.
 *
 * The dev/debug bypass (`isLocalDev` — the games-web dev server and the THGLApp
 * DEBUG build, which loads app-dev.localhost:3100 — plus the `DEBUG`
 * localStorage escape hatch) is deliberately evaluated AFTER `useHasMounted`:
 * both read `window`, so on the server they are false, and deciding on them
 * during the first client render is a hydration mismatch.
 *
 * @param hasPermission the account-derived flag (a perk, an invite, …)
 */
export function useAccountGate(hasPermission: boolean): AccountGate {
  const hasHydrated = useAccountStore((s) => s._hasHydrated);
  const mounted = useHasMounted();
  return resolveAccountGate({
    mounted,
    devBypass: isLocalDev || isDebug(),
    hasHydrated,
    hasPermission,
  });
}

/**
 * Hook that provides an optimized isDiscovered checker function.
 * - Builds lookup structures once when discoveredNodes changes (via useMemo)
 * - Caches nodeId.split("@") results to avoid repeated string operations
 * - All lookups are O(1)
 * - Supports backward compatibility: matches by coordinates when type IDs change
 *
 * @example
 * const isDiscovered = useDiscoveredChecker();
 * const discovered = isDiscovered(nodeId);
 */
export const useDiscoveredChecker = () => {
  const discoveredNodes = useSettingsStore((state) => state.discoveredNodes);

  // Build lookup structures once when discoveredNodes changes
  // splitCache is fresh each time, caching splits within a render cycle
  const lookup = useMemo(
    () => buildDiscoveryLookup(discoveredNodes),
    [discoveredNodes],
  );

  // Stable function reference that uses the cached lookup
  const isDiscovered = useCallback(
    (nodeId: string): boolean => checkNodeDiscovered(nodeId, lookup),
    [lookup],
  );

  return isDiscovered;
};
