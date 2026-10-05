"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  decodeBlueprintPlan,
  encodeBlueprintPlan,
  interpolate,
  localizePath,
  planBlueprints,
  type BlueprintPlanEntry,
  type OnceHumanBlueprintData,
} from "@repo/lib";
import {
  Button,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Input,
} from "@repo/ui/controls";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import type { BlueprintOption } from "./data";

export type BlueprintPlannerProps = {
  data: OnceHumanBlueprintData;
  options: BlueprintOption[];
  labels: Record<string, string>;
  appName: string;
  iconsHash?: string;
  locale: string;
  /** Plan when the URL has none (per-blueprint pages: that blueprint, locked → max). */
  initial?: BlueprintPlanEntry[];
};

type T = (key: string, vars?: Record<string, string | number>) => string;

export function BlueprintPlanner({
  data,
  options,
  labels,
  appName,
  iconsHash,
  locale,
  initial = [],
}: BlueprintPlannerProps) {
  const t: T = (key, vars) => {
    const v = labels[`blueprints.${key}`] ?? key;
    return vars
      ? interpolate(
          v,
          Object.fromEntries(
            Object.entries(vars).map(([k, x]) => [k, String(x)]),
          ),
        )
      : v;
  };
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const fmt = (n: number) => n.toLocaleString(locale);
  const currency = data.currency.name;

  const [plan, setPlan] = useState<BlueprintPlanEntry[]>(initial);
  const [have, setHave] = useState("");
  const [copied, setCopied] = useState(false);
  // URL → state runs once; state → URL only after that.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (hydrated) return;
    const q = new URLSearchParams(window.location.search);
    if (q.has("p")) setPlan(decodeBlueprintPlan(data, q.get("p")));
    if (q.has("have")) setHave(q.get("have")!.replace(/\D/g, ""));
    setHydrated(true);
  }, [data, hydrated]);

  const shareUrl = () => {
    const q = new URLSearchParams();
    if (plan.length) q.set("p", encodeBlueprintPlan(plan));
    if (have) q.set("have", have);
    const qs = q.toString();
    return `${window.location.origin}${window.location.pathname}${qs ? `?${qs}` : ""}`;
  };
  useEffect(() => {
    if (!hydrated) return;
    const url = shareUrl();
    if (url !== window.location.href)
      window.history.replaceState(null, "", url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, plan, have]);

  const { lines, total } = planBlueprints(data, plan);
  const update = (id: string, patch: Partial<BlueprintPlanEntry>) =>
    setPlan((p) =>
      p.map((e) => {
        if (e.id !== id) return e;
        const next = { ...e, ...patch };
        // Target never below current: moving one drags the other along.
        if (patch.from !== undefined && next.to < next.from)
          next.to = next.from;
        if (patch.to !== undefined && next.from > next.to) next.from = next.to;
        return next;
      }),
    );
  const missing = Math.max(0, total - (Number(have) || 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <BlueprintPicker
          options={options.filter((o) => !plan.some((e) => e.id === o.id))}
          data={data}
          onPick={(id) =>
            setPlan((p) => [
              ...p,
              { id, from: 0, to: data.blueprints[id]!.costs.length },
            ])
          }
          t={t}
          appName={appName}
          iconsHash={iconsHash}
        />
        {plan.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setPlan([])}>
            {t("clear")}
          </Button>
        )}
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

      {lines.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {lines.map((line) => {
            const opt = byId.get(line.id);
            const bp = data.blueprints[line.id]!;
            return (
              <li key={line.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <BlueprintIconBox
                    option={opt}
                    appName={appName}
                    iconsHash={iconsHash}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      className="font-medium hover:underline"
                      href={localizePath(`/blueprints/${line.id}`, locale)}
                    >
                      {opt?.name ?? line.id}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {data.rarities[bp.rarity] ?? bp.rarity} ·{" "}
                      {t(`kind.${bp.kind}`)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold tabular-nums">
                      {fmt(line.cost)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {currency}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    title={t("remove")}
                    onClick={() =>
                      setPlan((p) => p.filter((e) => e.id !== line.id))
                    }
                  >
                    ×
                  </Button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <StarPicker
                    label={t("current")}
                    value={line.from}
                    max={bp.costs.length}
                    onChange={(from) => update(line.id, { from })}
                    t={t}
                  />
                  <StarPicker
                    label={t("target")}
                    value={line.to}
                    max={bp.costs.length}
                    onChange={(to) => update(line.id, { to })}
                    t={t}
                  />
                </div>
                {line.steps.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                    {line.steps.map((s) => (
                      <span
                        key={s.star}
                        className="rounded bg-muted px-1.5 py-0.5"
                      >
                        {s.star === 1 ? t("unlock") : `★${s.star}`}{" "}
                        <span className="tabular-nums">{fmt(s.cost)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {lines.length > 0 && (
        <section className="grid gap-4 rounded-md border p-4 sm:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">
              {t("total", { currency })}
            </div>
            <div className="text-2xl font-semibold tabular-nums">
              {fmt(total)}
            </div>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              {t("have", { currency })}
            </span>
            <Input
              type="text"
              inputMode="numeric"
              className="h-9"
              placeholder="0"
              value={have}
              onChange={(e) => setHave(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          <div>
            <div className="text-xs text-muted-foreground">
              {t("missing", { currency })}
            </div>
            <div
              className={`text-2xl font-semibold tabular-nums ${missing === 0 ? "text-green-500" : ""}`}
            >
              {fmt(missing)}
            </div>
          </div>
        </section>
      )}

      <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
        <li>{t("note.cost", { currency })}</li>
        <li>{t("note.account")}</li>
      </ul>
    </div>
  );
}

export function BlueprintIconBox({
  option,
  size = 40,
  appName,
  iconsHash,
}: {
  option?: BlueprintOption;
  size?: number;
  appName: string;
  iconsHash?: string;
}) {
  if (!option?.icon)
    return (
      <span
        style={{ width: size, height: size }}
        className="inline-block shrink-0 rounded bg-muted"
      />
    );
  return (
    <SpriteIcon
      icon={option.icon}
      appName={appName}
      iconsHash={iconsHash}
      size={size}
    />
  );
}

function StarPicker({
  label,
  value,
  max,
  onChange,
  t,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
  t: T;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex h-9 items-center gap-1">
        <button
          type="button"
          aria-pressed={value === 0}
          className={`rounded border px-2 py-0.5 text-xs ${value === 0 ? "border-primary text-primary" : "text-muted-foreground"}`}
          onClick={() => onChange(0)}
        >
          {t("locked")}
        </button>
        {Array.from({ length: max }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={t("starsN", { n: i + 1 })}
            className={`text-xl leading-none ${i < value ? "text-yellow-400" : "text-muted-foreground/40"}`}
            onClick={() => onChange(i + 1)}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

function BlueprintPicker({
  options,
  data,
  onPick,
  t,
  appName,
  iconsHash,
}: {
  options: BlueprintOption[];
  data: OnceHumanBlueprintData;
  onPick: (id: string) => void;
  t: T;
  appName: string;
  iconsHash?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        {t("add")}
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t("search")} />
        <CommandList>
          <CommandEmpty>—</CommandEmpty>
          {options.map((o) => (
            <CommandItem
              key={o.id}
              value={`${o.name} ${data.rarities[o.rarity] ?? ""} ${t(`kind.${o.kind}`)} ${o.id}`}
              onSelect={() => {
                onPick(o.id);
                setOpen(false);
              }}
            >
              <BlueprintIconBox
                option={o}
                size={28}
                appName={appName}
                iconsHash={iconsHash}
              />
              <span className="ml-2">{o.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {data.rarities[o.rarity] ?? o.rarity} · {t(`kind.${o.kind}`)} ·{" "}
                {"★".repeat(o.maxStar)}
              </span>
            </CommandItem>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
