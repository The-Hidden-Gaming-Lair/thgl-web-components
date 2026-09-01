"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapPinnedIcon, SendIcon, DownloadIcon } from "lucide-react";
import WorldMapPreview, {
  type WorldMapPreviewIcons,
} from "./world-map-preview";
import PendingCodeRequests, {
  type PendingRequestStrings,
} from "./pending-code-requests";

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
  const [mapWorld, setMapWorld] = useState<string | null>(null);
  const [data, setData] = useState<WorldsResponse | null>(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Worlds that have reported event locations — these are the ones the map
  // preview can show. The user picks between them with the selector below.
  const worldsWithSpots = data?.worlds.filter((w) => w.hasSpots) ?? [];

  // The world shown in the inline map preview: an explicit click wins (if it
  // still has spots), else the first world with reported event locations.
  const previewId =
    (mapWorld && worldsWithSpots.some((w) => w.id === mapWorld)
      ? mapWorld
      : null) ??
    worldsWithSpots[0]?.id ??
    null;

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

      {/* Inline map preview — pick which active world's events to plot */}
      {previewId && (
        <div className="rounded-xl border border-border/60 bg-card/40 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
            <MapPinnedIcon className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="text-muted-foreground">{strings.eventMap}</span>
            {worldsWithSpots.length > 1 ? (
              <select
                value={previewId}
                onChange={(e) => setMapWorld(e.target.value)}
                className="rounded border border-border/60 bg-secondary px-2 py-1 font-mono text-xs text-foreground outline-none focus:border-primary/50"
                aria-label={strings.worldId}
              >
                {worldsWithSpots.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.id}
                    {w.region ? ` · ${w.region}` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-mono text-xs text-foreground">
                {previewId}
              </span>
            )}
            <span className="ml-auto text-[11px] text-muted-foreground">
              {worldsWithSpots.length} of {data?.worlds.length ?? 0} worlds
              mapped
            </span>
          </div>
          <WorldMapPreview serverId={previewId} icons={mapIcons} />
        </div>
      )}
      {/* No world has plottable coordinates yet — explain instead of hiding the
          map entirely, so activity-without-location doesn't read as broken. */}
      {!previewId && data && data.worlds.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-sm">
          <div className="mb-1 flex items-center gap-2">
            <MapPinnedIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {strings.noMapTitle}
            </span>
          </div>
          <p className="text-muted-foreground">{strings.noMapBody}</p>
        </div>
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
              {data.worlds.map((world) => (
                <tr
                  key={world.id}
                  className="border-b border-border/30 last:border-0"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {world.joinCode ? (
                        <button
                          type="button"
                          onClick={() => copy(world.joinCode!)}
                          className="rounded bg-secondary px-2 py-1 font-mono text-secondary-foreground transition-colors hover:bg-secondary/80"
                          title={strings.copied}
                        >
                          {copiedId === world.joinCode
                            ? strings.copied
                            : world.joinCode}
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
                          onClick={() => requestCode(world.id)}
                          className="inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                          title={strings.requestCodeHint}
                        >
                          <SendIcon className="h-3 w-3" />
                          {strings.requestCode}
                        </button>
                      )}
                      {world.region && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                          {world.region}
                        </span>
                      )}
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
                        .map(([bucket, ts]) => (
                          <span
                            key={bucket}
                            className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                          >
                            {ACTIVITY_LABEL_KEYS[bucket]
                              ? strings[ACTIVITY_LABEL_KEYS[bucket]]
                              : bucket}{" "}
                            · {formatRelative(ts, now)}
                          </span>
                        ))}
                      {world.hasSpots && (
                        <button
                          type="button"
                          onClick={() => {
                            setMapWorld(world.id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                            previewId === world.id
                              ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          }`}
                          title="Show event locations on the map"
                        >
                          <MapPinnedIcon className="h-3 w-3" />
                          Map
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
