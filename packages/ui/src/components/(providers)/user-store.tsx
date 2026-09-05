"use client";

import { createContext, useContext } from "react";
import { useStore } from "zustand";
import type { UserStore, UserStoreState } from "@repo/lib";

/**
 * Per-request user store, created and provided by CoordinatesProvider.
 *
 * Previously the store was a module-level singleton (`export let
 * useUserStore` in @repo/lib) lazily initialised from the request URL. On
 * the server that single instance was shared across all concurrent
 * requests, so one tenant's map state could bleed into another tenant's
 * SSR HTML — and it caused React 19 hydration mismatches. The store is now
 * created once per provider (per request on the server, per mount on the
 * client) and shared via this React context.
 *
 * These live in @repo/ui (not @repo/lib) because `createContext` is a
 * client-only API and would break Server Components that import @repo/lib.
 */
export const UserStoreContext = createContext<UserStore | null>(null);

const identityUserSelector = (state: UserStoreState) => state;

/**
 * Subscribe to the current request's user store with a selector. The call
 * signature matches the previous zustand hook, including the no-argument
 * form (returns the whole state).
 */
export function useUserStore<T = UserStoreState>(
  selector?: (state: UserStoreState) => T,
): T {
  const store = useContext(UserStoreContext);
  if (!store) {
    throw new Error("useUserStore must be used within a CoordinatesProvider");
  }
  return useStore(
    store,
    (selector ?? identityUserSelector) as (state: UserStoreState) => T,
  );
}

/**
 * Access the current request's user store instance for imperative use
 * (`getState()` / `subscribe()`) outside React's render flow.
 */
export function useUserStoreApi(): UserStore {
  const store = useContext(UserStoreContext);
  if (!store) {
    throw new Error(
      "useUserStoreApi must be used within a CoordinatesProvider",
    );
  }
  return store;
}

/**
 * Non-throwing variant: returns the store, or `null` when there is no
 * CoordinatesProvider (e.g. a standalone map embed like the /worlds preview).
 * For imperative, best-effort features that can safely no-op without the store.
 */
export function useUserStoreApiOptional(): UserStore | null {
  return useContext(UserStoreContext);
}
