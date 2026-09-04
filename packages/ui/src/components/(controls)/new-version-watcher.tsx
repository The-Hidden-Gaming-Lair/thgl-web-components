"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAppUpdateStore } from "../(providers)/app-update-store";

// Baked into the client bundle at build time (Docker build-arg CLIENT_SHA →
// NEXT_PUBLIC_CLIENT_SHA). Deliberately NOT the per-deploy git SHA: this
// hashes only the client-relevant source trees (games-web-deploy.yml
// "Compute client build identity"), so deploys that only ship public/
// payloads (THGLApp installer, OG images) keep the same value and don't
// prompt every open tab to reload an unchanged web app. Empty/undefined in
// `next dev`, which disables *detection* (but not the test seam below).
const CLIENT_BUILD_SHA = process.env.NEXT_PUBLIC_CLIENT_SHA;

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const MIN_CHECK_GAP_MS = 60 * 1000;

/**
 * Detects that the deployed build no longer matches the one this tab is
 * running. Deliberately NEVER reloads automatically — an automatic reload
 * could loop if the mismatch persists (e.g. an edge still serving old HTML
 * after a deploy).
 *
 * Two triggers:
 *  1. Polling `/api/build-id` (no-store) while the tab is visible, plus an
 *     immediate check when the tab regains visibility.
 *  2. A ChunkLoadError anywhere (window `error` / `unhandledrejection`) —
 *     the running build tried to lazy-load a chunk that no longer resolves,
 *     so navigation is broken until the user reloads.
 *
 * How each is surfaced (see also `NewVersionButton`, which renders the quiet
 * reload affordance in the header):
 *  - stale  → header button ONLY. Every deploy, immediately, no toast. A
 *             stale-but-working tab is not an emergency: treating it as one
 *             meant second-screen users (Peer Link on a tablet) got a sticky
 *             toast once per deploy — five-plus times on a busy day.
 *  - broken → header button (amber ring) AND a persistent toast, every time.
 *             A dead chunk makes the page unusable, so that one still shouts.
 *
 * NOTE this component is mounted OUTSIDE `I18NProvider` in both root layouts,
 * so it must not call `useT` (which throws without the provider). The toast
 * copy stays English here; the header button, which is inside the provider,
 * is translated.
 */
export function NewVersionWatcher() {
  const notifiedRef = useRef(false);
  const lastCheckRef = useRef(0);
  const markStale = useAppUpdateStore((s) => s.markStale);
  const markBroken = useAppUpdateStore((s) => s.markBroken);

  // The effect below is mount-once; keep the latest actions in a ref so it
  // never needs them in its dependency array.
  const actionsRef = useRef({ markStale, markBroken });
  actionsRef.current = { markStale, markBroken };

  useEffect(() => {
    const notify = (broken: boolean) => {
      if (notifiedRef.current) return;
      notifiedRef.current = true;

      if (!broken) {
        actionsRef.current.markStale();
        return;
      }

      actionsRef.current.markBroken();
      toast.info("A new version is available", {
        description: "This page needs a reload to keep working.",
        duration: Infinity,
        action: {
          label: "Reload",
          onClick: () => window.location.reload(),
        },
      });
    };

    // Test seam — registered even when detection is disabled (`next dev` has
    // no CLIENT_SHA) so both states can be driven from the browser without a
    // real deploy. See docs/THGL_FRONTEND_GUIDE.md.
    const w = window as unknown as Record<string, unknown>;
    w.__thglSimulateUpdate = (broken?: boolean) => {
      notifiedRef.current = false;
      notify(broken === true);
    };
    const cleanupSeam = () => {
      delete w.__thglSimulateUpdate;
    };

    if (!CLIENT_BUILD_SHA) return cleanupSeam;

    const check = async () => {
      if (notifiedRef.current) return;
      const now = Date.now();
      if (now - lastCheckRef.current < MIN_CHECK_GAP_MS) return;
      lastCheckRef.current = now;
      try {
        const res = await fetch("/api/build-id", { cache: "no-store" });
        if (!res.ok) return;
        const { clientSha } = (await res.json()) as { clientSha?: string };
        if (clientSha && clientSha !== CLIENT_BUILD_SHA) notify(false);
      } catch {
        // Network hiccup — next poll retries.
      }
    };

    const isChunkLoadMessage = (msg: unknown) =>
      typeof msg === "string" &&
      (msg.includes("ChunkLoadError") || msg.includes("Failed to load chunk"));

    const onError = (event: ErrorEvent) => {
      if (
        (event.error as Error | undefined)?.name === "ChunkLoadError" ||
        isChunkLoadMessage(event.message)
      ) {
        notify(true);
      }
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as Error | undefined;
      if (
        reason?.name === "ChunkLoadError" ||
        isChunkLoadMessage(reason?.message)
      ) {
        notify(true);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void check();
    }, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
      cleanupSeam();
    };
  }, []);

  return null;
}
