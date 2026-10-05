"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  activitiesStorageKey,
  formatUtcOffset,
  guessRegion,
  parseActivitiesState,
} from "@repo/lib";

/** Shape of public/heartopia/config/weather.json (data-forge `weather` component). */
export type WeatherData = {
  types: Record<
    string,
    {
      names: Record<string, string>;
      /** The game's night-time label when it differs (Sunny→Clear, Rainbow→Moon Rainbow). */
      namesNight?: Record<string, string>;
      cat: string;
      special: boolean;
      /** Game weather class (1 clear, 2 rain, 3 rainbow, 4 snow) — what fish/bug gating refers to. */
      cls?: number;
      /** 1–3 for meteor showers / auroras: the game draws a different icon per variant. */
      variant?: number;
    }
  >;
  calendar: { m: number; d: number; h: number[] }[];
  /** The game's four day phases (Dawn 0, Morning 6, Afternoon 12, Evening 18), localized. */
  phases?: { b: number; names: Record<string, string> }[];
};

// Weather category → emoji + accent. Emoji keeps it locale-independent and needs no icon pipeline.
const CAT: Record<string, { emoji: string; ring: string }> = {
  clear: { emoji: "☀️", ring: "" },
  cloud: { emoji: "☁️", ring: "" },
  heat: { emoji: "🔥", ring: "" },
  petal: { emoji: "🌸", ring: "" },
  meteor: { emoji: "☄️", ring: "ring-1 ring-amber-500/60" },
  aurora: { emoji: "🌌", ring: "ring-1 ring-amber-500/60" },
  sunshower: { emoji: "🌦️", ring: "ring-1 ring-amber-500/60" },
  rain: { emoji: "🌧️", ring: "" },
  storm: { emoji: "⛈️", ring: "ring-1 ring-amber-500/60" },
  snow: { emoji: "❄️", ring: "" },
  rainbow: { emoji: "🌈", ring: "ring-1 ring-amber-500/60" },
  other: { emoji: "🌫️", ring: "" },
};

// Weathers players hunt (rare fish/bugs/ores gate on them, seasonal events need snow/heat/petals)
// — surfaced as "find next" jumps. A category without a type in the data renders no button.
const SPECIAL_CATS = [
  "meteor",
  "rainbow",
  "aurora",
  "sunshower",
  "snow",
  "heat",
  "petal",
] as const;

// Which weather represents a 6-hour slot in the month grid: the rarest / most useful thing in the
// window wins over the background sky, so a rainbow afternoon reads as 🌈 even if it was sunny
// for four of the six hours. Clear and cloudy share a rank: between them the majority of the
// window decides (a single cloudy hour must not turn a sunny morning into ☁️).
const CAT_RANK: Record<string, number> = {
  meteor: 9,
  aurora: 8,
  rainbow: 7,
  sunshower: 6,
  storm: 5,
  petal: 4,
  heat: 4,
  rain: 3,
  snow: 3,
  other: 2,
  cloud: 0,
  clear: 0,
};

/** The four 6-hour windows the in-game forecast panel is built around. */
const SLOT_STARTS = [0, 6, 12, 18] as const;

/** English fallback for the game's day phases when the data ships without them. */
const PHASE_FALLBACK = ["Dawn", "Morning", "Afternoon", "Evening"];

/** In-game night = 18:00–05:59 (the weather panel shows moon icons for its 6pm and 12am slots). */
const isNightHour = (hour: number) => hour >= 18 || hour < 6;

// The game's calendar is a leap-year template (Jan 1 – Dec 31 incl. Feb 29) that lines up with
// real-world dates (in-game "Tuesday, September 1st" = 2026-09-01), so the page renders it as the
// current real year; Feb 29 is skipped in non-leap years.
const isLeapYear = (y: number) =>
  (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Real date for a calendar day, or null when it does not exist this year (Feb 29). */
function toDate(year: number, m: number, d: number): Date | null {
  const date = new Date(year, m - 1, d);
  return date.getMonth() === m - 1 ? date : null;
}

// "Today" via useSyncExternalStore so the server render (no date) and the client (local date)
// never disagree during hydration; the client re-renders with its own date right after.
const subscribeNoop = () => () => {};
const todayKey = () => {
  const n = new Date();
  return n.getFullYear() * 10000 + (n.getMonth() + 1) * 100 + n.getDate();
};

/** A game server and its fixed clock (from the game's `config/activities.json` regions). */
export type ForecastServer = {
  id: string;
  label: string;
  utcOffsetMinutes: number;
};

/** Opt-in "also show my local time" (the forecast stays in server time, the way players talk). */
type LocalTimePref = { on: boolean; server?: string };
const localTimeKey = (game: string) => `thgl-forecast-local-time:${game}`;

const pad2 = (n: number) => String(n).padStart(2, "0");

function formatDate(
  locale: string,
  date: Date,
  opts: Intl.DateTimeFormatOptions,
) {
  try {
    return new Intl.DateTimeFormat(locale, opts).format(date);
  } catch {
    return new Intl.DateTimeFormat("en", opts).format(date);
  }
}

export function WeatherForecast({
  data,
  locale,
  labels,
  game,
  servers = [],
}: {
  data: WeatherData;
  locale: string;
  labels: {
    title: string;
    hourly: string;
    special: string;
    find: string;
    today: string;
    slots: string;
    variants: string;
    localTime: string;
    localTimeHint: string;
    server: string;
    yourTime: string;
  };
  /** Tenant id: keys the saved local-time preference. */
  game: string;
  /** The game's servers; without them the local-time toggle is not shown. */
  servers?: ForecastServer[];
}) {
  const today = useSyncExternalStore(subscribeNoop, todayKey, () => 0);
  const year = today ? Math.floor(today / 10000) : new Date().getFullYear();

  // Local-time preference, read after hydration. Default server: the one picked in the
  // activities tracker, else the one closest to the viewer's clock (same guess as the tracker).
  const [localPref, setLocalPref] = useState<LocalTimePref>({ on: false });
  const [guessedServer, setGuessedServer] = useState<string | undefined>();
  useEffect(() => {
    if (!servers.length) return;
    try {
      const saved = JSON.parse(
        localStorage.getItem(localTimeKey(game)) ?? "null",
      ) as Partial<LocalTimePref> | null;
      if (saved && typeof saved === "object")
        setLocalPref({
          on: saved.on === true,
          server: typeof saved.server === "string" ? saved.server : undefined,
        });
      const tracker = parseActivitiesState(
        localStorage.getItem(activitiesStorageKey(game)),
      )?.region;
      const now = Date.now();
      setGuessedServer(
        servers.some((s) => s.id === tracker)
          ? tracker
          : guessRegion(
              servers.map((s) => ({ ...s, name: s.label })),
              -new Date(now).getTimezoneOffset(),
              now,
              Intl.DateTimeFormat().resolvedOptions().timeZone,
            ).id,
      );
    } catch {
      // Storage blocked: the toggle still works for this visit.
    }
  }, [game, servers]);
  const updateLocalPref = (next: LocalTimePref) => {
    setLocalPref(next);
    try {
      localStorage.setItem(localTimeKey(game), JSON.stringify(next));
    } catch {
      // ignore
    }
  };
  const server =
    servers.find((s) => s.id === (localPref.server ?? guessedServer)) ??
    servers[0];

  // (m*100+d) → calendar index.
  const indexByDay = useMemo(() => {
    const map = new Map<number, number>();
    data.calendar.forEach((c, i) => map.set(c.m * 100 + c.d, i));
    return map;
  }, [data.calendar]);
  const todayIndex = today ? (indexByDay.get(today % 10000) ?? null) : null;

  const [selected, setSelected] = useState<number | null>(null);
  const [viewMonth, setViewMonth] = useState<number | null>(null);
  const day = selected ?? todayIndex ?? 0;
  const cur = data.calendar[day];
  const month = viewMonth ?? cur.m;

  const select = (i: number) => {
    setSelected(i);
    setViewMonth(null); // the grid follows the selected day
  };

  const name = (wid: number, hour?: number) => {
    const t = data.types[String(wid)];
    if (!t) return String(wid);
    const names =
      hour !== undefined && isNightHour(hour) && t.namesNight
        ? t.namesNight
        : t.names;
    return names[locale] ?? names.en ?? t.names.en ?? String(wid);
  };
  const catOf = (wid: number) => data.types[String(wid)]?.cat ?? "other";
  const meta = (wid: number, hour?: number) => {
    const cat = catOf(wid);
    const m = CAT[cat] ?? CAT.other;
    // Clear night sky: the game shows a moon for its 6pm/12am slots.
    if (cat === "clear" && hour !== undefined && isNightHour(hour))
      return { ...m, emoji: "🌙" };
    return m;
  };

  // Localized name of the 6-hour window starting at `start` (the game's own day phases).
  const phaseName = (k: number) => {
    const p = data.phases?.find((x) => x.b === SLOT_STARTS[k]);
    return p?.names[locale] ?? p?.names.en ?? PHASE_FALLBACK[k];
  };

  // One representative weather per 6-hour slot (see CAT_RANK): highest rank in the window, ties
  // broken by how many hours that category covers, then by the earliest hour.
  const slotSummary = (hours: number[]) =>
    SLOT_STARTS.map((start) => {
      const count = new Map<string, number>();
      for (let h = start; h < start + 6; h++) {
        const wid = hours[h];
        if (wid === undefined) continue;
        const cat = catOf(wid);
        count.set(cat, (count.get(cat) ?? 0) + 1);
      }
      let best: { wid: number; hour: number; rank: number; n: number } | null =
        null;
      for (let h = start; h < start + 6; h++) {
        const wid = hours[h];
        if (wid === undefined) continue;
        const cat = catOf(wid);
        const rank = CAT_RANK[cat] ?? 2;
        const n = count.get(cat) ?? 0;
        if (!best || rank > best.rank || (rank === best.rank && n > best.n))
          best = { wid, hour: h, rank, n };
      }
      return best ?? { wid: hours[start], hour: start };
    });

  // Month grid: Monday-first weeks, leading blanks for the first weekday of the month.
  const monthCells = useMemo(() => {
    const days = data.calendar
      .map((c, i) => ({ ...c, i }))
      .filter(
        (c) => c.m === month && (c.d !== 29 || c.m !== 2 || isLeapYear(year)),
      );
    const first = toDate(year, month, 1);
    const lead = first ? (first.getDay() + 6) % 7 : 0;
    return { lead, days };
  }, [data.calendar, month, year]);

  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        formatDate(locale, new Date(2024, 0, 1 + i), { weekday: "short" }),
      ), // 2024-01-01 is a Monday
    [locale],
  );

  const monthNames = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        formatDate(locale, new Date(year, i, 1), { month: "short" }),
      ),
    [locale, year],
  );

  const monthTitle = formatDate(locale, new Date(year, month - 1, 1), {
    month: "long",
    year: "numeric",
  });
  const curDate = toDate(year, cur.m, cur.d);
  const dayTitle = curDate
    ? formatDate(locale, curDate, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : `${cur.m}/${cur.d}`;

  // Which special categories appear in the current day (for the day summary).
  const daySpecials = useMemo(() => {
    const set = new Set<string>();
    for (const wid of cur.h) {
      const t = data.types[String(wid)];
      if (t?.special) set.add(t.cat);
    }
    return [...set];
  }, [cur, data.types]);

  // Server hour of the selected day → the viewer's wall clock (their own zone incl. DST; the
  // server clock is a fixed offset), with "+1d"/"−1d" when it lands on another local date.
  const localClock = (hour: number) => {
    if (!localPref.on || !server) return null;
    const at =
      Date.UTC(year, cur.m - 1, cur.d, hour) - server.utcOffsetMinutes * 60_000;
    const t = new Date(at);
    const shift = Math.round(
      (Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) -
        Date.UTC(year, cur.m - 1, cur.d)) /
        86_400_000,
    );
    return `${pad2(t.getHours())}:${pad2(t.getMinutes())}${
      shift ? ` ${shift > 0 ? "+" : "−"}${Math.abs(shift)}d` : ""
    }`;
  };
  const viewerOffset = useSyncExternalStore(
    subscribeNoop,
    () => -new Date().getTimezoneOffset(),
    () => 0,
  );

  // Whether the selected day has a weather with variants (shows the legend line).
  const hasVariants = cur.h.some((w) => data.types[String(w)]?.variant);

  // Jump to the next day (wrapping) whose hours contain the given category.
  const findNext = (cat: string) => {
    const n = data.calendar.length;
    for (let step = 1; step <= n; step++) {
      const i = (day + step) % n;
      if (data.calendar[i].h.some((w) => catOf(w) === cat)) {
        select(i);
        return;
      }
    }
  };

  const navBtn =
    "rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent";

  return (
    <div className="space-y-6">
      {/* Find-next special weather */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          {labels.find}
        </p>
        <div className="flex flex-wrap gap-2">
          {SPECIAL_CATS.map((c) => {
            const sample = Object.entries(data.types).find(
              ([, t]) => t.cat === c,
            );
            if (!sample) return null;
            return (
              <button
                key={c}
                type="button"
                onClick={() => findNext(c)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:border-amber-500/60 hover:text-amber-400 transition-colors"
              >
                <span>{CAT[c]?.emoji}</span>
                <span>{name(Number(sample[0]))}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Month overview */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            type="button"
            onClick={() => setViewMonth(month === 1 ? 12 : month - 1)}
            className={navBtn}
            aria-label="Previous month"
          >
            ←
          </button>
          <div className="text-center">
            <div className="text-lg font-bold capitalize">{monthTitle}</div>
            {todayIndex !== null && (
              <button
                type="button"
                onClick={() => select(todayIndex)}
                className="text-xs text-amber-400 hover:underline"
              >
                {labels.today}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setViewMonth(month === 12 ? 1 : month + 1)}
            className={navBtn}
            aria-label="Next month"
          >
            →
          </button>
        </div>
        {/* Month jump row. The responsive column counts here and on the hourly grid are
            `!important`: the page loads the app's Tailwind build first and the prebuilt
            @repo/ui stylesheet second, and the second re-emits the base `grid-cols-*`
            utilities without the app's responsive variants, so a plain `lg:grid-cols-4`
            loses the cascade and the grid stays at its mobile column count. */}
        <div className="mb-3 grid grid-cols-6 gap-1 sm:grid-cols-12!">
          {monthNames.map((label, i) => {
            const m = i + 1;
            const active = m === month;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setViewMonth(m)}
                aria-pressed={active}
                className={`rounded-md border px-1 py-1 text-xs capitalize transition-colors ${
                  active
                    ? "border-amber-500/60 bg-amber-500/20 text-amber-400"
                    : "border-border bg-background hover:bg-accent"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekdays.map((w) => (
            <div
              key={w}
              className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground py-1"
            >
              {w}
            </div>
          ))}
          {Array.from({ length: monthCells.lead }, (_, i) => (
            <div key={`lead-${i}`} />
          ))}
          {monthCells.days.map((c) => {
            const isSel = c.i === day;
            const isToday = c.i === todayIndex;
            // Dot = the day has a weather the find-next buttons cover (snow/heat/petals too).
            const special = c.h.some((w) =>
              (SPECIAL_CATS as readonly string[]).includes(catOf(w)),
            );
            const slots = slotSummary(c.h);
            return (
              <button
                key={c.i}
                type="button"
                onClick={() => select(c.i)}
                aria-pressed={isSel}
                title={slots
                  .map((s, k) => `${phaseName(k)}: ${name(s.wid, s.hour)}`)
                  .join(" · ")}
                className={`flex min-h-[3.5rem] flex-col rounded-md border p-1 text-left transition-colors sm:min-h-[4rem] ${
                  isSel
                    ? "border-amber-500/60 bg-amber-500/20 text-amber-400"
                    : isToday
                      ? "border-amber-500/60 bg-background hover:bg-accent"
                      : "border-border bg-background hover:bg-accent"
                }`}
              >
                <span className="flex items-center justify-between text-xs tabular-nums">
                  <span className={isToday ? "font-bold" : ""}>{c.d}</span>
                  {special && (
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-amber-400"
                    />
                  )}
                </span>
                {/* `!` on the sm: utilities for the same cascade reason as the month jump row:
                    without it the base `grid` wins and desktop shows a stretched 2×2 grid. */}
                <span className="mt-auto grid grid-cols-2 gap-x-0.5 gap-y-1 text-xs leading-none sm:flex! sm:flex-wrap! sm:gap-0.5! sm:text-base!">
                  {slots.map((s, k) => {
                    const cat = catOf(s.wid);
                    // Plain sky (sunny/cloudy/clear night) recedes so the weathers players
                    // plan around stand out at a glance; every other weather (rain, snow,
                    // heat and petals too) gets the amber chip.
                    const plain = cat === "clear" || cat === "cloud";
                    return (
                      <span
                        key={k}
                        className={`rounded-sm px-px ${
                          plain
                            ? "opacity-35 grayscale"
                            : "bg-amber-500/25 ring-1 ring-amber-500/70"
                        }`}
                      >
                        {meta(s.wid, s.hour).emoji}
                      </span>
                    );
                  })}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {labels.slots}{" "}
          {SLOT_STARTS.map((start, k) => (
            <span key={start} className="whitespace-nowrap">
              {k > 0 && " · "}
              {phaseName(k)} {String(start).padStart(2, "0")}–
              {String(start + 6).padStart(2, "0")}
            </span>
          ))}
        </p>
      </div>

      {/* Selected day: 24-hour timeline, one column per 6-hour window (read downwards) */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            type="button"
            onClick={() =>
              select((day - 1 + data.calendar.length) % data.calendar.length)
            }
            className={navBtn}
            aria-label="Previous day"
          >
            ←
          </button>
          <div className="text-center">
            <div className="text-lg font-bold capitalize">{dayTitle}</div>
            {daySpecials.length > 0 && (
              <div className="text-xs text-amber-400">
                {labels.special}:{" "}
                {daySpecials.map((c) => CAT[c]?.emoji).join(" ")}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => select((day + 1) % data.calendar.length)}
            className={navBtn}
            aria-label="Next day"
          >
            →
          </button>
        </div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {labels.hourly}
          </p>
          {server && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <label className="inline-flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={localPref.on}
                  onChange={(e) =>
                    updateLocalPref({ ...localPref, on: e.target.checked })
                  }
                  className="accent-amber-500"
                />
                {labels.localTime}
              </label>
              {localPref.on && servers.length > 1 && (
                <label className="inline-flex items-center gap-1.5">
                  {labels.server}
                  <select
                    value={server.id}
                    onChange={(e) =>
                      updateLocalPref({ ...localPref, server: e.target.value })
                    }
                    className="rounded-md border border-border bg-background px-1.5 py-0.5 text-xs text-foreground"
                  >
                    {servers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label} ({formatUtcOffset(s.utcOffsetMinutes)})
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
        </div>
        {localPref.on && server && (
          <p className="mb-3 text-xs text-muted-foreground">
            {labels.localTimeHint
              .replace("{server}", formatUtcOffset(server.utcOffsetMinutes))
              .replace("{you}", formatUtcOffset(viewerOffset))}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4!">
          {SLOT_STARTS.map((start, k) => (
            <div key={start} className="space-y-1.5">
              <div className="flex items-baseline justify-between px-1 text-xs">
                <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                  {phaseName(k)}
                </span>
                <span className="tabular-nums text-muted-foreground/70">
                  {String(start).padStart(2, "0")}–
                  {String(start + 6).padStart(2, "0")}
                </span>
              </div>
              {cur.h.slice(start, start + 6).map((wid, j) => {
                const hour = start + j;
                const m = meta(wid, hour);
                const variant = data.types[String(wid)]?.variant;
                const local = localClock(hour);
                return (
                  <div
                    key={hour}
                    className={`flex items-center gap-2 rounded-md bg-background px-2.5 py-2 ${m.ring}`}
                  >
                    <span className="text-xl leading-none">{m.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {String(hour).padStart(2, "0")}:00
                        {local && (
                          <span
                            className="text-amber-400/80"
                            title={labels.yourTime}
                          >
                            {" · "}
                            {local} {labels.yourTime}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm">
                          {name(wid, hour)}
                        </span>
                        {variant !== undefined && (
                          <span
                            className="shrink-0 rounded bg-amber-500/20 px-1 text-[10px] font-semibold tabular-nums text-amber-400"
                            title={`${labels.variants} ${variant}`}
                          >
                            {variant}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {hasVariants && (
          <p className="mt-3 text-xs text-muted-foreground">
            {labels.variants}
          </p>
        )}
      </div>
    </div>
  );
}
