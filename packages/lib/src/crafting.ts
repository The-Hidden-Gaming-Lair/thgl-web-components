/**
 * Generic crafting calculator (`/crafting`, inbox #307): pure logic over the
 * database recipe contract (data-forge add-game `references/database-quality.md`
 * §5.1), shared by the server pages and the client calculator.
 *
 * Contract, in short:
 * - a recipe is any entry with `ingredients: DbRef[]` (`count` = amount, default 1);
 * - its output is `products: DbRef[]` (`count` = yield per craft, default 1);
 *   an entry WITHOUT `products` is the recipe for itself, yield 1;
 * - when explicit recipes (with `products`) make an item, the item's own
 *   `ingredients` are a mirror of them and ignored;
 * - stations come as `craftedIn` / `craftedAt` / `producedIn` DbRefs, or the
 *   display strings `craftable.station` / `Station`.
 *
 * Everything here is side-effect free (no fetch, no DOM) so it runs and is
 * tested on both sides. The XP planner (#305) reuses `planCrafting` for the
 * material cost of a training method.
 */

/** A stack of one entry: `count` of `id` (an entry of db section `section`). */
export type CraftRef = { id: string; section: string; count: number };

/** Where a recipe is made: a db entry (linkable) or a display label. */
export type CraftStation =
  | { id: string; section: string; label?: undefined }
  | { id?: undefined; section?: undefined; label: string };

export type CraftRecipe = {
  /** Id of the db entry that carries the recipe (a recipe or the item itself). */
  key: string;
  /** Db section of that entry. */
  section: string;
  products: CraftRef[];
  ingredients: CraftRef[];
  stations: CraftStation[];
  /** Marked `Alternate` in the data (Satisfactory) — never the default. */
  alternate: boolean;
  /** Derived from an item's own `ingredients` (no `products` prop). */
  implicit: boolean;
};

export type CraftingGraph = {
  recipes: CraftRecipe[];
  /** Item id → indices into `recipes` that make it, best first. */
  byProduct: Record<string, number[]>;
  /** Item id → the recipe used by default; null = gathered by default. */
  defaults: Record<string, number | null>;
  /** Item id → indices into `recipes` that consume it. */
  usedIn: Record<string, number[]>;
  /** Every id seen (product, ingredient, station) → its db section. */
  sectionOf: Record<string, string>;
};

/** Minimal db shapes this module reads (structurally `DatabaseConfig`). */
export type CraftDbEntry = { id: string; props?: Record<string, unknown> };
export type CraftDbCategory = { type: string; items: CraftDbEntry[] };

type RawRef = { id?: unknown; section?: unknown; count?: unknown };

function toRefs(value: unknown, fallbackSection?: string): CraftRef[] {
  const list = Array.isArray(value)
    ? value
    : value && typeof value === "object" && "list" in value
      ? (value as { list: unknown }).list
      : value && typeof value === "object" && "id" in value
        ? [value]
        : [];
  if (!Array.isArray(list)) return [];
  const out: CraftRef[] = [];
  for (const raw of list as RawRef[]) {
    if (!raw || typeof raw.id !== "string" || !raw.id) continue;
    const section =
      typeof raw.section === "string" && raw.section
        ? raw.section
        : fallbackSection;
    if (!section) continue;
    const n = typeof raw.count === "number" ? raw.count : Number(raw.count);
    const count = Number.isFinite(n) && n > 0 ? n : 1;
    // The same ingredient listed twice (rare data quirk) = one stack.
    const prev = out.find((r) => r.id === raw.id);
    if (prev) prev.count += count;
    else out.push({ id: raw.id, section, count });
  }
  return out;
}

const STATION_REF_KEYS = ["craftedIn", "craftedAt", "producedIn"] as const;

/** Normalize the station shapes of one entry's props. */
export function readStations(props: Record<string, unknown>): CraftStation[] {
  const refs = STATION_REF_KEYS.flatMap((k) => toRefs(props[k]));
  if (refs.length) {
    const seen = new Set<string>();
    return refs
      .filter((r) => !seen.has(r.id) && seen.add(r.id))
      .map((r) => ({ id: r.id, section: r.section }));
  }
  const craftable = props.craftable as { station?: unknown } | undefined;
  const label =
    (craftable && typeof craftable.station === "string" && craftable.station) ||
    (typeof props.Station === "string" && props.Station) ||
    "";
  return label ? [{ label }] : [];
}

function isAlternate(props: Record<string, unknown>): boolean {
  const v = props.Alternate ?? props.alternate;
  return v === true || (typeof v === "string" && /^(yes|true)$/i.test(v));
}

const PURCHASE = /shop|vendor|store|merchant|trader/i;

/**
 * A "recipe" that buys the item (Witchspire shop recipes) or upgrades the
 * previous tier (Starsand `_upgrade` formulas) — a valid alternative, but not
 * what "how do I craft X" means, so never the default when another exists.
 */
function isPurchaseOrUpgrade(r: CraftRecipe): boolean {
  return (
    /(^|_)(upgrade|shop)(_|$)/i.test(r.key) ||
    r.stations.some((s) => PURCHASE.test(s.label ?? s.id ?? ""))
  );
}

/** `recipe_fuel` / `item_fuel` → `fuel` (the shared name stem). */
function stem(id: string): string {
  const i = id.indexOf("_");
  return (i >= 0 ? id.slice(i + 1) : id).toLowerCase();
}

/**
 * Build the recipe graph from database categories (full type files — the
 * index alone carries no props). Order of `byProduct[id]` = default first:
 * standard over alternate, main output over byproduct, a recipe named after
 * the item, not consuming its own product, then data order.
 */
export function buildCraftingGraph(
  categories: CraftDbCategory[],
  options: {
    /** Gathered by default even when craftable (adds to `_gather` props). */
    gatherable?: Iterable<string>;
  } = {},
): CraftingGraph {
  const recipes: CraftRecipe[] = [];
  const sectionOf: Record<string, string> = {};
  const implicit: CraftRecipe[] = [];
  for (const cat of categories) {
    // In a recipe section (entries name OTHER entries as products), an entry
    // without `products` is an incomplete recipe — never "makes itself".
    // (An item's self-ref yield does not make its section a recipe section.)
    const recipeSection = cat.items.some((e) =>
      toRefs(e.props?.products, cat.type).some((p) => p.id !== e.id),
    );
    for (const entry of cat.items) {
      sectionOf[entry.id] ??= cat.type;
      const props = entry.props;
      if (!props) continue;
      const ingredients = toRefs(props.ingredients, cat.type);
      if (!ingredients.length) continue;
      const products = toRefs(props.products, cat.type);
      if (!products.length && recipeSection) continue;
      const recipe: CraftRecipe = {
        key: entry.id,
        section: cat.type,
        products: products.length
          ? products
          : [{ id: entry.id, section: cat.type, count: 1 }],
        ingredients,
        stations: readStations(props),
        alternate: isAlternate(props),
        implicit: !products.length,
      };
      (products.length ? recipes : implicit).push(recipe);
    }
  }
  // Explicit recipes win: an item's own ingredients mirror them — unless all
  // of them are alternates (Grounded 2 lists only the extra ways to make an
  // item in its recipe section; the item keeps its standard recipe).
  const explicitProducts = new Set(
    recipes.flatMap((r) => (r.alternate ? [] : r.products.map((p) => p.id))),
  );
  for (const r of implicit) {
    if (!explicitProducts.has(r.products[0].id)) recipes.push(r);
  }

  const byProduct: Record<string, number[]> = {};
  const usedIn: Record<string, number[]> = {};
  recipes.forEach((r, i) => {
    for (const p of r.products) {
      sectionOf[p.id] ??= p.section;
      (byProduct[p.id] ??= []).push(i);
    }
    for (const ing of r.ingredients) {
      sectionOf[ing.id] ??= ing.section;
      const list = (usedIn[ing.id] ??= []);
      if (list[list.length - 1] !== i) list.push(i);
    }
    for (const s of r.stations) if (s.id) sectionOf[s.id] ??= s.section;
  });
  // Two recipes that turn A into B and B back into A (Palworld Pal Souls,
  // Satisfactory packaging): the direction that makes MORE units than it
  // consumes is the breakdown — never the default.
  const reversesLoop = (r: CraftRecipe, id: string) => {
    const made = r.products.reduce((n, p) => n + p.count, 0);
    const used = r.ingredients.reduce((n, g) => n + g.count, 0);
    if (made <= used) return false;
    return r.ingredients.some((g) =>
      (byProduct[g.id] ?? []).some((j) =>
        recipes[j].ingredients.some((h) => h.id === id),
      ),
    );
  };
  const gatherable = new Set(options.gatherable ?? []);
  for (const cat of categories) {
    for (const entry of cat.items) {
      if (entry.props?._gather === true) gatherable.add(entry.id);
    }
  }
  const defaults: Record<string, number | null> = {};
  for (const [id, list] of Object.entries(byProduct)) {
    const score = (i: number) => {
      const r = recipes[i];
      return (
        (r.products[0].id === id ? 0 : 16) +
        (r.alternate ? 8 : 0) +
        (isPurchaseOrUpgrade(r) ? 4 : 0) +
        (stem(r.key) === stem(id) || r.key === id ? 0 : 2) +
        (r.ingredients.some((g) => g.id === id) ? 1 : 0)
      );
    };
    list.sort((a, b) => score(a) - score(b) || a - b);
    // Default: gather what the data flags `_gather` (Satisfactory Coal has
    // converter recipes, players mine it); else the best recipe that makes
    // the item as its MAIN output, does not consume it and is not a reverse
    // recipe (unpackage / breakdown). Nothing left → gathered.
    defaults[id] = gatherable.has(id)
      ? null
      : (list.find((i) => {
          const r = recipes[i];
          return (
            r.products[0].id === id &&
            !r.ingredients.some((g) => g.id === id) &&
            !REVERSE.test(r.key) &&
            !reversesLoop(r, id)
          );
        }) ?? null);
  }
  return { recipes, byProduct, defaults, usedIn, sectionOf };
}

/** Recipes that take an item apart again — never a default. */
const REVERSE =
  /(^|_)(un_?package\w*|unpack\w*|breakdown|break_down|recycl\w*|salvag\w*|dismantl\w*|disassembl\w*|decompos\w*)(_|$)/i;

/** `choice[id] = RAW_CHOICE`: gather / already have it, do not craft. */
export const RAW_CHOICE = "-";

/** Item ids crafted by default (a recipe page / picker entry each). */
export function craftableIds(graph: CraftingGraph): string[] {
  return Object.keys(graph.byProduct).filter(
    (id) => graph.defaults[id] != null,
  );
}

/** Recipe indices for an item, best first (empty = raw material). */
export function recipesFor(graph: CraftingGraph, id: string): number[] {
  return graph.byProduct[id] ?? [];
}

/**
 * Item id → chosen recipe KEY (`CraftRecipe.key`) or `RAW_CHOICE`;
 * missing = the graph default.
 */
export type RecipeChoice = Record<string, string>;

/** The recipe index used for `id` under `choice` (undefined = raw). */
export function chosenRecipe(
  graph: CraftingGraph,
  id: string,
  choice: RecipeChoice = {},
): number | undefined {
  const list = graph.byProduct[id];
  if (!list?.length) return undefined;
  const key = choice[id];
  if (key === RAW_CHOICE) return undefined;
  if (key) {
    const hit = list.find((i) => graph.recipes[i].key === key);
    if (hit !== undefined) return hit;
  }
  return graph.defaults[id] ?? undefined;
}

/** How many `id` one craft of `recipe` yields. */
export function recipeYield(recipe: CraftRecipe, id: string): number {
  return recipe.products.find((p) => p.id === id)?.count ?? 1;
}

export type CraftStep = {
  id: string;
  section: string;
  /** Amount needed. */
  qty: number;
  /** Recipe index used, undefined for a raw material. */
  recipe?: number;
  /** Times the recipe runs: ceil(qty / yield). */
  crafts: number;
  /** Amount one craft makes. */
  yield: number;
  /** Inputs for `crafts` runs. */
  children: { id: string; section: string; qty: number }[];
};

/** One level of the tree: what making `qty` of `id` takes. */
export function craftStep(
  graph: CraftingGraph,
  id: string,
  qty: number,
  choice: RecipeChoice = {},
): CraftStep {
  const section = graph.sectionOf[id] ?? "";
  const ri = chosenRecipe(graph, id, choice);
  if (ri === undefined) {
    return { id, section, qty, crafts: 0, yield: 1, children: [] };
  }
  const recipe = graph.recipes[ri];
  const y = recipeYield(recipe, id);
  const crafts = Math.ceil(qty / y);
  return {
    id,
    section,
    qty,
    recipe: ri,
    crafts,
    yield: y,
    children: recipe.ingredients.map((g) => ({
      id: g.id,
      section: g.section,
      qty: g.count * crafts,
    })),
  };
}

export type CraftTarget = { id: string; qty: number };

export type CraftPlanLine = { id: string; section: string; qty: number };
export type CraftPlanCraft = CraftPlanLine & {
  recipe: number;
  crafts: number;
  /** crafts × yield (≥ qty; the rest is surplus). */
  produced: number;
};

export type CraftPlan = {
  /** Base materials to gather, largest first. */
  raw: CraftPlanLine[];
  /** Everything crafted on the way (targets included), in build order. */
  crafted: CraftPlanCraft[];
  /** Stations used, with the number of crafts at each. */
  stations: { station: CraftStation; crafts: number }[];
  /** Left over after crafting (rounding up to whole crafts, byproducts). */
  surplus: CraftPlanLine[];
  /** Items whose recipe loops back to an ancestor — counted as raw there. */
  cycles: string[];
};

/**
 * The whole shopping list for `targets`, aggregated across the tree so a
 * shared intermediate is crafted in whole batches once (not rounded up per
 * branch). A recipe that leads back to an item already being expanded (a
 * cycle) stops there: that input is counted as raw.
 */
export function planCrafting(
  graph: CraftingGraph,
  targets: CraftTarget[],
  choice: RecipeChoice = {},
): CraftPlan {
  // 1. DFS over chosen recipes: post-order + back edges (cycles).
  const order: string[] = [];
  const state = new Map<string, 1 | 2>(); // 1 = on stack, 2 = done
  const backEdges = new Set<string>(); // `${from}\u0000${to}`
  const cycles = new Set<string>();
  const visit = (root: string) => {
    if (state.has(root)) return;
    // Iterative DFS (deep factory chains must not blow the stack).
    const stack: { id: string; next: number; inputs: string[] }[] = [];
    const push = (id: string) => {
      state.set(id, 1);
      const ri = chosenRecipe(graph, id, choice);
      const inputs =
        ri === undefined ? [] : graph.recipes[ri].ingredients.map((g) => g.id);
      stack.push({ id, next: 0, inputs });
    };
    push(root);
    while (stack.length) {
      const top = stack[stack.length - 1];
      if (top.next < top.inputs.length) {
        const to = top.inputs[top.next++];
        const s = state.get(to);
        if (s === 1) {
          backEdges.add(`${top.id}\u0000${to}`);
          cycles.add(to);
        } else if (s === undefined) push(to);
      } else {
        state.set(top.id, 2);
        order.push(top.id);
        stack.pop();
      }
    }
  };
  for (const t of targets) visit(t.id);

  // 2. Push demand down in topological order (reverse post-order).
  const demand = new Map<string, number>();
  const raw = new Map<string, number>();
  const add = (m: Map<string, number>, id: string, n: number) =>
    m.set(id, (m.get(id) ?? 0) + n);
  for (const t of targets) if (t.qty > 0) add(demand, t.id, t.qty);

  const crafted: CraftPlanCraft[] = [];
  const surplus = new Map<string, number>();
  const stationCrafts = new Map<string, { station: CraftStation; n: number }>();
  for (let k = order.length - 1; k >= 0; k--) {
    const id = order[k];
    const need = demand.get(id) ?? 0;
    if (need <= 0) continue;
    const section = graph.sectionOf[id] ?? "";
    const ri = chosenRecipe(graph, id, choice);
    if (ri === undefined) {
      add(raw, id, need);
      continue;
    }
    const recipe = graph.recipes[ri];
    const y = recipeYield(recipe, id);
    const crafts = Math.ceil(need / y);
    crafted.push({
      id,
      section,
      qty: need,
      recipe: ri,
      crafts,
      produced: crafts * y,
    });
    if (crafts * y > need) add(surplus, id, crafts * y - need);
    for (const p of recipe.products) {
      if (p.id !== id) add(surplus, p.id, p.count * crafts);
    }
    for (const g of recipe.ingredients) {
      const n = g.count * crafts;
      if (backEdges.has(`${id}\u0000${g.id}`)) add(raw, g.id, n);
      else add(demand, g.id, n);
    }
    for (const s of recipe.stations) {
      const key = s.id ?? `label:${s.label}`;
      const prev = stationCrafts.get(key);
      if (prev) prev.n += crafts;
      else stationCrafts.set(key, { station: s, n: crafts });
    }
  }

  const sectionFor = (id: string) => graph.sectionOf[id] ?? "";
  const lines = (m: Map<string, number>) =>
    [...m]
      .filter(([, n]) => n > 0)
      .map(([id, qty]) => ({ id, section: sectionFor(id), qty }))
      .sort((a, b) => b.qty - a.qty || a.id.localeCompare(b.id));
  return {
    raw: lines(raw),
    crafted,
    stations: [...stationCrafts.values()]
      .map(({ station, n }) => ({ station, crafts: n }))
      .sort((a, b) => b.crafts - a.crafts),
    surplus: lines(surplus),
    cycles: [...cycles],
  };
}

/** Longest ingredient chain under `id` (0 = raw), cycle-safe. */
export function craftDepth(
  graph: CraftingGraph,
  id: string,
  choice: RecipeChoice = {},
  seen: Set<string> = new Set(),
): number {
  const ri = chosenRecipe(graph, id, choice);
  if (ri === undefined || seen.has(id)) return 0;
  seen.add(id);
  let max = 0;
  for (const g of graph.recipes[ri].ingredients) {
    max = Math.max(max, craftDepth(graph, g.id, choice, seen));
  }
  seen.delete(id);
  return max + 1;
}

const MAX_QTY = 1_000_000;

/** `?items=id:qty,id2:qty` → targets (bad parts dropped, qty clamped). */
export function parseCraftItems(
  param: string | null | undefined,
): CraftTarget[] {
  if (!param) return [];
  const out: CraftTarget[] = [];
  for (const part of param.split(",")) {
    if (!part) continue;
    const at = part.lastIndexOf(":");
    if (at === 0) continue;
    const rawId = at > 0 ? part.slice(0, at) : part;
    const n = at > 0 ? Number(part.slice(at + 1)) : 1;
    let id: string;
    try {
      id = decodeURIComponent(rawId);
    } catch {
      continue;
    }
    if (!id) continue;
    const qty = Number.isFinite(n)
      ? Math.min(MAX_QTY, Math.max(1, Math.floor(n)))
      : 1;
    const prev = out.find((t) => t.id === id);
    if (prev) prev.qty = Math.min(MAX_QTY, prev.qty + qty);
    else out.push({ id, qty });
  }
  return out;
}

/** Inverse of `parseCraftItems`. */
export function formatCraftItems(targets: CraftTarget[]): string {
  return targets.map((t) => `${encodeURIComponent(t.id)}:${t.qty}`).join(",");
}

/** `?r=item:recipeKey,...` → choice (keys must exist for that item). */
export function parseRecipeChoice(
  param: string | null | undefined,
  graph?: CraftingGraph,
): RecipeChoice {
  const out: RecipeChoice = {};
  if (!param) return out;
  for (const part of param.split(",")) {
    const at = part.indexOf(":");
    if (at <= 0) continue;
    let id: string, key: string;
    try {
      id = decodeURIComponent(part.slice(0, at));
      key = decodeURIComponent(part.slice(at + 1));
    } catch {
      continue;
    }
    if (
      graph &&
      !(graph.byProduct[id] ?? []).some((i) => graph.recipes[i].key === key)
    )
      continue;
    out[id] = key;
  }
  return out;
}

/** Inverse of `parseRecipeChoice`; drops choices equal to the default. */
export function formatRecipeChoice(
  choice: RecipeChoice,
  graph?: CraftingGraph,
): string {
  return Object.entries(choice)
    .filter(
      ([id, key]) =>
        !graph || graph.recipes[graph.byProduct[id]?.[0] ?? -1]?.key !== key,
    )
    .map(([id, key]) => `${encodeURIComponent(id)}:${encodeURIComponent(key)}`)
    .join(",");
}
