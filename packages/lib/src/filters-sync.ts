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
 *          data, so the two must converge upward); `droppedIds` — ids dropped
 *          as "deleted on another device", so the caller can broadcast the
 *          drop to sibling windows (see recordHydrateDrops) — without that
 *          signal a sibling still holding the filter in memory unions it right
 *          back in on the next rehydrate and the delete ping-pongs.
 *
 * @param pendingIds ids with a queued or in-flight PUT. Their local copy is
 *          kept verbatim — never overwritten by the (possibly stale) server
 *          copy and never dropped — so a re-hydrate triggered while an edit is
 *          still uploading can't clobber it. Matters once hydrate runs on
 *          focus/visibility (not just at mount).
 *
 * @param isDeleted deletion-tombstone predicate (see filter-tombstones.ts).
 *          A matching LOCAL filter is dropped — even one with a pending PUT;
 *          the delete intent is newer than the edit. A matching SERVER filter
 *          is not appended: its DELETE is still queued/in-flight (or failed
 *          and will be retried), so a hydrate racing a purge must not
 *          resurrect it (the original "purged them all and they came back").
 */
export function mergeHydratedFilters(
  local: DrawingsAndNodes[],
  server: DrawingsAndNodes[],
  pendingIds: ReadonlySet<string> = new Set(),
  isDeleted: (f: DrawingsAndNodes) => boolean = () => false,
): { merged: DrawingsAndNodes[]; resyncIds: string[]; droppedIds: string[] } {
  const serverById = new Map(
    server.filter((f) => f.id).map((f) => [f.id as string, f]),
  );
  const hasData = (f: DrawingsAndNodes) =>
    (f.nodes?.length ?? 0) > 0 || !!f.drawing;

  const merged: DrawingsAndNodes[] = [];
  const resyncIds: string[] = [];
  const droppedIds: string[] = [];
  const seenIds = new Set<string>();

  for (const localFilter of local) {
    if (localFilter.id && seenIds.has(localFilter.id)) {
      // A duplicate local copy of an id already resolved above. Resolving each
      // twin independently emitted the server row once PER twin, so a pair of
      // duplicates bred into a pair of IDENTICAL duplicates on every hydrate —
      // a multiplier behind the "flooded with duplicates" reports. One server
      // row can only ever become one local filter.
      continue;
    }
    if (isDeleted(localFilter)) {
      // Tombstoned → the user deleted this filter (possibly in another
      // window). Drop it, even over a pending PUT.
      continue;
    }
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
      droppedIds.push(localFilter.id);
      continue;
    } else {
      // No id, or an id whose upload was never confirmed (`synced` falsy) →
      // keep so we don't lose data the user just created but couldn't upload.
      merged.push(localFilter);
    }
  }

  // Append server-only filters (created on another device). They are, by
  // definition, on the server → synced. Tombstoned ones are skipped — their
  // server row just hasn't been deleted yet.
  for (const [id, filter] of serverById) {
    if (seenIds.has(id) || isDeleted(filter)) continue;
    merged.push({ ...filter, synced: true });
  }

  return { merged, resyncIds, droppedIds };
}

/**
 * Reconcile the in-memory `myFilters` against a just-loaded persisted copy
 * during a store rehydrate (mount, and — crucially — the cross-window/webview
 * `storage`-event rehydrate).
 *
 * The bug this closes is the mirror image of the deletion-resurrection one that
 * {@link recordFilterTombstone}/{@link filterOutTombstoned} fixed. `myFilters`
 * lives inside the whole settings blob (last-writer-wins on the entire
 * `{profiles, currentProfileId}` object). THGLApp runs several long-lived
 * WebView2 windows sharing ONE localStorage (dashboard + controller always;
 * desktop/overlay on top — two full map windows in "Both" mode). A window
 * holding a snapshot taken BEFORE the user added a filter will, on its next
 * settings write (a hotkey, a live-mode toggle, an icon-size tweak…), persist
 * its whole blob WITHOUT that filter. The resulting storage event rehydrates
 * the window that owns the filter and — with a naive whole-blob merge — clobbers
 * the just-added filter out of the live view, then off disk on the next persist.
 * (Verified live in THGLApp: add → stale cross-window write → filter vanishes.)
 *
 * The rule (mirror of tombstones, but for adds/edits): the persisted copy is
 * authoritative for anything it KNOWS about (so a genuine edit or delete that
 * was just written wins — last-writer-wins), but any in-memory filter the
 * persisted blob has NEVER heard of is a local add the stale writer simply
 * didn't know about → keep it, UNLESS it carries a live tombstone (then it was
 * deliberately deleted elsewhere and must stay gone).
 *
 * Identity: an in-memory filter is "known" to the persisted blob if its server
 * `id` OR its `name` matches a persisted entry. Matching by id-else-name (the
 * first version of this union) minted DUPLICATES around the id-assignment
 * moment: the same logical filter existed in memory WITH an id (assigned by a
 * signed-in `addMyFilter` / first PUT) while a stale window's blob still held
 * the pre-id copy keyed only by name — different keys, both kept, twin filters
 * ("one is broken / one doesn't show" reports). Name-matching collapses them.
 * One asymmetry: if the in-memory copy carries an id and the persisted
 * name-match does NOT, the id (and its sync bookkeeping) is grafted onto the
 * persisted copy — content authority stays with the persisted write
 * (last-writer-wins), but the server identity must survive, or the filter
 * stops syncing AND the next hydrate re-appends the server row as a twin.
 *
 * Returns the `persisted` array UNCHANGED (same reference) when there is
 * nothing to add back or graft, so the hot path (mount, same-state rehydrate)
 * doesn't re-allocate and doesn't spuriously mark state changed.
 *
 * @param inMemory   the store's current `myFilters` (the live view)
 * @param persisted  the just-loaded profile's `myFilters` (already
 *                   tombstone-stripped by the caller)
 * @param isTombstoned deletion-tombstone predicate (see filter-tombstones.ts).
 *                   Callers should fold in `isRecentHydrateDrop` so a filter
 *                   another window just dropped as deleted-elsewhere isn't
 *                   unioned back (the delete ping-pong).
 */
export function unionMyFiltersOnRehydrate(
  inMemory: DrawingsAndNodes[],
  persisted: DrawingsAndNodes[],
  isTombstoned: (f: DrawingsAndNodes) => boolean = () => false,
): DrawingsAndNodes[] {
  if (inMemory.length === 0) return persisted;
  const persistedIds = new Set(
    persisted.filter((f) => f.id).map((f) => f.id as string),
  );
  const persistedNames = new Set(persisted.map((f) => f.name));

  const extras: DrawingsAndNodes[] = [];
  // persisted index → identity-grafted replacement
  const grafts = new Map<number, DrawingsAndNodes>();
  for (const f of inMemory) {
    if (f.id && persistedIds.has(f.id)) continue; // known → persisted wins
    if (persistedNames.has(f.name)) {
      // Known by name. Same logical filter around the id-assignment moment —
      // NOT a new add; keeping both would mint the duplicate twins this
      // function used to create. If the in-memory copy has the server id and
      // the persisted one doesn't, carry the identity over.
      if (f.id) {
        const idx = persisted.findIndex((p) => p.name === f.name && !p.id);
        if (idx !== -1 && !grafts.has(idx)) {
          const p = persisted[idx];
          grafts.set(idx, {
            ...p,
            id: f.id,
            game: p.game ?? f.game,
            synced: f.synced,
          });
        }
      }
      continue;
    }
    if (!isTombstoned(f)) extras.push(f);
  }

  if (extras.length === 0 && grafts.size === 0) return persisted;
  const out = persisted.map((p, i) => grafts.get(i) ?? p);
  return extras.length ? [...out, ...extras] : out;
}

/**
 * Heal duplicate "My Filters" twins that the id-else-name union above already
 * minted for some users before name-matching landed: the same logical filter
 * present twice under one name — once WITH a server id (the synced copy) and
 * once WITHOUT (a stale pre-id snapshot unioned back in).
 *
 * Deliberately conservative — a twin is removed ONLY when doing so cannot lose
 * data: it must be id-less, share its name with an id-carrying filter, carry
 * no drawing, and every node id it has must already exist on the id-carrying
 * copy. Twins with unique content are left alone (better a visible duplicate
 * than silent data loss), as are same-name pairs that BOTH carry ids — those
 * are two real server rows and the server view is authoritative.
 *
 * Returns the input array unchanged (same reference) when nothing is removed.
 */
export function dedupeMyFilters(
  filters: DrawingsAndNodes[],
): DrawingsAndNodes[] {
  if (filters.length < 2) return filters;
  const withId = new Map<string, DrawingsAndNodes[]>();
  for (const f of filters) {
    if (!f.id) continue;
    const list = withId.get(f.name);
    if (list) list.push(f);
    else withId.set(f.name, [f]);
  }
  if (withId.size === 0) return filters;

  const kept = filters.filter((f) => {
    if (f.id) return true;
    const keepers = withId.get(f.name);
    if (!keepers) return true;
    if (f.drawing) return true;
    const keeperNodeIds = new Set(
      keepers.flatMap((k) => (k.nodes ?? []).map((n) => n.id)),
    );
    return !(f.nodes ?? []).every((n) => keeperNodeIds.has(n.id));
  });
  return kept.length === filters.length ? filters : kept;
}

/**
 * Give a server identity to signed-in filters that have content but no `id`,
 * so they can finally be uploaded.
 *
 * `scheduleFilterSync` is a no-op without an `id`, and only `addMyFilter`
 * ever minted one. Several paths produce an id-less filter that the user
 * plainly expects to be theirs, in the cloud:
 *
 *  - **Settings → My Filters → Restore**, which calls `setMyFilters` (plural).
 *    That action is deliberately sync-free — `scheduleFilterSync` uses it to
 *    flip `synced` without re-triggering itself — so a restored backup stayed
 *    local forever while still *looking* synced.
 *  - a filter **healed** from a botched file import (see
 *    `repairMisimportedFilter`), which strips the wrapper's identity.
 *  - a filter created while signed out, kept after signing in.
 *
 * Such a filter is invisible to every other device and can't be shared — the
 * share code would resolve to nothing. Adopting it on hydrate makes the local
 * copy converge upward instead of silently diverging.
 *
 * Empty filters are skipped: an id is only worth minting for something with
 * markers or a drawing to carry, and it avoids uploading placeholder rows for
 * filters the user made but never filled in.
 *
 * @param filters current `myFilters`
 * @param newId   id factory (injected so tests aren't tied to `crypto`)
 * @param game    game id stamped on adopted filters that lack one — the PUT
 *                requires it
 * @returns `filters` unchanged (same reference) when there's nothing to adopt,
 *          plus the ids that were minted so the caller can push them
 */
export function adoptLocalFilters(
  filters: DrawingsAndNodes[],
  newId: () => string,
  game?: string,
): { filters: DrawingsAndNodes[]; adoptedIds: string[] } {
  const adoptedIds: string[] = [];
  const out = filters.map((f) => {
    if (f.id) return f;
    const hasContent = (f.nodes?.length ?? 0) > 0 || !!f.drawing;
    if (!hasContent) return f;
    const id = newId();
    adoptedIds.push(id);
    // `synced` stays falsy: the PUT hasn't happened yet, and claiming
    // otherwise would let a racing hydrate drop it as "deleted elsewhere".
    return { ...f, id, game: f.game ?? game };
  });
  return adoptedIds.length
    ? { filters: out, adoptedIds }
    : { filters, adoptedIds };
}

/**
 * Augment the queued/in-flight PUT set ({@link mergeHydratedFilters}'s
 * `pendingIds`) with ids whose PUT SUCCEEDED within the last `graceMs`.
 *
 * Why: hydrate drops a "synced but absent-from-server" filter as "deleted on
 * another device". But a filter saved moments ago races that rule — a
 * signed-in add schedules a debounced PUT; a `hydrateFiltersFromServer` fired
 * on mount/focus/visibility can fetch the server list BEFORE that PUT commits
 * (or before a read-replica catches up), so the list omits the filter, WHILE
 * the local copy has already flipped `synced:true` (PUT `.then`) and is no
 * longer queued/in-flight. Result: the just-saved filter is dropped and the
 * delete is persisted — it vanishes until the next focus re-fetch brings it
 * back. (Reproduced live in THGLApp; matches "disappears right after saving /
 * after reopening, reappears when I focus the window".)
 *
 * Treating recently-synced ids as pending keeps them for a short window, long
 * enough for the server list to reflect the write. A genuine delete-elsewhere
 * still propagates: that id was not PUT by THIS surface recently, so it isn't
 * in `recent` and is dropped as before.
 *
 * Mutates `recent` to prune expired entries (called on the hydrate hot path).
 */
export function pendingIdsWithSyncGrace(
  pending: ReadonlySet<string>,
  recent: Map<string, number>,
  now: number,
  graceMs: number,
): Set<string> {
  const out = new Set(pending);
  for (const [id, ts] of recent) {
    if (now - ts < graceMs) out.add(id);
    else recent.delete(id);
  }
  return out;
}
