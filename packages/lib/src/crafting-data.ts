import {
  fetchDatabaseIndex,
  fetchDatabaseType,
  fetchDbDict,
  fetchVersion,
  type AppConfig,
  type DatabaseConfig,
  type FiltersConfig,
} from "./config";
import {
  buildCraftingGraph,
  craftableIds,
  type CraftDbCategory,
  type CraftingGraph,
} from "./crafting";

/**
 * Loading side of the crafting calculator (`/crafting`): reads every database
 * type of a game and keeps only the recipe props, so pages, the client payload
 * and the sitemap all work on one small memoized graph per data build.
 */

export const CRAFTING_PATH = "/crafting";

/**
 * A tenant opts in by listing `/crafting` in `internalLinks` — recipe data
 * alone is not enough: gaming.tools partner games and games whose recipe data
 * is not verified (e.g. no counts) stay off.
 */
export function hasCraftingTool(appConfig: AppConfig): boolean {
  return (appConfig.internalLinks ?? []).some(
    (l) => l.href === CRAFTING_PATH && !l.previewOnly,
  );
}

/** The props the calculator reads (database-quality.md §5.1). */
const RECIPE_PROPS = [
  "ingredients",
  "products",
  "craftedIn",
  "craftedAt",
  "producedIn",
  "craftable",
  "Station",
  "Alternate",
] as const;

function slimRef(r: unknown) {
  if (!r || typeof r !== "object") return r;
  const { id, section, count, group } = r as {
    id?: unknown;
    section?: unknown;
    count?: unknown;
    group?: unknown;
  };
  return {
    id,
    section,
    ...(count && count !== 1 ? { count } : {}),
    // `group` on ingredients = an "any of" slot (crafting.ts).
    ...(typeof group === "string" && group ? { group } : {}),
  };
}

function slimProp(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(slimRef);
  if (value && typeof value === "object") {
    if ("list" in value) return slimProp((value as { list: unknown }).list);
    if ("id" in value) return [slimRef(value)];
    if ("station" in value)
      return { station: (value as { station: unknown }).station };
  }
  return value;
}

/** Every entry that carries a recipe, with only the recipe props. */
export function slimCraftingSource(
  categories: DatabaseConfig,
): CraftDbCategory[] {
  const out: CraftDbCategory[] = [];
  for (const cat of categories) {
    const items: CraftDbCategory["items"] = [];
    for (const item of cat.items) {
      const props = item.props as Record<string, unknown> | undefined;
      // `_gather`: a gathered resource that also has recipes (Satisfactory
      // converter recipes for Coal) — kept even without own ingredients.
      const gather = props?._gather === true;
      const ingredients = slimProp(props?.ingredients);
      const hasRecipe = Array.isArray(ingredients) && ingredients.length > 0;
      if (!hasRecipe && !gather) continue;
      const slim: Record<string, unknown> = gather ? { _gather: true } : {};
      if (hasRecipe) {
        for (const k of RECIPE_PROPS) {
          if (props![k] !== undefined) slim[k] = slimProp(props![k]);
        }
      }
      items.push({ id: item.id, props: slim });
    }
    if (items.length) out.push({ type: cat.type, items });
  }
  return out;
}

/** A shop that sells an item, with its price label ("190 gold"), if any. */
export type CraftSeller = { id: string; section: string; price?: string };

/**
 * `soldBy` refs (codex shape: shop DbRefs, `tooltip` = price label) of every
 * item in the graph — the calculator's buy-or-gather choice.
 */
export function craftingSellers(
  categories: DatabaseConfig,
  graph: CraftingGraph,
): Record<string, CraftSeller[]> {
  const out: Record<string, CraftSeller[]> = {};
  for (const cat of categories) {
    for (const item of cat.items) {
      if (graph.sectionOf[item.id] === undefined) continue;
      const soldBy = (item.props as Record<string, unknown> | undefined)
        ?.soldBy;
      const list = Array.isArray(soldBy)
        ? soldBy
        : soldBy && typeof soldBy === "object" && "list" in soldBy
          ? (soldBy as { list: unknown }).list
          : [];
      if (!Array.isArray(list)) continue;
      const sellers: CraftSeller[] = [];
      for (const r of list as {
        id?: unknown;
        section?: unknown;
        tooltip?: unknown;
      }[]) {
        if (typeof r?.id !== "string" || typeof r.section !== "string")
          continue;
        if (sellers.some((s) => s.id === r.id)) continue;
        sellers.push({
          id: r.id,
          section: r.section,
          ...(typeof r.tooltip === "string" && r.tooltip
            ? { price: r.tooltip }
            : {}),
        });
      }
      if (sellers.length) out[item.id] = sellers;
    }
  }
  return out;
}

/**
 * Static vendor sell-price props (data-forge writes "Sell Price"; Duet Night
 * Abyss "Sell Value"). Only these: a bare "Price" / "Value" is a shop price in
 * some games and an internal score in others.
 */
const SELL_PRICE_PROPS = ["Sell Price", "Sell Value"] as const;

/** Item id → what one unit sells for (a numeric sell-price prop). */
export function craftingSellPrices(
  categories: DatabaseConfig,
  graph: CraftingGraph,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const cat of categories) {
    for (const item of cat.items) {
      if (graph.sectionOf[item.id] === undefined) continue;
      const props = item.props as Record<string, unknown> | undefined;
      for (const k of SELL_PRICE_PROPS) {
        const v = props?.[k];
        if (typeof v === "number" && Number.isFinite(v) && v > 0) {
          out[item.id] = v;
          break;
        }
      }
    }
  }
  return out;
}

/** "1,200 Fishing Medals" → `{ amount: 1200, currency: "Fishing Medals" }`. */
export function parsePrice(
  label: string | undefined,
): { amount: number; currency: string } | null {
  const m = label?.trim().match(/^(\d[\d,]*(?:\.\d+)?)\s+(\S.*)$/);
  if (!m) return null;
  const amount = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(amount) && amount > 0
    ? { amount, currency: m[2] }
    : null;
}

export type CraftingData = {
  /** Slim recipe entries (what the client rebuilds the graph from). */
  source: CraftDbCategory[];
  graph: CraftingGraph;
  /** Item id → shops selling it (codex `soldBy`), for buy-or-gather. */
  sellers: Record<string, CraftSeller[]>;
  /** Item id → static vendor sell price (`Sell Price` prop), if any. */
  sellPrices: Record<string, number>;
  /** The database index (names come from the dict, icons from here). */
  index: DatabaseConfig;
  /** Map filter types with spawns for an entry (`section/id` → type ids). */
  mapTypes: Record<string, string[]>;
};

function normName(name: string): string {
  return name.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

function term(dict: Record<string, string>, key: string): string {
  const v = dict[key];
  if (!v) return "";
  return v[0] === "@" ? (dict[v] ?? "") : v;
}

/**
 * Map filter types (with spawns) for every recipe item — the same rules as the
 * codex "On the map" block (db-map-links.ts): a declared `dbSection` link
 * first, else an exact English-name match (≥ 3 chars).
 */
export function craftingMapTypes(
  graph: CraftingGraph,
  filters: FiltersConfig,
  counts: Record<string, number> | undefined,
  enDict: Record<string, string>,
): Record<string, string[]> {
  const declared = new Map<string, string[]>();
  const byName = new Map<string, string[]>();
  const add = (m: Map<string, string[]>, k: string, v: string) => {
    const list = m.get(k) ?? [];
    if (!list.includes(v)) list.push(v);
    m.set(k, list);
  };
  for (const f of filters) {
    for (const v of f.values) {
      if (v.no_map_markers || (v as { live_only?: boolean }).live_only)
        continue;
      if (counts && !(counts[v.id] > 0)) continue;
      if (v.dbSection)
        add(declared, `${v.dbSection}/${v.dbEntryId ?? v.id}`, v.id);
      const name = normName(term(enDict, v.id));
      if (name.length >= 3) add(byName, name, v.id);
    }
  }
  const out: Record<string, string[]> = {};
  for (const [id, section] of Object.entries(graph.sectionOf)) {
    const key = `${section}/${id}`;
    const own = declared.get(key);
    const name = normName(term(enDict, id));
    const types = own?.length
      ? own
      : name.length >= 3
        ? byName.get(name)
        : undefined;
    if (types?.length) out[key] = [...types];
  }
  return out;
}

const memo = new Map<string, { stamp: string; data: Promise<CraftingData> }>();

async function load(appName: string): Promise<CraftingData> {
  const [index, version, enDict] = await Promise.all([
    fetchDatabaseIndex(appName).catch(() => [] as DatabaseConfig),
    fetchVersion(appName).catch(() => null),
    fetchDbDict(appName, "en").catch(() => ({}) as Record<string, string>),
  ]);
  const types = index.filter((c) => !c.type.startsWith("_"));
  const full = await Promise.all(
    types.map((c) => fetchDatabaseType(appName, c.type).catch(() => null)),
  );
  const loaded = full.filter((c): c is DatabaseConfig[number] => !!c);
  const source = slimCraftingSource(loaded);
  const graph = buildCraftingGraph(source);
  const sellers = craftingSellers(loaded, graph);
  const sellPrices = craftingSellPrices(loaded, graph);
  // Map spawns are only for "show on map" links — NOT a gather default:
  // placed structures, wrecks and loot crates are map markers too.
  const mapTypes = craftingMapTypes(
    graph,
    version?.data.filters ?? [],
    version?.counts?.byType,
    enDict,
  );
  return { source, graph, sellers, sellPrices, index, mapTypes };
}

/**
 * The game's crafting graph (empty when it has no recipes), memoized per
 * data build (`version.more.contentHash`).
 */
export async function fetchCraftingData(
  appName: string,
): Promise<CraftingData> {
  const version = await fetchVersion(appName).catch(() => null);
  const stamp = version?.more?.contentHash ?? version?.id ?? "";
  const hit = memo.get(appName);
  if (hit && hit.stamp === stamp) return hit.data;
  const data = load(appName);
  memo.set(appName, { stamp, data });
  data.catch(() => {
    if (memo.get(appName)?.data === data) memo.delete(appName);
  });
  return data;
}

/** Item ids with a `/crafting/<id>` page: craftable AND a codex entry. */
export function craftingPageIds(data: CraftingData): string[] {
  const entries = new Set(
    data.index.flatMap((c) =>
      c.type.startsWith("_") ? [] : c.items.map((i) => i.id),
    ),
  );
  return craftableIds(data.graph).filter((id) => entries.has(id));
}

/** Sitemap paths of the crafting tool (hub + per-item pages). */
export async function craftingSitemapPaths(
  appConfig: AppConfig,
): Promise<string[]> {
  if (!hasCraftingTool(appConfig)) return [];
  const data = await fetchCraftingData(appConfig.name).catch(() => null);
  if (!data) return [];
  return craftingPageIds(data).map(
    (id) => `${CRAFTING_PATH}/${encodeURIComponent(id)}`,
  );
}
