import type { DrawingsAndNodes } from "./settings";

/**
 * Pure cores for the "My Filters" mutation actions, split out of the zustand
 * store so they can be unit-tested (the store itself touches `window`).
 *
 * Every one of these had a bug that only showed up as "sync is broken":
 * the store applied the change locally and then decided what to UPLOAD from
 * stale information. Keeping the decision here, next to its tests, is what
 * makes those cases checkable.
 */

/**
 * Apply a partial update to every filter matching `name`.
 *
 * Returns the updated filters themselves — this is the part that regressed.
 * The store used to re-find the result by the name it was CALLED with, which
 * silently found nothing whenever the patch changed `name` (i.e. every
 * rename), so the rename applied locally and was never uploaded. Returning the
 * objects removes the possibility of looking them up by a key that just moved.
 *
 * All matches are returned, not just the first: duplicate names are reachable
 * (the same filter uploaded under two ids by different surfaces), and patching
 * two filters while uploading one leaves the other silently diverged.
 *
 * `filters` is returned unchanged (same reference) when nothing matches.
 */
export function applyFilterPatch(
  filters: DrawingsAndNodes[],
  name: string,
  patch: Partial<DrawingsAndNodes>,
): { filters: DrawingsAndNodes[]; updated: DrawingsAndNodes[] } {
  const updated: DrawingsAndNodes[] = [];
  const next = filters.map((filter) => {
    if (filter.name !== name) return filter;
    const merged = { ...filter, ...patch };
    updated.push(merged);
    return merged;
  });
  return updated.length ? { filters: next, updated } : { filters, updated };
}

/**
 * Split filters into the ones to keep and the ones being removed.
 *
 * The caller must tombstone AND server-delete every entry in `removed` —
 * dropping them from the array alone is not a delete. A path that skipped that
 * (the settings "Reset" button cleared the array directly) left the server
 * rows intact, so the very next hydrate resurrected everything the user had
 * just cleared: the original "I deleted them all and they came back" bug,
 * on a route that bypassed the tombstone system entirely.
 *
 * `filters` is returned unchanged (same reference) when nothing matches.
 */
export function removeFiltersMatching(
  filters: DrawingsAndNodes[],
  predicate: (filter: DrawingsAndNodes) => boolean,
): { filters: DrawingsAndNodes[]; removed: DrawingsAndNodes[] } {
  const removed = filters.filter(predicate);
  if (removed.length === 0) return { filters, removed };
  return { filters: filters.filter((f) => !predicate(f)), removed };
}
