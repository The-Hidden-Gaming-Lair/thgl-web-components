/**
 * Game-reported collected nodes that follow the character being played.
 *
 * THGLApp's `characterData.payload.collectedNodeSets` carries, per named set
 * (`empyrean_traces`, later `quests`, …), the COMPLETE list of node ids the
 * game reports as collected for the CURRENT character. A key that is present
 * replaces that set; an absent key means "unknown", the set is left alone.
 *
 * The ids still land in `discoveredNodes` + `autoDiscoveredNodes` (so every
 * reader, the auto-discovered badge and the opt-out toggle keep working), and
 * `gameReportedNodes[set]` records which of them THIS mechanism added and owns.
 * Only owned ids are ever removed, by exact string, so the user's own marks
 * and every other source of marks are never touched. `removeDiscoveredMatches`
 * is deliberately NOT used: its base-id rule would also drop a hand-made
 * `empyrean_trace_5@x:y` when removing the bare `empyrean_trace_5`.
 *
 * Removal guard: an owned id is removed only once it is missing from
 * {@link GAME_REPORTED_REMOVE_AFTER_MISSES} consecutive reports of its set, so
 * one partial memory read does not make marks blink out and back. The miss
 * counters are in memory only (the caller keeps them, they are not persisted).
 *
 * Migration: the first report of a set with no ownership record yet adopts
 * the marks the old add-only `collectedNodeIds` path wrote, but only for a set
 * listed in {@link LEGACY_MIGRATION_ID_PREFIXES} and only the ids with that
 * set's prefix. Every other set (`quests`, `strongholds`, anything new) starts
 * with an empty record, so a set that happens to arrive first cannot adopt and
 * then remove another set's legacy marks.
 */

/** Consecutive reports an owned id must be missing from before it is removed. */
export const GAME_REPORTED_REMOVE_AFTER_MISSES = 2;

/**
 * Sets whose ids the old add-only `collectedNodeIds` path wrote, with the id
 * prefix they own. Only these sets migrate legacy marks, and only ids that
 * start with their prefix.
 */
export const LEGACY_MIGRATION_ID_PREFIXES: Readonly<Record<string, string>> = {
  empyrean_traces: "empyrean_trace_",
};

export type GameReportedNodes = Record<string, string[]>;

export type GameReportedSetUpdate = {
  discoveredNodes?: string[];
  autoDiscoveredNodes?: string[];
  gameReportedNodes?: GameReportedNodes;
};

/**
 * Diff one report of one set against the stored state. Pure: returns the
 * store patch (`null` when nothing persisted changes, so the caller skips the
 * write and nothing re-renders) and the miss counters to keep for the next
 * report of this set. Only the fields that changed are in the patch.
 */
export function diffGameReportedSet({
  setName,
  reportedIds,
  discoveredNodes,
  autoDiscoveredNodes,
  gameReportedNodes,
  misses,
}: {
  setName: string;
  /** The complete list for the current character (may be empty). */
  reportedIds: readonly string[];
  discoveredNodes: readonly string[];
  autoDiscoveredNodes: readonly string[];
  /** The stored ownership record; undefined/malformed = nothing recorded yet. */
  gameReportedNodes: Readonly<Record<string, unknown>> | undefined;
  /** Miss counters of this set from the previous report (in memory). */
  misses: ReadonlyMap<string, number> | undefined;
}): {
  update: GameReportedSetUpdate | null;
  misses: Map<string, number>;
  added: string[];
  removed: string[];
} {
  const record: Record<string, unknown> =
    gameReportedNodes &&
    typeof gameReportedNodes === "object" &&
    !Array.isArray(gameReportedNodes)
      ? gameReportedNodes
      : {};
  const storedOwned = record[setName];
  const hasRecord = Array.isArray(storedOwned);

  // Ids another set owns: never adopted or claimed here, so two sets cannot
  // remove each other's marks.
  const ownedElsewhere = new Set<string>();
  for (const [name, ids] of Object.entries(record)) {
    if (name === setName || !Array.isArray(ids)) continue;
    for (const id of ids) if (typeof id === "string") ownedElsewhere.add(id);
  }

  let owned: string[];
  if (hasRecord) {
    owned = (storedOwned as unknown[]).filter(
      (id): id is string => typeof id === "string",
    );
  } else {
    // Migration: before this record existed, the add-only path wrote the
    // reported ids (bare spawn ids, no "@") into autoDiscoveredNodes. A set
    // that replaced that path adopts the unowned bare ids with ITS prefix, so
    // the first complete report can clean up another character's leftovers.
    // Every other writer of autoDiscoveredNodes (the live actor flag) stores
    // "@" ids, and hand-made marks are never in that list. A set without a
    // legacy prefix adopts nothing: the old path never wrote its marks.
    const prefix = Object.prototype.hasOwnProperty.call(
      LEGACY_MIGRATION_ID_PREFIXES,
      setName,
    )
      ? LEGACY_MIGRATION_ID_PREFIXES[setName]
      : undefined;
    owned = prefix
      ? [
          ...new Set(
            autoDiscoveredNodes.filter(
              (id) =>
                id.startsWith(prefix) &&
                !id.includes("@") &&
                !ownedElsewhere.has(id),
            ),
          ),
        ]
      : [];
  }

  const reported = new Set(reportedIds);
  const discovered = new Set(discoveredNodes);
  const ownedSet = new Set(owned);

  // Add what the game reports and nothing has marked yet. An id that is
  // already discovered from another source stays that source's (not claimed).
  const added: string[] = [];
  for (const id of reported) {
    if (!discovered.has(id)) added.push(id);
  }

  // Owned ids missing from this report: count the miss, remove on the Nth.
  const nextMisses = new Map<string, number>();
  const removed: string[] = [];
  for (const id of owned) {
    if (reported.has(id)) continue; // present again = counter reset
    const count = (misses?.get(id) ?? 0) + 1;
    if (count >= GAME_REPORTED_REMOVE_AFTER_MISSES) removed.push(id);
    else nextMisses.set(id, count);
  }

  const removedSet = new Set(removed);
  const newOwned = [
    ...owned.filter((id) => !removedSet.has(id)),
    ...added.filter((id) => !ownedSet.has(id) && !ownedElsewhere.has(id)),
  ];
  const ownedChanged =
    !hasRecord ||
    newOwned.length !== (storedOwned as unknown[]).length ||
    newOwned.some((id, i) => (storedOwned as unknown[])[i] !== id);

  if (added.length === 0 && removed.length === 0 && !ownedChanged) {
    return { update: null, misses: nextMisses, added, removed };
  }

  const update: GameReportedSetUpdate = {};
  if (added.length > 0 || removed.length > 0) {
    const nextDiscovered = discoveredNodes.filter((id) => !removedSet.has(id));
    for (const id of added) nextDiscovered.push(id);
    if (
      nextDiscovered.length !== discoveredNodes.length ||
      nextDiscovered.some((id, i) => discoveredNodes[i] !== id)
    ) {
      update.discoveredNodes = nextDiscovered;
    }

    const autoSet = new Set(autoDiscoveredNodes);
    const nextAuto = autoDiscoveredNodes.filter((id) => !removedSet.has(id));
    for (const id of added) if (!autoSet.has(id)) nextAuto.push(id);
    if (
      nextAuto.length !== autoDiscoveredNodes.length ||
      nextAuto.some((id, i) => autoDiscoveredNodes[i] !== id)
    ) {
      update.autoDiscoveredNodes = nextAuto;
    }
  }
  if (ownedChanged) {
    const nextRecord: GameReportedNodes = {};
    for (const [name, ids] of Object.entries(record)) {
      if (Array.isArray(ids)) {
        nextRecord[name] = ids.filter(
          (id): id is string => typeof id === "string",
        );
      }
    }
    nextRecord[setName] = newOwned;
    update.gameReportedNodes = nextRecord;
  }

  return {
    update: Object.keys(update).length > 0 ? update : null,
    misses: nextMisses,
    added,
    removed,
  };
}
