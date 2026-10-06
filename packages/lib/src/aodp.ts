/**
 * Albion Online Data Project (AODP, albion-online-data.com): crowd-sourced
 * market prices, uploaded by players running the AODP client. Used by the
 * crafting calculator (`craftingMarket: "aodp"`), fetched in the browser —
 * the API sends `Access-Control-Allow-Origin: *` and rate-limits per IP.
 */

export const AODP_SERVERS = {
  americas: "west",
  asia: "east",
  europe: "europe",
} as const;
export type AodpServer = keyof typeof AODP_SERVERS;

/** Market cities (AODP location names). The Black Market only buys. */
export const AODP_CITIES = [
  "Bridgewatch",
  "Brecilien",
  "Caerleon",
  "Fort Sterling",
  "Lymhurst",
  "Martlock",
  "Thetford",
] as const;
export const AODP_BLACK_MARKET = "Black Market";

/** Enchanted resources are `<id>@<level>` on the market. */
const ENCHANTED_RESOURCE =
  /^T\d_(WOOD|ORE|HIDE|FIBER|ROCK|PLANKS|METALBAR|LEATHER|CLOTH|STONEBLOCK)_LEVEL(\d)$/;

/** Our codex id (`t4_wood_level1`) → the AODP item id (`T4_WOOD_LEVEL1@1`). */
export function aodpItemId(id: string): string {
  const up = id.toUpperCase();
  const m = up.match(ENCHANTED_RESOURCE);
  return m ? `${up}@${m[2]}` : up;
}

/** URL length budget per request (AODP rejects very long URLs). */
const MAX_URL = 3800;

/** Price URLs for `ids` (codex ids) in `cities`, split to stay short. */
export function aodpPriceUrls(
  server: AodpServer,
  ids: string[],
  cities: string[],
): string[] {
  const base = `https://${AODP_SERVERS[server]}.albion-online-data.com/api/v2/stats/prices/`;
  const query = `.json?locations=${cities.map(encodeURIComponent).join(",")}&qualities=1`;
  const urls: string[] = [];
  let batch: string[] = [];
  const flush = () => {
    if (batch.length) urls.push(`${base}${batch.join(",")}${query}`);
    batch = [];
  };
  for (const id of [...new Set(ids.map(aodpItemId))]) {
    const enc = encodeURIComponent(id);
    if (
      batch.length &&
      base.length + query.length + [...batch, enc].join(",").length > MAX_URL
    )
      flush();
    batch.push(enc);
  }
  flush();
  return urls;
}

export type AodpRow = {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
};

/** A market price and when a player last saw it (ms since epoch). */
export type MarketPrice = { amount: number; seenAt: number };

function seen(date: string): number {
  // UTC without a zone suffix; "0001-01-01T00:00:00" = never seen.
  const t = Date.parse(date.endsWith("Z") ? date : `${date}Z`);
  return Number.isFinite(t) && t > 0 ? t : 0;
}

/**
 * Rows → AODP item id → price in `city`: the cheapest sell order (what buying
 * costs, and what listing has to beat); the Black Market only has buy orders,
 * so there it is the best buy order (what selling there pays).
 */
export function aodpPrices(
  rows: AodpRow[],
  city: string,
): Record<string, MarketPrice> {
  const out: Record<string, MarketPrice> = {};
  const black = city === AODP_BLACK_MARKET;
  for (const r of rows) {
    if (r.city !== city) continue;
    const amount = black ? r.buy_price_max : r.sell_price_min;
    const seenAt = seen(black ? r.buy_price_max_date : r.sell_price_min_date);
    if (!(amount > 0) || !seenAt) continue;
    out[r.item_id] = { amount, seenAt };
  }
  return out;
}
