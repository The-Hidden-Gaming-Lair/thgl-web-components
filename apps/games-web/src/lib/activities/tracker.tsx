"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Download,
  EyeOff,
  Minus,
  Plus,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react";
import {
  ActivitiesImportError,
  LEGACY_ACTIVITIES_KEY,
  activitiesStorageKey,
  activityCount,
  activityLastReset,
  addCharacter,
  clearFrequency,
  customActivityId,
  emptyActivitiesState,
  exportActivitiesJson,
  findRegion,
  gameWeekday,
  guessRegion,
  isAvailableToday,
  lastResetAt,
  migrateLegacyActivities,
  nextResetAt,
  parseActivitiesJson,
  parseActivitiesState,
  pruneProgress,
  removeCharacter,
  setActivityCount,
  splitDuration,
  translate,
  type ActivitiesState,
  type ActivityFrequency,
} from "@repo/lib";
import type { ActivitiesView, ActivityView } from "./data";

type Labels = Record<string, string>;

const FREQUENCIES: ActivityFrequency[] = ["daily", "weekly", "monthly"];

const FREQ_STYLE: Record<ActivityFrequency, string> = {
  daily: "text-emerald-300 border-emerald-700/60",
  weekly: "text-amber-300 border-amber-700/60",
  monthly: "text-sky-300 border-sky-700/60",
};

const CHIP = (active: boolean) =>
  `rounded px-2.5 py-1 text-xs transition-colors ${
    active
      ? "bg-amber-600/80 text-white"
      : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
  }`;
const BUTTON =
  "inline-flex h-8 items-center gap-1.5 rounded border border-slate-700 bg-slate-900/60 px-2.5 text-xs text-slate-200 hover:border-slate-500 hover:bg-slate-800 disabled:opacity-50";
const ICON_BUTTON =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500 hover:bg-slate-800 disabled:opacity-40";
const INPUT =
  "h-8 rounded border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none";

function useL(labels: Labels) {
  return useCallback(
    (key: string, fallback: string, vars?: Record<string, string>) =>
      translate(labels, `activities.${key}`, { fallback, vars }),
    [labels],
  );
}

type Tracked = ActivityView & { custom?: boolean };

/** localStorage-backed state (+ one-time migration of the old tracker). */
function useActivitiesState(view: ActivitiesView) {
  const key = activitiesStorageKey(view.game);
  const [state, setState] = useState<ActivitiesState | null>(null);
  const [storageOk, setStorageOk] = useState(true);

  useEffect(() => {
    let loaded: ActivitiesState | null = null;
    try {
      loaded = parseActivitiesState(localStorage.getItem(key));
      if (!loaded) {
        const config = {
          activities: view.activities.map((a) => ({
            ...a,
            name: a.id,
          })),
          terms: { en: view.enNames },
          legacyRetired: view.legacyRetired,
        };
        loaded = migrateLegacyActivities(
          localStorage.getItem(LEGACY_ACTIVITIES_KEY),
          config,
          Date.now(),
        );
        if (loaded) localStorage.setItem(key, JSON.stringify(loaded));
      }
    } catch {
      setStorageOk(false);
    }
    setState(loaded ?? emptyActivitiesState());
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      const next = parseActivitiesState(e.newValue);
      if (next) setState(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, view]);

  const update = useCallback(
    (fn: (s: ActivitiesState) => ActivitiesState) => {
      setState((prev) => {
        const next = fn(prev ?? emptyActivitiesState());
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          setStorageOk(false);
        }
        return next;
      });
    },
    [key],
  );

  return { state, update, storageOk };
}

function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Bar({ done, total }: { done: number; total: number }) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
    >
      <div
        className="h-full rounded-full bg-amber-500 transition-[width]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/**
 * Daily / weekly activities tracker: compact rows with counters, automatic
 * clearing at the game's server reset (per region), countdowns, several
 * characters, hidden + custom activities, export / import. Everything lives
 * in this browser (`thgl-activities:<game>`).
 */
export function ActivitiesTracker({
  view,
  labels,
  locale,
}: {
  view: ActivitiesView;
  labels: Labels;
  locale: string;
}) {
  const L = useL(labels);
  const { state, update, storageOk } = useActivitiesState(view);
  const now = useNow();
  const [filter, setFilter] = useState<ActivityFrequency | "all">("all");
  const [message, setMessage] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // No region picked yet: the one closest to the viewer's clock.
  const guessed = useMemo(
    () =>
      now === null
        ? undefined
        : guessRegion(
            view.reset.regions,
            -new Date(now).getTimezoneOffset(),
            now,
            Intl.DateTimeFormat().resolvedOptions().timeZone,
          ).id,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view.reset.regions, now === null],
  );
  const region = findRegion(view, state?.region ?? guessed);
  const usedFrequencies = useMemo(
    () =>
      FREQUENCIES.filter(
        (f) =>
          view.activities.some((a) => a.frequency === f) ||
          state?.custom.some((c) => c.frequency === f),
      ),
    [view.activities, state?.custom],
  );

  const resets = useMemo(() => {
    if (now === null) return null;
    const last = {} as Record<ActivityFrequency, number>;
    const next = {} as Record<ActivityFrequency, number>;
    for (const f of FREQUENCIES) {
      last[f] = lastResetAt(view.reset, region, f, now);
      next[f] = nextResetAt(view.reset, region, f, now);
    }
    return { last, next, weekday: gameWeekday(view.reset, region, now) };
    // Recompute when a reset passes (or the region changes), not every second.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, view.reset, now === null ? null : Math.floor(now / 60_000)]);

  // Forget ticks that no reset can count any more (keeps storage small).
  const lastDaily = resets?.last.daily;
  useEffect(() => {
    if (!state || !resets) return;
    const pruned = pruneProgress(state, resets.last);
    if (pruned !== state) update(() => pruned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastDaily, state === null]);

  const tracked: Tracked[] = useMemo(() => {
    const hidden = new Set(state?.hidden ?? []);
    return [
      ...view.activities.filter((a) => !hidden.has(a.id)),
      ...(state?.custom ?? []).map((c) => ({ ...c, custom: true })),
    ];
  }, [view.activities, state?.hidden, state?.custom]);

  const count = useCallback(
    (a: Tracked) => {
      if (!state || !resets) return 0;
      if (!a.reset || now === null) return activityCount(state, a, resets.last);
      return activityCount(state, a, {
        ...resets.last,
        [a.frequency]: activityLastReset(view.reset, region, a, now),
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, resets, view.reset, region],
  );
  const available = useCallback(
    (a: Tracked) => !resets || isAvailableToday(a, resets.weekday),
    [resets],
  );

  const totals = useMemo(() => {
    const out = {} as Record<
      ActivityFrequency,
      { done: number; total: number }
    >;
    for (const f of FREQUENCIES) out[f] = { done: 0, total: 0 };
    for (const a of tracked) {
      if (!available(a)) continue;
      out[a.frequency].total += 1;
      if (count(a) >= a.max) out[a.frequency].done += 1;
    }
    return out;
  }, [tracked, count, available]);

  const groups = useMemo(() => {
    const out: { id: string; name: string; items: Tracked[] }[] = [];
    const byId = new Map<string, (typeof out)[number]>();
    for (const c of view.categories) {
      const g = { id: c.id, name: c.name, items: [] as Tracked[] };
      byId.set(c.id, g);
      out.push(g);
    }
    for (const a of tracked) {
      if (filter !== "all" && a.frequency !== filter) continue;
      if (state?.hideDone && count(a) >= a.max) continue;
      const gid = a.custom ? `custom:${a.category}` : a.category;
      let g = byId.get(gid);
      if (!g) {
        g = {
          id: gid,
          name: a.category || L("myActivities", "My activities"),
          items: [],
        };
        byId.set(gid, g);
        out.push(g);
      }
      g.items.push(a);
    }
    return out.filter((g) => g.items.length);
  }, [view.categories, tracked, filter, state?.hideDone, count, L]);

  const setCount = (a: Tracked, n: number) =>
    update((s) =>
      setActivityCount(s, a.id, Math.max(0, Math.min(n, a.max)), Date.now()),
    );

  const duration = (ms: number) => {
    const { d, h, m, s } = splitDuration(ms);
    if (d) return L("durationDH", "{{d}}d {{h}}h", { d: `${d}`, h: `${h}` });
    if (h) return L("durationHM", "{{h}}h {{m}}m", { h: `${h}`, m: `${m}` });
    return L("durationMS", "{{m}}m {{s}}s", { m: `${m}`, s: `${s}` });
  };
  const localTime = (at: number) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(at);

  /** "Resets 00:00 server time" / "Resets Friday 05:00 server time". */
  const resetHint = (a: Tracked) => {
    const r = view.reset;
    const h = a.reset?.hour ?? region.dailyHour ?? r.dailyHour;
    const m =
      a.reset?.minute ??
      (a.reset?.hour !== undefined
        ? 0
        : (region.dailyMinute ?? r.dailyMinute ?? 0));
    const time = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(Date.UTC(2026, 0, 1, h, m));
    const day =
      a.frequency === "weekly"
        ? new Intl.DateTimeFormat(locale, {
            weekday: "long",
            timeZone: "UTC",
          }).format(
            Date.UTC(2026, 0, 4 + (a.reset?.weeklyDay ?? r.weeklyDay)),
          ) + " "
        : "";
    return L("resetsAt", "Resets {{time}} server time", { time: day + time });
  };

  const freqLabel = (f: ActivityFrequency) =>
    L(`freq.${f}`, f[0].toUpperCase() + f.slice(1));

  const exportFile = () => {
    if (!state) return;
    const blob = new Blob([exportActivitiesJson(view.game, state)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${view.game}-activities.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const importText = (text: string) => {
    try {
      const incoming = parseActivitiesJson(text, view.game);
      if (
        !confirm(
          L(
            "importConfirm",
            "Replace your current tracker data with the file?",
          ),
        )
      ) {
        return;
      }
      update(() => incoming);
      setMessage(L("imported", "Progress imported."));
    } catch (err) {
      if (err instanceof ActivitiesImportError && err.reason === "wrong-game") {
        setMessage(
          L("importWrongGame", "That file is from another game ({{game}}).", {
            game: err.game ?? "",
          }),
        );
      } else {
        setMessage(L("importInvalid", "That is not a tracker file."));
      }
    }
  };

  const characterName = (c: { id: string; name: string }, i: number) =>
    c.name ||
    (i === 0
      ? L("mainCharacter", "Main")
      : L("characterN", "Character {{n}}", { n: `${i + 1}` }));

  const hiddenBuiltIns = view.activities.filter((a) =>
    state?.hidden.includes(a.id),
  );

  return (
    <div className="space-y-4 text-left">
      {!storageOk && (
        <p className="rounded border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-red-200">
          {L(
            "storageOff",
            "Your browser blocks local storage, so progress will not be saved.",
          )}
        </p>
      )}

      <section className="space-y-3 rounded border border-slate-800 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-end gap-3">
          {view.regions.length > 1 && (
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              {L("region", "Server region")}
              <select
                className={INPUT}
                value={region.id}
                onChange={(e) =>
                  update((s) => ({ ...s, region: e.target.value }))
                }
              >
                {view.regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <CharacterPicker
            state={state}
            update={update}
            L={L}
            characterName={characterName}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          {usedFrequencies.map((f) => (
            <div
              key={f}
              className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="text-xs text-muted-foreground">
                  {L(`${f}Reset`, `${freqLabel(f)} reset`)}
                </span>
                <span
                  className="font-mono text-sm tabular-nums text-slate-100"
                  suppressHydrationWarning
                >
                  {resets && now !== null
                    ? L("resetIn", "in {{time}}", {
                        time: duration(resets.next[f] - now),
                      })
                    : "…"}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 text-xs text-muted-foreground">
                <span suppressHydrationWarning>
                  {resets
                    ? L("resetAtLocal", "{{time}} your time", {
                        time: localTime(resets.next[f]),
                      })
                    : ""}
                </span>
                <span>
                  {L("doneCount", "{{done}}/{{total}} done", {
                    done: `${totals[f].done}`,
                    total: `${totals[f].total}`,
                  })}
                </span>
              </div>
              <div className="mt-1.5">
                <Bar done={totals[f].done} total={totals[f].total} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={CHIP(filter === "all")}
          onClick={() => setFilter("all")}
        >
          {L("all", "All")}
        </button>
        {usedFrequencies.map((f) => (
          <button
            key={f}
            type="button"
            className={CHIP(filter === f)}
            onClick={() => setFilter(f)}
          >
            {freqLabel(f)}
          </button>
        ))}
        <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs text-slate-300">
          <input
            type="checkbox"
            className="accent-amber-500"
            checked={state?.hideDone ?? false}
            onChange={(e) =>
              update((s) => ({ ...s, hideDone: e.target.checked }))
            }
          />
          {L("hideDone", "Hide completed")}
        </label>
      </div>

      <div className="space-y-3">
        {groups.map((g) => {
          const collapsed = state?.collapsed.includes(g.id) ?? false;
          const avail = g.items.filter(available);
          const done = avail.filter((a) => count(a) >= a.max).length;
          return (
            <section
              key={g.id}
              className="rounded border border-slate-800 bg-slate-900/30"
            >
              <button
                type="button"
                aria-expanded={!collapsed}
                onClick={() =>
                  update((s) => ({
                    ...s,
                    collapsed: collapsed
                      ? s.collapsed.filter((c) => c !== g.id)
                      : [...s.collapsed, g.id],
                  }))
                }
                className="flex w-full items-center gap-2 px-3 py-2 text-left"
              >
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    collapsed ? "-rotate-90" : ""
                  }`}
                />
                <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {g.name}
                </h3>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {done}/{avail.length}
                </span>
                <span className="hidden w-24 sm:block">
                  <Bar done={done} total={avail.length} />
                </span>
              </button>
              {!collapsed && (
                <ul className="space-y-1 px-2 pb-2">
                  {g.items.map((a) => (
                    <Row
                      key={a.id}
                      activity={a}
                      n={count(a)}
                      available={available(a)}
                      onSet={(n) => setCount(a, n)}
                      onHide={() =>
                        update((s) =>
                          a.custom
                            ? {
                                ...s,
                                custom: s.custom.filter((c) => c.id !== a.id),
                              }
                            : { ...s, hidden: [...s.hidden, a.id] },
                        )
                      }
                      freqLabel={freqLabel}
                      L={L}
                      locale={locale}
                      resetHint={a.reset ? resetHint(a) : undefined}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <section className="space-y-3 border-t border-slate-800 pt-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={BUTTON}
            onClick={() => setShowAdd((v) => !v)}
          >
            <Plus className="h-4 w-4" />
            {L("addCustom", "Add your own activity")}
          </button>
          {hiddenBuiltIns.length > 0 && (
            <button
              type="button"
              className={BUTTON}
              onClick={() => setShowHidden((v) => !v)}
            >
              <EyeOff className="h-4 w-4" />
              {L("hiddenCount", "Hidden activities ({{count}})", {
                count: `${hiddenBuiltIns.length}`,
              })}
            </button>
          )}
          <button type="button" className={BUTTON} onClick={exportFile}>
            <Download className="h-4 w-4" />
            {L("export", "Export")}
          </button>
          <button
            type="button"
            className={BUTTON}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {L("import", "Import")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) importText(await file.text());
            }}
          />
          {usedFrequencies.map((f) => (
            <button
              key={f}
              type="button"
              className={BUTTON}
              onClick={() => {
                if (
                  confirm(
                    L(
                      "clearConfirm",
                      "Clear all {{frequency}} progress of this character now?",
                      {
                        frequency: freqLabel(f),
                      },
                    ),
                  )
                ) {
                  update((s) =>
                    clearFrequency(
                      s,
                      (id) => tracked.find((a) => a.id === id)?.frequency,
                      f,
                    ),
                  );
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              {L("clearFrequency", "Clear {{frequency}}", {
                frequency: freqLabel(f),
              })}
            </button>
          ))}
        </div>
        {message && (
          <p className="text-xs text-amber-300" role="status">
            {message}
          </p>
        )}
        {showHidden && hiddenBuiltIns.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {hiddenBuiltIns.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className={BUTTON}
                  title={L("restore", "Show again")}
                  onClick={() =>
                    update((s) => ({
                      ...s,
                      hidden: s.hidden.filter((h) => h !== a.id),
                    }))
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  {a.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {showAdd && (
          <AddCustom
            L={L}
            freqLabel={freqLabel}
            frequencies={usedFrequencies.length ? usedFrequencies : ["daily"]}
            exists={(name) =>
              tracked.some(
                (a) =>
                  a.id === customActivityId(name) ||
                  a.name.toLowerCase() === name.trim().toLowerCase(),
              )
            }
            onAdd={(c) => {
              update((s) => ({ ...s, custom: [...s.custom, c] }));
              setShowAdd(false);
            }}
          />
        )}
      </section>
    </div>
  );
}

function Row({
  activity: a,
  n,
  available,
  onSet,
  onHide,
  freqLabel,
  L,
  locale,
  resetHint,
}: {
  resetHint?: string;
  activity: Tracked;
  n: number;
  available: boolean;
  onSet: (n: number) => void;
  onHide: () => void;
  freqLabel: (f: ActivityFrequency) => string;
  L: ReturnType<typeof useL>;
  locale: string;
}) {
  const done = n >= a.max;
  const days = a.days?.length
    ? a.days
        .map((d) =>
          new Intl.DateTimeFormat(locale, {
            weekday: "short",
            timeZone: "UTC",
          }).format(Date.UTC(2026, 0, 4 + d)),
        )
        .join(", ")
    : null;
  return (
    <li
      className={`flex items-center gap-2 rounded border px-2 py-1.5 transition-colors ${
        done
          ? "border-amber-700/40 bg-amber-950/20"
          : "border-slate-800 bg-slate-900/40"
      } ${available ? "" : "opacity-50"}`}
    >
      {a.max === 1 ? (
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={
            done
              ? L("markUndone", "Mark {{name}} as not done", { name: a.name })
              : L("markDone", "Mark {{name}} as done", { name: a.name })
          }
          onClick={() => onSet(done ? 0 : 1)}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border ${
            done
              ? "border-amber-500 bg-amber-500 text-slate-950"
              : "border-slate-600 bg-slate-950"
          }`}
        >
          {done && <Check className="h-4 w-4" strokeWidth={3} />}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() =>
          a.max === 1 ? onSet(done ? 0 : 1) : !done && onSet(n + 1)
        }
        className="min-w-0 flex-1 text-left"
        tabIndex={a.max === 1 ? -1 : 0}
      >
        <span
          className={`block truncate text-sm ${
            done ? "text-muted-foreground line-through" : "text-slate-100"
          }`}
        >
          {a.name}
        </span>
        {(a.desc || days || resetHint) && (
          <span className="block truncate text-xs text-muted-foreground">
            {[
              a.desc,
              resetHint,
              days &&
                (available
                  ? L("availableOn", "Available: {{days}}", { days })
                  : L("notToday", "Not today ({{days}})", { days })),
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        )}
      </button>
      <span
        className={`hidden shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide sm:block ${FREQ_STYLE[a.frequency]}`}
      >
        {freqLabel(a.frequency)}
      </span>
      {a.max > 1 && (
        <span className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className={ICON_BUTTON}
            disabled={n === 0}
            aria-label={L("decrease", "Remove one from {{name}}", {
              name: a.name,
            })}
            onClick={() => onSet(n - 1)}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span
            className={`w-12 text-center font-mono text-sm tabular-nums ${
              done ? "text-amber-300" : "text-slate-200"
            }`}
          >
            {n}/{a.max}
          </span>
          <button
            type="button"
            className={ICON_BUTTON}
            disabled={done}
            aria-label={L("increase", "Add one to {{name}}", { name: a.name })}
            onClick={() => onSet(n + 1)}
          >
            <Plus className="h-4 w-4" />
          </button>
        </span>
      )}
      <button
        type="button"
        className="inline-flex h-8 w-7 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-800 hover:text-slate-200"
        title={
          a.custom
            ? L("removeCustom", "Delete {{name}}", { name: a.name })
            : L("hide", "Hide {{name}}", { name: a.name })
        }
        aria-label={
          a.custom
            ? L("removeCustom", "Delete {{name}}", { name: a.name })
            : L("hide", "Hide {{name}}", { name: a.name })
        }
        onClick={() => {
          if (
            !a.custom ||
            confirm(
              L("removeCustom", "Delete {{name}}", { name: a.name }) + "?",
            )
          ) {
            onHide();
          }
        }}
      >
        {a.custom ? (
          <Trash2 className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </button>
    </li>
  );
}

function CharacterPicker({
  state,
  update,
  L,
  characterName,
}: {
  state: ActivitiesState | null;
  update: (fn: (s: ActivitiesState) => ActivitiesState) => void;
  L: ReturnType<typeof useL>;
  characterName: (c: { id: string; name: string }, i: number) => string;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const characters = state?.characters ?? emptyActivitiesState().characters;
  const active = state?.active ?? characters[0].id;
  const activeIndex = Math.max(
    0,
    characters.findIndex((c) => c.id === active),
  );
  return (
    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
      <span>{L("character", "Character")}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {characters.length > 1 && (
          <select
            className={INPUT}
            value={active}
            aria-label={L("character", "Character")}
            onChange={(e) => update((s) => ({ ...s, active: e.target.value }))}
          >
            {characters.map((c, i) => (
              <option key={c.id} value={c.id}>
                {characterName(c, i)}
              </option>
            ))}
          </select>
        )}
        {characters.length === 1 && !adding && (
          <span className="text-sm text-slate-200">
            {characterName(characters[0], 0)}
          </span>
        )}
        {adding ? (
          <form
            className="flex items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              const id = `c${Date.now().toString(36)}`;
              update((s) => addCharacter(s, name, id));
              setName("");
              setAdding(false);
            }}
          >
            <input
              autoFocus
              className={INPUT}
              maxLength={40}
              placeholder={L("characterName", "Character name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit" className={BUTTON}>
              {L("add", "Add")}
            </button>
            <button
              type="button"
              className={BUTTON}
              onClick={() => setAdding(false)}
            >
              {L("cancel", "Cancel")}
            </button>
          </form>
        ) : (
          <button
            type="button"
            className={BUTTON}
            onClick={() => setAdding(true)}
          >
            <UserPlus className="h-4 w-4" />
            {L("addCharacter", "Add character")}
          </button>
        )}
        {characters.length > 1 && !adding && (
          <button
            type="button"
            className={BUTTON}
            onClick={() => {
              const c = characters[activeIndex];
              if (
                confirm(
                  L(
                    "removeCharacterConfirm",
                    "Remove {{name}} and its progress?",
                    {
                      name: characterName(c, activeIndex),
                    },
                  ),
                )
              ) {
                update((s) => removeCharacter(s, c.id));
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            {L("removeCharacter", "Remove character")}
          </button>
        )}
      </div>
    </div>
  );
}

function AddCustom({
  L,
  freqLabel,
  frequencies,
  exists,
  onAdd,
}: {
  L: ReturnType<typeof useL>;
  freqLabel: (f: ActivityFrequency) => string;
  frequencies: ActivityFrequency[];
  exists: (name: string) => boolean;
  onAdd: (c: {
    id: string;
    name: string;
    category: string;
    max: number;
    frequency: ActivityFrequency;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [max, setMax] = useState(1);
  const [frequency, setFrequency] = useState<ActivityFrequency>(frequencies[0]);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid gap-2 rounded border border-slate-800 bg-slate-900/40 p-3 sm:grid-cols-[2fr_1.5fr_6rem_8rem_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const clean = name.trim();
        if (!clean) return;
        if (exists(clean)) {
          setError(
            L("customExists", "An activity with this name already exists."),
          );
          return;
        }
        onAdd({
          id: customActivityId(clean),
          name: clean.slice(0, 120),
          category: category.trim().slice(0, 120),
          max: Math.max(1, Math.min(10_000, Math.floor(max) || 1)),
          frequency,
        });
      }}
    >
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        {L("customName", "Name")}
        <input
          required
          className={INPUT}
          value={name}
          maxLength={120}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        {L("customCategory", "Group")}
        <input
          className={INPUT}
          value={category}
          maxLength={120}
          placeholder={L("myActivities", "My activities")}
          onChange={(e) => setCategory(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        {L("customMax", "Times")}
        <input
          type="number"
          min={1}
          max={10000}
          className={INPUT}
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        {L("customFrequency", "Resets")}
        <select
          className={INPUT}
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as ActivityFrequency)}
        >
          {(["daily", "weekly", "monthly"] as ActivityFrequency[]).map((f) => (
            <option key={f} value={f}>
              {freqLabel(f)}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className={`${BUTTON} justify-center`}>
        <Plus className="h-4 w-4" />
        {L("add", "Add")}
      </button>
      {error && (
        <p className="text-xs text-red-300 sm:col-span-5" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
