"use client";

import { useMemo, useState } from "react";

/** Shape of public/heartopia/config/weather.json (data-forge `weather` component). */
export type WeatherData = {
  types: Record<
    string,
    { names: Record<string, string>; cat: string; special: boolean }
  >;
  calendar: { m: number; d: number; h: number[] }[];
};

// Weather category → emoji + accent. Emoji keeps it locale-independent and needs no icon pipeline.
const CAT: Record<string, { emoji: string; ring: string }> = {
  clear: { emoji: "☀️", ring: "" },
  cloud: { emoji: "☁️", ring: "" },
  lucky: { emoji: "🍀", ring: "ring-1 ring-amber-500/60" },
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
  "lucky",
] as const;

export function WeatherForecast({
  data,
  locale,
  labels,
}: {
  data: WeatherData;
  locale: string;
  labels: { title: string; hourly: string; special: string; find: string };
}) {
  const [day, setDay] = useState(0);
  const cur = data.calendar[day];

  const name = (wid: number) => {
    const t = data.types[String(wid)];
    if (!t) return String(wid);
    return t.names[locale] ?? t.names.en ?? String(wid);
  };
  const meta = (wid: number) =>
    CAT[data.types[String(wid)]?.cat ?? "other"] ?? CAT.other;

  // Month → first calendar index (for the quick-jump row).
  const monthStart = useMemo(() => {
    const m = new Map<number, number>();
    data.calendar.forEach((c, i) => {
      if (!m.has(c.m)) m.set(c.m, i);
    });
    return m;
  }, [data.calendar]);
  const months = [...monthStart.keys()].sort((a, b) => a - b);

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
      if (data.calendar[i].h.some((w) => data.types[String(w)]?.cat === cat)) {
        setDay(i);
        return;
      }
    }
  };

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

      {/* Day navigation */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            type="button"
            onClick={() =>
              setDay(
                (d) => (d - 1 + data.calendar.length) % data.calendar.length,
              )
            }
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent"
            aria-label="Previous day"
          >
            ←
          </button>
          <div className="text-center">
            <div className="text-lg font-bold">
              Month {cur.m} · Day {cur.d}
            </div>
            <div className="text-xs text-muted-foreground">
              {day + 1} / {data.calendar.length}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDay((d) => (d + 1) % data.calendar.length)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent"
            aria-label="Next day"
          >
            →
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {months.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setDay(monthStart.get(m)!)}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                cur.m === m
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              M{m}
            </button>
          ))}
        </div>
        {daySpecials.length > 0 && (
          <p className="mt-3 text-xs text-amber-400">
            {labels.special}: {daySpecials.map((c) => CAT[c]?.emoji).join(" ")}
          </p>
        )}
      </div>

      {/* 24-hour timeline */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          {labels.hourly}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {cur.h.map((wid, hour) => {
            const m = meta(wid);
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
                  <div className="truncate text-sm">{name(wid)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
