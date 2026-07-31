"use client";

import { useEffect, useState } from "react";
import {
  incidentMatchesSurface,
  type StatusDocument,
  type StatusIncident,
} from "@repo/lib";

const STATUS_URL =
  process.env.NODE_ENV === "development"
    ? "/api/status"
    : "https://www.th.gl/api/status";
const POLL_MS = 5 * 60 * 1000;
// Components every web/app surface depends on.
const SURFACE_COMPONENTS = ["auth", "database", "cdn", "search", "api-forge"];
// Auto-banner: hard outages only.
const AUTO_COMPONENTS = ["auth", "database", "cdn"];
const AUTO_ID = "auto-hard-outage";
const DISMISS_HOURS = 6;

interface Banner {
  id: string;
  severity: "degraded" | "outage";
  text: string;
}

// Session-scope fallback when localStorage is unavailable.
const sessionDismissed = new Set<string>();

function dismissed(id: string): boolean {
  if (sessionDismissed.has(id)) return true;
  try {
    const raw = localStorage.getItem(`status-dismiss-${id}`);
    return (
      raw !== null && Date.now() - Number(raw) < DISMISS_HOURS * 3600 * 1000
    );
  } catch {
    return false;
  }
}

/** All applicable, non-dismissed messages for this surface, worst/most
 *  specific first. The banner renders the first and a "+N more" link;
 *  dismissing the first reveals the next. */
function toBanners(doc: StatusDocument, game: string | null): Banner[] {
  const banners: Banner[] = [];
  const surface = { components: SURFACE_COMPONENTS, game };
  // Open incidents (manual AND auto) matching this surface. Dismissal is
  // per MESSAGE, not per topic: the key includes createdAt, so a
  // re-opened incident that reuses a stable id (auto-<component>) or a
  // brand-new incident always re-shows. The 6h dismiss expiry is the
  // additional never-hidden-forever backstop for ongoing incidents.
  const incidents: StatusIncident[] = doc.incidents
    .filter((i) => i.resolvedAt === null)
    .filter((i) => incidentMatchesSurface(i, surface))
    .sort(
      (a, b) =>
        (a.severity === b.severity ? 0 : a.severity === "outage" ? -1 : 1) ||
        // Same severity: Leon's own words beat generic auto text.
        (a.source === b.source ? 0 : a.source === "manual" ? -1 : 1),
    );
  for (const incident of incidents) {
    const key = `${incident.id}:${incident.createdAt}`;
    if (dismissed(key)) continue;
    banners.push({
      id: key,
      severity: incident.severity,
      text: incident.body
        ? `${incident.title} — ${incident.body}`
        : incident.title,
    });
  }
  // Synthesized fallback for hard outages with NO readable incident row —
  // exactly the case where the DB itself is down and the incidents list
  // arrives empty. No timestamp available, so the coarse id + 6h expiry
  // governs re-showing. Provisional docs (on-demand fallback: single
  // un-suppressed probes) are excluded — one 5s probe timeout there used
  // to read as a site-wide outage, a recurring false positive right after
  // PC wake when the tab refetches immediately.
  const hardOutage =
    !doc.provisional &&
    doc.components.some(
      (c) => AUTO_COMPONENTS.includes(c.id) && c.state === "outage",
    );
  if (hardOutage && incidents.length === 0 && !dismissed(AUTO_ID)) {
    banners.push({
      id: AUTO_ID,
      severity: "outage",
      text: "Some features are temporarily degraded due to a service outage.",
    });
  }
  // Game-scoped live-mode flag (shown only on that game's surface). Key
  // includes the flag's updatedAt: editing the note or state counts as a
  // new message and re-shows immediately.
  const gameFlag = game
    ? doc.games.find((g) => g.id === game && g.liveMode !== null)
    : undefined;
  if (gameFlag?.liveMode) {
    const key = `flag-${gameFlag.id}:${gameFlag.liveMode.updatedAt}`;
    if (!dismissed(key)) {
      const flagBanner: Banner = {
        id: key,
        severity: gameFlag.liveMode.state === "outage" ? "outage" : "degraded",
        text:
          gameFlag.liveMode.note ?? `${gameFlag.label} live mode is degraded.`,
      };
      // The game-scoped message is the most relevant one on its own
      // surface — show it first.
      banners.unshift(flagBanner);
    }
  }
  return banners;
}

export function StatusBanner({
  game,
  className,
}: {
  game: string | null;
  /** Positioning per mount — fixed-header layouts overlay the banner
   *  below their header (it must not hide behind `fixed top-0` bars). */
  className?: string;
}) {
  const [doc, setDoc] = useState<StatusDocument | null>(null);
  // Bumped on dismiss so the banner list re-derives (localStorage isn't
  // reactive).
  const [, setDismissTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let visibleTimeout: ReturnType<typeof setTimeout> | null = null;
    const refresh = async () => {
      // Offline (e.g. right after PC wake, before the network is back):
      // the fetch can only fail or return junk — keep the last known doc.
      if (typeof navigator !== "undefined" && navigator.onLine === false)
        return;
      try {
        const res = await fetch(STATUS_URL);
        if (!res.ok) return;
        const nextDoc = (await res.json()) as StatusDocument;
        if (!cancelled) setDoc(nextDoc);
      } catch {
        // Status API unreachable — show nothing rather than guess.
      }
    };
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      // Small delay so a just-woken machine's network can settle first.
      if (visibleTimeout) clearTimeout(visibleTimeout);
      visibleTimeout = setTimeout(refresh, 2000);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (visibleTimeout) clearTimeout(visibleTimeout);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [game]);

  const banners = doc ? toBanners(doc, game) : [];
  const banner = banners[0];
  if (!banner) return null;
  const more = banners.length - 1;
  return (
    <div
      className={`flex items-center gap-2 px-4 py-1.5 text-sm backdrop-blur-xl ${banner.severity === "outage" ? "bg-red-500/15 text-red-200" : "bg-amber-500/15 text-amber-200"} ${className ?? ""}`}
    >
      <span className="grow">
        {banner.text}{" "}
        {more > 0 && (
          <a
            href="https://www.th.gl/status"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            …and {more} more
          </a>
        )}
        {more === 0 && (
          <a
            href="https://www.th.gl/status"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Status page
          </a>
        )}
      </span>
      <button
        aria-label="Dismiss"
        onClick={() => {
          sessionDismissed.add(banner.id);
          try {
            localStorage.setItem(
              `status-dismiss-${banner.id}`,
              String(Date.now()),
            );
          } catch {
            // localStorage unavailable — sessionDismissed covers this tab.
          }
          // Reveals the next message (if any) instead of hiding the bar.
          setDismissTick((t) => t + 1);
        }}
        className="opacity-70 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
