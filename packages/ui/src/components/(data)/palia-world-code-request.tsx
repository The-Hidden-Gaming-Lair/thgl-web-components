"use client";

import { useGameState } from "@repo/lib";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePreviewReleaseGate } from "../(apps)/preview-release-guard";

const REQUESTED_API = "https://palia-api.th.gl/worlds/requested";
const POLL_MS = 8_000;
const TOAST_ID = "palia-world-code-request";

// Always-mounted (Palia additionalComponents). While the player is in a world,
// polls which worlds have an on-demand join-code request. If someone has asked
// for THIS world's code, prompt the player to open the invite panel so the app
// can capture + share it — then thank them once it's fulfilled.
export function PaliaWorldCodeRequest() {
  const player = useGameState((state) => state.player) as {
    worldId?: string;
  } | null;
  const myWorldId = player?.worldId ?? null;
  const wasRequested = useRef(false);
  // Elite-only preview: don't nudge non-preview players to share codes yet.
  const allowed = usePreviewReleaseGate() === "allow";

  useEffect(() => {
    if (!allowed || !myWorldId) {
      if (wasRequested.current) {
        toast.dismiss(TOAST_ID);
        wasRequested.current = false;
      }
      return;
    }

    let cancelled = false;
    const check = () => {
      fetch(REQUESTED_API)
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then((json: { serverIds: string[] }) => {
          if (cancelled) {
            return;
          }
          const requested = json.serverIds?.includes(myWorldId) ?? false;
          if (requested && !wasRequested.current) {
            wasRequested.current = true;
            toast.info(
              "Someone wants to join your world — open the game menu (Esc) → World Code to share it.",
              { id: TOAST_ID, duration: 15_000 },
            );
          } else if (!requested && wasRequested.current) {
            // No longer requested = a code got shared (by you or someone here).
            wasRequested.current = false;
            toast.success("Thanks for sharing your world!", {
              id: TOAST_ID,
              duration: 4_000,
            });
          }
        })
        .catch(() => null);
    };

    check();
    const interval = setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [myWorldId, allowed]);

  return null;
}
