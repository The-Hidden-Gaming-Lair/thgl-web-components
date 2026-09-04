import { create } from "zustand";

/**
 * How the deployed build relates to the one this tab is running.
 *
 *  - `current` — in sync (or detection is disabled, e.g. `next dev`).
 *  - `stale`   — a newer build is deployed but this tab still works. Surfaced
 *                as a quiet, always-visible header button; a toast fires at
 *                most once per 24h (see `shouldShowStaleToast`).
 *  - `broken`  — the running build tried to lazy-load a chunk that no longer
 *                resolves, so navigation is dead until the user reloads. Loud
 *                and unthrottled.
 *
 * `broken` outranks `stale` and is never downgraded.
 */
export type AppUpdateStatus = "current" | "stale" | "broken";

type AppUpdateState = {
  status: AppUpdateStatus;
  markStale: () => void;
  markBroken: () => void;
};

/**
 * Deliberately NOT persisted: the build identity this tab compares against is
 * baked into its own bundle, so the status is only meaningful for the lifetime
 * of one page load. (The once-per-24h toast throttle IS persisted — separately,
 * in localStorage — because that one has to survive reloads.)
 */
export const useAppUpdateStore = create<AppUpdateState>((set) => ({
  status: "current",
  markStale: () =>
    set((state) => (state.status === "current" ? { status: "stale" } : state)),
  markBroken: () =>
    set((state) => (state.status === "broken" ? state : { status: "broken" })),
}));
