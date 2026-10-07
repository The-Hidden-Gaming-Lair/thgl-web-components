/**
 * Focused markers from live data: the companion app can send, inside a
 * `characterData` payload, `focusNodeIds: string[]` — the node ids of the
 * markers the player should look at right now (AION 2: the objective and
 * turn-in markers of the open quests' current step, plus `q_<QuestId>` for
 * every quest the character can take now). The ids go to
 * `useGameState.highlightSpawnIDs`; the map draws those markers enlarged.
 *
 * Live focus is ACTIVE (`useGameState.liveFocusActive`) while payloads carrying
 * the field keep arriving (an empty list counts: "no open quests" is an
 * answer); it turns inactive after {@link LIVE_FOCUS_STALE_MS} without one.
 * Spawns whose data sets `focusMode` are gated on both (see
 * `isSpawnShownByFocus` in coordinates.ts): an OFF filter hides its spawns,
 * focused or not; only the selected marker bypasses the filter.
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
 * - payload with `focusNodeIds` → replace the set (an explicit `[]` clears
 *   it), (re)arm the stale timer;
 * - payload without it → keep the current focus and leave the timer running
 *   (AION 2 leaves the field out when one quest-log read fails; that is no
 *   "no open quests"), and never touch highlights set from elsewhere;
 * - no payload with focus for `staleMs` → clear, but only if live focus set
 *   it (game closed / app gone).
 *
 * `setActive` hears the live-focus ACTIVE flag, only on change: true from the
 * first payload carrying the field (also `[]`), false after the stale clear
 * (or `clear()`).
 */
export const createLiveFocusTracker = (
  setIds: (ids: string[]) => void,
  staleMs: number = LIVE_FOCUS_STALE_MS,
  setActive?: (active: boolean) => void,
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
      setActive?.(false);
    }
  };

  return {
    apply(payload: unknown) {
      const focus = readFocusNodeIds(payload);
      // No field: keep the focus; only the stale timer (armed by payloads
      // that carry the field) drops it.
      if (focus === null) return;
      if (timer !== null) clearTimeout(timer);
      // Ids first, so a subscriber of the flag already sees the new focus.
      setIds(focus);
      if (!active) {
        active = true;
        setActive?.(true);
      }
      timer = setTimeout(() => {
        timer = null;
        clear();
      }, staleMs);
    },
    clear,
    /** True while live focus is active (see `setActive`). */
    isActive: () => active,
  };
};
