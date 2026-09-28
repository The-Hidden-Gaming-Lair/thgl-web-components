import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { StatsGameWithSummary } from "@/lib/stats-types";
import { formatAgo, formatExact } from "./format";
import { Trend } from "./stats-table";

/** Compact player-stats strip for www.th.gl/apps/<id>, linking to /stats/<id>. */
export function StatsCard({ game }: { game: StatsGameWithSummary }) {
  const s = game.summary;
  if (s.steamCcu === null && s.steamPeak30d === null && s.lastPatchAt === null)
    return null;
  const items = [
    { label: "Playing now on Steam", value: formatExact(s.steamCcu) },
    { label: "24-hour peak", value: formatExact(s.steamPeak24h) },
    { label: "7-day trend", value: <Trend value={s.steamTrend7d} /> },
    {
      label: "Last patch",
      value: <span suppressHydrationWarning>{formatAgo(s.lastPatchAt)}</span>,
    },
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">Player Stats</h2>
      <div className="grid max-md:grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border bg-card p-4 text-center"
          >
            <div className="text-xs text-muted-foreground">{item.label}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">
              {item.value}
            </div>
          </div>
        ))}
      </div>
      <div className="text-center">
        <Link
          href={`/stats/${game.id}`}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Player count history, platforms and patches
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
