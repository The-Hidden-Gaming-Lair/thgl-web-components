"use client";

import { isOverwolf, isThglApp, useGameState } from "@repo/lib";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../(controls)";
import { Copy, Server, Clock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { usePaliaTime } from "./palia-time";
import { usePreviewReleaseGate } from "../(apps)/preview-release-guard";

const WORLDS_API = "https://palia-api.th.gl/worlds";
const TRACKER_URL = "https://palia.th.gl/worlds";

type PublicWorld = {
  id: string;
  joinCode: string | null;
  region: string | null;
  startedAt: number | null;
  codeRequested: boolean;
};
type WorldsResponse = { updatedAt: number; worlds: PublicWorld[] };

// A Palia serverId encodes zone + region + a unique instance id (Palia streams
// each zone as its own server), e.g. "palia-adventure-2-x86cf-wmlxg" — turn it
// into a readable label.
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
  if (!startedAt) return "New";
  const totalMinutes = Math.max(0, Math.floor((now - startedAt) / 60_000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m old` : `${m}m old`;
}

// Sidebar entry. Browsing all active worlds lives on the /worlds PAGE now, so on
// the web this collapses to just the in-game clock. IN-APP (overlay/desktop),
// where there's no page navigation, it becomes a focused "Your World" panel:
// your current world + join code for quick sharing, plus a link to the tracker.
export function PaliaActiveWorlds() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<WorldsResponse | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The app publishes the local ServerId as player.worldId (menu-independent).
  const player = useGameState((state) => state.player) as {
    worldId?: string;
  } | null;
  const myWorldId = player?.worldId ?? null;
  const paliaTime = usePaliaTime();
  const previewGate = usePreviewReleaseGate();
  // In-app only + Elite/preview-gated. Everyone else just gets the clock.
  const showPanel = (isThglApp || isOverwolf) && previewGate === "allow";
  const myWorld =
    (myWorldId && data?.worlds.find((w) => w.id === myWorldId)) || null;

  const refresh = useCallback(() => {
    fetch(WORLDS_API)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((json: WorldsResponse) => setData(json))
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!showPanel) return; // web / non-preview: clock only, don't poll
    refresh();
    const poll = setInterval(refresh, isOpen ? 30_000 : 60_000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [isOpen, refresh, showPanel]);

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => null);
    setCopied(true);
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopied(false), 1500);
  };

  // Web (or in-app non-preview): keep only the in-game clock.
  if (!showPanel) {
    return (
      <div className="flex w-full items-center px-3 py-1.5 text-sm text-gray-300">
        <Clock className="mr-2 h-4 w-4" />
        <span className="grow text-left">Palia Time</span>
        {paliaTime}
      </div>
    );
  }

  const { zone, id } = worldName(myWorldId ?? "");
  const codeCopy = (code: string) => (
    <button
      type="button"
      onClick={() => copy(code)}
      className="inline-flex items-center gap-1 font-mono text-gray-100 hover:text-white"
      title="Copy join code"
    >
      <Copy className="h-3 w-3" />
      {copied ? "Copied!" : code}
    </button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost" className="w-full">
          <Server className="mr-2 h-4 w-4" />
          <span className="grow text-left">Your World</span>
          {paliaTime}
        </Button>
      </SheetTrigger>

      {/* Always-visible at-a-glance line: your world + code */}
      {myWorldId && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 px-4 pb-1 text-xs text-gray-400">
          <span className="font-medium text-gray-200" title={myWorldId}>
            {zone}
          </span>
          {myWorld?.region && (
            <span className="rounded bg-muted px-1 py-0.5 text-[10px] uppercase text-gray-400">
              {myWorld.region}
            </span>
          )}
          <span>·</span>
          {myWorld?.joinCode ? (
            codeCopy(myWorld.joinCode)
          ) : (
            <span className="text-gray-500">no code shared</span>
          )}
        </div>
      )}

      <SheetContent side="left" className="flex flex-col gap-4">
        <SheetHeader>
          <SheetTitle>Your World</SheetTitle>
          <SheetDescription>
            Share your world so friends — or players on the Active Worlds
            tracker — can join you.
          </SheetDescription>
        </SheetHeader>

        {myWorldId ? (
          <div className="space-y-3 text-sm">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-100">{zone}</span>
                {myWorld?.region && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-gray-400">
                    {myWorld.region}
                  </span>
                )}
                {id && (
                  <span className="font-mono text-[11px] text-gray-500">
                    {id}
                  </span>
                )}
              </div>
              {myWorld?.startedAt && (
                <p className="mt-0.5 text-xs text-gray-500">
                  {formatAge(myWorld.startedAt, now)}
                </p>
              )}
            </div>

            {myWorld?.joinCode ? (
              <div className="rounded-md border border-border/50 bg-card/60 p-3">
                <p className="text-xs text-gray-400">Your join code</p>
                <div className="mt-1 text-lg font-semibold">
                  {codeCopy(myWorld.joinCode)}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Send it to a friend, or it's listed on the tracker for players
                  who requested it.
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-border/50 bg-card/60 p-3">
                {myWorld?.codeRequested && (
                  <p className="mb-1 text-xs font-medium text-amber-400">
                    A player wants to join your world.
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  Open the game menu (<b>Esc → World Code</b>) to share your
                  join code
                  {myWorld?.codeRequested
                    ? " with them"
                    : " so others can join"}
                  . The app posts it to the tracker automatically.
                </p>
              </div>
            )}

            <p className="text-xs text-gray-500">
              You'll get a prompt when someone wants to join. Turn it off in
              Settings → Palia.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            Join a Palia world to see it here.
          </p>
        )}

        <a
          href={TRACKER_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-auto inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Server className="h-3.5 w-3.5" />
          Browse all active worlds →
        </a>
      </SheetContent>
    </Sheet>
  );
}
