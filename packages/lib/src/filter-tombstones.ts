import type { DrawingsAndNodes } from "./settings";

/**
 * Deletion tombstones + a retried server-delete queue for "My Filters".
 *
 * Why this exists: `myFilters` is persisted inside the settings blob
 * (last-writer-wins on the whole `{profiles, currentProfileId}` object). With
 * several live surfaces sharing one localStorage — the Overwolf desktop and
 * in-game overlay windows both run the full map app — a delete performed in
 * one window is resurrected the moment a stale window persists ITS in-memory
 * state. The storage-event rehydrate in dom.ts narrows but cannot close that
 * race (and Overwolf's CEF doesn't reliably deliver storage events at all).
 * That was the "custom filters keep coming back" support ticket.
 *
 * Tombstones make deletes monotonic: a delete writes (name, id, deletedAt)
 * markers under a SEPARATE storage key that no settings-blob write can
 * clobber. Every path that loads or persists myFilters — persist partialize,
 * rehydrate merge, server hydrate — drops entries matching a live tombstone,
 * so a stale window can no longer resurrect a deleted filter into storage or
 * into the UI.
 *
 * The pending-delete queue makes the server-side DELETE eventually
 * consistent. Previously the DELETE fired once and swallowed failures — and
 * was a silent no-op when signed out — orphaning `user_filters` rows that
 * every later hydrate faithfully resurrected. Now ids are queued persistently
 * and retried (from hydrate, which runs on signed-in mount/focus) until the
 * server confirms (2xx) or tells us to stop trying (caller-classified, e.g.
 * 404 already-gone / 403 not-owner).
 *
 * Both maps expire after 30 days. A tombstone also auto-clears when a server
 * copy proves the filter was re-created or updated AFTER the delete
 * (updatedAt newer than deletedAt) — latest action wins, so a deliberate
 * re-creation on another device isn't eaten for a month.
 *
 * Kept dependency-free (type-only imports) like filters-sync.ts so it stays
 * unit-testable without touching `window`: storage is injectable.
 */

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const TOMBSTONES_KEY = "thgl-filter-tombstones";
const PENDING_DELETES_KEY = "thgl-filter-pending-deletes";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
// Tombstones are re-read from storage at most this often (they're consulted
// on every persist write); cross-window writes also invalidate via the
// storage event below when the platform delivers it.
const CACHE_TTL_MS = 5_000;

type StampMap = Record<string, number>;

let storageOverride: StorageLike | null | undefined;

function getStorage(): StorageLike | null {
  if (storageOverride !== undefined) return storageOverride;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // Privacy mode / storage access denied — degrade to no-op.
    return null;
  }
}

/** Test seam: inject a fake storage (pass null to simulate no storage). */
export function _setFilterTombstoneStorageForTests(
  storage: StorageLike | null | undefined,
): void {
  storageOverride = storage;
  tombstoneCache = null;
}

function readMap(key: string): StampMap {
  const storage = getStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    // Prune expired entries on read; write back only if something expired.
    const now = Date.now();
    const map: StampMap = {};
    let pruned = false;
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "number" && now - v < TTL_MS) {
        map[k] = v;
      } else {
        pruned = true;
      }
    }
    if (pruned) writeMap(key, map);
    return map;
  } catch {
    return {};
  }
}

function writeMap(key: string, map: StampMap): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    if (Object.keys(map).length === 0) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, JSON.stringify(map));
    }
  } catch {
    // Quota / privacy errors — tombstones degrade gracefully.
  }
  if (key === TOMBSTONES_KEY) {
    tombstoneCache = { map, readAt: Date.now() };
  }
}

let tombstoneCache: { map: StampMap; readAt: number } | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === TOMBSTONES_KEY || e.key === null) tombstoneCache = null;
  });
}

function readTombstones(): StampMap {
  if (tombstoneCache && Date.now() - tombstoneCache.readAt < CACHE_TTL_MS) {
    return tombstoneCache.map;
  }
  const map = readMap(TOMBSTONES_KEY);
  tombstoneCache = { map, readAt: Date.now() };
  return map;
}

// Keys are prefixed so a filter name can never collide with a server id.
const idKey = (id: string) => `id:${id}`;
const nameKey = (name: string) => `name:${name}`;

/** Record that a filter was deleted. Marks both its name and (if any) id. */
export function recordFilterTombstone(filter: {
  name: string;
  id?: string;
}): void {
  const map = readMap(TOMBSTONES_KEY);
  const now = Date.now();
  map[nameKey(filter.name)] = now;
  if (filter.id) map[idKey(filter.id)] = now;
  writeMap(TOMBSTONES_KEY, map);
}

/**
 * Clear tombstones matching this filter. Called when the user deliberately
 * (re-)adds a filter, so a fresh creation under a previously-deleted name
 * isn't dropped by its own tombstone.
 */
export function clearFilterTombstones(filter: {
  name?: string;
  id?: string;
}): void {
  const map = readMap(TOMBSTONES_KEY);
  let changed = false;
  if (filter.name && nameKey(filter.name) in map) {
    delete map[nameKey(filter.name)];
    changed = true;
  }
  if (filter.id && idKey(filter.id) in map) {
    delete map[idKey(filter.id)];
    changed = true;
  }
  if (changed) writeMap(TOMBSTONES_KEY, map);
  // A deliberate (re-)add also invalidates any hydrate-drop echo for the id —
  // the user's intent is newer than the recorded absence.
  if (filter.id) clearHydrateDrops([filter.id]);
}

/**
 * Whether this filter matches a live tombstone and should be dropped.
 *
 * Exception (with an intentional side effect): if the filter carries an
 * `updatedAt` NEWER than the tombstone — i.e. a server copy that was
 * re-created or edited after the delete — the tombstone is stale; it is
 * cleared and the filter survives. Server timestamps are unix seconds,
 * local ones milliseconds; both are handled.
 */
export function isFilterTombstoned(
  filter: Pick<DrawingsAndNodes, "name" | "id" | "updatedAt">,
): boolean {
  const map = readTombstones();
  const deletedAt = Math.max(
    (filter.id && map[idKey(filter.id)]) || 0,
    (filter.name && map[nameKey(filter.name)]) || 0,
  );
  if (!deletedAt) return false;
  if (filter.updatedAt) {
    const updatedMs =
      filter.updatedAt < 1e12 ? filter.updatedAt * 1000 : filter.updatedAt;
    if (updatedMs > deletedAt) {
      clearFilterTombstones(filter);
      return false;
    }
  }
  return true;
}

/**
 * Drop tombstoned entries from a myFilters array. Returns the INPUT array
 * unchanged (same reference) when nothing matches, so hot callers (persist
 * partialize runs on every store write) can skip re-allocations.
 */
export function filterOutTombstoned<
  T extends Pick<DrawingsAndNodes, "name" | "id" | "updatedAt">,
>(filters: T[]): T[] {
  if (filters.length === 0) return filters;
  if (Object.keys(readTombstones()).length === 0) return filters;
  const kept = filters.filter((f) => !isFilterTombstoned(f));
  return kept.length === filters.length ? filters : kept;
}

/** Queue a server DELETE for this id; survives reloads, retried until confirmed. */
export function enqueueFilterDelete(id: string): void {
  const map = readMap(PENDING_DELETES_KEY);
  if (!(id in map)) {
    map[id] = Date.now();
    writeMap(PENDING_DELETES_KEY, map);
  }
}

function dequeueFilterDelete(id: string): void {
  const map = readMap(PENDING_DELETES_KEY);
  if (id in map) {
    delete map[id];
    writeMap(PENDING_DELETES_KEY, map);
  }
}

/** Ids with a queued server DELETE (exposed for tests / diagnostics). */
export function getPendingFilterDeletes(): string[] {
  return Object.keys(readMap(PENDING_DELETES_KEY));
}

// Durable "recently synced" stamps. Their purpose is the mirror of tombstones:
// keep hydrate from dropping a filter you JUST saved as "deleted elsewhere" when
// a racing server-list fetch (or read-replica lag) doesn't reflect the write
// yet. The in-memory pending sets can't cover this across a window close — a
// freshly reopened WebView2 window starts with empty pending state, so a
// synced-but-not-yet-replicated filter would be dropped (the "gone after
// reopening, back on focus" bug). Persisting the stamps lets the fresh window
// protect the id until the server catches up. Entries older than
// RECENT_SYNC_MAX_AGE_MS are pruned on write so the map stays tiny.
const RECENT_SYNCS_KEY = "thgl-filter-recent-syncs";
const RECENT_SYNC_MAX_AGE_MS = 5 * 60 * 1000;

/** Record that a filter's PUT just succeeded (durable across window close). */
export function recordRecentSync(id: string, now: number = Date.now()): void {
  const map = readMap(RECENT_SYNCS_KEY);
  for (const [k, v] of Object.entries(map)) {
    if (now - v > RECENT_SYNC_MAX_AGE_MS) delete map[k];
  }
  map[id] = now;
  writeMap(RECENT_SYNCS_KEY, map);
}

/** Load the durable recently-synced stamps as a fresh map (id → unix ms). */
export function loadRecentSyncs(): Map<string, number> {
  return new Map(Object.entries(readMap(RECENT_SYNCS_KEY)));
}

// Short-lived "hydrate dropped this as deleted-elsewhere" echoes. When
// hydrateFiltersFromServer drops a synced filter the server no longer returns,
// only THAT window learns about it — a sibling webview still holds the filter
// in memory and, on the storage-event rehydrate that follows the drop's
// persist, would union it right back in (unionMyFiltersOnRehydrate keeps
// in-memory filters the persisted blob doesn't know about, and a REMOTE delete
// records no local tombstone). The echo is the cross-window signal that the
// absence is a deletion, not a stale writer's ignorance: the union predicate
// checks it and lets the drop stick. Deliberately NOT a full tombstone — it
// must not hide a server copy that reappears (e.g. the drop was a replica-lag
// false positive), so hydrate clears the echo for any id its server list
// contains, and entries expire quickly regardless.
const HYDRATE_DROPS_KEY = "thgl-filter-hydrate-drops";
const HYDRATE_DROP_MAX_AGE_MS = 10 * 60 * 1000;

/** Record ids that hydrate just dropped as "deleted on another device". */
export function recordHydrateDrops(
  ids: string[],
  now: number = Date.now(),
): void {
  if (ids.length === 0) return;
  const map = readMap(HYDRATE_DROPS_KEY);
  for (const [k, v] of Object.entries(map)) {
    if (now - v > HYDRATE_DROP_MAX_AGE_MS) delete map[k];
  }
  for (const id of ids) map[id] = now;
  writeMap(HYDRATE_DROPS_KEY, map);
}

/**
 * Clear echoes for ids the server list DOES contain — the earlier drop was a
 * false positive (replica lag) or the filter was re-created; either way the
 * absence signal is stale and must not suppress the filter anywhere.
 */
export function clearHydrateDrops(ids: string[]): void {
  if (ids.length === 0) return;
  const map = readMap(HYDRATE_DROPS_KEY);
  let changed = false;
  for (const id of ids) {
    if (id in map) {
      delete map[id];
      changed = true;
    }
  }
  if (changed) writeMap(HYDRATE_DROPS_KEY, map);
}

/** Whether this id was recently dropped by a hydrate as deleted-elsewhere. */
export function isRecentHydrateDrop(
  id: string | undefined,
  now: number = Date.now(),
): boolean {
  if (!id) return false;
  const ts = readMap(HYDRATE_DROPS_KEY)[id];
  return typeof ts === "number" && now - ts < HYDRATE_DROP_MAX_AGE_MS;
}

let flushing = false;

/**
 * Drain the pending-delete queue. Serial, self-guarding against concurrent
 * calls. `shouldDiscard` classifies errors that can never succeed (404
 * already-gone, 403 not-owner) so their queue entries are dropped; all other
 * failures keep the entry for a later retry.
 */
export async function flushFilterDeletes(deps: {
  isSignedIn: () => boolean;
  deleteFilter: (id: string) => Promise<void>;
  shouldDiscard?: (err: unknown) => boolean;
}): Promise<void> {
  if (flushing) return;
  if (!deps.isSignedIn()) return;
  const ids = getPendingFilterDeletes();
  if (ids.length === 0) return;
  flushing = true;
  try {
    for (const id of ids) {
      try {
        await deps.deleteFilter(id);
        dequeueFilterDelete(id);
      } catch (err) {
        if (deps.shouldDiscard?.(err)) {
          dequeueFilterDelete(id);
        } else {
          console.error(
            "[filter sync] queued delete failed, will retry",
            id,
            err,
          );
        }
      }
    }
  } finally {
    flushing = false;
  }
}
