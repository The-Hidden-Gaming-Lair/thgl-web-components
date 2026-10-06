import {
  encodeMapFilterParam,
  fetchCraftingData,
  getDbSectionByType,
  hasCraftingTool,
  translate,
  type AppConfig,
  type CraftingData,
  type Version,
} from "@repo/lib";
import { resolveDict } from "@/lib/db/resolve-dict";

/**
 * Crafting calculator data for the current tenant: the memoized recipe graph
 * (lib `fetchCraftingData`) plus per-item display info. Null when the tenant
 * has not opted in (`/crafting` internalLink) or the game has no recipes —
 * the pages 404 then.
 */
export async function loadCrafting(
  appConfig: AppConfig,
): Promise<CraftingData | null> {
  if (!hasCraftingTool(appConfig)) return null;
  const data = await fetchCraftingData(appConfig.name).catch(() => null);
  if (!data || data.graph.recipes.length === 0) return null;
  return data;
}

export type CraftIcon = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** What the UI shows for one item (paths are NOT locale-prefixed). */
export type CraftItemInfo = {
  name: string;
  icon?: CraftIcon;
  /** Codex entry path, when the item has one. */
  db?: string;
  /** Map (single-map games) or location guide path, when it has spawns. */
  map?: string;
  /** Shops selling it (codex `soldBy`): name, codex path, price label. */
  sellers?: { name: string; db?: string; price?: string }[];
  /** What one unit sells for at a vendor (codex `Sell Price`). */
  sell?: number;
};

/**
 * Name, icon, codex link and map link for every item the graph mentions.
 * `dict` = the page's full db dict for the locale (names + type labels).
 */
export function craftItemInfos(
  appConfig: AppConfig,
  data: CraftingData,
  dict: Record<string, string>,
  version: Version,
  ids: Iterable<string> = Object.keys(data.graph.sectionOf),
): Record<string, CraftItemInfo> {
  const icons = new Map<string, CraftIcon>();
  const typeOf = new Map<string, string>();
  for (const cat of data.index) {
    if (cat.type.startsWith("_")) continue;
    for (const item of cat.items) {
      typeOf.set(item.id, cat.type);
      if (item.icon && typeof item.icon === "object") {
        icons.set(item.id, item.icon as CraftIcon);
      }
    }
  }
  const slugByType = getDbSectionByType(appConfig.db?.homeSections, data.index);
  const filters = version.data.filters;
  const tileNames = Object.keys(version.data.tiles ?? {});
  const singleMap =
    tileNames.length === 1
      ? version.data.tiles[tileNames[0]]?.defaultTitle ||
        translate(dict, tileNames[0])
      : null;

  const out: Record<string, CraftItemInfo> = {};
  for (const id of ids) {
    if (out[id]) continue;
    const type = typeOf.get(id);
    const slug = type ? slugByType.get(type) : undefined;
    const section = data.graph.sectionOf[id];
    const typeIds = data.mapTypes[`${section}/${id}`];
    let map: string | undefined;
    if (typeIds?.length) {
      const param = singleMap ? encodeMapFilterParam(filters, typeIds) : null;
      map =
        singleMap && param
          ? `/maps/${encodeURIComponent(singleMap)}?filters=${encodeURIComponent(param)}`
          : `/guides/${encodeURIComponent(translate(dict, typeIds[0]))}`;
    }
    const sellers = data.sellers[id]?.map((s) => {
      const shopSlug = slugByType.get(s.section);
      return {
        name: resolveDict(dict, s.id),
        db: shopSlug
          ? `/db/${shopSlug}/${encodeURIComponent(s.id)}`
          : undefined,
        price: s.price,
      };
    });
    out[id] = {
      name: resolveDict(dict, id),
      icon: icons.get(id),
      db: slug ? `/db/${slug}/${encodeURIComponent(id)}` : undefined,
      map,
      ...(sellers?.length ? { sellers } : {}),
      ...(data.sellPrices[id] ? { sell: data.sellPrices[id] } : {}),
    };
  }
  return out;
}

/** The `crafting.*` UI strings of a locale (sent to client components). */
export function craftingLabels(dict: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(dict).filter(([k]) => k.startsWith("crafting.")),
  );
}
