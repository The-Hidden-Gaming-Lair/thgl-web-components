"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AODP_BLACK_MARKET,
  AODP_CITIES,
  AODP_SERVERS,
  aodpItemId,
  aodpPrices,
  aodpPriceUrls,
  type AodpRow,
  type AodpServer,
  type MarketPrice,
} from "@repo/lib";
import type { CraftItemInfo } from "./data";
import { craftT, formatQty } from "./tree";

/**
 * Prices in the crafting calculator, from one of two sources:
 * - market: live crowd-sourced prices (`craftingMarket: "aodp"`, Albion) per
 *   server and city, with the age of every price;
 * - static: the vendor sell price of the codex (`Sell Price` prop).
 * Materials are priced where the player buys them, crafted items where they
 * sell them; the panel adds both up and shows the difference.
 */

/** A price older than this is flagged as old. */
const OLD_MS = 24 * 60 * 60 * 1000;

type MarketSettings = { server: AodpServer; buyCity: string; sellCity: string };

const DEFAULT_MARKET: MarketSettings = {
  server: "americas",
  buyCity: "Martlock",
  sellCity: "Martlock",
};

const SELL_CITIES = [...AODP_CITIES, AODP_BLACK_MARKET];

function readSettings(key: string): MarketSettings {
  try {
    const s = JSON.parse(localStorage.getItem(key) ?? "{}");
    return {
      server: s.server in AODP_SERVERS ? s.server : DEFAULT_MARKET.server,
      buyCity: (AODP_CITIES as readonly string[]).includes(s.buyCity)
        ? s.buyCity
        : DEFAULT_MARKET.buyCity,
      sellCity: SELL_CITIES.includes(s.sellCity)
        ? s.sellCity
        : DEFAULT_MARKET.sellCity,
    };
  } catch {
    return DEFAULT_MARKET;
  }
}

/** Fetched rows per server + cities + item set (shared by every render). */
const rowCache = new Map<string, Promise<AodpRow[]>>();

function fetchRows(
  server: AodpServer,
  ids: string[],
  cities: string[],
): Promise<AodpRow[]> {
  const key = `${server}|${cities.join(",")}|${[...ids].sort().join(",")}`;
  let hit = rowCache.get(key);
  if (!hit) {
    hit = Promise.all(
      aodpPriceUrls(server, ids, cities).map((u) =>
        fetch(u).then((r) =>
          r.ok ? (r.json() as Promise<AodpRow[]>) : Promise.reject(r.status),
        ),
      ),
    ).then((parts) => parts.flat());
    rowCache.set(key, hit);
    hit.catch(() => rowCache.delete(key));
    // Prices move: refetch after a few minutes on the next change.
    setTimeout(() => rowCache.delete(key), 5 * 60 * 1000);
  }
  return hit;
}

export type CraftPrices = {
  kind: "market" | "static";
  /** Unit price of a material (where it is bought). */
  buy: (id: string) => MarketPrice | null;
  /** Unit price of a crafted item (where it is sold). */
  sell: (id: string) => MarketPrice | null;
  loading: boolean;
  error: boolean;
  market?: MarketSettings & {
    set: (next: Partial<MarketSettings>) => void;
  };
};

/**
 * The calculator's prices. `buyIds` = the shopping list, `sellIds` = the
 * crafting plan. Null when the game has neither source.
 */
export function useCraftPrices({
  game,
  market,
  infos,
  buyIds,
  sellIds,
}: {
  game: string;
  market?: "aodp";
  infos: Record<string, CraftItemInfo>;
  buyIds: string[];
  sellIds: string[];
}): CraftPrices | null {
  const key = `thgl-crafting-market:${game}`;
  const [settings, setSettings] = useState<MarketSettings>(DEFAULT_MARKET);
  const [rows, setRows] = useState<AodpRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (market) setSettings(readSettings(key));
  }, [market, key]);

  const idsKey = [...buyIds, "|", ...sellIds].join(",");
  useEffect(() => {
    if (!market || (!buyIds.length && !sellIds.length)) return;
    let alive = true;
    setLoading(true);
    setError(false);
    const cities = [...new Set([settings.buyCity, settings.sellCity])];
    // Short pause: typing a quantity or picking recipes fires many changes.
    const timer = setTimeout(() => {
      fetchRows(settings.server, [...buyIds, ...sellIds], cities)
        .then((r) => alive && setRows(r))
        .catch(() => alive && setError(true))
        .finally(() => alive && setLoading(false));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, idsKey, settings]);

  const byCity = useMemo(() => {
    if (!rows) return null;
    return {
      buy: aodpPrices(rows, settings.buyCity),
      sell: aodpPrices(rows, settings.sellCity),
    };
  }, [rows, settings.buyCity, settings.sellCity]);

  const hasStatic = useMemo(
    () => Object.values(infos).some((i) => i.sell),
    [infos],
  );

  if (market === "aodp") {
    return {
      kind: "market",
      buy: (id) => byCity?.buy[aodpItemId(id)] ?? null,
      sell: (id) => byCity?.sell[aodpItemId(id)] ?? null,
      loading,
      error,
      market: {
        ...settings,
        set: (next) =>
          setSettings((prev) => {
            const merged = { ...prev, ...next };
            try {
              localStorage.setItem(key, JSON.stringify(merged));
            } catch {
              // Storage blocked: the choice still holds for this visit.
            }
            return merged;
          }),
      },
    };
  }
  if (!hasStatic) return null;
  const fixed = (id: string) =>
    infos[id]?.sell ? { amount: infos[id].sell!, seenAt: 0 } : null;
  return {
    kind: "static",
    buy: fixed,
    sell: fixed,
    loading: false,
    error: false,
  };
}

function ago(seenAt: number, locale: string): string {
  const mins = Math.round((Date.now() - seenAt) / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (mins < 60) return rtf.format(-Math.max(mins, 0), "minute");
  const hours = Math.round(mins / 60);
  if (hours < 48) return rtf.format(-hours, "hour");
  return rtf.format(-Math.round(hours / 24), "day");
}

/** "342 each · 4,104" (+ the age of a market price) for one line. */
export function PriceTag({
  price,
  qty,
  prices,
  labels,
  locale,
}: {
  price: MarketPrice | null;
  qty: number;
  prices: CraftPrices;
  labels: Record<string, string>;
  locale: string;
}) {
  const t = craftT(labels);
  if (!price) {
    if (prices.loading) return null;
    return (
      <span className="text-xs text-muted-foreground">
        {t("prices.noPrice")}
      </span>
    );
  }
  const old = price.seenAt > 0 && Date.now() - price.seenAt > OLD_MS;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1 text-xs tabular-nums">
      <span className="text-muted-foreground">
        {t("prices.each", { price: formatQty(price.amount, locale) })}
      </span>
      <span className="font-medium text-amber-200">
        {formatQty(price.amount * qty, locale)}
        {prices.kind === "market" ? ` ${t("prices.silver")}` : ""}
      </span>
      {price.seenAt > 0 && (
        <span
          className={old ? "text-orange-400" : "text-muted-foreground"}
          title={new Date(price.seenAt).toLocaleString(locale)}
        >
          (
          {t(old ? "prices.old" : "prices.updated", {
            age: ago(price.seenAt, locale),
          })}
          )
        </span>
      )}
    </span>
  );
}

/** Totals (materials vs. crafted items), the market pickers and the credit. */
export function PricePanel({
  prices,
  raw,
  targets,
  name,
  labels,
  locale,
}: {
  prices: CraftPrices;
  raw: { id: string; qty: number }[];
  targets: { id: string; qty: number }[];
  name: (id: string) => string;
  labels: Record<string, string>;
  locale: string;
}) {
  const t = craftT(labels);
  const sum = (
    lines: { id: string; qty: number }[],
    get: (id: string) => MarketPrice | null,
  ) => {
    let total = 0;
    const missing: string[] = [];
    for (const l of lines) {
      const p = get(l.id);
      if (p) total += p.amount * l.qty;
      else missing.push(l.id);
    }
    return { total, missing };
  };
  const mats = sum(raw, prices.buy);
  const made = sum(targets, prices.sell);
  const missing = [...new Set([...mats.missing, ...made.missing])];
  const market = prices.kind === "market";
  const unit = market ? ` ${t("prices.silver")}` : "";
  const money = (n: number) => `${formatQty(Math.round(n), locale)}${unit}`;
  const diff = made.total - mats.total;
  const m = prices.market;

  return (
    <section className="space-y-2 rounded-md border p-3 text-sm">
      <h3 className="font-semibold">
        {t(market ? "prices.marketTitle" : "prices.staticTitle")}
      </h3>
      {m && (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="inline-flex items-center gap-1">
            {t("prices.server")}
            <select
              className="h-7 rounded border bg-background px-1"
              value={m.server}
              onChange={(e) => m.set({ server: e.target.value as AodpServer })}
            >
              {(Object.keys(AODP_SERVERS) as AodpServer[]).map((s) => (
                <option key={s} value={s}>
                  {t(`prices.server.${s}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex items-center gap-1">
            {t("prices.buyCity")}
            <select
              className="h-7 rounded border bg-background px-1"
              value={m.buyCity}
              onChange={(e) => m.set({ buyCity: e.target.value })}
            >
              {AODP_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex items-center gap-1">
            {t("prices.sellCity")}
            <select
              className="h-7 rounded border bg-background px-1"
              value={m.sellCity}
              onChange={(e) => m.set({ sellCity: e.target.value })}
            >
              {SELL_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {prices.error ? (
        <p className="text-xs text-red-400">{t("prices.error")}</p>
      ) : prices.loading && market ? (
        <p className="text-xs text-muted-foreground">{t("prices.loading")}</p>
      ) : (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 tabular-nums">
            <dt className="text-muted-foreground">
              {t(market ? "prices.materials" : "prices.staticMaterials")}
            </dt>
            <dd>{money(mats.total)}</dd>
            <dt className="text-muted-foreground">
              {t(market ? "prices.crafted" : "prices.staticCrafted")}
            </dt>
            <dd>{money(made.total)}</dd>
            {missing.length === 0 && (
              <>
                <dt className="text-muted-foreground">
                  {t(market ? "prices.profit" : "prices.staticGain")}
                </dt>
                <dd
                  className={`font-semibold ${diff >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {diff > 0 ? "+" : ""}
                  {money(diff)}
                </dd>
              </>
            )}
          </dl>
          {missing.length > 0 && (
            <p className="text-xs text-orange-400">
              {t("prices.missing", { items: missing.map(name).join(", ") })}
            </p>
          )}
        </>
      )}
      {market && (
        <p className="text-xs text-muted-foreground">
          {t("prices.aodpCredit")}{" "}
          <a
            href="https://www.albion-online-data.com/"
            target="_blank"
            rel="noopener"
            className="underline underline-offset-2 hover:text-amber-300"
          >
            Albion Online Data Project
          </a>
          . {t("prices.aodpExcludes")}
        </p>
      )}
    </section>
  );
}
