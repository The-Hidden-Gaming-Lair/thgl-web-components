"use client";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { SendIcon, ChevronRightIcon } from "lucide-react";
import WorldMapPreview, {
  type WorldMapPreviewIcons,
} from "./world-map-preview";
import PendingCodeRequests, {
  type PendingRequestStrings,
} from "./pending-code-requests";
import { worldName, zoneLabel, ZONE_ORDER } from "./world-name";
import { Skeleton } from "@repo/ui/data";

const WORLDS_API = "https://palia-api.th.gl/worlds";
const REQUEST_CODE_API = "https://palia-api.th.gl/worlds/request-code";
const CANCEL_CODE_API = "https://palia-api.th.gl/worlds/cancel-code";
// Max join-code requests a visitor can have open (without a code) at once.
const MAX_ACTIVE_REQUESTS = 3;

export type PublicWorld = {
  id: string; // serverId
  joinCode: string | null;
  region: string | null;
  startedAt: number | null;
  firstSeen: number;
  lastSeen: number;
  reporters: number;
  activity: Record<string, number>;
  codeRequested: boolean;
  codeRequestedAt: number | null;
  joinCodeAt: number | null;
  hasSpots: boolean;
};

type WorldsResponse = {
  updatedAt: number;
  codeRequestTtlMs?: number;
  worlds: PublicWorld[];
};

export type ActiveWorldsStrings = {
  worldId: string;
  age: string;
  lastReport: string;
  reporters: string;
  activity: string;
  activityFlowTrees: string;
  activityPalium: string;
  activityLootPiles: string;
  ageUnknown: string;
  copied: string;
  codeReported: string; // tooltip: how long ago the code was reported ("{ago}" placeholder)
  noCode: string;
  requestCode: string;
  requestCodeHint: string;
  requestLimit: string;
  codeRequested: string;
  eventMap: string;
  showMap: string;
  showMapHint: string;
  lookingFor: string;
  clearFilter: string;
  zone: string;
  zoneAll: string;
  sort: string;
  sortActive: string;
  sortOldest: string;
  sortNewest: string;
  noneMatch: string;
  noMapTitle: string;
  noMapBody: string;
  pending: PendingRequestStrings;
  empty: string;
  live: string;
  fetchError: string;
};

// Only the string-valued label keys — keeps `strings[bucketKey]` a string.
type ActivityLabelKey =
  | "activityFlowTrees"
  | "activityPalium"
  | "activityLootPiles";
const ACTIVITY_LABEL_KEYS: Record<string, ActivityLabelKey> = {
  flowTrees: "activityFlowTrees",
  palium: "activityPalium",
  lootPiles: "activityLootPiles",
};

// The event types a visitor can filter/sort worlds by (matches the map legend).
const EVENT_FILTERS: { bucket: string; dot: string }[] = [
  { bucket: "flowTrees", dot: "#34d399" },
  { bucket: "palium", dot: "#38bdf8" },
];

function formatAge(startedAt: number | null, now: number, unknown: string) {
  if (!startedAt) {
    return unknown;
  }
  const totalMinutes = Math.max(0, Math.floor((now - startedAt) / 60_000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatRelative(ts: number, now: number) {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) {
    return `${s}s`;
  }
  return `${Math.floor(s / 60)}m`;
}

export default function ActiveWorldsClient({
  strings,
  mapIcons,
}: {
  strings: ActiveWorldsStrings;
  mapIcons: WorldMapPreviewIcons;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [data, setData] = useState<WorldsResponse | null>(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<Set<string>>(new Set());
  const [zoneFilter, setZoneFilter] = useState("");
  const [sortBy, setSortBy] = useState<"active" | "oldest" | "newest">(
    "active",
  );
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Frozen row order so a background refresh doesn't reshuffle the table (which
  // would yank the row you just requested/expanded). Rebuilt only when the
  // filter changes; new worlds append at the bottom, gone ones drop out.
  const orderRef = useRef<{ key: string; ids: string[] }>({ key: "", ids: [] });

  const toggleExpand = (serverId: string) =>
    setExpandedId((prev) => (prev === serverId ? null : serverId));

  const toggleFilter = (bucket: string) =>
    setEventFilter((prev) => {
      const next = new Set(prev);
      if (next.has(bucket)) {
        next.delete(bucket);
      } else {
        next.add(bucket);
      }
      return next;
    });

  const refresh = useCallback(() => {
    fetch(WORLDS_API)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((json: WorldsResponse) => {
        setData(json);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  // Cap concurrent open requests: count the visitor's requests that don't yet
  // have a code (pending / expired). Fulfilled ones free a slot.
  const activeRequestCount = [...requestedIds].filter(
    (id) => !data?.worlds.find((w) => w.id === id)?.joinCode,
  ).length;
  const atRequestLimit = activeRequestCount >= MAX_ACTIVE_REQUESTS;

  useEffect(() => {
    refresh();
    // Poll faster while the visitor is waiting on a requested code so it (and
    // the pending/expired transitions) show within seconds, not the idle 30s.
    const intervalMs = requestedIds.size > 0 ? 6_000 : 30_000;
    const poll = setInterval(refresh, intervalMs);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [refresh, requestedIds.size]);

  const copy = (id: string) => {
    navigator.clipboard?.writeText(id).catch(() => null);
    setCopiedId(id);
    if (copyTimeout.current) {
      clearTimeout(copyTimeout.current);
    }
    copyTimeout.current = setTimeout(() => setCopiedId(null), 1500);
  };

  const requestCode = (serverId: string) => {
    if (requestedIds.has(serverId) || atRequestLimit) return;
    setRequestedIds((prev) => new Set(prev).add(serverId));
    fetch(REQUEST_CODE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverId }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((json: { status: string; joinCode?: string }) => {
        if (json.status === "code" && json.joinCode) {
          copy(json.joinCode);
        }
        refresh();
      })
      .catch(() => null);
  };

  const cancelRequest = (serverId: string) => {
    setRequestedIds((prev) => {
      const next = new Set(prev);
      next.delete(serverId);
      return next;
    });
    fetch(CANCEL_CODE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverId }),
    })
      .then(() => refresh())
      .catch(() => null);
  };

  // Shared join-code control (copy / requesting / request). The buttons stop
  // click propagation so acting on the code doesn't also toggle the row's
  // expansion (everything ELSE in the row expands it).
  const codeControl = (world: PublicWorld) =>
    world.joinCode ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          copy(world.joinCode!);
        }}
        className="cursor-copy rounded bg-secondary px-2 py-1 font-mono text-xs text-secondary-foreground transition-colors hover:bg-secondary/80"
        title={
          world.joinCodeAt
            ? strings.codeReported.replace(
                "{ago}",
                formatRelative(world.joinCodeAt, now),
              )
            : strings.copied
        }
      >
        {copiedId === world.joinCode ? strings.copied : world.joinCode}
      </button>
    ) : world.codeRequested || requestedIds.has(world.id) ? (
      <span className="inline-flex items-center gap-1 text-xs text-amber-400">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
        </span>
        {strings.codeRequested}
      </span>
    ) : (
      <button
        type="button"
        disabled={atRequestLimit}
        onClick={(e) => {
          e.stopPropagation();
          requestCode(world.id);
        }}
        className="inline-flex items-center gap-1 whitespace-nowrap rounded border border-border/60 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border/60 disabled:hover:text-muted-foreground"
        title={atRequestLimit ? strings.requestLimit : strings.requestCodeHint}
      >
        <SendIcon className="h-3 w-3" />
        {strings.requestCode}
      </button>
    );

  // Expand the freshest mapped world once on first load, so a map is visible by
  // default (falls back to the newest world). After that the user is in control.
  const didInitExpand = useRef(false);
  useEffect(() => {
    if (didInitExpand.current || !data || data.worlds.length === 0) return;
    didInitExpand.current = true;
    const first = data.worlds.find((w) => w.hasSpots) ?? data.worlds[0];
    setExpandedId(first.id);
  }, [data]);

  // When a requested world's code lands on a later poll, copy it once.
  const autoCopiedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!data) return;
    for (const id of requestedIds) {
      const code = data.worlds.find((w) => w.id === id)?.joinCode;
      if (code && !autoCopiedRef.current.has(code)) {
        autoCopiedRef.current.add(code);
        copy(code);
      }
    }
    // `copy` is stable enough (only touches a ref + setState); omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, requestedIds]);

  // Which zones currently have worlds, in canonical order — drives the dropdown
  // so we never offer an empty zone.
  const zonesPresent = ZONE_ORDER.filter((z) =>
    (data?.worlds ?? []).some((w) => worldName(w.id).zoneKey === z),
  );

  // Apply the zone + "looking for" event filters, then sort. Default sort keeps
  // the old behaviour (freshest activity when event-filtered, else newest-seen);
  // "oldest"/"newest" sort by server age (unknown age sinks to the bottom).
  const filteredWorlds = (() => {
    const buckets = [...eventFilter];
    const freshest = (w: PublicWorld) =>
      Math.max(0, ...buckets.map((bk) => w.activity[bk] ?? 0));
    const list = (data?.worlds ?? []).filter((w) => {
      if (zoneFilter && worldName(w.id).zoneKey !== zoneFilter) return false;
      if (eventFilter.size > 0 && freshest(w) <= 0) return false;
      return true;
    });
    if (sortBy === "oldest") {
      return list.sort(
        (a, b) => (a.startedAt ?? Infinity) - (b.startedAt ?? Infinity),
      );
    }
    if (sortBy === "newest") {
      return list.sort(
        (a, b) => (b.startedAt ?? -Infinity) - (a.startedAt ?? -Infinity),
      );
    }
    if (eventFilter.size > 0) {
      return list.sort((a, b) => freshest(b) - freshest(a));
    }
    return list.sort((a, b) => b.lastSeen - a.lastSeen);
  })();

  // Stabilise the order: keep the positions established on first render (or when
  // the filter changed) so refreshes don't move rows the user is interacting
  // with. New worlds are appended; worlds that dropped out are removed.
  const filterKey = `${sortBy}|${zoneFilter}|${[...eventFilter].sort().join(",")}`;
  const stableWorlds = (() => {
    const byId = new Map(filteredWorlds.map((w) => [w.id, w]));
    const prev = orderRef.current.key === filterKey ? orderRef.current.ids : [];
    const kept = prev.filter((id) => byId.has(id));
    const keptSet = new Set(kept);
    const fresh = filteredWorlds
      .map((w) => w.id)
      .filter((id) => !keptSet.has(id));
    const ids = [...kept, ...fresh];
    orderRef.current = { key: filterKey, ids };
    return ids.map((id) => byId.get(id)!);
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {strings.live}
          {data ? ` • ${formatRelative(data.updatedAt, now)}` : null}
        </span>
      </div>

      {/* Loading placeholder — reserve the content height so the table + map
          don't shove the page down (and the CTA up) when data arrives. */}
      {!data && !error && (
        <div className="space-y-3" aria-hidden>
          <Skeleton className="h-7 w-64 rounded-full" />
          <div className="overflow-hidden rounded-lg border border-border/50 bg-card/50 p-3">
            <Skeleton className="mb-3 h-72 w-full rounded-lg" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* "Looking for" — filter the list to worlds with the chosen live events */}
      {data && data.worlds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {strings.lookingFor}
          </span>
          {EVENT_FILTERS.map(({ bucket, dot }) => {
            const on = eventFilter.has(bucket);
            return (
              <button
                key={bucket}
                type="button"
                onClick={() => toggleFilter(bucket)}
                aria-pressed={on}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  on
                    ? "border-primary/50 bg-primary/10 text-foreground"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: dot }}
                />
                {strings[ACTIVITY_LABEL_KEYS[bucket]]}
              </button>
            );
          })}
          {eventFilter.size > 0 && (
            <button
              type="button"
              onClick={() => setEventFilter(new Set())}
              className="text-[11px] text-muted-foreground underline hover:text-foreground"
            >
              {strings.clearFilter}
            </button>
          )}

          {/* Zone filter + age sort (requested by the community) */}
          <span className="mx-1 hidden h-4 w-px bg-border/60 sm:block" />
          {zonesPresent.length > 1 && (
            <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              {strings.zone}
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="rounded-full border border-border/60 bg-card px-2 py-1 text-xs text-foreground focus:border-primary/50 focus:outline-none"
              >
                <option value="">{strings.zoneAll}</option>
                {zonesPresent.map((z) => (
                  <option key={z} value={z}>
                    {zoneLabel(z)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            {strings.sort}
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "active" | "oldest" | "newest")
              }
              className="rounded-full border border-border/60 bg-card px-2 py-1 text-xs text-foreground focus:border-primary/50 focus:outline-none"
            >
              <option value="active">{strings.sortActive}</option>
              <option value="oldest">{strings.sortOldest}</option>
              <option value="newest">{strings.sortNewest}</option>
            </select>
          </label>
        </div>
      )}

      {/* Live tracker for the join-code requests this visitor has made */}
      {data && requestedIds.size > 0 && (
        <>
          <PendingCodeRequests
            worlds={data.worlds}
            myRequests={requestedIds}
            ttlMs={data.codeRequestTtlMs ?? 120_000}
            now={now}
            copiedId={copiedId}
            onCancel={cancelRequest}
            onRetry={requestCode}
            onCopy={copy}
            strings={strings.pending}
          />
          {atRequestLimit && (
            <p className="px-1 text-xs text-amber-400">
              {strings.requestLimit}
            </p>
          )}
        </>
      )}

      {error && (
        <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
          {strings.fetchError}
        </p>
      )}
      {data && data.worlds.length === 0 && !error && (
        <p className="rounded-md border border-border/50 bg-card/50 px-3 py-4 text-sm text-muted-foreground">
          {strings.empty}
        </p>
      )}
      {data && data.worlds.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border/50 bg-card/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">{strings.worldId}</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {strings.age}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium max-sm:hidden">
                  {strings.lastReport}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium max-sm:hidden">
                  {strings.reporters}
                </th>
                <th className="px-3 py-2 font-medium">{strings.activity}</th>
              </tr>
            </thead>
            <tbody>
              {stableWorlds.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-sm text-muted-foreground"
                  >
                    {strings.noneMatch}
                  </td>
                </tr>
              )}
              {stableWorlds.map((world) => {
                const expanded = expandedId === world.id;
                return (
                  <Fragment key={world.id}>
                    <tr
                      onClick={() => toggleExpand(world.id)}
                      className={`cursor-pointer border-b border-border/30 transition-colors hover:bg-card/60 ${
                        expanded ? "bg-card/60" : ""
                      }`}
                    >
                      <td className="px-3 py-2 align-top">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <ChevronRightIcon
                            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
                              expanded ? "rotate-90" : ""
                            }`}
                          />
                          <span className="font-medium text-foreground">
                            {worldName(world.id).zone}
                          </span>
                          {world.region && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                              {world.region}
                            </span>
                          )}
                          {worldName(world.id).id && (
                            <span
                              className="font-mono text-[11px] text-muted-foreground"
                              title={world.id}
                            >
                              {worldName(world.id).id}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pl-5">
                          {codeControl(world)}
                        </div>
                        {/* Secondary stats fold into the world cell on mobile,
                            where the Last-report / Reporters columns are hidden. */}
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 pl-5 text-[11px] text-muted-foreground tabular-nums sm:hidden">
                          <span>
                            {strings.lastReport}:{" "}
                            {formatRelative(world.lastSeen, now)}
                          </span>
                          <span>
                            {strings.reporters}: {world.reporters}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 align-top tabular-nums">
                        {formatAge(world.startedAt, now, strings.ageUnknown)}
                      </td>
                      <td className="px-3 py-2 align-top tabular-nums text-muted-foreground max-sm:hidden">
                        {formatRelative(world.lastSeen, now)}
                      </td>
                      <td className="px-3 py-2 align-top tabular-nums text-muted-foreground max-sm:hidden">
                        {world.reporters}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex flex-wrap items-center gap-1">
                          {Object.entries(world.activity)
                            .sort((a, b) => b[1] - a[1])
                            .map(([bucket, ts]) => {
                              const dot = EVENT_FILTERS.find(
                                (f) => f.bucket === bucket,
                              )?.dot;
                              return (
                                <span
                                  key={bucket}
                                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                                >
                                  {dot && (
                                    <span
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: dot }}
                                    />
                                  )}
                                  {ACTIVITY_LABEL_KEYS[bucket]
                                    ? strings[ACTIVITY_LABEL_KEYS[bucket]]
                                    : bucket}
                                  {/* Timestamp is space-hungry — drop it on
                                      mobile where the column is narrow. */}
                                  <span className="max-sm:hidden">
                                    {" "}
                                    · {formatRelative(ts, now)}
                                  </span>
                                </span>
                              );
                            })}
                        </div>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-border/30 bg-card/30">
                        <td colSpan={5} className="px-3 pb-3">
                          {world.hasSpots ? (
                            <WorldMapPreview
                              serverId={world.id}
                              icons={mapIcons}
                            />
                          ) : (
                            <p className="rounded-md border border-border/50 bg-card/50 px-3 py-4 text-sm text-muted-foreground">
                              {strings.noMapBody}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
