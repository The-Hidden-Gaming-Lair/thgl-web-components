"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addCraftList,
  buildCraftingGraph,
  craftableIds,
  craftListsStorageKey,
  craftListTargets,
  craftQueryParam,
  emptyCraftListsState,
  MAX_CRAFT_LISTS,
  mergeCraftTargets,
  newCraftListId,
  nextCraftListName,
  parseCraftListsState,
  removeCraftList,
  renameCraftList,
  saveCraftListQuery,
  serializeCraftListsState,
  type CraftListsState,
  formatCraftItems,
  formatRecipeChoice,
  ingredientId,
  parseCraftItems,
  parsePrice,
  parseRecipeChoice,
  planCrafting,
  RAW_CHOICE,
  slotKey,
  type CraftDbCategory,
  type CraftingGraph,
  type CraftStock,
  type CraftTarget,
  type RecipeChoice,
} from "@repo/lib";
import { Button } from "@repo/ui/controls";
import type { CraftItemInfo } from "./data";
import { PricePanel, PriceTag, useCraftPrices } from "./prices";
import {
  CraftTree,
  ItemLabel,
  MapLink,
  SellerChips,
  SlotHint,
  StationChips,
  craftT,
  formatQty,
  stationLabel,
} from "./tree";

type Payload = {
  source: CraftDbCategory[];
  items: Record<string, CraftItemInfo>;
  iconsHash?: string;
};

type Tab = "list" | "steps" | "tree";

const MAX_RESULTS = 40;

/** The saved lists of one game, kept in localStorage (synced across tabs). */
function useCraftLists(game: string) {
  const key = craftListsStorageKey(game);
  const [lists, setLists] = useState<CraftListsState | null>(null);

  useEffect(() => {
    try {
      setLists(parseCraftListsState(localStorage.getItem(key)));
    } catch {
      setLists(emptyCraftListsState());
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      setLists((prev) => {
        const next = parseCraftListsState(e.newValue);
        // Another tab must not switch this tab's open list.
        const keep = next.lists.some((l) => l.id === prev?.active);
        return { ...next, active: keep ? prev!.active : null };
      });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const updateLists = useCallback(
    (fn: (s: CraftListsState) => CraftListsState) =>
      setLists((prev) => {
        if (!prev) return prev;
        const next = fn(prev);
        if (next === prev) return prev;
        try {
          localStorage.setItem(key, serializeCraftListsState(next));
        } catch {
          // Storage full or blocked: the lists still work for this visit.
        }
        return next;
      }),
    [key],
  );

  return { lists, updateLists };
}

/**
 * The /crafting calculator: pick items × quantity → raw shopping list, build
 * steps with stations, and an expandable tree. Everything runs on the client
 * over `/api/db/crafting` with the lib's pure crafting logic; the state lives
 * in the URL (?items=id:qty,…&r=item:recipe,…) so a plan can be shared.
 * Named lists are saved per game in localStorage (`thgl-crafting-lists:<game>`,
 * same query format); the open list saves every change.
 */
export function CraftingCalculator({
  labels,
  appName,
  locale,
  market,
}: {
  labels: Record<string, string>;
  appName: string;
  locale: string;
  /** Live market prices (tenant `craftingMarket`). */
  market?: "aodp";
}) {
  const t = craftT(labels);
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState(false);
  const [targets, setTargets] = useState<CraftTarget[]>([]);
  const [choice, setChoice] = useState<RecipeChoice>({});
  /** Items the player buys instead of gathering / crafting. */
  const [buy, setBuy] = useState<string[]>([]);
  /** Items the player already has (used before crafting). */
  const [have, setHave] = useState<CraftStock>({});
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("list");
  const [copied, setCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const { lists, updateLists } = useCraftLists(appName);
  const activeList = lists?.lists.find((l) => l.id === lists.active) ?? null;
  /** Name field: the open list's name (rename), else the name to save as. */
  const [nameDraft, setNameDraft] = useState("");
  useEffect(() => {
    setNameDraft(activeList?.name ?? "");
  }, [activeList?.id, activeList?.name]);

  useEffect(() => {
    let alive = true;
    fetch(`/api/db/crafting?locale=${encodeURIComponent(locale)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((p: Payload) => alive && setPayload(p))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [locale]);

  const graph = useMemo<CraftingGraph | null>(
    () => (payload ? buildCraftingGraph(payload.source) : null),
    [payload],
  );
  const infos = payload?.items ?? {};
  const name = (id: string) => infos[id]?.name ?? id;

  /** A plan query (`items=…&r=…&buy=…&have=…`) → state; ids are validated. */
  const readPlan = (query: string, g: CraftingGraph) => {
    // Raw (still-encoded) values: the parsers decode each id themselves.
    const raw = (key: string) => craftQueryParam(query, key);
    return {
      targets: parseCraftItems(raw("items")).filter((x) => g.byProduct[x.id]),
      choice: parseRecipeChoice(raw("r"), g),
      buy: (raw("buy") ?? "")
        .split(",")
        .map((p) => {
          try {
            return decodeURIComponent(p);
          } catch {
            return "";
          }
        })
        .filter((id) => id && g.sectionOf[id] !== undefined),
      have: Object.fromEntries(
        parseCraftItems(raw("have"))
          .filter((x) => g.sectionOf[x.id] !== undefined)
          .map((x) => [x.id, x.qty]),
      ) as CraftStock,
    };
  };
  const applyPlan = (query: string, g: CraftingGraph) => {
    const p = readPlan(query, g);
    setTargets(p.targets);
    setChoice(p.choice);
    setBuy(p.buy);
    setHave(p.have);
  };

  /** The plan part of the share link: everything but the tab. */
  const planQuery = () => {
    // Built by hand: the formatters already encode each id, and `:` / `,`
    // stay readable in the shared link.
    const parts: string[] = [];
    if (targets.length) parts.push(`items=${formatCraftItems(targets)}`);
    const r = graph ? formatRecipeChoice(choice, graph) : "";
    if (r) parts.push(`r=${r}`);
    if (buy.length) parts.push(`buy=${buy.map(encodeURIComponent).join(",")}`);
    const stock = Object.entries(have).map(([id, qty]) => ({ id, qty }));
    if (stock.length) parts.push(`have=${formatCraftItems(stock)}`);
    return parts.join("&");
  };

  // URL (or the list that was open last) → state once the graph is known.
  useEffect(() => {
    if (!graph || hydrated || !lists) return;
    const search = window.location.search;
    const fromUrl = ["items", "r", "buy", "have"].some(
      (k) => craftQueryParam(search, k) !== null,
    );
    const active = lists.lists.find((l) => l.id === lists.active);
    if (!fromUrl && active) {
      applyPlan(active.query, graph);
    } else {
      applyPlan(search, graph);
      // A shared link that is not the open list starts an unsaved plan.
      if (
        active &&
        search.replace(/^\?/, "").split("&tab=")[0] !== active.query
      )
        updateLists((s) => ({ ...s, active: null }));
    }
    const tabParam = craftQueryParam(search, "tab");
    if (tabParam === "steps" || tabParam === "tree") setTab(tabParam);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, hydrated, lists]);

  const shareUrl = () => {
    const query = [planQuery(), tab !== "list" ? `tab=${tab}` : ""]
      .filter(Boolean)
      .join("&");
    const { origin, pathname } = window.location;
    return `${origin}${pathname}${query ? `?${query}` : ""}`;
  };

  useEffect(() => {
    if (!hydrated) return;
    window.history.replaceState(null, "", shareUrl());
    // The open list follows every change.
    const query = planQuery();
    updateLists((s) =>
      s.active ? saveCraftListQuery(s, s.active, query, Date.now()) : s,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, targets, choice, buy, have, tab]);

  const options = useMemo(() => {
    if (!graph) return [];
    return craftableIds(graph)
      .map((id) => ({ id, name: infos[id]?.name ?? id }))
      .sort((a, b) => a.name.localeCompare(b.name, locale));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, payload, locale]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return options
      .filter((o) => o.name.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS);
  }, [options, query]);

  /** A bought item is not crafted: it becomes a shopping-list line. */
  const planChoice = useMemo<RecipeChoice>(() => {
    const next = { ...choice };
    for (const id of buy) if (graph?.byProduct[id]) next[id] = RAW_CHOICE;
    return next;
  }, [graph, choice, buy]);

  const plan = useMemo(
    () =>
      graph && targets.length
        ? planCrafting(graph, targets, planChoice, have)
        : null,
    [graph, targets, planChoice, have],
  );

  /** Price of one unit from the first seller with a readable price. */
  const unitPrice = (id: string) => {
    for (const s of payload?.items[id]?.sellers ?? []) {
      const p = parsePrice(s.price);
      if (p) return p;
    }
    return null;
  };
  /** Currency → total for the materials ticked "buy". */
  const buyTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const l of plan?.raw ?? []) {
      if (!buy.includes(l.id)) continue;
      const p = unitPrice(l.id);
      if (p)
        totals.set(
          p.currency,
          (totals.get(p.currency) ?? 0) + p.amount * l.qty,
        );
    }
    return [...totals];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, buy, payload]);

  const rawIds = useMemo(() => plan?.raw.map((l) => l.id) ?? [], [plan]);
  const targetIds = useMemo(() => targets.map((x) => x.id), [targets]);
  const prices = useCraftPrices({
    game: appName,
    market,
    infos,
    buyIds: rawIds,
    sellIds: targetIds,
  });

  if (error) {
    return <p className="text-sm text-red-400">{t("loadError")}</p>;
  }
  if (!graph || !payload) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }

  const add = (id: string) => {
    setTargets((prev) =>
      prev.some((x) => x.id === id) ? prev : [...prev, { id, qty: 1 }],
    );
    setQuery("");
  };
  const setQty = (id: string, qty: number) =>
    setTargets((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              qty: Math.max(1, Math.min(1_000_000, Math.floor(qty) || 1)),
            }
          : x,
      ),
    );
  const remove = (id: string) =>
    setTargets((prev) => prev.filter((x) => x.id !== id));
  const pick = (id: string, key: string) =>
    setChoice((prev) => {
      const next = { ...prev };
      if (!key) delete next[id];
      else next[id] = key;
      return next;
    });

  const common = {
    appName,
    iconsHash: payload.iconsHash,
    locale,
  };

  const saveAsList = () => {
    const id = newCraftListId(lists?.lists ?? []);
    updateLists(
      (s) =>
        addCraftList(
          s,
          nameDraft.trim() ||
            nextCraftListName(s.lists, (n) => t("lists.defaultName", { n })),
          planQuery(),
          Date.now(),
          id,
        ) ?? s,
    );
  };
  const commitRename = () => {
    if (!activeList) return;
    if (!nameDraft.trim()) setNameDraft(activeList.name);
    else updateLists((s) => renameCraftList(s, activeList.id, nameDraft));
  };
  const openList = (id: string) => {
    const list = lists?.lists.find((l) => l.id === id);
    if (!list) return;
    applyPlan(list.query, graph);
    updateLists((s) => ({ ...s, active: id }));
  };
  const newList = () => {
    setTargets([]);
    setChoice({});
    setBuy([]);
    setHave({});
    updateLists((s) => ({ ...s, active: null }));
  };
  /** Add another list's items (and its recipe / buy picks) to this plan. */
  const addListToPlan = (id: string) => {
    const list = lists?.lists.find((l) => l.id === id);
    if (!list) return;
    const other = readPlan(list.query, graph);
    setTargets((prev) => mergeCraftTargets(prev, other.targets));
    setChoice((prev) => ({ ...other.choice, ...prev }));
    setBuy((prev) => [...new Set([...prev, ...other.buy])]);
    setHave((prev) => ({ ...other.have, ...prev }));
  };
  const deleteList = (id: string, listName: string) => {
    if (!window.confirm(t("lists.deleteConfirm", { name: listName }))) return;
    updateLists((s) => removeCraftList(s, id));
  };
  const listsFull = (lists?.lists.length ?? 0) >= MAX_CRAFT_LISTS;

  const toggleBuy = (id: string, on: boolean) =>
    setBuy((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)));
  /** "Buy instead" tick with the cost of `qty`, for items a shop sells. */
  const buyToggle = (id: string, qty: number) => {
    const price = unitPrice(id);
    if (!price) return null;
    const on = buy.includes(id);
    return (
      <label className="inline-flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => toggleBuy(id, e.target.checked)}
        />
        {on
          ? t("buyCost", {
              cost: `${formatQty(price.amount * qty, locale)} ${price.currency}`,
            })
          : t("buy")}
      </label>
    );
  };
  /** "In stock" amount: used before gathering / crafting this item. */
  const stockInput = (id: string) => (
    <label className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      {t("inStock")}
      <input
        type="number"
        min={0}
        inputMode="numeric"
        className="h-7 w-16 rounded border bg-background px-1 text-xs tabular-nums text-foreground"
        value={have[id] ?? ""}
        placeholder="0"
        onChange={(e) => {
          const n = Math.min(1_000_000, Math.floor(Number(e.target.value)));
          setHave((prev) => {
            const next = { ...prev };
            if (n > 0) next[id] = n;
            else delete next[id];
            return next;
          });
        }}
      />
    </label>
  );

  const recipePicker = (id: string, allowGather: boolean) => {
    const list = graph.byProduct[id] ?? [];
    const def = graph.defaults[id];
    if (list.length <= (allowGather || def == null ? 0 : 1)) return null;
    const current = choice[id] ?? "";
    return (
      <select
        aria-label={t("recipe")}
        className="h-7 max-w-full rounded border bg-background px-1 text-xs"
        value={current}
        onChange={(e) => pick(id, e.target.value)}
      >
        <option value="">
          {def == null
            ? t("defaultGather")
            : t("defaultRecipe", { recipe: recipeSummary(def) })}
        </option>
        {list
          .filter((i) => i !== def)
          .map((i) => (
            <option key={graph.recipes[i].key} value={graph.recipes[i].key}>
              {recipeSummary(i)}
            </option>
          ))}
        {allowGather && def != null && (
          <option value={RAW_CHOICE}>{t("gatherInstead")}</option>
        )}
      </select>
    );
  };

  function recipeSummary(i: number) {
    const r = graph!.recipes[i];
    const station = r.stations.map((s) => stationLabel(s, infos)).join(", ");
    const ings = r.ingredients
      .map((g) => `${g.count}× ${g.any ? g.any.group : name(g.id)}`)
      .join(", ");
    return station ? `${station}: ${ings}` : ings;
  }

  return (
    <div className="space-y-6">
      {/* Saved lists */}
      <section className="space-y-2 rounded-md border p-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold">{t("lists.title")}</h2>
          <input
            type="text"
            maxLength={60}
            aria-label={t("lists.name")}
            placeholder={t("lists.name")}
            className="h-8 min-w-0 flex-1 rounded border bg-background px-2 text-sm sm:max-w-64"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              if (activeList) commitRename();
              else if (targets.length && !listsFull) saveAsList();
            }}
          />
          {activeList ? (
            <span className="text-xs text-muted-foreground">
              {t("lists.saved")}
            </span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={!targets.length || listsFull}
              title={listsFull ? t("lists.full", { max: MAX_CRAFT_LISTS }) : ""}
              onClick={saveAsList}
            >
              {t("lists.save")}
            </Button>
          )}
          {(activeList || targets.length > 0) && (
            <Button size="sm" variant="ghost" onClick={newList}>
              {t("lists.new")}
            </Button>
          )}
        </div>
        {lists && lists.lists.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {lists.lists.map((l) => {
              const isActive = l.id === lists.active;
              const count = craftListTargets(l).length;
              return (
                <li
                  key={l.id}
                  className={`flex items-center rounded-md border text-sm ${isActive ? "border-amber-300 bg-amber-300/10" : ""}`}
                >
                  <button
                    type="button"
                    aria-pressed={isActive}
                    title={t("lists.open", { name: l.name })}
                    className="max-w-56 truncate px-2 py-1 hover:text-amber-300"
                    onClick={() => openList(l.id)}
                  >
                    {l.name}{" "}
                    <span className="text-xs text-muted-foreground tabular-nums">
                      ({count})
                    </span>
                  </button>
                  {!isActive && count > 0 && (
                    <button
                      type="button"
                      title={t("lists.addTitle", { name: l.name })}
                      aria-label={t("lists.addTitle", { name: l.name })}
                      className="h-7 rounded px-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                      onClick={() => addListToPlan(l.id)}
                    >
                      {t("lists.add")}
                    </button>
                  )}
                  <button
                    type="button"
                    title={t("lists.delete", { name: l.name })}
                    aria-label={t("lists.delete", { name: l.name })}
                    className="h-7 w-7 rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={() => deleteList(l.id, l.name)}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">{t("lists.hint")}</p>
        )}
      </section>

      {/* Picker */}
      <section className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="craft-search">
          {t("addItem")}
        </label>
        <input
          id="craft-search"
          type="search"
          autoComplete="off"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          placeholder={t("searchPlaceholder", { count: options.length })}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) add(results[0].id);
          }}
        />
        {results.length > 0 && (
          <ul className="max-h-72 overflow-y-auto rounded-md border sidebar-scroll">
            {results.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => add(o.id)}
                >
                  <ItemLabel
                    id={o.id}
                    info={{ ...infos[o.id], db: undefined, name: o.name }}
                    {...common}
                    size={24}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.trim() && results.length === 0 && (
          <p className="text-xs text-muted-foreground">{t("noResults")}</p>
        )}
      </section>

      {/* Targets */}
      {targets.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <section className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{t("toCraft")}</h2>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => {
                navigator.clipboard?.writeText(shareUrl()).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
            >
              {copied ? t("copied") : t("share")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setTargets([])}>
              {t("clear")}
            </Button>
          </div>
          <ul className="divide-y rounded-md border">
            {targets.map((x) => (
              <li
                key={x.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-2"
              >
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  aria-label={t("quantity")}
                  className="h-8 w-20 rounded border bg-background px-2 text-sm tabular-nums"
                  value={x.qty}
                  onChange={(e) => setQty(x.id, Number(e.target.value))}
                />
                <span className="min-w-0 flex-1">
                  <ItemLabel
                    id={x.id}
                    info={infos[x.id]}
                    {...common}
                    href={`/crafting/${encodeURIComponent(x.id)}`}
                  />
                </span>
                {recipePicker(x.id, false)}
                {prices && (
                  <PriceTag
                    price={prices.sell(x.id)}
                    qty={x.qty}
                    prices={prices}
                    labels={labels}
                    locale={locale}
                  />
                )}
                <button
                  type="button"
                  aria-label={t("remove")}
                  className="h-8 w-8 rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => remove(x.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {plan && (
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2" role="tablist">
            {(["list", "steps", "tree"] as const).map((k) => (
              <Button
                key={k}
                role="tab"
                aria-selected={tab === k}
                variant={tab === k ? "default" : "outline"}
                size="sm"
                onClick={() => setTab(k)}
              >
                {t(`tab.${k}`)}
              </Button>
            ))}
          </div>

          {tab === "list" && (
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-semibold">
                  {t("rawMaterials")}
                </h3>
                <ul className="divide-y rounded-md border">
                  {plan.raw.map((l) => (
                    <li
                      key={l.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1.5 text-sm"
                    >
                      <span className="w-16 shrink-0 text-right font-mono tabular-nums text-amber-200">
                        {formatQty(l.qty, locale)}×
                      </span>
                      <span className="min-w-0 flex-1">
                        <ItemLabel id={l.id} info={infos[l.id]} {...common} />
                      </span>
                      <MapLink
                        info={infos[l.id]}
                        locale={locale}
                        label={t("showOnMap")}
                      />
                      {graph.byProduct[l.id] &&
                        !buy.includes(l.id) &&
                        recipePicker(l.id, true)}
                      {stockInput(l.id)}
                      {prices && (
                        <PriceTag
                          price={prices.buy(l.id)}
                          qty={l.qty}
                          prices={prices}
                          labels={labels}
                          locale={locale}
                        />
                      )}
                      {infos[l.id]?.sellers && (
                        <span className="flex w-full flex-wrap items-center gap-2 pl-[4.75rem]">
                          <SellerChips
                            info={infos[l.id]}
                            locale={locale}
                            label={t("soldBy")}
                          />
                          {buyToggle(l.id, l.qty)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                {buyTotals.length > 0 && (
                  <p className="mt-2 text-sm">
                    <span className="text-muted-foreground">
                      {t("buyTotal")}
                    </span>{" "}
                    <span className="font-medium text-amber-200">
                      {buyTotals
                        .map(([cur, n]) => `${formatQty(n, locale)} ${cur}`)
                        .join(" · ")}
                    </span>
                  </p>
                )}
              </div>
              {prices && (
                <PricePanel
                  prices={prices}
                  raw={plan.raw}
                  targets={targets}
                  name={name}
                  labels={labels}
                  locale={locale}
                />
              )}
              {plan.fromStock.length > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold">
                    {t("fromStock")}
                  </h3>
                  <ul className="divide-y rounded-md border">
                    {plan.fromStock.map((l) => (
                      <li
                        key={l.id}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1.5 text-sm"
                      >
                        <span className="w-16 shrink-0 text-right font-mono tabular-nums text-muted-foreground">
                          {formatQty(l.qty, locale)}×
                        </span>
                        <span className="min-w-0 flex-1">
                          <ItemLabel id={l.id} info={infos[l.id]} {...common} />
                        </span>
                        {stockInput(l.id)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.slots.length > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold">
                    {t("anyOfTitle")}
                  </h3>
                  <p className="mb-1 text-xs text-muted-foreground">
                    {t("anyOfHint")}
                  </p>
                  <ul className="divide-y rounded-md border">
                    {plan.slots.map((s) => (
                      <li
                        key={s.group}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1.5 text-sm"
                      >
                        <span className="w-16 shrink-0 text-right font-mono tabular-nums text-amber-200">
                          {formatQty(s.qty, locale)}×
                        </span>
                        <SlotHint group={s.group} />
                        <select
                          aria-label={s.group}
                          className="h-7 max-w-full rounded border bg-background px-1 text-xs"
                          value={s.id}
                          onChange={(e) =>
                            pick(
                              slotKey(s.group),
                              e.target.value === graph.slots[s.group]?.[0]
                                ? ""
                                : e.target.value,
                            )
                          }
                        >
                          {(graph.slots[s.group] ?? []).map((m) => (
                            <option key={m} value={m}>
                              {name(m)}
                            </option>
                          ))}
                        </select>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.stations.length > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold">
                    {t("stations")}
                  </h3>
                  <ul className="flex flex-wrap gap-2 text-sm">
                    {plan.stations.map((s) => (
                      <li
                        key={s.station.id ?? s.station.label}
                        className="flex items-center gap-1"
                      >
                        <StationChips
                          stations={[s.station]}
                          infos={infos}
                          locale={locale}
                        />
                        <span className="text-xs text-muted-foreground">
                          {t("crafts", { crafts: formatQty(s.crafts, locale) })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.surplus.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("surplus")}{" "}
                  {plan.surplus
                    .map((l) => `${formatQty(l.qty, locale)}× ${name(l.id)}`)
                    .join(", ")}
                </p>
              )}
              {plan.cycles.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("cycleNote", {
                    items: plan.cycles.map(name).join(", "),
                  })}
                </p>
              )}
            </div>
          )}

          {tab === "steps" && (
            <ol className="divide-y rounded-md border">
              {[...plan.crafted].reverse().map((c, i) => {
                const r = graph.recipes[c.recipe];
                return (
                  <li key={c.id} className="space-y-1 px-2 py-2 text-sm">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="w-6 shrink-0 text-right text-xs text-muted-foreground">
                        {i + 1}.
                      </span>
                      <span>
                        {t("craftStep", {
                          crafts: formatQty(c.crafts, locale),
                        })}
                      </span>
                      <ItemLabel id={c.id} info={infos[c.id]} {...common} />
                      {c.produced !== c.qty && (
                        <span className="text-xs text-muted-foreground">
                          {t("makes", {
                            produced: formatQty(c.produced, locale),
                          })}
                        </span>
                      )}
                      <StationChips
                        stations={r.stations}
                        infos={infos}
                        locale={locale}
                      />
                    </div>
                    <div className="ml-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {r.ingredients
                          .map(
                            (g) =>
                              `${formatQty(g.count * c.crafts, locale)}× ${name(ingredientId(g, planChoice))}`,
                          )
                          .join(" · ")}
                      </span>
                      {recipePicker(c.id, !targets.some((x) => x.id === c.id))}
                      {stockInput(c.id)}
                      {!targets.some((x) => x.id === c.id) &&
                        buyToggle(c.id, c.qty)}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {tab === "tree" && (
            <div className="space-y-3">
              {targets.map((x) => (
                <CraftTree
                  key={x.id}
                  id={x.id}
                  qty={x.qty}
                  graph={graph}
                  choice={planChoice}
                  infos={infos}
                  labels={labels}
                  {...common}
                  openDepth={3}
                  maxNodes={600}
                />
              ))}
              <p className="text-xs text-muted-foreground">{t("treeNote")}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
