"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  createBreeder,
  findBreedingPlan,
  interpolate,
  localizePath,
  type BreedingData,
  type BreedingGender,
  type BreedingPair,
} from "@repo/lib";
import {
  Button,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/controls";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import type { BreedingPalInfo } from "./data";

type Tab = "child" | "parents" | "path";

export type BreedingCalculatorProps = {
  data: BreedingData;
  pals: BreedingPalInfo[];
  labels: Record<string, string>;
  appName: string;
  iconsHash?: string;
  locale: string;
};

const OWNED_KEY = "palworld-breeding-owned";
const PAIRS_PAGE = 60;

/** Parse the shareable URL state (?tab=&a=&b=&target=&own=). */
function readUrl(ids: Set<string>) {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(window.location.search);
  const pal = (k: string) => {
    const v = q.get(k);
    return v && ids.has(v) ? v : undefined;
  };
  const tab = q.get("tab");
  return {
    tab:
      tab === "child" || tab === "parents" || tab === "path"
        ? (tab as Tab)
        : undefined,
    a: pal("a"),
    b: pal("b"),
    target: pal("target"),
    own: q
      .get("own")
      ?.split(",")
      .filter((id) => ids.has(id)),
  };
}

export function BreedingCalculator({
  data,
  pals,
  labels,
  appName,
  iconsHash,
  locale,
}: BreedingCalculatorProps) {
  const t = (key: string, vars?: Record<string, string | number>) => {
    const v = labels[`breeding.${key}`] ?? key;
    return vars
      ? interpolate(
          v,
          Object.fromEntries(
            Object.entries(vars).map(([k, x]) => [k, String(x)]),
          ),
        )
      : v;
  };
  const breeder = useMemo(() => createBreeder(data), [data]);
  const byId = useMemo(() => new Map(pals.map((p) => [p.id, p])), [pals]);

  const [tab, setTab] = useState<Tab>("child");
  const [a, setA] = useState<string>();
  const [b, setB] = useState<string>();
  const [target, setTarget] = useState<string>();
  const [owned, setOwned] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  // URL → state runs once; state → URL only after that (else the first,
  // empty state would overwrite a shared link before it is read).
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from the URL first (shared links), else the saved "My Pals".
  useEffect(() => {
    if (hydrated) return;
    const url = readUrl(new Set(byId.keys()));
    if (url.tab) setTab(url.tab);
    else if (url.target && !url.a) setTab(url.own ? "path" : "parents");
    if (url.a) setA(url.a);
    if (url.b) setB(url.b);
    if (url.target) setTarget(url.target);
    if (url.own?.length) setOwned(url.own);
    else {
      try {
        const saved = JSON.parse(localStorage.getItem(OWNED_KEY) ?? "[]");
        if (Array.isArray(saved)) setOwned(saved.filter((id) => byId.has(id)));
      } catch {
        /* ignore */
      }
    }
    setHydrated(true);
  }, [byId, hydrated]);

  const saveOwned = (next: string[]) => {
    setOwned(next);
    try {
      localStorage.setItem(OWNED_KEY, JSON.stringify(next));
    } catch {
      /* private mode */
    }
  };

  const shareUrl = () => {
    const q = new URLSearchParams({ tab });
    if (tab === "child") {
      if (a) q.set("a", a);
      if (b) q.set("b", b);
    } else if (target) q.set("target", target);
    if (tab === "path" && owned.length) q.set("own", owned.join(","));
    return `${window.location.origin}${window.location.pathname}?${q}`;
  };

  // Keep the address bar shareable without adding history entries.
  useEffect(() => {
    if (!hydrated) return;
    const url = shareUrl();
    if (url !== window.location.href)
      window.history.replaceState(null, "", url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, tab, a, b, target, owned]);

  const name = (id: string) => byId.get(id)?.name ?? id;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist">
        {(["child", "parents", "path"] as const).map((k) => (
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
      </div>

      {tab === "child" && (
        <ChildTab
          {...{
            a,
            b,
            setA,
            setB,
            pals,
            byId,
            breeder,
            t,
            name,
            appName,
            iconsHash,
            locale,
          }}
        />
      )}
      {tab === "parents" && (
        <ParentsTab
          {...{
            target,
            setTarget,
            pals,
            byId,
            breeder,
            owned,
            t,
            name,
            appName,
            iconsHash,
            locale,
          }}
        />
      )}
      {tab === "path" && (
        <PathTab
          {...{
            target,
            setTarget,
            pals,
            byId,
            breeder,
            owned,
            saveOwned,
            t,
            name,
            appName,
            iconsHash,
            locale,
          }}
        />
      )}

      {data.build && (
        <p className="text-xs text-muted-foreground">
          {t("build", { build: data.build })}
        </p>
      )}
    </div>
  );
}

type Shared = {
  pals: BreedingPalInfo[];
  byId: Map<string, BreedingPalInfo>;
  breeder: ReturnType<typeof createBreeder>;
  t: (key: string, vars?: Record<string, string | number>) => string;
  name: (id: string) => string;
  appName: string;
  iconsHash?: string;
  locale: string;
};

function PalIcon({
  pal,
  size = 40,
  appName,
  iconsHash,
}: {
  pal?: BreedingPalInfo;
  size?: number;
  appName: string;
  iconsHash?: string;
}) {
  if (!pal?.icon)
    return (
      <span
        style={{ width: size, height: size }}
        className="inline-block shrink-0 rounded bg-muted"
      />
    );
  return (
    <SpriteIcon
      icon={pal.icon}
      appName={appName}
      iconsHash={iconsHash}
      size={size}
    />
  );
}

/** Pal chip linking to its per-pal breeding page. */
function PalChip({
  id,
  byId,
  appName,
  iconsHash,
  locale,
  sub,
}: { id: string; sub?: string } & Pick<
  Shared,
  "byId" | "appName" | "iconsHash" | "locale"
>) {
  const pal = byId.get(id);
  return (
    <Link
      href={localizePath(`/breeding/${id}`, locale)}
      className="inline-flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-accent"
    >
      <PalIcon pal={pal} size={32} appName={appName} iconsHash={iconsHash} />
      <span>
        {pal?.name ?? id}
        {sub && (
          <span className="ml-1 text-xs text-muted-foreground">{sub}</span>
        )}
      </span>
    </Link>
  );
}

function PalPicker({
  value,
  onChange,
  label,
  pals,
  byId,
  t,
  appName,
  iconsHash,
}: {
  value?: string;
  onChange: (id: string) => void;
  label: string;
} & Pick<Shared, "pals" | "byId" | "t" | "appName" | "iconsHash">) {
  const [open, setOpen] = useState(false);
  const pal = value ? byId.get(value) : undefined;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-14 w-full items-center gap-2 rounded-md border bg-background px-2 py-1 text-left hover:bg-accent"
      >
        <PalIcon pal={pal} appName={appName} iconsHash={iconsHash} />
        <span className={pal ? "" : "text-muted-foreground"}>
          {pal ? pal.name : t("choose")}
        </span>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t("search")} />
        <CommandList>
          <CommandEmpty>—</CommandEmpty>
          {pals.map((p) => (
            <CommandItem
              key={p.id}
              value={`${p.name} #${p.dex} ${p.id}`}
              onSelect={() => {
                onChange(p.id);
                setOpen(false);
              }}
            >
              <PalIcon
                pal={p}
                size={28}
                appName={appName}
                iconsHash={iconsHash}
              />
              <span className="ml-2">{p.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                #{p.dex}
              </span>
            </CommandItem>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  );
}

const genderLabel = (t: Shared["t"], g: BreedingGender | null) =>
  g === "m" ? t("gender.male") : g === "f" ? t("gender.female") : "";

function ChildTab({
  a,
  b,
  setA,
  setB,
  ...s
}: Shared & {
  a?: string;
  b?: string;
  setA: (id: string) => void;
  setB: (id: string) => void;
}) {
  const { breeder, t, name } = s;
  const outcomes = a && b ? breeder.breed(a, b) : [];
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end [&>*:first-child]:flex-1 [&>*:last-child]:flex-1">
        <PalPicker value={a} onChange={setA} label={t("parentA")} {...s} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const x = a;
            setA(b!);
            setB(x!);
          }}
          disabled={!a || !b}
          className="sm:mb-3"
        >
          ⇄ {t("swap")}
        </Button>
        <PalPicker value={b} onChange={setB} label={t("parentB")} {...s} />
      </div>
      {outcomes.map((o) => (
        <div key={o.child} className="rounded-md border p-3 space-y-2">
          <div className="text-xs text-muted-foreground">{t("child")}</div>
          <PalChip id={o.child} {...s} />
          <p className="text-sm">
            {o.via === "same"
              ? t("why.same")
              : o.via === "unique"
                ? t("why.unique")
                : t("why.rank", {
                    a: breeder.data.pals[a!].rank,
                    b: breeder.data.pals[b!].rank,
                    target: breeder.targetRank(a!, b!),
                    child: breeder.data.pals[o.child].rank,
                  })}
          </p>
          {o.genders && (
            <p className="text-sm font-medium">
              {t("gender.needs", {
                a: name(a!),
                ga: genderLabel(t, o.genders[0]),
                b: name(b!),
                gb: genderLabel(t, o.genders[1]),
              })}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/** Table of parent pairs; shared by the calculator and the per-pal page. */
function PairList({
  pairs,
  ownedSet,
  ...s
}: Pick<Shared, "byId" | "t" | "name" | "appName" | "iconsHash" | "locale"> & {
  pairs: BreedingPair[];
  ownedSet?: Set<string>;
}) {
  const [filter, setFilter] = useState("");
  const [onlyOwned, setOnlyOwned] = useState(false);
  const [limit, setLimit] = useState(PAIRS_PAGE);
  const { t, name } = s;
  const f = filter.trim().toLowerCase();
  const shown = pairs.filter(
    (p) =>
      (!f ||
        name(p.a).toLowerCase().includes(f) ||
        name(p.b).toLowerCase().includes(f)) &&
      (!onlyOwned || (ownedSet?.has(p.a) && ownedSet?.has(p.b))),
  );
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="h-9 flex-1 min-w-40 rounded-md border bg-background px-2 text-sm"
          placeholder={t("pairs.filter")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        {ownedSet && ownedSet.size > 0 && (
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={onlyOwned}
              onChange={(e) => setOnlyOwned(e.target.checked)}
            />
            {t("pairs.ownedOnly")}
          </label>
        )}
      </div>
      <ul className="divide-y rounded-md border">
        {shown.slice(0, limit).map((p) => (
          <li
            key={`${p.a}|${p.b}|${p.outcome.genders?.join("")}`}
            className="flex flex-wrap items-center gap-x-2 px-2 py-1"
          >
            <PalChip
              id={p.a}
              sub={
                p.outcome.genders
                  ? genderLabel(t, p.outcome.genders[0])
                  : undefined
              }
              {...s}
            />
            <span className="text-muted-foreground">+</span>
            <PalChip
              id={p.b}
              sub={
                p.outcome.genders
                  ? genderLabel(t, p.outcome.genders[1])
                  : undefined
              }
              {...s}
            />
          </li>
        ))}
      </ul>
      {shown.length > limit && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLimit(shown.length)}
        >
          {t("pairs.showAll", { count: shown.length })}
        </Button>
      )}
    </div>
  );
}

function ParentsTab({
  target,
  setTarget,
  owned,
  ...s
}: Shared & {
  target?: string;
  setTarget: (id: string) => void;
  owned: string[];
}) {
  const { breeder, t } = s;
  const pairs = useMemo(
    () =>
      target
        ? breeder.parentsOf(target).filter((p) => p.a !== p.b || p.a !== target)
        : [],
    [breeder, target],
  );
  const ownedSet = useMemo(() => new Set(owned), [owned]);
  return (
    <div className="space-y-4">
      <PalPicker
        value={target}
        onChange={setTarget}
        label={t("target")}
        {...s}
      />
      {target && (
        <>
          <p className="text-sm">
            {pairs.length
              ? t("pairs.count", { count: pairs.length })
              : t("pairs.none")}
          </p>
          <PairList pairs={pairs} ownedSet={ownedSet} {...s} />
        </>
      )}
    </div>
  );
}

function PathTab({
  target,
  setTarget,
  owned,
  saveOwned,
  ...s
}: Shared & {
  target?: string;
  setTarget: (id: string) => void;
  owned: string[];
  saveOwned: (ids: string[]) => void;
}) {
  const { breeder, t, byId } = s;
  const plan = useMemo(
    () =>
      target && owned.length
        ? findBreedingPlan(breeder, owned, target)
        : undefined,
    [breeder, owned, target],
  );
  return (
    <div className="space-y-4">
      <div className="rounded-md border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{t("owned")}</h3>
          {owned.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => saveOwned([])}>
              {t("owned.clear")}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{t("owned.hint")}</p>
        <div className="flex flex-wrap gap-1">
          {owned.length === 0 && (
            <span className="text-sm text-muted-foreground">
              {t("owned.empty")}
            </span>
          )}
          {owned.map((id) => (
            <button
              key={id}
              type="button"
              title="×"
              onClick={() => saveOwned(owned.filter((x) => x !== id))}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm hover:bg-destructive/20"
            >
              <PalIcon
                pal={byId.get(id)}
                size={20}
                appName={s.appName}
                iconsHash={s.iconsHash}
              />
              {s.name(id)} ×
            </button>
          ))}
        </div>
        <PalPicker
          onChange={(id) => !owned.includes(id) && saveOwned([...owned, id])}
          label={t("owned.add")}
          {...s}
        />
      </div>
      <PalPicker
        value={target}
        onChange={setTarget}
        label={t("target")}
        {...s}
      />
      {target && !owned.length && (
        <p className="text-sm">{t("path.needOwned")}</p>
      )}
      {target && owned.length > 0 && plan === null && (
        <div className="space-y-2">
          <p className="text-sm">{t("path.none")}</p>
          <PairList pairs={breeder.parentsOf(target)} {...s} />
        </div>
      )}
      {plan && plan.steps.length === 0 && (
        <p className="text-sm">{t("path.have")}</p>
      )}
      {plan && plan.steps.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {t("path.steps", { count: plan.steps.length })} ·{" "}
            {t("path.eggs", { eggs: plan.eggs.toFixed(1).replace(/\.0$/, "") })}
          </p>
          <ol className="space-y-1">
            {plan.steps.map((step, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center gap-x-2 rounded-md border px-2 py-1"
              >
                <span className="w-6 text-sm text-muted-foreground">
                  {i + 1}.
                </span>
                <PalChip
                  id={step.a}
                  sub={
                    step.genders ? genderLabel(t, step.genders[0]) : undefined
                  }
                  {...s}
                />
                <span className="text-muted-foreground">+</span>
                <PalChip
                  id={step.b}
                  sub={
                    step.genders ? genderLabel(t, step.genders[1]) : undefined
                  }
                  {...s}
                />
                <span className="text-muted-foreground">→</span>
                <PalChip id={step.child} {...s} />
                {step.eggs > 1.05 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {t("path.eggs", { eggs: step.eggs.toFixed(1) })}
                  </span>
                )}
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground">{t("path.note")}</p>
        </div>
      )}
    </div>
  );
}
