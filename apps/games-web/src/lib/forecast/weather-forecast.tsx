"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

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
    }
  >;
  calendar: { m: number; d: number; h: number[] }[];
};

// Weather category → emoji + accent. Emoji keeps it locale-independent and needs no icon pipeline.
const CAT: Record<string, { emoji: string; ring: string }> = {
  clear: { emoji: "☀️", ring: "" },
  cloud: { emoji: "☁️", ring: "" },
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

// Special weathers players hunt (rare fish/bugs/ores gate on them) — surfaced as "find next" jumps.
const SPECIAL_CATS = [
  "meteor",
  "rainbow",
  "aurora",
  "storm",
  "sunshower",
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
  rain: 3,
  snow: 3,
  other: 2,
  cloud: 0,
  clear: 0,
};

/** The four 6-hour windows the in-game forecast panel is built around. */
const SLOT_STARTS = [0, 6, 12, 18] as const;

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
  };
}) {
  const today = useSyncExternalStore(subscribeNoop, todayKey, () => 0);
  const year = today ? Math.floor(today / 10000) : new Date().getFullYear();

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
            const special = c.h.some((w) => data.types[String(w)]?.special);
            const slots = slotSummary(c.h);
            return (
              <button
                key={c.i}
                type="button"
                onClick={() => select(c.i)}
                aria-pressed={isSel}
                title={slots
                  .map((s, k) => `${SLOT_STARTS[k]}:00 ${name(s.wid, s.hour)}`)
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
                <span className="mt-auto grid grid-cols-2 gap-x-0.5 gap-y-1 text-xs leading-none sm:flex sm:flex-wrap sm:gap-y-0 sm:text-base">
                  {slots.map((s, k) => (
                    <span key={k}>{meta(s.wid, s.hour).emoji}</span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{labels.slots}</p>
      </div>

      {/* Selected day: 24-hour timeline */}
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
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          {labels.hourly}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {cur.h.map((wid, hour) => {
            const m = meta(wid, hour);
            return (
              <div
                key={hour}
                className={`flex items-center gap-2 rounded-md bg-background px-2.5 py-2 ${m.ring}`}
              >
                <span className="text-xl leading-none">{m.emoji}</span>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  <div className="truncate text-sm">{name(wid, hour)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
