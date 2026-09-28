"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@repo/lib";
import {
  CLIENTS_WITH_PUBLIC_PLAYERS,
  PLATFORM_LABELS,
  type Metric,
  type StatsGameDetail,
} from "@/lib/stats-types";
import {
  formatAgo,
  formatCount,
  formatDate,
  formatDateTime,
  formatExact,
  formatPercent,
  reviewScore,
} from "./format";
import { TimeSeriesChart } from "./time-series-chart";

const SECTION =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

const CHART_METRICS: { metric: Metric; label: string; valueLabel: string }[] = [
  { metric: "steam_ccu", label: "Steam players", valueLabel: "Players" },
  { metric: "twitch_viewers", label: "Twitch viewers", valueLabel: "Viewers" },
  { metric: "discord_online", label: "Discord online", valueLabel: "Online" },
];

function Tile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && (
        <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}

function Toggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-md border p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded px-2.5 py-1 transition-colors",
            value === o.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function GameStatsView({ game }: { game: StatsGameDetail }) {
  const s = game.summary;
  const available = CHART_METRICS.filter(
    (m) => (game.daily[m.metric]?.length ?? 0) > 0,
  );
  const [metric, setMetric] = useState<Metric>(
    available[0]?.metric ?? "steam_ccu",
  );
  const [range, setRange] = useState<"7d" | "all">("7d");
  const chartMeta = CHART_METRICS.find((m) => m.metric === metric)!;

  const points = useMemo(() => {
    const series = range === "7d" ? game.hourly[metric] : game.daily[metric];
    return (series ?? []).map((p) => ({ t: p.t, v: p.max }));
  }, [game, metric, range]);

  const trackingSince = useMemo(() => {
    const firsts = Object.values(game.daily)
      .map((series) => series?.[0]?.t)
      .filter((t): t is number => typeof t === "number");
    return firsts.length > 0 ? Math.min(...firsts) : null;
  }, [game.daily]);

  const score = reviewScore(s.steamReviews, s.steamReviewPositive);
  const publicBuilds = game.builds.filter((b) => b.branch === "public");
  const otherBuilds = game.builds.filter((b) => b.branch !== "public");

  return (
    <div className="space-y-10">
      {/* Headline numbers */}
      <section className="space-y-3">
        <h2 className={SECTION}>Players</h2>
        <div className="grid max-md:grid-cols-2 gap-3 md:grid-cols-4">
          <Tile
            label="Playing now on Steam"
            value={formatExact(s.steamCcu)}
            hint={game.steamAppId ? undefined : "Not on Steam"}
          />
          <Tile label="24-hour peak" value={formatExact(s.steamPeak24h)} />
          <Tile label="30-day peak" value={formatExact(s.steamPeak30d)} />
          <Tile
            label="7-day trend"
            value={formatPercent(s.steamTrend7d)}
            hint="Average vs. the week before"
          />
        </div>
      </section>

      {/* Chart */}
      {available.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className={SECTION}>
              {chartMeta.label} ·{" "}
              {range === "7d" ? "hourly peak" : "daily peak"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {available.length > 1 && (
                <Toggle
                  options={available.map((m) => ({
                    value: m.metric,
                    label: m.label,
                  }))}
                  value={metric}
                  onChange={setMetric}
                />
              )}
              <Toggle
                options={[
                  { value: "7d", label: "7 days" },
                  { value: "all", label: "All time" },
                ]}
                value={range}
                onChange={setRange}
              />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <TimeSeriesChart
              points={points}
              valueLabel={chartMeta.valueLabel}
              hourly={range === "7d"}
            />
          </div>
          {trackingSince && (
            <p className="text-xs text-muted-foreground">
              Tracked by TH.GL since {formatDate(trackingSince)}. Peaks and
              history only cover the time since then.
            </p>
          )}
        </section>
      )}

      {/* Community */}
      <section className="space-y-3">
        <h2 className={SECTION}>Community</h2>
        <div className="grid max-md:grid-cols-2 gap-3 md:grid-cols-4">
          <Tile
            label="Steam reviews"
            value={score !== null ? `${score}%` : "–"}
            hint={
              s.steamReviews
                ? `positive of ${formatCount(s.steamReviews)}`
                : undefined
            }
          />
          <Tile label="Steam followers" value={formatCount(s.steamFollowers)} />
          <Tile
            label="Twitch viewers"
            value={formatCount(s.twitchViewers)}
            hint={
              s.twitchChannels !== null
                ? `${formatCount(s.twitchChannels)} live channels`
                : undefined
            }
          />
          <Tile
            label="Official Discord"
            value={formatCount(s.discordOnline)}
            hint={
              s.discordMembers !== null
                ? `online of ${formatCount(s.discordMembers)} members`
                : game.discordInvite
                  ? undefined
                  : "Not tracked yet"
            }
          />
        </div>
      </section>

      {/* Platforms */}
      <section className="space-y-3">
        <h2 className={SECTION}>Platforms</h2>
        {game.platforms.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No platforms listed yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Platform</th>
                  <th className="px-3 py-2 font-medium">Player numbers</th>
                </tr>
              </thead>
              <tbody>
                {game.platforms.map((p) => {
                  const isPublic = CLIENTS_WITH_PUBLIC_PLAYERS.includes(
                    p.client,
                  );
                  return (
                    <tr key={p.client} className="border-t">
                      <td className="px-3 py-2">
                        {p.url ? (
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:text-primary"
                          >
                            {PLATFORM_LABELS[p.client]}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          PLATFORM_LABELS[p.client]
                        )}
                        {p.status === "upcoming" && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            upcoming
                          </span>
                        )}
                        {p.status === "early_access" && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            early access
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {isPublic ? (
                          s.steamCcu !== null ? (
                            `${formatExact(s.steamCcu)} playing now`
                          ) : (
                            <span className="text-muted-foreground">
                              No players yet
                            </span>
                          )
                        ) : (
                          <span className="text-muted-foreground">
                            Not published
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {game.platforms.some(
          (p) => !CLIENTS_WITH_PUBLIC_PLAYERS.includes(p.client),
        ) && (
          <p className="text-xs text-muted-foreground">
            Only Steam publishes live player numbers. Other stores don&apos;t,
            so there is no reliable total across all platforms — Twitch and
            Discord above show interest across every platform.
          </p>
        )}
      </section>

      {/* Patches */}
      {game.builds.length > 0 && (
        <section className="space-y-3">
          <h2 className={SECTION}>Steam patch history</h2>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Updated</th>
                  <th className="px-3 py-2 font-medium">Branch</th>
                  <th className="px-3 py-2 font-medium">Build</th>
                </tr>
              </thead>
              <tbody>
                {[...publicBuilds, ...otherBuilds].slice(0, 20).map((b) => (
                  <tr key={`${b.branch}-${b.buildId}`} className="border-t">
                    <td
                      className="px-3 py-2"
                      title={formatDateTime(b.timeUpdated ?? b.seenAt)}
                      suppressHydrationWarning
                    >
                      {formatAgo(b.timeUpdated ?? b.seenAt)}
                    </td>
                    <td className="px-3 py-2">{b.branch}</td>
                    <td className="px-3 py-2 font-mono text-xs tabular-nums">
                      {b.buildId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
