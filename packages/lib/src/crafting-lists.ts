/**
 * Named, saved crafting plans for the /crafting calculator. A plan is kept as
 * the same query string the share link uses (`items=…&r=…&buy=…`), so saving,
 * opening and sharing all go through one format. The lists live per viewer in
 * the browser (one localStorage key per game). Side-effect free: tested here,
 * used by the client calculator.
 */

import {
  formatCraftItems,
  parseCraftItems,
  type CraftTarget,
} from "./crafting";

export type SavedCraftList = {
  id: string;
  name: string;
  /** Share-link query without `?` (`items=…&r=…&buy=…`). */
  query: string;
  updatedAt: number;
};

export type CraftListsState = {
  lists: SavedCraftList[];
  /** The list the calculator edits (changes save into it), if any. */
  active: string | null;
};

export const MAX_CRAFT_LISTS = 50;
const MAX_NAME = 60;

/** localStorage key holding every saved crafting list of one game. */
export function craftListsStorageKey(game: string): string {
  return `thgl-crafting-lists:${game}`;
}

export function emptyCraftListsState(): CraftListsState {
  return { lists: [], active: null };
}

export function cleanCraftListName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
}

/** Stored state → object. Tolerates null, garbage and missing fields. */
export function parseCraftListsState(
  raw: string | null | undefined,
): CraftListsState {
  if (!raw) return emptyCraftListsState();
  let parsed: { lists?: unknown; active?: unknown } | null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptyCraftListsState();
  }
  if (!parsed || typeof parsed !== "object") return emptyCraftListsState();
  const lists: SavedCraftList[] = [];
  const seen = new Set<string>();
  for (const l of Array.isArray(parsed.lists) ? parsed.lists : []) {
    if (!l || typeof l !== "object") continue;
    const { id, name, query, updatedAt } = l as Record<string, unknown>;
    if (typeof id !== "string" || !id || seen.has(id)) continue;
    if (typeof query !== "string") continue;
    const clean = typeof name === "string" ? cleanCraftListName(name) : "";
    if (!clean) continue;
    seen.add(id);
    lists.push({
      id,
      name: clean,
      query,
      updatedAt: typeof updatedAt === "number" ? updatedAt : 0,
    });
    if (lists.length >= MAX_CRAFT_LISTS) break;
  }
  const active =
    typeof parsed.active === "string" && seen.has(parsed.active)
      ? parsed.active
      : null;
  return { lists, active };
}

export function serializeCraftListsState(state: CraftListsState): string {
  return JSON.stringify({ v: 1, lists: state.lists, active: state.active });
}

/** Short random id, unique within `taken`. */
export function newCraftListId(taken: readonly SavedCraftList[]): string {
  for (;;) {
    const id = Math.random().toString(36).slice(2, 10);
    if (id && !taken.some((l) => l.id === id)) return id;
  }
}

/** First free "<base> N" (N from 1) - for unnamed saves. */
export function nextCraftListName(
  lists: readonly SavedCraftList[],
  base: (n: number) => string,
): string {
  const names = new Set(lists.map((l) => l.name));
  for (let n = lists.length + 1; ; n++) {
    if (!names.has(base(n))) return base(n);
  }
}

/**
 * Add a new list (made active). Null when the name is empty, the id is taken or
 * the cap is hit. Pass `id` from outside a React updater (updaters must be pure).
 */
export function addCraftList(
  state: CraftListsState,
  name: string,
  query: string,
  now: number,
  id = newCraftListId(state.lists),
): CraftListsState | null {
  const clean = cleanCraftListName(name);
  if (!clean || state.lists.length >= MAX_CRAFT_LISTS) return null;
  if (state.lists.some((l) => l.id === id)) return null;
  return {
    lists: [...state.lists, { id, name: clean, query, updatedAt: now }],
    active: id,
  };
}

/** Store the current plan into list `id` (no-op when unchanged). */
export function saveCraftListQuery(
  state: CraftListsState,
  id: string,
  query: string,
  now: number,
): CraftListsState {
  const list = state.lists.find((l) => l.id === id);
  if (!list || list.query === query) return state;
  return {
    ...state,
    lists: state.lists.map((l) =>
      l.id === id ? { ...l, query, updatedAt: now } : l,
    ),
  };
}

export function renameCraftList(
  state: CraftListsState,
  id: string,
  name: string,
): CraftListsState {
  const clean = cleanCraftListName(name);
  if (!clean) return state;
  return {
    ...state,
    lists: state.lists.map((l) => (l.id === id ? { ...l, name: clean } : l)),
  };
}

export function removeCraftList(
  state: CraftListsState,
  id: string,
): CraftListsState {
  return {
    lists: state.lists.filter((l) => l.id !== id),
    active: state.active === id ? null : state.active,
  };
}

/** One raw (still-encoded) value of a query string, or null. */
export function craftQueryParam(query: string, key: string): string | null {
  const part = query
    .replace(/^\?/, "")
    .split("&")
    .find((p) => p.startsWith(`${key}=`));
  return part === undefined ? null : part.slice(key.length + 1);
}

/** The targets a saved list holds (for counts and "add to plan"). */
export function craftListTargets(list: SavedCraftList): CraftTarget[] {
  return parseCraftItems(craftQueryParam(list.query, "items"));
}

/** Targets of `a` plus `b`; the same item sums its quantities. */
export function mergeCraftTargets(
  a: CraftTarget[],
  b: CraftTarget[],
): CraftTarget[] {
  return parseCraftItems(formatCraftItems([...a, ...b]));
}
