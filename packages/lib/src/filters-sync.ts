import type { DrawingsAndNodes } from "./settings";

/**
 * Pure decision core for {@link hydrateFiltersFromServer}. Kept dependency-free
 * (type-only import) so it can be unit-tested without instantiating the zustand
 * store (which touches `window`).
 *
 * Reconciles the local `myFilters` list against the server's authoritative view
 * for a signed-in user. The hard problem is telling two look-alike states apart
 * for a local filter that carries a server `id` the server no longer returns:
 *
 *   a) it was DELETED on another device/surface  → must be dropped locally,
 *      otherwise the next `scheduleFilterSync` re-upserts it (the "filters keep
 *      coming back" resurrection bug), and
 *   b) its first upload never landed (id assigned locally by `addMyFilter`, PUT
 *      lost to a fast reload / offline / error) → must be KEPT, or we silently
 *      lose data the user just created.
 *
 * The `synced` flag disambiguates: it is set true only once we've *confirmed*
 * the id exists on the server (a successful PUT, or the id appearing in a
 * hydrate response). So "absent from server AND `synced`" ⇒ deleted (a) ⇒ drop;
 * "absent from server AND NOT `synced`" ⇒ never uploaded (b) ⇒ keep.
 *
 * @param local  current `myFilters`
 * @param server the server's filters, already converted via `serverFilterToLocal`
 * @returns `merged` — the reconciled list to store; `resyncIds` — ids whose
 *          local copy should be re-pushed (server copy was empty but local had
 *          data, so the two must converge upward).
 *
 * @param pendingIds ids with a queued or in-flight PUT. Their local copy is
 *          kept verbatim — never overwritten by the (possibly stale) server
 *          copy and never dropped — so a re-hydrate triggered while an edit is
 *          still uploading can't clobber it. Matters once hydrate runs on
 *          focus/visibility (not just at mount).
 */
export function mergeHydratedFilters(
  local: DrawingsAndNodes[],
  server: DrawingsAndNodes[],
  pendingIds: ReadonlySet<string> = new Set(),
): { merged: DrawingsAndNodes[]; resyncIds: string[] } {
  const serverById = new Map(
    server.filter((f) => f.id).map((f) => [f.id as string, f]),
  );
  const hasData = (f: DrawingsAndNodes) =>
    (f.nodes?.length ?? 0) > 0 || !!f.drawing;

  const merged: DrawingsAndNodes[] = [];
  const resyncIds: string[] = [];
  const seenIds = new Set<string>();

  for (const localFilter of local) {
    if (localFilter.id && pendingIds.has(localFilter.id)) {
      // An upload for this filter is queued/in-flight → it is the source of
      // truth. Keep the local copy untouched (don't take the stale server copy,
      // don't drop it) and mark it seen so it isn't re-appended below.
      merged.push(localFilter);
      seenIds.add(localFilter.id);
    } else if (localFilter.id && serverById.has(localFilter.id)) {
      const serverFilter = serverById.get(localFilter.id)!;
      // Guard against destroying local markers/drawings that never finished
      // uploading (e.g. an edit made just before reload): if the server copy is
      // empty but the local one has content, keep local and push it back up so
      // the two converge.
      if (hasData(localFilter) && !hasData(serverFilter)) {
        merged.push({ ...localFilter, synced: true });
        resyncIds.push(localFilter.id);
      } else {
        merged.push({ ...serverFilter, synced: true });
      }
      seenIds.add(localFilter.id);
    } else if (localFilter.id && localFilter.synced) {
      // Confirmed on the server before, now gone → deleted on another
      // device/surface. Drop it so the deletion propagates instead of being
      // resurrected by the next sync. (Do not re-add to `merged`.)
      continue;
    } else {
      // No id, or an id whose upload was never confirmed (`synced` falsy) →
      // keep so we don't lose data the user just created but couldn't upload.
      merged.push(localFilter);
    }
  }

  // Append server-only filters (created on another device). They are, by
  // definition, on the server → synced.
  for (const [id, filter] of serverById) {
    if (!seenIds.has(id)) merged.push({ ...filter, synced: true });
  }

  return { merged, resyncIds };
}
