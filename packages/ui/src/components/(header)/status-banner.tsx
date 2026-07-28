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
    : "https://status.th.gl/api/status";
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

function dismissed(id: string): boolean {
  try {
    const raw = localStorage.getItem(`status-dismiss-${id}`);
    return (
      raw !== null && Date.now() - Number(raw) < DISMISS_HOURS * 3600 * 1000
    );
  } catch {
    return false;
  }
}

function toBanner(doc: StatusDocument, game: string | null): Banner | null {
  const surface = { components: SURFACE_COMPONENTS, game };
  // Manual incidents first — Leon's own words beat generic auto text.
  const incident: StatusIncident | undefined = doc.incidents
    .filter((i) => i.resolvedAt === null && i.source === "manual")
    .filter((i) => incidentMatchesSurface(i, surface))
    .sort((a, b) =>
      a.severity === b.severity ? 0 : a.severity === "outage" ? -1 : 1,
    )[0];
  if (incident && !dismissed(incident.id)) {
    return {
      id: incident.id,
      severity: incident.severity,
      text: incident.body
        ? `${incident.title} — ${incident.body}`
        : incident.title,
    };
  }
  const hardOutage = doc.components.some(
    (c) => AUTO_COMPONENTS.includes(c.id) && c.state === "outage",
  );
  if (hardOutage && !dismissed(AUTO_ID)) {
    return {
      id: AUTO_ID,
      severity: "outage",
      text: "Some features are temporarily degraded due to a service outage.",
    };
  }
  // Game-scoped live-mode flag (shown only on that game's surface).
  const gameFlag = game
    ? doc.games.find((g) => g.id === game && g.liveMode !== null)
    : undefined;
  if (gameFlag?.liveMode && !dismissed(`flag-${gameFlag.id}`)) {
    return {
      id: `flag-${gameFlag.id}`,
      severity: gameFlag.liveMode.state === "outage" ? "outage" : "degraded",
      text:
        gameFlag.liveMode.note ?? `${gameFlag.label} live mode is degraded.`,
    };
  }
  return null;
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
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await fetch(STATUS_URL);
        if (!res.ok) return;
        const doc = (await res.json()) as StatusDocument;
        if (!cancelled) setBanner(toBanner(doc, game));
      } catch {
        // Status API unreachable — show nothing rather than guess.
      }
    };
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [game]);

  if (!banner) return null;
  return (
    <div
      className={`flex items-center gap-2 px-4 py-1.5 text-sm backdrop-blur-xl ${banner.severity === "outage" ? "bg-red-500/15 text-red-200" : "bg-amber-500/15 text-amber-200"} ${className ?? ""}`}
    >
      <span className="grow">
        {banner.text}{" "}
        <a
          href="https://status.th.gl"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Status page
        </a>
      </span>
      <button
        aria-label="Dismiss"
        onClick={() => {
          try {
            localStorage.setItem(
              `status-dismiss-${banner.id}`,
              String(Date.now()),
            );
          } catch {
            // localStorage unavailable — dismiss for this render only.
          }
          setBanner(null);
        }}
        className="opacity-70 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
