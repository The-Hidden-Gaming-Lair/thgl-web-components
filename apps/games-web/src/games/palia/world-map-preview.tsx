"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, type JSX } from "react";
import { type TilesConfig, type SimpleSpawn } from "@repo/lib";
import { Skeleton } from "@repo/ui/data";

const WorldMapDynamic = dynamic(() => import("./world-map-dynamic"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 md:h-80 rounded-lg" />,
});

const SPOTS_API = "https://palia-api.th.gl/worlds/spots";

// Palia map ids (tiles) keyed to the friendly names players know, in the order
// the in-game world unlocks them. This is the canonical map-switcher list.
const MAPS: { id: string; label: string }[] = [
  { id: "VillageWorld", label: "Kilima Valley" },
  { id: "AdventureZoneWorld", label: "Bahari Bay" },
  { id: "AZ2_Root", label: "Elderwood" },
  { id: "AZ3_Root", label: "Royal Highlands" },
];

const BUCKET_META: Record<string, { label: string; dot: string }> = {
  flowTrees: { label: "Flow Trees", dot: "#34d399" }, // emerald — Grove / flow
  palium: { label: "Palium", dot: "#38bdf8" }, // sky — palium
};

type Spots = Record<string, { m: string; x: number; y: number; at: number }[]>;

export type WorldMapPreviewIcons = {
  tiles: TilesConfig;
  iconsPath: string;
  bucketIcons: Record<string, SimpleSpawn["icon"]>;
  fallbackIcon: SimpleSpawn["icon"];
};

export default function WorldMapPreview({
  serverId,
  icons,
}: {
  serverId: string;
  icons: WorldMapPreviewIcons;
}): JSX.Element {
  const [spots, setSpots] = useState<Spots | null>(null);
  const [error, setError] = useState(false);
  const [activeMap, setActiveMap] = useState<string | null>(null);

  // Reset the map selection whenever we switch worlds so we land on that
  // world's populated map, not a stale one.
  useEffect(() => setActiveMap(null), [serverId]);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(`${SPOTS_API}?serverId=${encodeURIComponent(serverId)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then((json: { spots: Spots }) => {
          if (!cancelled) {
            setSpots(json.spots ?? {});
            setError(false);
          }
        })
        .catch(() => !cancelled && setError(true));
    load();
    const poll = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [serverId]);

  // Flatten to per-map spawn lists (a world's events can span several maps).
  const byMap = useMemo(() => {
    const out: Record<string, SimpleSpawn[]> = {};
    if (!spots) return out;
    for (const [bucket, list] of Object.entries(spots)) {
      const meta = BUCKET_META[bucket];
      const icon = icons.bucketIcons[bucket] ?? icons.fallbackIcon;
      list.forEach((s, i) => {
        (out[s.m] ||= []).push({
          id: `${bucket}-${s.m}-${i}`,
          name: meta?.label ?? bucket,
          label: meta?.label ?? bucket, // shown verbatim in the hover tooltip
          icon,
          p: [s.x, s.y],
        } as SimpleSpawn);
      });
    }
    return out;
  }, [spots, icons.bucketIcons, icons.fallbackIcon]);

  const countFor = (mapId: string) => byMap[mapId]?.length ?? 0;

  // Default to the map that actually has the most reported events.
  const busiestMap = useMemo(
    () =>
      MAPS.map((m) => m.id).sort((a, b) => countFor(b) - countFor(a))[0] ??
      MAPS[0]!.id,
    [byMap], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const currentMap = activeMap ?? busiestMap;

  const bucketCounts = useMemo(() => {
    const c: Record<string, number> = {};
    if (spots) for (const [b, l] of Object.entries(spots)) c[b] = l.length;
    return c;
  }, [spots]);

  const totalSpots = Object.values(bucketCounts).reduce((a, b) => a + b, 0);

  if (error) {
    return (
      <p className="rounded-md bg-amber-500/10 px-3 py-4 text-sm text-amber-400">
        Could not load event locations — retrying.
      </p>
    );
  }
  if (!spots) {
    return <Skeleton className="h-64 md:h-80 rounded-lg" />;
  }

  return (
    <div className="space-y-3">
      {/* Legend + counts */}
      <div className="flex flex-wrap items-center gap-3">
        {Object.entries(BUCKET_META).map(([bucket, meta]) => (
          <span
            key={bucket}
            className={`inline-flex items-center gap-1.5 text-xs ${
              bucketCounts[bucket]
                ? "text-muted-foreground"
                : "text-muted-foreground/40"
            }`}
          >
            <span className="relative flex h-2.5 w-2.5" aria-hidden>
              {bucketCounts[bucket] ? (
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
                  style={{ backgroundColor: meta.dot }}
                />
              ) : null}
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: meta.dot }}
              />
            </span>
            <span
              className={
                bucketCounts[bucket] ? "font-medium text-foreground" : ""
              }
            >
              {meta.label}
            </span>
            <span className="tabular-nums">×{bucketCounts[bucket] ?? 0}</span>
          </span>
        ))}
      </div>

      {/* Map switcher — all four Palia maps, dimmed when a map has no events */}
      <div className="flex flex-wrap gap-1">
        {MAPS.map((m) => {
          const n = countFor(m.id);
          const active = m.id === currentMap;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveMap(m.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors ${
                active
                  ? "bg-secondary text-secondary-foreground"
                  : n
                    ? "text-muted-foreground hover:bg-secondary/50"
                    : "text-muted-foreground/40 hover:bg-secondary/30"
              }`}
            >
              {m.label}
              <span
                className={`tabular-nums ${
                  n ? "text-emerald-400" : "opacity-60"
                }`}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {/* The map itself, framed like a scanner */}
      <div className="relative overflow-hidden rounded-lg border border-border/60 bg-black/40 shadow-inner ring-1 ring-inset ring-white/5">
        <WorldMapDynamic
          key={currentMap}
          mapName={currentMap}
          spawns={byMap[currentMap] ?? []}
          tiles={icons.tiles}
          icons={icons.iconsPath}
        />
        {/* subtle vignette to sell the "live radar" feel */}
        <div className="pointer-events-none absolute inset-0 rounded-lg bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]" />
        {countFor(currentMap) === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded-md bg-black/60 px-3 py-1.5 text-xs text-muted-foreground">
              No events reported on this map yet
            </span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        {totalSpots > 0
          ? "Live locations crowdsourced from players in this world · updates every 15s"
          : "Waiting for a player in this world to report event locations · updates every 15s"}
      </p>
    </div>
  );
}
