"use client";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  MapPinnedIcon,
  SendIcon,
  DownloadIcon,
  ChevronRightIcon,
} from "lucide-react";
import WorldMapPreview, {
  type WorldMapPreviewIcons,
} from "./world-map-preview";
import PendingCodeRequests, {
  type PendingRequestStrings,
} from "./pending-code-requests";
import { worldName } from "./world-name";
import { Skeleton } from "@repo/ui/data";

const WORLDS_API = "https://palia-api.th.gl/worlds";
const REQUEST_CODE_API = "https://palia-api.th.gl/worlds/request-code";
const CANCEL_CODE_API = "https://palia-api.th.gl/worlds/cancel-code";

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
  noCode: string;
  requestCode: string;
  requestCodeHint: string;
  codeRequested: string;
  eventMap: string;
  showMap: string;
  showMapHint: string;
  lookingFor: string;
  clearFilter: string;
  noneMatch: string;
  noMapTitle: string;
  noMapBody: string;
  pending: PendingRequestStrings;
  empty: string;
  live: string;
  fetchError: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaStep1: string;
  ctaStep1Body: string;
  ctaStep2: string;
  ctaStep2Body: string;
  ctaStep3: string;
  ctaStep3Body: string;
  ctaButton: string;
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
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        title={strings.copied}
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
        onClick={(e) => {
          e.stopPropagation();
          requestCode(world.id);
        }}
        className="inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        title={strings.requestCodeHint}
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

  // Apply the "looking for" event filter: keep only worlds with a selected
  // activity, freshest first. No filter = all worlds, newest-seen first.
  const filteredWorlds = (() => {
    const all = data?.worlds ?? [];
    if (eventFilter.size === 0) return all;
    const buckets = [...eventFilter];
    const freshest = (w: PublicWorld) =>
      Math.max(0, ...buckets.map((bk) => w.activity[bk] ?? 0));
    return all
      .filter((w) => freshest(w) > 0)
      .sort((a, b) => freshest(b) - freshest(a));
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
        </div>
      )}

      {/* Live tracker for the join-code requests this visitor has made */}
      {data && requestedIds.size > 0 && (
        <PendingCodeRequests
          worlds={data.worlds}
          myRequests={requestedIds}
          ttlMs={data.codeRequestTtlMs ?? 120_000}
          now={now}
          copiedId={copiedId}
          onCancel={cancelRequest}
          onCopy={copy}
          strings={strings.pending}
        />
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
                <th className="px-3 py-2 font-medium">{strings.age}</th>
                <th className="px-3 py-2 font-medium">{strings.lastReport}</th>
                <th className="px-3 py-2 font-medium">{strings.reporters}</th>
                <th className="px-3 py-2 font-medium">{strings.activity}</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorlds.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-sm text-muted-foreground"
                  >
                    {strings.noneMatch}
                  </td>
                </tr>
              )}
              {filteredWorlds.map((world) => {
                const expanded = expandedId === world.id;
                return (
                  <Fragment key={world.id}>
                    <tr
                      onClick={() => toggleExpand(world.id)}
                      className={`cursor-pointer border-b border-border/30 transition-colors hover:bg-card/60 ${
                        expanded ? "bg-card/60" : ""
                      }`}
                    >
                      <td className="px-3 py-2">
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
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatAge(world.startedAt, now, strings.ageUnknown)}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">
                        {formatRelative(world.lastSeen, now)}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">
                        {world.reporters}
                      </td>
                      <td className="px-3 py-2">
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
                                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                                >
                                  {dot && (
                                    <span
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: dot }}
                                    />
                                  )}
                                  {ACTIVITY_LABEL_KEYS[bucket]
                                    ? strings[ACTIVITY_LABEL_KEYS[bucket]]
                                    : bucket}{" "}
                                  · {formatRelative(ts, now)}
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

      {/* How it works + companion-app advert (mirrors the rummage-pile page) */}
      <div className="mt-4 rounded-2xl border border-primary/20 bg-linear-to-br from-primary/5 via-transparent to-accent/5 p-6 md:p-8">
        <h3 className="mb-2 text-2xl font-bold text-primary">
          {strings.ctaTitle}
        </h3>
        <p className="mb-6 text-muted-foreground">{strings.ctaDescription}</p>
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: DownloadIcon,
              title: strings.ctaStep1,
              body: strings.ctaStep1Body,
            },
            {
              icon: MapPinnedIcon,
              title: strings.ctaStep2,
              body: strings.ctaStep2Body,
            },
            {
              icon: SendIcon,
              title: strings.ctaStep3,
              body: strings.ctaStep3Body,
            },
          ].map((step, i) => (
            <div
              key={i}
              className="flex h-full flex-col items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {i + 1}
              </div>
              <step.icon className="h-8 w-8 shrink-0 text-primary" />
              <div className="text-center">
                <p className="mb-1 font-medium">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
        <a
          href="https://www.th.gl/companion-app"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]"
        >
          <DownloadIcon className="h-4 w-4" />
          {strings.ctaButton}
        </a>
      </div>
    </div>
  );
}
