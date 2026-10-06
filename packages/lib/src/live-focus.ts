/**
 * Focused markers from live data: the companion app can send, inside a
 * `characterData` payload, `focusNodeIds: string[]` — the node ids of the
 * markers the player should look at right now (AION 2: the objectives of the
 * character's open quests). The map shows those markers enlarged
 * (`useGameState.highlightSpawnIDs`) and even when their filter is off.
 *
 * Each message replaces the whole set. Nothing is persisted.
 */

/**
 * After this long without a `characterData` message carrying `focusNodeIds`,
 * the focus is dropped. The app sends no "game closed" message to the map, so
 * without it the last quest focus would stay on screen after quitting the game.
 * AION 2 sends every 10 s; three missed reads clear it.
 */
export const LIVE_FOCUS_STALE_MS = 30_000;

/**
 * `focusNodeIds` of a `characterData` payload: the string ids (anything else
 * dropped) when the field is an array, `null` when the payload has no such
 * field (a game that does not send focus at all).
 */
export const readFocusNodeIds = (payload: unknown): string[] | null => {
  if (!payload || typeof payload !== "object") return null;
  const raw = (payload as { focusNodeIds?: unknown }).focusNodeIds;
  if (!Array.isArray(raw)) return null;
  return raw.filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  );
};

/**
 * Replace semantics for an id list held in a store: returns `next` (deduped),
 * or `prev` itself when both hold the same ids in any order — so a payload
 * that repeats the same focus every few seconds does not change the store
 * reference and does not re-run the subscribers (spawn refresh, marker redraw).
 */
export const replaceHighlightIds = (
  prev: string[],
  next: readonly string[],
): string[] => {
  const nextSet = new Set(next);
  if (nextSet.size === prev.length && prev.every((id) => nextSet.has(id))) {
    return prev;
  }
  return Array.from(nextSet);
};

/**
 * Applies the focus of each `characterData` payload through `setIds`:
 * - payload with `focusNodeIds` → replace the set, (re)arm the stale timer;
 * - payload without it → clear the set, but only if live focus set it, so a
 *   game that never sends focus does not wipe highlights from elsewhere;
 * - no payload with focus for `staleMs` → clear (game closed / app gone).
 */
export const createLiveFocusTracker = (
  setIds: (ids: string[]) => void,
  staleMs: number = LIVE_FOCUS_STALE_MS,
) => {
  let active = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clear = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (active) {
      active = false;
      setIds([]);
    }
  };

  return {
    apply(payload: unknown) {
      const focus = readFocusNodeIds(payload);
      if (focus === null) {
        clear();
        return;
      }
      if (timer !== null) clearTimeout(timer);
      active = true;
      setIds(focus);
      timer = setTimeout(() => {
        timer = null;
        clear();
      }, staleMs);
    },
    clear,
  };
};
