"use client";

import { useGameState } from "@repo/lib";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../(controls)";
import { Copy, Server, Send, Clock } from "lucide-react";
import { usePreviewReleaseGate } from "../(apps)/preview-release-guard";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { usePaliaTime } from "./palia-time";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";

const WORLDS_API = "https://palia-api.th.gl/worlds";

const REQUEST_CODE_API = "https://palia-api.th.gl/worlds/request-code";

type PublicWorld = {
  id: string; // serverId
  joinCode: string | null;
  region: string | null;
  startedAt: number | null;
  firstSeen: number;
  lastSeen: number;
  reporters: number;
  activity: Record<string, number>;
  codeRequested: boolean;
};

type WorldsResponse = { updatedAt: number; worlds: PublicWorld[] };

const ACTIVITY_LABELS: Record<string, string> = {
  flowTrees: "Flow Trees",
  palium: "Palium",
  lootPiles: "Rummage Piles",
};

// A Palia serverId encodes zone + region + a unique instance id (Palia streams
// each zone as its own server), e.g. "palia-adventure-2-x86cf-wmlxg" — turn it
// into a readable label so same-region instances are tellable apart.
const ZONE_NAMES: Record<string, string> = {
  village: "Kilima Valley",
  adventure: "Bahari Bay",
  "adventure-2": "Elderwood",
  "adventure-3": "Royal Highlands",
  blackmarket: "Black Market",
  housing: "Home Plot",
};
function worldName(serverId: string): { zone: string; id: string } {
  const m = serverId.match(/^palia-([a-z]+(?:-\d+)?)-(.+)$/);
  if (!m) return { zone: serverId, id: "" };
  return { zone: ZONE_NAMES[m[1]] ?? m[1], id: m[2] };
}

function formatAge(startedAt: number | null, now: number) {
  if (!startedAt) {
    return "age unknown";
  }
  const totalMinutes = Math.max(0, Math.floor((now - startedAt) / 60_000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m old` : `${m}m old`;
}

function formatRelative(ts: number, now: number) {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) {
    return `${s}s`;
  }
  return `${Math.floor(s / 60)}m`;
}

export function PaliaActiveWorlds() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<WorldsResponse | null>(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The app publishes the local ServerId as player.worldId (always available,
  // menu-independent) so the panel can highlight the world you're in.
  const player = useGameState((state) => state.player) as {
    worldId?: string;
  } | null;
  const myWorldId = player?.worldId ?? null;
  // In-game clock shown at the end of the trigger row (replaces the separate
  // "Palia Time" sidebar row; the locked-window PaliaTime overlay stays).
  const paliaTime = usePaliaTime();
  // Active Worlds is an Elite-only preview for now; non-preview users still get
  // the in-game clock (this row replaced the old standalone "Palia Time" row).
  const previewGate = usePreviewReleaseGate();
  const showWorlds = previewGate === "allow";
  const myWorld =
    (myWorldId && data?.worlds.find((world) => world.id === myWorldId)) || null;

  const refresh = useCallback(() => {
    fetch(WORLDS_API)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((json: WorldsResponse) => {
        setData(json);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  // Poll even while the sheet is closed so the sidebar current-world line has
  // age data — slower closed (60s) than open (30s); the CDN caches the GET.
  useEffect(() => {
    if (!showWorlds) return; // non-preview: clock only, don't poll the worlds API
    refresh();
    const poll = setInterval(refresh, isOpen ? 30_000 : 60_000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [isOpen, refresh, showWorlds]);

  const copy = (id: string) => {
    navigator.clipboard?.writeText(id).catch(() => null);
    setCopiedId(id);
    if (copyTimeout.current) {
      clearTimeout(copyTimeout.current);
    }
    copyTimeout.current = setTimeout(() => setCopiedId(null), 1500);
  };

  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const requestCode = (serverId: string) => {
    // Optimistically mark as requested so the button flips immediately.
    setRequestedIds((prev) => new Set(prev).add(serverId));
    fetch(REQUEST_CODE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverId }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((json: { status: string; joinCode?: string }) => {
        if (json.status === "code" && json.joinCode) {
          copy(json.joinCode); // a fresh code already existed — copy it
        }
        refresh();
      })
      .catch(() => null);
  };

  // Non-preview users: keep only the in-game clock (the Active Worlds panel is
  // Elite-only until it launches). Mirrors the trigger row's clock placement.
  if (!showWorlds) {
    return (
      <div className="flex w-full items-center px-3 py-1.5 text-sm text-gray-300">
        <Clock className="mr-2 h-4 w-4" />
        <span className="grow text-left">Palia Time</span>
        {paliaTime}
      </div>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost" className="w-full">
          <Server className="mr-2 h-4 w-4" />
          <span className="grow text-left">Active Worlds</span>
          {paliaTime}
        </Button>
      </SheetTrigger>
      {myWorldId && (
        <div className="flex items-center gap-2 px-4 pb-1 text-xs text-gray-400">
          <span>Your world:</span>
          <span className="font-medium text-gray-200" title={myWorldId}>
            {worldName(myWorldId).zone}
          </span>
          {myWorld?.joinCode ? (
            <button
              type="button"
              onClick={() => copy(myWorld.joinCode!)}
              className="font-mono text-gray-200 hover:text-white"
              title="Copy join code"
            >
              {copiedId === myWorld.joinCode ? "Copied!" : myWorld.joinCode}
            </button>
          ) : (
            <span className="text-gray-500">no code yet</span>
          )}
          {myWorld?.region && (
            <span className="rounded bg-muted px-1 py-0.5 text-[10px] uppercase text-gray-400">
              {myWorld.region}
            </span>
          )}
          {myWorld && <span>· {formatAge(myWorld.startedAt, now)}</span>}
        </div>
      )}
      <SheetContent side="left" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Active Worlds</SheetTitle>
          <SheetDescription>
            Crowdsourced by players using the TH.GL apps. Copy a world ID and
            use it in-game to join that world.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea>
          <div className="space-y-1">
            {error && (
              <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
                Could not reach the live API – retrying
              </p>
            )}
            {data && data.worlds.length === 0 && !error && (
              <p className="text-sm text-gray-400">
                No worlds reported in the last 10 minutes. Play with the app
                running to contribute.
              </p>
            )}
            {!data && !error && <div>Loading...</div>}
            {data?.worlds.map((world) => (
              <div
                key={world.id}
                className={`rounded-md border border-border/50 p-2 ${
                  myWorldId === world.id ? "ring-1 ring-green-600" : ""
                }`}
              >
                <div
                  className="mb-1 flex items-center gap-1.5"
                  title={world.id}
                >
                  <span className="text-sm font-medium text-gray-200">
                    {worldName(world.id).zone}
                  </span>
                  <span className="font-mono text-[10px] text-gray-500">
                    {worldName(world.id).id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {world.joinCode ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="font-mono"
                      onClick={() => copy(world.joinCode!)}
                    >
                      <Copy className="mr-2 h-3 w-3" />
                      {copiedId === world.joinCode ? "Copied!" : world.joinCode}
                    </Button>
                  ) : world.codeRequested || requestedIds.has(world.id) ? (
                    <span className="text-xs text-amber-500">
                      code requested…
                    </span>
                  ) : myWorldId === world.id ? (
                    <span className="text-xs text-gray-500">no code yet</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      onClick={() => requestCode(world.id)}
                      title="Ask a player in this world to share the join code"
                    >
                      <Send className="mr-1 h-3 w-3" />
                      Request code
                    </Button>
                  )}
                  {world.region && (
                    <span className="rounded bg-muted px-1 py-0.5 text-[10px] uppercase text-gray-400">
                      {world.region}
                    </span>
                  )}
                  <span className="text-sm text-gray-300">
                    {formatAge(world.startedAt, now)}
                  </span>
                  {myWorldId === world.id && (
                    <Badge variant="outline" className="text-green-500">
                      You are here
                    </Badge>
                  )}
                  <span className="ml-auto text-xs text-gray-400">
                    {formatRelative(world.lastSeen, now)} ago
                  </span>
                </div>
                {Object.keys(world.activity).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Object.entries(world.activity)
                      .sort((a, b) => b[1] - a[1])
                      .map(([bucket, ts]) => (
                        <Badge key={bucket} variant="outline">
                          {ACTIVITY_LABELS[bucket] ?? bucket} ·{" "}
                          {formatRelative(ts, now)}
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <SheetDescription>
          <span className="text-gray-300 text-sm">
            {data ? `Updated ${formatRelative(data.updatedAt, now)} ago` : ""}
          </span>
        </SheetDescription>
      </SheetContent>
    </Sheet>
  );
}
