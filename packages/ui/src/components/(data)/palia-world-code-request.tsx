"use client";

import { useGameState, useSettingsStore } from "@repo/lib";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePreviewReleaseGate } from "../(apps)/preview-release-guard";

const REQUESTED_API = "https://palia-api.th.gl/worlds/requested";
const WORLDS_API = "https://palia-api.th.gl/worlds";
const FAQ_URL = "https://www.th.gl/faq/palia-active-worlds";
const POLL_MS = 8_000;
const TOAST_ID = "palia-world-code-request";

// Always-mounted (Palia additionalComponents). While the player is in a world,
// polls which worlds have an on-demand join-code request. If someone has asked
// for THIS world's code, prompt the player to open the invite panel so the app
// can capture + share it — then thank them once it's fulfilled. The prompt is
// sticky (it stays until shared/expired, not a 15s flash) and can be muted in
// Settings. Elite/preview-gated while the feature is in preview.
export function PaliaWorldCodeRequest() {
  const player = useGameState((state) => state.player) as {
    worldId?: string;
  } | null;
  const myWorldId = player?.worldId ?? null;
  const muted = useSettingsStore((s) => s.worldCodeRequestsMuted);
  const allowed = usePreviewReleaseGate() === "allow" && !muted;
  const wasRequested = useRef(false);

  // If the feature gets muted (or gated off) while a prompt is up, clear it.
  useEffect(() => {
    if (!allowed) {
      toast.dismiss(TOAST_ID);
      wasRequested.current = false;
    }
  }, [allowed]);

  useEffect(() => {
    if (!allowed) return;

    let cancelled = false;
    const check = () => {
      // Transient reads (e.g. while a menu is open) can drop the world id — skip
      // this tick rather than dismissing the sticky prompt out from under the user.
      if (!myWorldId) return;
      fetch(REQUESTED_API)
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then((json: { serverIds: string[] }) => {
          if (cancelled) return;
          const requested = json.serverIds?.includes(myWorldId) ?? false;
          if (requested && !wasRequested.current) {
            wasRequested.current = true;
            toast.info("A player wants to join your Palia world", {
              id: TOAST_ID,
              duration: Infinity, // sticky until the code is shared or expires
              description:
                "Someone found your world on the TH.GL Active Worlds tracker. Open the game menu (Esc) → World Code to share your join code with them.",
              action: {
                label: "What's this?",
                onClick: () =>
                  window.open(FAQ_URL, "_blank", "noopener,noreferrer"),
              },
            });
          } else if (!requested && wasRequested.current) {
            wasRequested.current = false;
            // Requested → not-requested means either the code was shared OR the
            // request expired unfulfilled. Only thank the player if a code
            // actually landed; otherwise quietly dismiss.
            fetch(WORLDS_API)
              .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
              .then(
                (data: {
                  worlds: { id: string; joinCode: string | null }[];
                }) => {
                  const world = data.worlds?.find((w) => w.id === myWorldId);
                  if (world?.joinCode) {
                    toast.success("Thanks for sharing your world!", {
                      id: TOAST_ID,
                      duration: 4_000,
                    });
                  } else {
                    toast.dismiss(TOAST_ID);
                  }
                },
              )
              .catch(() => toast.dismiss(TOAST_ID));
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
