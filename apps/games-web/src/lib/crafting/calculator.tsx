"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildCraftingGraph,
  craftableIds,
  formatCraftItems,
  formatRecipeChoice,
  parseCraftItems,
  parseRecipeChoice,
  planCrafting,
  RAW_CHOICE,
  type CraftDbCategory,
  type CraftingGraph,
  type CraftTarget,
  type RecipeChoice,
} from "@repo/lib";
import { Button } from "@repo/ui/controls";
import type { CraftItemInfo } from "./data";
import {
  CraftTree,
  ItemLabel,
  MapLink,
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

/**
 * The /crafting calculator: pick items × quantity → raw shopping list, build
 * steps with stations, and an expandable tree. Everything runs on the client
 * over `/api/db/crafting` with the lib's pure crafting logic; the state lives
 * in the URL (?items=id:qty,…&r=item:recipe,…) so a plan can be shared.
 */
export function CraftingCalculator({
  labels,
  appName,
  locale,
}: {
  labels: Record<string, string>;
  appName: string;
  locale: string;
}) {
  const t = craftT(labels);
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState(false);
  const [targets, setTargets] = useState<CraftTarget[]>([]);
  const [choice, setChoice] = useState<RecipeChoice>({});
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("list");
  const [copied, setCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);

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

  // URL → state once the graph is known (ids are validated against it).
  useEffect(() => {
    if (!graph || hydrated) return;
    // Raw (still-encoded) values: the parsers decode each id themselves.
    const raw = (key: string) =>
      window.location.search
        .slice(1)
        .split("&")
        .find((p) => p.startsWith(`${key}=`))
        ?.slice(key.length + 1) ?? null;
    setTargets(
      parseCraftItems(raw("items")).filter((x) => graph.byProduct[x.id]),
    );
    setChoice(parseRecipeChoice(raw("r"), graph));
    const tabParam = raw("tab");
    if (tabParam === "steps" || tabParam === "tree") setTab(tabParam);
    setHydrated(true);
  }, [graph, hydrated]);

  const shareUrl = () => {
    // Built by hand: the formatters already encode each id, and `:` / `,`
    // stay readable in the shared link.
    const parts: string[] = [];
    if (targets.length) parts.push(`items=${formatCraftItems(targets)}`);
    const r = graph ? formatRecipeChoice(choice, graph) : "";
    if (r) parts.push(`r=${r}`);
    if (tab !== "list") parts.push(`tab=${tab}`);
    const { origin, pathname } = window.location;
    return `${origin}${pathname}${parts.length ? `?${parts.join("&")}` : ""}`;
  };

  useEffect(() => {
    if (!hydrated) return;
    window.history.replaceState(null, "", shareUrl());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, targets, choice, tab]);

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

  const plan = useMemo(
    () =>
      graph && targets.length ? planCrafting(graph, targets, choice) : null,
    [graph, targets, choice],
  );

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
      .map((g) => `${g.count}× ${name(g.id)}`)
      .join(", ");
    return station ? `${station}: ${ings}` : ings;
  }

  return (
    <div className="space-y-6">
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
                      {graph.byProduct[l.id] && recipePicker(l.id, true)}
                    </li>
                  ))}
                </ul>
              </div>
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
                              `${formatQty(g.count * c.crafts, locale)}× ${name(g.id)}`,
                          )
                          .join(" · ")}
                      </span>
                      {recipePicker(c.id, !targets.some((x) => x.id === c.id))}
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
                  choice={choice}
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
