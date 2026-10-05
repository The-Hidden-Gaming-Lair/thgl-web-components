"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  findTalents,
  interpolate,
  localizePath,
  palStat,
  PAL_STATS,
  type PalStat,
  type PalStatInput,
  type PalStatsData,
} from "@repo/lib";
import {
  Button,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Input,
  Switch,
} from "@repo/ui/controls";
import { PalPicker, type PickerPal } from "@/lib/breeding/calculator";

type Tab = "find" | "calc";

export type IvCalculatorProps = {
  data: PalStatsData;
  pals: PickerPal[];
  labels: Record<string, string>;
  appName: string;
  iconsHash?: string;
  locale: string;
};

const MAX_PASSIVES = 4;
const URL_STAT: Record<PalStat, string> = {
  hp: "h",
  attack: "a",
  defense: "d",
};

type State = {
  tab: Tab;
  pal?: string;
  level: number;
  alpha: boolean;
  stars: number;
  trust: number;
  statue: Record<PalStat, number>;
  passives: string[];
  /** In-game values (find tab), as typed. */
  values: Record<PalStat, string>;
  /** Talents (calc tab). */
  talents: Record<PalStat, number>;
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(v) ? Math.trunc(v) : min));

const EMPTY_STATS = { hp: 0, attack: 0, defense: 0 };

function readUrl(data: PalStatsData, ids: Set<string>): Partial<State> {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(window.location.search);
  const s = data.settings;
  const num = (k: string, max: number, min = 0) =>
    q.has(k) ? clamp(Number(q.get(k)), min, max) : undefined;
  const pal = q.get("pal");
  const stat = (prefix: string, max: number) =>
    Object.fromEntries(
      PAL_STATS.map((st) => [st, num(prefix + URL_STAT[st], max) ?? 0]),
    ) as Record<PalStat, number>;
  return {
    tab: q.get("tab") === "calc" ? "calc" : "find",
    pal: pal && ids.has(pal) ? pal : undefined,
    level: num("lv", s.maxLevel, 1),
    alpha: q.get("alpha") === "1",
    stars: num("st", s.maxCondenserRank - 1),
    trust: num("tr", s.maxTrustRank),
    statue: stat("s", s.maxStatueRank),
    talents: stat("iv", s.maxTalent),
    passives: q
      .get("p")
      ?.split(",")
      .filter((p) => data.passives[p])
      .slice(0, MAX_PASSIVES),
    values: Object.fromEntries(
      PAL_STATS.map((st) => [st, q.get(URL_STAT[st]) ?? ""]),
    ) as Record<PalStat, string>,
  };
}

export function IvCalculator({
  data,
  pals,
  labels,
  appName,
  iconsHash,
  locale,
}: IvCalculatorProps) {
  const t = (key: string, vars?: Record<string, string | number>) => {
    const v = labels[`iv.${key}`] ?? key;
    return vars
      ? interpolate(
          v,
          Object.fromEntries(
            Object.entries(vars).map(([k, x]) => [k, String(x)]),
          ),
        )
      : v;
  };
  const s = data.settings;
  const byId = useMemo(() => new Map(pals.map((p) => [p.id, p])), [pals]);

  const [state, setState] = useState<State>({
    tab: "find",
    level: 1,
    alpha: false,
    stars: 0,
    trust: 0,
    statue: { ...EMPTY_STATS },
    passives: [],
    values: { hp: "", attack: "", defense: "" },
    talents: { hp: 50, attack: 50, defense: 50 },
  });
  const set = (patch: Partial<State>) =>
    setState((st) => ({ ...st, ...patch }));
  const [copied, setCopied] = useState(false);
  // URL → state runs once; state → URL only after that.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (hydrated) return;
    const url = readUrl(data, new Set(byId.keys()));
    setState((st) => ({
      ...st,
      ...Object.fromEntries(
        Object.entries(url).filter(([, v]) => v !== undefined),
      ),
    }));
    setHydrated(true);
  }, [byId, data, hydrated]);

  const shareUrl = () => {
    const q = new URLSearchParams();
    if (state.tab === "calc") q.set("tab", "calc");
    if (state.pal) q.set("pal", state.pal);
    q.set("lv", String(state.level));
    if (state.alpha) q.set("alpha", "1");
    if (state.stars) q.set("st", String(state.stars));
    if (state.trust) q.set("tr", String(state.trust));
    for (const st of PAL_STATS) {
      if (state.statue[st]) q.set(`s${URL_STAT[st]}`, String(state.statue[st]));
      if (state.tab === "find" && state.values[st])
        q.set(URL_STAT[st], state.values[st]);
      if (state.tab === "calc")
        q.set(`iv${URL_STAT[st]}`, String(state.talents[st]));
    }
    if (state.passives.length) q.set("p", state.passives.join(","));
    return `${window.location.origin}${window.location.pathname}?${q}`;
  };
  useEffect(() => {
    if (!hydrated) return;
    const url = shareUrl();
    if (url !== window.location.href)
      window.history.replaceState(null, "", url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, state]);

  const input: PalStatInput = {
    level: state.level,
    alpha: state.alpha,
    stars: state.stars,
    trust: state.trust,
    statue: state.statue,
    passives: state.passives,
  };
  const hasAlpha = !!(state.pal && data.pals[state.pal]?.alpha);
  const statLabel = (st: PalStat) => t(`stat.${st}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="tablist">
        {(["find", "calc"] as const).map((k) => (
          <Button
            key={k}
            role="tab"
            aria-selected={state.tab === k}
            variant={state.tab === k ? "default" : "outline"}
            size="sm"
            onClick={() => set({ tab: k })}
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

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <PalPicker
            value={state.pal}
            onChange={(pal) => set({ pal })}
            label={t("pal")}
            pals={pals}
            byId={byId}
            t={t}
            appName={appName}
            iconsHash={iconsHash}
          />
          {state.pal && (
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                className="underline"
                href={localizePath(`/db/paldeck/${state.pal}`, locale)}
              >
                {t("paldeck")}
              </Link>
              <Link
                className="underline"
                href={localizePath(`/breeding/${state.pal}`, locale)}
              >
                {t("breeding")}
              </Link>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={state.alpha && hasAlpha}
              disabled={!hasAlpha}
              onCheckedChange={(alpha) => set({ alpha })}
            />
            {t("alpha")}
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <NumberField
            label={t("level")}
            value={state.level}
            min={1}
            max={s.maxLevel}
            onChange={(level) => set({ level })}
          />
          <NumberField
            label={t("trust")}
            value={state.trust}
            min={0}
            max={s.maxTrustRank}
            onChange={(trust) => set({ trust })}
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t("stars")}</span>
            <div className="flex h-9 items-center gap-0.5">
              {Array.from({ length: s.maxCondenserRank - 1 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={t("starsN", { n: i + 1 })}
                  className={`text-xl leading-none ${i < state.stars ? "text-yellow-400" : "text-muted-foreground/40"}`}
                  onClick={() =>
                    set({ stars: state.stars === i + 1 ? i : i + 1 })
                  }
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          {PAL_STATS.map((st) => (
            <NumberField
              key={st}
              label={t("statue", { stat: statLabel(st) })}
              value={state.statue[st]}
              min={0}
              max={s.maxStatueRank}
              onChange={(v) => set({ statue: { ...state.statue, [st]: v } })}
            />
          ))}
        </div>
      </section>

      <PassivePicker
        data={data}
        value={state.passives}
        onChange={(passives) => set({ passives })}
        t={t}
        name={(id) => labels[`passive.${id}`] ?? id}
        statLabel={statLabel}
      />

      {!state.pal ? (
        <p className="text-sm text-muted-foreground">{t("pickPal")}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-1 font-normal">{t("col.stat")}</th>
              {state.tab === "find" ? (
                <>
                  <th className="py-1 font-normal">{t("col.value")}</th>
                  <th className="py-1 font-normal">{t("col.iv")}</th>
                </>
              ) : (
                <>
                  <th className="py-1 font-normal">{t("col.iv")}</th>
                  <th className="py-1 font-normal">{t("col.result")}</th>
                </>
              )}
              <th className="py-1 font-normal">{t("col.range")}</th>
            </tr>
          </thead>
          <tbody>
            {PAL_STATS.map((st) => {
              const lo = palStat(data, state.pal!, st, 0, input);
              const hi = palStat(data, state.pal!, st, s.maxTalent, input);
              return (
                <tr key={st} className="border-t">
                  <td className="py-2 pr-2 font-medium">{statLabel(st)}</td>
                  {state.tab === "find" ? (
                    <FindCells
                      value={state.values[st]}
                      onChange={(v) =>
                        set({ values: { ...state.values, [st]: v } })
                      }
                      talents={
                        state.values[st]
                          ? findTalents(
                              data,
                              state.pal!,
                              st,
                              Number(state.values[st]),
                              input,
                            )
                          : undefined
                      }
                      max={s.maxTalent}
                      t={t}
                    />
                  ) : (
                    <>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          inputMode="numeric"
                          className="h-9 w-24"
                          min={0}
                          max={s.maxTalent}
                          value={state.talents[st]}
                          onChange={(e) =>
                            set({
                              talents: {
                                ...state.talents,
                                [st]: clamp(
                                  Number(e.target.value),
                                  0,
                                  s.maxTalent,
                                ),
                              },
                            })
                          }
                        />
                      </td>
                      <td className="py-2 pr-2 text-base font-semibold tabular-nums">
                        {palStat(
                          data,
                          state.pal!,
                          st,
                          state.talents[st],
                          input,
                        )}
                      </td>
                    </>
                  )}
                  <td className="py-2 tabular-nums text-muted-foreground">
                    {lo}–{hi}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
        <li>{t("note.attack")}</li>
        <li>{t("note.buffs")}</li>
        {data.build && <li>{t("build", { build: data.build })}</li>}
      </ul>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input
        type="number"
        inputMode="numeric"
        className="h-9"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
      />
    </label>
  );
}

function FindCells({
  value,
  onChange,
  talents,
  max,
  t,
}: {
  value: string;
  onChange: (v: string) => void;
  talents?: number[];
  max: number;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  let result: ReactNode = <span className="text-muted-foreground">—</span>;
  if (talents && !talents.length)
    result = <span className="text-destructive">{t("noMatch")}</span>;
  else if (talents?.length) {
    const lo = talents[0];
    const hi = talents[talents.length - 1];
    const tone =
      hi >= 90 ? "text-yellow-400" : hi >= 60 ? "text-green-500" : "";
    result = (
      <span className={`text-base font-semibold tabular-nums ${tone}`}>
        {lo === hi ? `${lo}%` : `${lo}–${hi}%`}
        {lo === 0 && hi === max && (
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {t("anyIv")}
          </span>
        )}
      </span>
    );
  }
  return (
    <>
      <td className="py-2 pr-2">
        <Input
          type="number"
          inputMode="numeric"
          className="h-9 w-28"
          min={0}
          placeholder={t("valuePlaceholder")}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        />
      </td>
      <td className="py-2 pr-2">{result}</td>
    </>
  );
}

function PassivePicker({
  data,
  value,
  onChange,
  t,
  name,
  statLabel,
}: {
  data: PalStatsData;
  value: string[];
  onChange: (v: string[]) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  name: (id: string) => string;
  statLabel: (st: PalStat) => string;
}) {
  const [open, setOpen] = useState(false);
  const effects = (id: string) =>
    PAL_STATS.filter((st) => data.passives[id]?.[st])
      .map((st) => {
        const v = data.passives[id]![st]!;
        return `${statLabel(st)} ${v > 0 ? "+" : ""}${v}%`;
      })
      .join(", ");
  const sorted = useMemo(
    () =>
      Object.keys(data.passives).sort(
        (a, b) =>
          data.passives[b]!.rank - data.passives[a]!.rank ||
          name(a).localeCompare(name(b)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );
  return (
    <section className="space-y-2">
      <div className="flex items-baseline gap-2">
        <h3 className="text-sm font-semibold">{t("passives")}</h3>
        <span className="text-xs text-muted-foreground">
          {t("passivesHint")}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {value.map((id) => (
          <button
            key={id}
            type="button"
            title={t("remove")}
            onClick={() => onChange(value.filter((p) => p !== id))}
            className={`rounded-md border px-2 py-1 text-sm hover:bg-accent ${data.passives[id]!.rank < 0 ? "border-destructive/60" : ""}`}
          >
            {name(id)}{" "}
            <span className="text-xs text-muted-foreground">{effects(id)}</span>{" "}
            ×
          </button>
        ))}
        {value.length < MAX_PASSIVES && (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            {t("addPassive")}
          </Button>
        )}
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t("searchPassive")} />
        <CommandList>
          <CommandEmpty>—</CommandEmpty>
          {sorted
            .filter((id) => !value.includes(id))
            .map((id) => (
              <CommandItem
                key={id}
                value={`${name(id)} ${id}`}
                onSelect={() => {
                  onChange([...value, id].slice(0, MAX_PASSIVES));
                  setOpen(false);
                }}
              >
                <span>{name(id)}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {effects(id)}
                </span>
              </CommandItem>
            ))}
        </CommandList>
      </CommandDialog>
    </section>
  );
}
