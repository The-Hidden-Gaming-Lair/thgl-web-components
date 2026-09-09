import { repairMisimportedFilters } from "./filter-import";
import { dedupeMyFilters, unionMyFiltersOnRehydrate } from "./filters-sync";
import type { DrawingsAndNodes, Profile } from "./settings";

/**
 * Pure pieces of the settings store's persist `merge` / `partialize` paths.
 *
 * Every helper they call (union, dedupe, repair, tombstones) is tested on its
 * own; what kept re-breaking in 2026-09 was the ORDER they run in and the
 * write-back into the profile — so that composition lives here, with the
 * storage-reading predicates injected, and the store only wires it up.
 */

export type IsTombstoned = (filter: DrawingsAndNodes) => boolean;

/**
 * Strip tombstoned filters from one profile's settings snapshot, for the
 * profile-flatten sites (switch/delete/import). Same reference when nothing
 * is removed. A profile without a `myFilters` key is returned as-is —
 * flattening must not clear the root list in that legacy case.
 */
export function cleanProfileSettingsForFlatten(
  settings: Profile["settings"],
  isTombstoned: IsTombstoned,
): Profile["settings"] {
  if (!settings?.myFilters?.length) return settings;
  const filtered = filterOut(settings.myFilters, isTombstoned);
  return filtered === settings.myFilters
    ? settings
    : { ...settings, myFilters: filtered };
}

/**
 * Strip tombstoned filters from every profile snapshot. Runs on every store
 * write (`partialize`) and on every rehydrate, so identity is preserved when
 * nothing changes — a fresh array here would be a storage write per state
 * change. Never mutates the input.
 */
export function stripTombstonedFromProfiles(
  profiles: Profile[],
  isTombstoned: IsTombstoned,
): Profile[] {
  let changed = false;
  const cleaned = profiles.map((profile) => {
    const myFilters = profile.settings?.myFilters;
    if (!myFilters?.length) return profile;
    const filtered = filterOut(myFilters, isTombstoned);
    if (filtered === myFilters) return profile;
    changed = true;
    return {
      ...profile,
      settings: { ...profile.settings, myFilters: filtered },
    };
  });
  return changed ? cleaned : profiles;
}

function filterOut(
  filters: DrawingsAndNodes[],
  isTombstoned: IsTombstoned,
): DrawingsAndNodes[] {
  let changed = false;
  const kept = filters.filter((f) => {
    const drop = isTombstoned(f);
    if (drop) changed = true;
    return !drop;
  });
  return changed ? kept : filters;
}

/**
 * Reconcile just-loaded persisted profiles with the in-memory state on
 * rehydrate (mount AND cross-window storage events), for the current profile:
 *
 * 1. strip tombstoned filters (a stale window may have written a deleted
 *    filter back),
 * 2. union in-memory local adds the writing window did not know about —
 *    ONLY when the rehydrate stays on the same profile (a switch made by
 *    another window would otherwise leak filters across profiles), and never
 *    a filter a sibling window just dropped as deleted-elsewhere,
 * 3. heal same-name twins the pre-name-matching union minted,
 * 4. heal filters an older file import wrapped whole into `drawing`.
 *
 * The reconciled list is written into the returned profile too (not just the
 * flat root the caller assigns), because `partialize` persists `profiles`, so
 * the next write must carry a resurrected filter back to disk. The input
 * profiles are never mutated.
 */
export function reconcileRehydratedProfiles(args: {
  profiles: Profile[];
  currentProfileId: string | undefined;
  inMemory: { myFilters?: DrawingsAndNodes[]; currentProfileId?: string };
  isTombstoned: IsTombstoned;
  isRecentHydrateDrop: (id: string) => boolean;
}): { profiles: Profile[]; currentProfile: Profile | undefined } {
  const profiles = stripTombstonedFromProfiles(
    args.profiles,
    args.isTombstoned,
  );
  const index = profiles.findIndex((p) => p.id === args.currentProfileId);
  if (index === -1) return { profiles, currentProfile: undefined };
  const current = profiles[index];

  const sameProfile = args.inMemory.currentProfileId === args.currentProfileId;
  const persistedFilters = current.settings?.myFilters ?? [];
  let reconciled =
    sameProfile && args.inMemory.myFilters?.length
      ? unionMyFiltersOnRehydrate(
          args.inMemory.myFilters,
          persistedFilters,
          (f) =>
            args.isTombstoned(f) ||
            (f.id !== undefined && args.isRecentHydrateDrop(f.id)),
        )
      : persistedFilters;
  reconciled = dedupeMyFilters(reconciled);
  reconciled = repairMisimportedFilters(reconciled);
  if (reconciled === persistedFilters)
    return { profiles, currentProfile: current };

  const updated: Profile = {
    ...current,
    settings: { ...current.settings, myFilters: reconciled },
  };
  const next = profiles.slice();
  next[index] = updated;
  return { profiles: next, currentProfile: updated };
}
