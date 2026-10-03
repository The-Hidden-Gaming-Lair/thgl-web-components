"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { localizePath } from "@repo/lib";

/** Shape of public/heartopia/config/daily-rares.json (data-forge `dailyRares` component). */
export type DailyRaresData = {
  /** Loop day 1 (YYYY-MM-DD); the loop repeats every `period` days from here. */
  start: string;
  period: number;
  /** Map title the candidate spots are plotted on (map route segment). */
  map: string;
  types: Record<
    string,
    {
      /** Active spot per loop day (map-entity point id). */
      loop: number[];
      spots: Record<string, { label: string; area: Record<string, string> }>;
    }
  >;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const ROWS = 7;

// Local calendar day as a UTC-midnight timestamp, via useSyncExternalStore so the server render
// (no date) and the client never disagree during hydration (same as the weather forecast).
const subscribeNoop = () => () => {};
const todayUtc = () => {
  const n = new Date();
  return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
};

function formatDay(locale: string, t: number) {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  };
  try {
    return new Intl.DateTimeFormat(locale, opts).format(t);
  } catch {
    return new Intl.DateTimeFormat("en", opts).format(t);
  }
}

export function DailyRares({
  data,
  locale,
  labels,
}: {
  data: DailyRaresData;
  locale: string;
  labels: {
    title: string;
    intro: string;
    today: string;
    date: string;
    near: string;
    reset: string;
    /** type id → column header */
    types: Record<string, string>;
  };
}) {
  const today = useSyncExternalStore(subscribeNoop, todayUtc, () => 0);
  const [offset, setOffset] = useState(0); // in weeks from today
  if (!today) return null;

  const [y, m, d] = data.start.split("-").map(Number);
  const start = Date.UTC(y, m - 1, d);
  const loopDay = (t: number) => {
    const n = Math.round((t - start) / DAY_MS) % data.period;
    return n < 0 ? n + data.period : n;
  };
  const first = today + offset * ROWS * DAY_MS;
  const days = Array.from({ length: ROWS }, (_, i) => first + i * DAY_MS);
  const typeIds = Object.keys(labels.types).filter((t) => data.types[t]);

  const spotHref = (type: string, pointId: number) => {
    const node = encodeURIComponent(`${type}@${pointId}`);
    return localizePath(
      `/maps/${encodeURIComponent(data.map)}/${type}/${node}?id=${node}`,
      locale,
    );
  };

  const navBtn =
    "rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-40";

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <button
          type="button"
          onClick={() => setOffset(offset - 1)}
          className={navBtn}
          aria-label="Previous week"
        >
          ←
        </button>
        <div className="text-center">
          <div className="text-lg font-bold">{labels.title}</div>
          {offset !== 0 && (
            <button
              type="button"
              onClick={() => setOffset(0)}
              className="text-xs text-amber-400 hover:underline"
            >
              {labels.today}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOffset(offset + 1)}
          className={navBtn}
          aria-label="Next week"
        >
          →
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{labels.intro}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-1.5 pr-3 font-semibold">{labels.date}</th>
              {typeIds.map((t) => (
                <th key={t} className="py-1.5 pr-3 font-semibold">
                  {labels.types[t]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((t) => {
              const isToday = t === today;
              const ld = loopDay(t);
              return (
                <tr
                  key={t}
                  className={`border-t border-border ${isToday ? "bg-amber-500/10" : ""}`}
                >
                  <td
                    className={`py-2 pr-3 whitespace-nowrap capitalize ${isToday ? "font-bold text-amber-400" : ""}`}
                  >
                    {formatDay(locale, t)}
                    {isToday && (
                      <span className="ml-1.5 text-xs font-normal">
                        ({labels.today})
                      </span>
                    )}
                  </td>
                  {typeIds.map((type) => {
                    const pointId = data.types[type].loop[ld];
                    const spot = data.types[type].spots[pointId];
                    const area = spot?.area[locale] ?? spot?.area.en;
                    return (
                      <td key={type} className="py-2 pr-3">
                        <Link
                          href={spotHref(type, pointId)}
                          className="hover:text-amber-400 hover:underline"
                        >
                          <span className="font-semibold tabular-nums">
                            {spot?.label ?? pointId}
                          </span>
                          {area && (
                            <span className="text-muted-foreground">
                              {" "}
                              · {labels.near} {area}
                            </span>
                          )}
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{labels.reset}</p>
    </div>
  );
}
