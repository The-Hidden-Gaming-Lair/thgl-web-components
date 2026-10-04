import {
  planCrafting,
  recipeYield,
  type CraftPlan,
  type CraftTarget,
  type CraftingGraph,
  type RecipeChoice,
} from "./crafting";

/**
 * Skill XP planner (`/xp-planner`, inbox #305): pure logic over a game's
 * `config/xp.json` (data-forge, first shipped by RuneScape: Dragonwilds —
 * `rsdragonwilds/xp-planner.ts`). Any game that ships the file lights up the
 * tool; nothing here is game-specific.
 *
 * Contract, in short:
 * - `curve[i]` = total XP needed to REACH level `i + 1` (`curve[0] = 0`);
 * - a method gives `xp` per `unit` (one craft, one ore, one point of damage…)
 *   to one `skill`; a method with `recipe` costs that codex recipe once per
 *   action, one with `items` costs those materials once per action;
 * - `flag` marks values the data cannot pin down (see XpFlag).
 *
 * Side-effect free, so it runs (and is tested) on both server and client.
 */

/**
 * - `approx`: computed (e.g. from node health), the game can round per hit;
 * - `variable`: depends on a minigame / yield / plot tier;
 * - `min`: a lower bound (part of the award is not in the data);
 * - `unverified`: game data and observed values disagree.
 */
export type XpFlag = "approx" | "variable" | "min" | "unverified";

export type XpMaterial = { id: string; section: string; count?: number };

export type XpMethod = {
  id: string;
  skill: string;
  kind: string;
  xp: number;
  unit: string;
  /** Dict key: a codex id or an `xp:` key of `terms`. */
  name: string;
  variant?: string;
  db?: { section: string; id: string };
  recipe?: string;
  items?: XpMaterial[];
  map?: string[];
  level?: number;
  flag?: XpFlag;
};

/** The fields the logic reads — also satisfied by UI views of a method. */
export type XpMethodBase = {
  id: string;
  skill: string;
  kind: string;
  xp: number;
  unit: string;
  recipe?: string;
  items?: XpMaterial[];
};

/** The parts of a config the logic reads. */
export type XpConfigBase = {
  curve: number[];
  skills: { id: string; name: string }[];
  methods: XpMethodBase[];
};

export type XpConfig = {
  v: number;
  maxLevel: number;
  curve: number[];
  skills: { id: string; name: string }[];
  methods: XpMethod[];
  terms?: Record<string, Record<string, string>>;
};

export const XP_PLANNER_PATH = "/xp-planner";

/** Units where the game scales the award with the hit (XP per damage point). */
export const PER_DAMAGE_UNIT = "damage";

/** Highest level of the curve. */
export function maxLevelOf(curve: number[]): number {
  return curve.length;
}

/** Clamp a level into 1…max (non-numbers → 1). */
export function clampLevel(curve: number[], level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.min(maxLevelOf(curve), Math.max(1, Math.floor(level)));
}

/** Total XP needed to reach `level`. */
export function xpForLevel(curve: number[], level: number): number {
  return curve[clampLevel(curve, level) - 1] ?? 0;
}

/** The level a player with `xp` total XP is at. */
export function levelForXp(curve: number[], xp: number): number {
  if (!(xp > 0)) return 1;
  // Binary search: the last level whose threshold is ≤ xp.
  let lo = 0;
  let hi = curve.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (curve[mid] <= xp) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

/** XP still needed from `currentXp` to reach `targetLevel` (0 when already there). */
export function xpToLevel(
  curve: number[],
  currentXp: number,
  targetLevel: number,
): number {
  return Math.max(
    0,
    Math.ceil(xpForLevel(curve, targetLevel) - Math.max(0, currentXp)),
  );
}

/** XP between two levels (from the start of `from` to the start of `to`). */
export function xpBetweenLevels(
  curve: number[],
  from: number,
  to: number,
): number {
  return Math.max(0, xpForLevel(curve, to) - xpForLevel(curve, from));
}

/** Progress (0…1) from the start of the current level towards the next one. */
export function levelProgress(curve: number[], xp: number): number {
  const level = levelForXp(curve, xp);
  if (level >= maxLevelOf(curve)) return 1;
  const start = xpForLevel(curve, level);
  const end = xpForLevel(curve, level + 1);
  return end > start ? (Math.max(0, xp) - start) / (end - start) : 1;
}

/** How many actions of `xpPerAction` cover `xpNeeded` (whole actions, rounded up). */
export function actionsNeeded(xpNeeded: number, xpPerAction: number): number {
  if (!(xpNeeded > 0)) return 0;
  if (!(xpPerAction > 0)) return Infinity;
  // Guard float noise: 0.1 × 30 = 3.0000000000000004 must not need a 31st action.
  return Math.ceil(xpNeeded / xpPerAction - 1e-9);
}

/** Methods of one skill, best XP per action first (stable on id). */
export function methodsForSkill<M extends XpMethodBase>(
  config: { methods: M[] },
  skill: string,
): M[] {
  return config.methods
    .filter((m) => m.skill === skill)
    .sort((a, b) => b.xp - a.xp || a.id.localeCompare(b.id));
}

/** Skills that have at least one method, in data order. */
export function trainableSkills(config: XpConfigBase): XpConfig["skills"] {
  const has = new Set(config.methods.map((m) => m.skill));
  return config.skills.filter((s) => has.has(s.id));
}

/** Methods grouped by `kind`, groups ordered by their best method. */
export function groupMethods<M extends XpMethodBase>(
  methods: M[],
): { kind: string; methods: M[] }[] {
  const groups = new Map<string, M[]>();
  for (const m of methods) {
    const list = groups.get(m.kind) ?? [];
    list.push(m);
    groups.set(m.kind, list);
  }
  return [...groups.entries()]
    .map(([kind, list]) => ({
      kind,
      methods: [...list].sort(
        (a, b) => b.xp - a.xp || a.id.localeCompare(b.id),
      ),
    }))
    .sort(
      (a, b) =>
        b.methods[0].xp - a.methods[0].xp || a.kind.localeCompare(b.kind),
    );
}

/** The shopping list for `actions` × `method` — null when it costs nothing known. */
export function methodCost(
  graph: CraftingGraph | null,
  method: Pick<XpMethodBase, "recipe" | "items">,
  actions: number,
): CraftPlan | null {
  if (!graph || !(actions > 0) || !Number.isFinite(actions)) return null;
  if (method.recipe) {
    const ri = graph.recipes.findIndex((r) => r.key === method.recipe);
    if (ri < 0) return null;
    const recipe = graph.recipes[ri];
    const product = recipe.products[0];
    if (!product) return null;
    // Force THIS recipe for its product (an alternate recipe is its own method).
    const choice: RecipeChoice = { [product.id]: recipe.key };
    const targets: CraftTarget[] = [
      { id: product.id, qty: actions * recipeYield(recipe, product.id) },
    ];
    return planCrafting(graph, targets, choice);
  }
  if (method.items?.length) {
    const targets: CraftTarget[] = method.items.map((m) => ({
      id: m.id,
      qty: (m.count ?? 1) * actions,
    }));
    return planCrafting(graph, targets);
  }
  return null;
}

/** Direct inputs of one action (before sub-crafting), for a compact summary. */
export function methodInputs(
  graph: CraftingGraph | null,
  method: Pick<XpMethodBase, "recipe" | "items">,
): XpMaterial[] {
  if (method.items?.length) return method.items;
  if (!graph || !method.recipe) return [];
  const recipe = graph.recipes.find((r) => r.key === method.recipe);
  return (
    recipe?.ingredients.map((g) => ({
      id: g.id,
      section: g.section,
      count: g.count,
    })) ?? []
  );
}

export type XpPlannerState = {
  skill?: string;
  /** Current level (ignored when `xp` is set). */
  from: number;
  /** Exact current XP, when the player entered it. */
  xp?: number;
  to: number;
  /** Selected method id. */
  method?: string;
};

/** URL params (`skill`, `from` | `xp`, `to`, `m`) → state, validated against the data. */
export function parseXpPlannerState(
  config: XpConfigBase,
  params: { get(key: string): string | null },
  fallbackSkill?: string,
): XpPlannerState {
  const skills = new Set(config.skills.map((s) => s.id));
  const rawSkill = params.get("skill");
  const skill =
    rawSkill && skills.has(rawSkill)
      ? rawSkill
      : fallbackSkill && skills.has(fallbackSkill)
        ? fallbackSkill
        : undefined;
  const xpParam = Number(params.get("xp"));
  const xp =
    params.get("xp") !== null && Number.isFinite(xpParam) && xpParam >= 0
      ? Math.min(Math.floor(xpParam), config.curve[config.curve.length - 1])
      : undefined;
  const from =
    xp !== undefined
      ? levelForXp(config.curve, xp)
      : clampLevel(config.curve, Number(params.get("from") ?? 1));
  const toRaw = params.get("to");
  const to = clampLevel(
    config.curve,
    toRaw !== null
      ? Number(toRaw)
      : Math.min(maxLevelOf(config.curve), from + 1),
  );
  const m = params.get("m") ?? undefined;
  const method =
    m && config.methods.some((x) => x.id === m && (!skill || x.skill === skill))
      ? m
      : undefined;
  return { skill, from, xp, to, method };
}

/** Inverse of parseXpPlannerState (omits defaults). */
export function formatXpPlannerState(
  state: XpPlannerState,
  options: { includeSkill?: boolean } = {},
): string {
  const p = new URLSearchParams();
  if (state.skill && options.includeSkill !== false)
    p.set("skill", state.skill);
  if (state.xp !== undefined) p.set("xp", String(state.xp));
  else if (state.from > 1) p.set("from", String(state.from));
  p.set("to", String(state.to));
  if (state.method) p.set("m", state.method);
  return p.toString();
}

/** Current total XP of a state (exact XP when entered, else the level start). */
export function stateXp(curve: number[], state: XpPlannerState): number {
  return state.xp ?? xpForLevel(curve, state.from);
}
