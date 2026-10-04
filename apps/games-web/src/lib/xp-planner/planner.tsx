"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  actionsNeeded,
  buildCraftingGraph,
  clampLevel,
  formatCraftItems,
  formatXpPlannerState,
  groupMethods,
  levelForXp,
  levelProgress,
  localizePath,
  methodCost,
  methodInputs,
  parseXpPlannerState,
  PER_DAMAGE_UNIT,
  stateXp,
  xpForLevel,
  xpToLevel,
  type CraftDbCategory,
  type CraftingGraph,
  type XpConfigBase,
  type XpPlannerState,
} from "@repo/lib";
import { Button } from "@repo/ui/controls";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import type { CraftItemInfo } from "@/lib/crafting/data";
import { ItemLabel, MapLink, StationChips } from "@/lib/crafting/tree";
import type { XpMethodView, XpPayload } from "./data";
import { FlagBadge, fmt, xpPerUnit, xpT } from "./parts";

type CraftPayload = {
  source: CraftDbCategory[];
  items: Record<string, CraftItemInfo>;
  iconsHash?: string;
};

const PAGE = 60;

/**
 * The /xp-planner calculator: skill + current level (or exact XP) → target
 * level, then every way the game awards that skill's XP with the actions
 * needed, and the material cost of crafting/building methods through the
 * crafting graph. Data loads client-side (`/api/xp-planner`, plus
 * `/api/db/crafting` for costs); the state lives in the URL so a plan can be
 * shared.
 */
export function XpPlanner({
  labels,
  appName,
  locale,
  basePath,
  initialSkill,
}: {
  labels: Record<string, string>;
  appName: string;
  locale: string;
  /** `/xp-planner` (not locale-prefixed). */
  basePath: string;
  /** Set on `/xp-planner/<skill>` pages — the skill lives in the path there. */
  initialSkill?: string;
}) {
  const t = xpT(labels);
  const router = useRouter();
  const [payload, setPayload] = useState<XpPayload | null>(null);
  const [error, setError] = useState(false);
  const [craft, setCraft] = useState<CraftPayload | null>(null);
  const [state, setState] = useState<XpPlannerState | null>(null);
  const [useXp, setUseXp] = useState(false);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/xp-planner?locale=${encodeURIComponent(locale)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((p: XpPayload) => alive && setPayload(p))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [locale]);

  // Recipe graph for material costs (only when the tenant ships /crafting).
  useEffect(() => {
    if (!payload?.crafting) return;
    let alive = true;
    fetch(`/api/db/crafting?locale=${encodeURIComponent(locale)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((p: CraftPayload) => alive && setCraft(p))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [payload?.crafting, locale]);

  const config = useMemo<XpConfigBase | null>(
    () =>
      payload
        ? {
            curve: payload.curve,
            skills: payload.skills,
            methods: payload.methods,
          }
        : null,
    [payload],
  );

  // URL → state once the data is known.
  useEffect(() => {
    if (!config || state) return;
    const params = new URLSearchParams(window.location.search);
    const s = parseXpPlannerState(
      config,
      params,
      initialSkill ?? config.skills[0]?.id,
    );
    setUseXp(s.xp !== undefined);
    setState(s);
  }, [config, state, initialSkill]);

  const skill = state?.skill ?? config?.skills[0]?.id ?? "";
  const pathFor = (s: XpPlannerState) => {
    const inPath = !!initialSkill;
    const path = inPath
      ? `${basePath}/${encodeURIComponent(s.skill ?? "")}`
      : basePath;
    const q = formatXpPlannerState(s, { includeSkill: !inPath });
    return `${localizePath(path, locale)}${q ? `?${q}` : ""}`;
  };
  const shareUrl = () =>
    state ? `${window.location.origin}${pathFor(state)}` : window.location.href;

  useEffect(() => {
    if (!state) return;
    window.history.replaceState(null, "", pathFor(state));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const graph = useMemo<CraftingGraph | null>(
    () => (craft ? buildCraftingGraph(craft.source) : null),
    [craft],
  );

  const methods = useMemo(
    () => (payload ? payload.methods.filter((m) => m.skill === skill) : []),
    [payload, skill],
  );
  const kinds = useMemo(
    () => groupMethods(methods).map((g) => g.kind),
    [methods],
  );

  if (error) return <p className="text-sm text-red-400">{t("loadError")}</p>;
  if (!payload || !config || !state) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  }

  const curve = payload.curve;
  const max = curve.length;
  const currentXp = stateXp(curve, state);
  const currentLevel = levelForXp(curve, currentXp);
  const target = Math.max(state.to, Math.min(max, currentLevel));
  const needed = xpToLevel(curve, currentXp, target);
  const skillLabel = payload.skills.find((s) => s.id === skill)?.name ?? skill;

  const update = (patch: Partial<XpPlannerState>) =>
    setState((prev) => (prev ? { ...prev, ...patch } : prev));
  const setSkill = (id: string) => {
    if (initialSkill && id !== skill) {
      // Per-skill pages carry server-rendered content for their skill: navigate.
      router.push(pathFor({ ...state, skill: id, method: undefined }));
      return;
    }
    update({ skill: id, method: undefined });
    setKind("");
    setQuery("");
    setLimit(PAGE);
  };

  const q = query.trim().toLowerCase();
  const visible = groupMethods(methods)
    .filter((g) => !kind || g.kind === kind)
    .flatMap((g) => g.methods)
    .filter((m) => !q || m.name.toLowerCase().includes(q))
    .sort((a, b) => b.xp - a.xp || a.id.localeCompare(b.id));
  const selected = state.method
    ? methods.find((m) => m.id === state.method)
    : undefined;

  const common = { appName, iconsHash: payload.iconsHash, locale };
  const infos = craft?.items ?? {};
  const itemName = (id: string) => infos[id]?.name ?? id;

  const inputClass =
    "h-10 w-full rounded-md border bg-background px-3 text-sm tabular-nums";

  return (
    <div className="space-y-6">
      {/* Skill picker */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium">{t("pickSkill")}</h2>
        <div className="flex flex-wrap gap-2" role="tablist">
          {payload.skills.map((s) => (
            <Button
              key={s.id}
              role="tab"
              aria-selected={s.id === skill}
              variant={s.id === skill ? "default" : "outline"}
              size="sm"
              onClick={() => setSkill(s.id)}
            >
              {s.name}
            </Button>
          ))}
        </div>
      </section>

      {/* Levels */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium" htmlFor="xp-from">
              {useXp ? t("currentXp") : t("currentLevel")}
            </label>
            <button
              type="button"
              className="text-xs text-amber-400 hover:underline"
              onClick={() => {
                if (useXp) {
                  update({ xp: undefined, from: currentLevel });
                } else {
                  update({ xp: xpForLevel(curve, state.from) });
                }
                setUseXp(!useXp);
              }}
            >
              {useXp ? t("enterLevel") : t("enterXp")}
            </button>
          </div>
          {useXp ? (
            <input
              id="xp-from"
              type="number"
              min={0}
              max={curve[max - 1]}
              inputMode="numeric"
              className={inputClass}
              value={state.xp ?? 0}
              onChange={(e) => {
                const v = Math.max(
                  0,
                  Math.min(
                    curve[max - 1],
                    Math.floor(Number(e.target.value)) || 0,
                  ),
                );
                update({ xp: v, from: levelForXp(curve, v) });
              }}
            />
          ) : (
            <input
              id="xp-from"
              type="number"
              min={1}
              max={max}
              inputMode="numeric"
              className={inputClass}
              value={state.from}
              onChange={(e) =>
                update({ from: clampLevel(curve, Number(e.target.value)) })
              }
            />
          )}
          <p className="text-xs text-muted-foreground">
            {t("levelXp", {
              level: currentLevel,
              xp: fmt(currentXp, locale),
              progress: fmt(levelProgress(curve, currentXp) * 100, locale),
            })}
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium" htmlFor="xp-to">
              {t("targetLevel")}
            </label>
            <button
              type="button"
              className="text-xs text-amber-400 hover:underline"
              onClick={() => update({ to: max })}
            >
              {t("maxLevel", { level: max })}
            </button>
          </div>
          <input
            id="xp-to"
            type="number"
            min={1}
            max={max}
            inputMode="numeric"
            className={inputClass}
            value={state.to}
            onChange={(e) =>
              update({ to: clampLevel(curve, Number(e.target.value)) })
            }
          />
          <p className="text-xs text-muted-foreground">
            {t("targetXp", {
              level: target,
              xp: fmt(xpForLevel(curve, target), locale),
            })}
          </p>
        </div>
      </section>

      {/* Summary */}
      <section className="flex flex-wrap items-center gap-3 rounded-md border border-amber-700/40 bg-amber-950/20 px-3 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("xpNeededFor", { skill: skillLabel, level: target })}
          </div>
          <div className="text-2xl font-semibold tabular-nums text-amber-200">
            {fmt(needed, locale)} XP
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            navigator.clipboard?.writeText(shareUrl()).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? t("copied") : t("share")}
        </Button>
      </section>

      {/* Selected method: cost */}
      {selected && (
        <SelectedMethod
          method={selected}
          needed={needed}
          graph={graph}
          crafting={payload.crafting}
          infos={infos}
          labels={labels}
          common={common}
          itemName={itemName}
          onClose={() => update({ method: undefined })}
        />
      )}

      {/* Methods */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">
            {t("methodsFor", { skill: skillLabel, count: methods.length })}
          </h2>
        </div>
        <input
          type="search"
          autoComplete="off"
          aria-label={t("searchMethods")}
          placeholder={t("searchMethods")}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE);
          }}
        />
        {kinds.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={kind === "" ? "default" : "outline"}
              onClick={() => setKind("")}
            >
              {t("allKinds")}
            </Button>
            {kinds.map((k) => (
              <Button
                key={k}
                size="sm"
                variant={kind === k ? "default" : "outline"}
                onClick={() => {
                  setKind(k);
                  setLimit(PAGE);
                }}
              >
                {t(`kind.${k}`)}
              </Button>
            ))}
          </div>
        )}
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noMethods")}</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {visible.slice(0, limit).map((m) => (
              <MethodRow
                key={m.id}
                m={m}
                needed={needed}
                active={m.id === state.method}
                onSelect={() =>
                  update({ method: m.id === state.method ? undefined : m.id })
                }
                inputs={methodInputs(graph, m)
                  .map((g) => `${fmt(g.count ?? 1, locale)}× ${itemName(g.id)}`)
                  .join(", ")}
                labels={labels}
                common={common}
              />
            ))}
          </ul>
        )}
        {visible.length > limit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLimit(Infinity)}
          >
            {t("showAll", { count: visible.length })}
          </Button>
        )}
        <FlagLegend labels={labels} methods={methods} />
      </section>
    </div>
  );
}

function MethodIcon({
  m,
  appName,
  iconsHash,
  size = 28,
}: {
  m: XpMethodView;
  appName: string;
  iconsHash?: string;
  size?: number;
}) {
  return m.icon ? (
    <SpriteIcon
      icon={m.icon}
      appName={appName}
      iconsHash={iconsHash}
      size={size}
    />
  ) : (
    <span
      className="inline-block shrink-0 rounded bg-muted"
      style={{ width: size, height: size }}
    />
  );
}

function MethodRow({
  m,
  needed,
  active,
  onSelect,
  inputs,
  labels,
  common,
}: {
  m: XpMethodView;
  needed: number;
  active: boolean;
  onSelect: () => void;
  inputs: string;
  labels: Record<string, string>;
  common: { appName: string; iconsHash?: string; locale: string };
}) {
  const t = xpT(labels);
  const { locale } = common;
  const n = actionsNeeded(needed, m.xp);
  const perDamage = m.unit === PER_DAMAGE_UNIT;
  return (
    <li
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-2 text-sm ${active ? "bg-amber-950/30" : ""}`}
    >
      <MethodIcon m={m} appName={common.appName} iconsHash={common.iconsHash} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {m.db ? (
            <Link
              href={localizePath(m.db, locale)}
              prefetch={false}
              className="truncate hover:text-amber-300 hover:underline underline-offset-2"
            >
              {m.name}
            </Link>
          ) : (
            <span className="truncate">{m.name}</span>
          )}
          <FlagBadge flag={m.flag} labels={labels} />
          {m.level ? (
            <span className="text-[11px] text-muted-foreground">
              {t("requiresLevel", { level: m.level })}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
          <span>{xpPerUnit(t, m.xp, m.unit, locale)}</span>
          {inputs && <span className="truncate">{inputs}</span>}
          {m.map && (
            <Link
              href={localizePath(m.map, locale)}
              prefetch={false}
              className="text-amber-400 hover:underline"
            >
              {t("showOnMap")}
            </Link>
          )}
        </div>
      </div>
      <div className="ml-auto text-right">
        <div className="font-mono tabular-nums text-amber-200">
          {Number.isFinite(n) ? fmt(n, locale) : "–"}
          {perDamage ? "" : "×"}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {perDamage ? t("damageNeeded") : t("actionsNeeded")}
        </div>
      </div>
      {(m.recipe || m.items?.length) && (
        <Button
          variant={active ? "default" : "outline"}
          size="sm"
          aria-pressed={active}
          onClick={onSelect}
        >
          {t("materials")}
        </Button>
      )}
    </li>
  );
}

function SelectedMethod({
  method,
  needed,
  graph,
  crafting,
  infos,
  labels,
  common,
  itemName,
  onClose,
}: {
  method: XpMethodView;
  needed: number;
  graph: CraftingGraph | null;
  crafting: boolean;
  infos: Record<string, CraftItemInfo>;
  labels: Record<string, string>;
  common: { appName: string; iconsHash?: string; locale: string };
  itemName: (id: string) => string;
  onClose: () => void;
}) {
  const t = xpT(labels);
  const { locale } = common;
  const n = actionsNeeded(needed, method.xp);
  const plan = useMemo(() => methodCost(graph, method, n), [graph, method, n]);
  const recipe = method.recipe
    ? graph?.recipes.find((r) => r.key === method.recipe)
    : undefined;
  // The same plan in the crafting calculator (this recipe forced for its product).
  const product = recipe?.products[0];
  const calcTargets =
    recipe && product
      ? [{ id: product.id, qty: n * product.count }]
      : (method.items ?? []).map((i) => ({
          id: i.id,
          qty: (i.count ?? 1) * n,
        }));
  const calcHref =
    plan && calcTargets.length && Number.isFinite(n)
      ? `/crafting?items=${formatCraftItems(calcTargets)}${
          recipe && product
            ? `&r=${encodeURIComponent(product.id)}:${encodeURIComponent(recipe.key)}`
            : ""
        }`
      : null;
  return (
    <section className="space-y-3 rounded-md border px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <MethodIcon
          m={method}
          appName={common.appName}
          iconsHash={common.iconsHash}
          size={36}
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">
            {t("trainingWith", { method: method.name })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("actionsSummary", {
              actions: Number.isFinite(n) ? fmt(n, locale) : "–",
              xp: xpPerUnit(t, method.xp, method.unit, locale),
            })}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>
      {!crafting ? null : !graph ? (
        <p className="text-sm text-muted-foreground">{t("loadingCost")}</p>
      ) : !plan ? (
        <p className="text-sm text-muted-foreground">{t("noCost")}</p>
      ) : (
        <div className="space-y-3">
          <div>
            <h3 className="mb-1 text-sm font-semibold">{t("rawMaterials")}</h3>
            <ul className="divide-y rounded-md border">
              {plan.raw.map((l) => (
                <li
                  key={l.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1.5 text-sm"
                >
                  <span className="w-20 shrink-0 text-right font-mono tabular-nums text-amber-200">
                    {fmt(l.qty, locale)}×
                  </span>
                  <span className="min-w-0 flex-1">
                    <ItemLabel id={l.id} info={infos[l.id]} {...common} />
                  </span>
                  <MapLink
                    info={infos[l.id]}
                    locale={locale}
                    label={t("showOnMap")}
                  />
                </li>
              ))}
            </ul>
          </div>
          {plan.crafted.length > 0 && (
            <div>
              <h3 className="mb-1 text-sm font-semibold">{t("craftSteps")}</h3>
              <ol className="space-y-1 text-sm">
                {[...plan.crafted].reverse().map((c) => {
                  const r = graph.recipes[c.recipe];
                  return (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center gap-x-2 gap-y-1"
                    >
                      <span className="font-mono tabular-nums text-amber-200">
                        {t("craftTimes", { crafts: fmt(c.crafts, locale) })}
                      </span>
                      <span>{itemName(c.id)}</span>
                      <StationChips
                        stations={r.stations}
                        infos={infos}
                        locale={locale}
                      />
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
          {calcHref && (
            <Link
              href={localizePath(calcHref, locale)}
              prefetch={false}
              className="inline-block text-sm text-amber-400 hover:underline"
            >
              {t("openCrafting")}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

function FlagLegend({
  labels,
  methods,
}: {
  labels: Record<string, string>;
  methods: XpMethodView[];
}) {
  const t = xpT(labels);
  const flags = [
    ...new Set(methods.map((m) => m.flag).filter(Boolean)),
  ] as string[];
  const hasDamage = methods.some((m) => m.unit === PER_DAMAGE_UNIT);
  const hasChop = methods.some((m) => m.kind === "chop");
  if (!flags.length && !hasDamage) return null;
  return (
    <ul className="space-y-1 text-xs text-muted-foreground">
      {hasDamage && <li>{t("damageNote")}</li>}
      {hasChop && <li>{t("chopNote")}</li>}
      {flags.map((f) => (
        <li key={f}>
          <FlagBadge flag={f} labels={labels} /> {t(`flag.${f}.help`)}
        </li>
      ))}
    </ul>
  );
}
