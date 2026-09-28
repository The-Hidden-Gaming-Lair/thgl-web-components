"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Single-series time chart (no chart lib in games-web — same approach as
 * the Songs of Conquest savegame LineChart). One metric per chart, so no
 * legend: the surrounding heading names the series. Crosshair + tooltip on
 * hover/touch; the numbers also exist as text (tiles / tables) around it.
 */

export type ChartPoint = { t: number; v: number };

const HEIGHT = 240;
const PAD = { top: 12, right: 12, bottom: 26, left: 48 };

function niceMax(max: number): number {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const step = steps.find((s) => s * pow >= max) ?? 10;
  return step * pow;
}

const axisNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function TimeSeriesChart({
  points,
  valueLabel,
  hourly,
}: {
  points: ChartPoint[];
  /** Tooltip label, e.g. "Peak players". */
  valueLabel: string;
  /** Hour buckets (tooltip shows time) vs day buckets (date only). */
  hourly: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setWidth(Math.max(280, Math.floor(entry.contentRect.width))),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    if (points.length === 0) return null;
    const innerW = width - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const t0 = points[0].t;
    const t1 = points[points.length - 1].t;
    const span = Math.max(1, t1 - t0);
    const yMax = niceMax(Math.max(...points.map((p) => p.v)));
    const x = (t: number) =>
      PAD.left +
      (points.length === 1 ? innerW / 2 : ((t - t0) / span) * innerW);
    const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH;
    const path = points
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`,
      )
      .join("");
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => yMax * f);
    const xTickCount = Math.max(2, Math.min(6, Math.floor(innerW / 110)));
    const xTicks = Array.from(
      { length: xTickCount },
      (_, i) => t0 + (span * i) / (xTickCount - 1),
    );
    return { x, y, path, yTicks, xTicks, innerW };
  }, [points, width]);

  const fmtTick = (t: number) =>
    new Date(t * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      ...(hourly &&
      points.length > 0 &&
      points[points.length - 1].t - points[0].t < 2 * 86400
        ? { hour: "2-digit" }
        : {}),
      timeZone: "UTC",
    });
  const fmtTooltipTime = (t: number) =>
    new Date(t * 1000).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: hourly ? undefined : "numeric",
      ...(hourly ? { hour: "2-digit", minute: "2-digit" } : {}),
      timeZone: "UTC",
      timeZoneName: hourly ? "short" : undefined,
    });

  function onMove(clientX: number) {
    if (!geo || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = clientX - rect.left;
    let best = 0;
    let bestDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(geo.x(p.t) - px);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setHover(best);
  }

  if (!geo) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        Collecting data — check back soon.
      </div>
    );
  }

  const hp = hover !== null ? points[hover] : null;
  const tooltipLeft = hp ? Math.min(Math.max(geo.x(hp.t), 70), width - 70) : 0;

  return (
    <div
      ref={ref}
      className="relative w-full select-none"
      onMouseMove={(e) => onMove(e.clientX)}
      onMouseLeave={() => setHover(null)}
      onTouchStart={(e) => onMove(e.touches[0].clientX)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
    >
      <svg
        width={width}
        height={HEIGHT}
        className="block text-primary"
        role="img"
        aria-label={`${valueLabel} over time`}
      >
        {geo.yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={geo.y(t)}
              y2={geo.y(t)}
              className="stroke-muted-foreground/15"
            />
            <text
              x={PAD.left - 8}
              y={geo.y(t) + 3}
              textAnchor="end"
              fontSize={10}
              className="fill-muted-foreground"
            >
              {axisNumber.format(t)}
            </text>
          </g>
        ))}
        {geo.xTicks
          .map((t) => ({ t, label: fmtTick(t) }))
          // Short spans (first hours of tracking) repeat the same label.
          .filter((tick, i, all) => i === 0 || tick.label !== all[i - 1].label)
          .map((tick, i, all) => (
            <text
              key={tick.t}
              x={all.length === 1 ? PAD.left + geo.innerW / 2 : geo.x(tick.t)}
              y={HEIGHT - 8}
              textAnchor={
                all.length === 1
                  ? "middle"
                  : i === 0
                    ? "start"
                    : i === all.length - 1
                      ? "end"
                      : "middle"
              }
              fontSize={10}
              className="fill-muted-foreground"
            >
              {tick.label}
            </text>
          ))}
        <path
          d={geo.path}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.length === 1 && (
          <circle
            cx={geo.x(points[0].t)}
            cy={geo.y(points[0].v)}
            r={4}
            fill="currentColor"
          />
        )}
        {hp && (
          <g>
            <line
              x1={geo.x(hp.t)}
              x2={geo.x(hp.t)}
              y1={PAD.top}
              y2={HEIGHT - PAD.bottom}
              className="stroke-muted-foreground/40"
            />
            <circle
              cx={geo.x(hp.t)}
              cy={geo.y(hp.v)}
              r={4}
              fill="currentColor"
              className="stroke-background"
              strokeWidth={2}
            />
          </g>
        )}
      </svg>
      {hp && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-xs shadow-md"
          style={{ left: tooltipLeft }}
        >
          <div className="text-muted-foreground">{fmtTooltipTime(hp.t)}</div>
          <div className="font-medium tabular-nums">
            {valueLabel}: {hp.v.toLocaleString("en-US")}
          </div>
        </div>
      )}
    </div>
  );
}
