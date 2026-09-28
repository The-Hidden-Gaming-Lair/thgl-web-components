"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@repo/lib";
import { Input } from "@repo/ui/controls";
import {
  PUBLIC_STATUSES,
  STATUS_LABELS,
  type StatsGameWithSummary,
  type StatsStatus,
} from "@/lib/stats-types";
import { formatAgo, formatCount, formatPercent } from "./format";
import { StatusBadge } from "./status-badge";

type SortKey =
  | "title"
  | "steamCcu"
  | "steamPeak24h"
  | "steamPeak30d"
  | "steamTrend7d"
  | "twitchViewers"
  | "lastPatchAt"
  | "voteCount";

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: "title", label: "Game" },
  { key: "steamCcu", label: "Steam now", className: "text-right" },
  {
    key: "steamPeak24h",
    label: "24h peak",
    className: "text-right max-sm:hidden",
  },
  {
    key: "steamPeak30d",
    label: "30d peak",
    className: "text-right max-md:hidden",
  },
  {
    key: "steamTrend7d",
    label: "7d trend",
    className: "text-right max-md:hidden",
  },
  {
    key: "twitchViewers",
    label: "Twitch",
    className: "text-right max-lg:hidden",
  },
  {
    key: "lastPatchAt",
    label: "Last patch",
    className: "text-right max-lg:hidden",
  },
  { key: "voteCount", label: "Votes", className: "text-right max-sm:hidden" },
];

function sortValue(
  g: StatsGameWithSummary,
  key: SortKey,
): number | string | null {
  if (key === "title") return g.title.toLowerCase();
  if (key === "voteCount") return g.voteCount;
  return g.summary[key];
}

export function Trend({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">–</span>;
  const Icon = value >= 0 ? TrendingUp : TrendingDown;
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Icon
        className={cn(
          "h-3.5 w-3.5",
          value >= 0 ? "text-emerald-400" : "text-rose-400",
        )}
        aria-hidden
      />
      {formatPercent(value)}
    </span>
  );
}

export function StatsTable({ games }: { games: StatsGameWithSummary[] }) {
  const [status, setStatus] = useState<StatsStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({
    key: "steamCcu",
    desc: true,
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return games
      .filter((g) => status === "all" || g.status === status)
      .filter((g) => !q || g.title.toLowerCase().includes(q))
      .sort((a, b) => {
        const av = sortValue(a, sort.key);
        const bv = sortValue(b, sort.key);
        // Missing values always sink, whatever the direction.
        if (av === null && bv === null) return a.title.localeCompare(b.title);
        if (av === null) return 1;
        if (bv === null) return -1;
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sort.desc ? -cmp : cmp;
      });
  }, [games, status, query, sort]);

  const counts = useMemo(() => {
    const c: Partial<Record<StatsStatus, number>> = {};
    for (const g of games) c[g.status] = (c[g.status] ?? 0) + 1;
    return c;
  }, [games]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["all", ...PUBLIC_STATUSES] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              status === s
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s === "all" ? "All" : STATUS_LABELS[s]}{" "}
            <span className="opacity-70">
              {s === "all" ? games.length : (counts[s] ?? 0)}
            </span>
          </button>
        ))}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search games…"
          className="ml-auto h-8 max-sm:w-full sm:w-56"
          aria-label="Search games"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="w-10 px-3 py-2 text-left font-medium">#</th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-3 py-2 font-medium",
                    col.className ?? "text-left",
                  )}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() =>
                      setSort((cur) => ({
                        key: col.key,
                        desc:
                          cur.key === col.key ? !cur.desc : col.key !== "title",
                      }))
                    }
                  >
                    {col.label}
                    {sort.key === col.key &&
                      (sort.desc ? (
                        <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUp className="h-3 w-3" />
                      ))}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((g, i) => (
              <tr key={g.id} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 text-muted-foreground tabular-nums">
                  {i + 1}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/stats/${g.id}`}
                    className="flex items-center gap-3 hover:text-primary"
                  >
                    {g.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={g.imageUrl}
                        alt=""
                        width={64}
                        height={30}
                        loading="lazy"
                        className="h-[30px] w-16 rounded object-cover max-sm:hidden"
                      />
                    ) : (
                      <span className="h-[30px] w-16 rounded bg-muted max-sm:hidden" />
                    )}
                    <span className="font-medium">{g.title}</span>
                    {g.status !== "supported" && (
                      <StatusBadge status={g.status} />
                    )}
                  </Link>
                </td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">
                  {formatCount(g.summary.steamCcu)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums max-sm:hidden">
                  {formatCount(g.summary.steamPeak24h)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums max-md:hidden">
                  {formatCount(g.summary.steamPeak30d)}
                </td>
                <td className="px-3 py-2 text-right max-md:hidden">
                  <Trend value={g.summary.steamTrend7d} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums max-lg:hidden">
                  {formatCount(g.summary.twitchViewers)}
                </td>
                <td
                  className="px-3 py-2 text-right text-muted-foreground max-lg:hidden"
                  suppressHydrationWarning
                >
                  {formatAgo(g.summary.lastPatchAt)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums max-sm:hidden">
                  {g.status === "supported" ? "–" : g.voteCount}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length + 1}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No games match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
