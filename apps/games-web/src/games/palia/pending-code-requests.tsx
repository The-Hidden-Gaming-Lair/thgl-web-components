"use client";

import {
  XIcon,
  CheckIcon,
  CopyIcon,
  Loader2Icon,
  ClockIcon,
} from "lucide-react";
import type { PublicWorld } from "./active-worlds-client";
import { worldName } from "./world-name";

export type PendingRequestStrings = {
  pendingTitle: string;
  pendingWaiting: string;
  pendingWaitingHint: string;
  pendingReporters: string;
  pendingArrived: string;
  pendingExpired: string;
  cancel: string;
  copied: string;
  copyCode: string;
};

// A compact tracker card for the join-code requests THIS visitor has made.
// Shows live progress (a player in that world is being nudged to share the
// code), lets them cancel, and surfaces the code the moment it lands.
export default function PendingCodeRequests({
  worlds,
  myRequests,
  ttlMs,
  now,
  copiedId,
  onCancel,
  onCopy,
  strings,
}: {
  worlds: PublicWorld[];
  myRequests: Set<string>;
  ttlMs: number;
  now: number;
  copiedId: string | null;
  onCancel: (serverId: string) => void;
  onCopy: (code: string) => void;
  strings: PendingRequestStrings;
}) {
  const byId = new Map(worlds.map((w) => [w.id, w]));
  const entries = [...myRequests]
    .map((id) => byId.get(id))
    .filter(Boolean) as PublicWorld[];
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="font-medium text-foreground">
          {strings.pendingTitle}
        </span>
      </div>
      <ul className="space-y-2">
        {entries.map((w) => {
          const arrived = !!w.joinCode;
          const pending = !arrived && w.codeRequested;
          const expired = !arrived && !w.codeRequested;
          const startedAt = w.codeRequestedAt ?? now;
          const elapsed = Math.max(0, now - startedAt);
          const pct = Math.min(100, Math.round((elapsed / ttlMs) * 100));

          return (
            <li
              key={w.id}
              className="rounded-lg border border-border/50 bg-card/60 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground" title={w.id}>
                  <span className="font-medium">{worldName(w.id).zone}</span>
                  <span className="ml-1 font-mono text-muted-foreground">
                    {worldName(w.id).id}
                  </span>
                </span>
                {w.region && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                    {w.region}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-2">
                  {arrived ? (
                    <button
                      type="button"
                      onClick={() => onCopy(w.joinCode!)}
                      className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-1 font-mono text-xs text-emerald-300 transition-colors hover:bg-emerald-500/25"
                    >
                      {copiedId === w.joinCode ? (
                        <CheckIcon className="h-3 w-3" />
                      ) : (
                        <CopyIcon className="h-3 w-3" />
                      )}
                      {copiedId === w.joinCode ? strings.copied : w.joinCode}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onCancel(w.id)}
                    className="inline-flex items-center gap-1 rounded border border-border/60 px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
                    title={strings.cancel}
                    aria-label={strings.cancel}
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              </div>

              {pending && (
                <div className="mt-2">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Loader2Icon className="h-3 w-3 animate-spin text-primary" />
                    <span>{strings.pendingWaiting}</span>
                    <span className="ml-auto tabular-nums">
                      {w.reporters} {strings.pendingReporters}
                    </span>
                  </div>
                  {/* TTL progress — the request auto-expires when this fills */}
                  <div className="h-1 w-full overflow-hidden rounded-full bg-border/50">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-[width] duration-1000 ease-linear"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {strings.pendingWaitingHint}
                  </p>
                </div>
              )}

              {arrived && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400">
                  <CheckIcon className="h-3 w-3" /> {strings.pendingArrived}
                </p>
              )}

              {expired && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-400">
                  <ClockIcon className="h-3 w-3" /> {strings.pendingExpired}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
