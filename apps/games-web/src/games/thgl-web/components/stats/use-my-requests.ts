"use client";

import { useCallback, useEffect, useState } from "react";
import type { StatsGame } from "@/lib/stats-types";

/**
 * Per-user request state (votes, pending requests, admin flag), fetched
 * client-side from the no-store /api/stats/requests/mine — the pages
 * themselves are edge-cached and identical for everyone.
 */

export type MyRequests = {
  signedIn: boolean;
  votes: string[];
  isAdmin: boolean;
  pending: StatsGame[];
  /** The signed-in user's own th.gl comments (they may delete them). */
  commentIds?: string[];
};

const EMPTY: MyRequests = {
  signedIn: false,
  votes: [],
  isAdmin: false,
  pending: [],
};

let inflight: Promise<MyRequests> | null = null;

function load(force = false): Promise<MyRequests> {
  if (!inflight || force) {
    inflight = fetch("/api/stats/requests/mine", {
      credentials: "include",
      cache: "no-store",
    })
      .then((r) => (r.ok ? (r.json() as Promise<MyRequests>) : EMPTY))
      .catch(() => EMPTY);
  }
  return inflight;
}

export function useMyRequests() {
  // null = still loading.
  const [state, setState] = useState<MyRequests | null>(null);
  useEffect(() => {
    let alive = true;
    load().then((s) => alive && setState(s));
    return () => {
      alive = false;
    };
  }, []);
  const refresh = useCallback(async () => {
    setState(await load(true));
  }, []);
  return { state, setState, refresh };
}

export function signInUrl(): string {
  const returnTo =
    typeof window === "undefined"
      ? "https://www.th.gl/requests"
      : window.location.href;
  return `/api/patreon/authorize?return_to=${encodeURIComponent(returnTo)}`;
}
