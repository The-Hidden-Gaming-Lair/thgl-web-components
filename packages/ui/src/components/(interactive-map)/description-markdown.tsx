"use client";

import type { ReactNode } from "react";
import { useCallback } from "react";
import Markdown from "markdown-to-jsx";
import Link from "next/link";
import { localizePath } from "@repo/lib";
import { useLocale, useT, useUserStore } from "../(providers)";
import { useMapStore } from "./store";

// Shared renderer for marker DESCRIPTIONS (used by both the hover tooltip and the click-through
// details panel). Descriptions are markdown (`markdown-to-jsx`); the <a> override makes cross-links
// inside them behave:
//   • `/maps/<mapKey>/<filterId>/<spawnId>?id=<node>` — a marker deep link authored by data-forge
//     with RAW dict keys (the localized display names differ per locale). We resolve each segment
//     via `t()` for a canonical URL, but a LEFT click pans the map to the marker in place (select +
//     center, no navigation / reload) since the two /maps routes are separate pages with no shared
//     layout (Next routing would remount the map — the app itself uses replaceState for this).
//   • other internal links (`/db/...`) — client-side <Link> (soft nav).
//   • external links — new tab.

function resolveMapLink(
  href: string,
  t: (key: string, opts?: { fallback?: string }) => string,
): string {
  const [path, query] = href.split("?");
  const parts = path.split("/"); // ["", "maps", mapKey, filterId, spawnId]
  if (parts.length < 5) return href;
  const seg = (s: string) => encodeURIComponent(t(s, { fallback: s }));
  return `/maps/${seg(parts[2])}/${seg(parts[3])}/${seg(parts[4])}${query ? `?${query}` : ""}`;
}

type GameMapLike = {
  setCenter: (c: [number, number]) => void;
  getZoom: () => number;
  setZoom: (z: number) => void;
};

// Select + pan the map to a marker WITHOUT navigating. Target coords are encoded in the node id
// (`<prefix>@<lat>:<lng>`), so no lookup is needed. Same-map only (requirement links point at a boss
// on the map the marker is already on); a modified/middle click falls through to the href.
export function useFocusMarker() {
  const setSelectedNodeId = useUserStore((s) => s.setSelectedNodeId);
  return useCallback(
    (nodeId: string) => {
      const at = nodeId.split("@")[1];
      const [lat, lng] = at ? at.split(":").map(Number) : [NaN, NaN];
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;
      setSelectedNodeId(nodeId); // triggers useMarkerUrlSync -> replaceState URL update (no reload)
      const map = useMapStore.getState().map as
        | (GameMapLike & { minZoom?: number; maxZoom?: number })
        | null;
      if (!map) return;
      const targetZoom = Math.round(
        (map.minZoom ?? 0) + ((map.maxZoom ?? 10) - (map.minZoom ?? 0)) * 0.7,
      );
      map.setCenter([lat, lng]);
      if (map.getZoom() < targetZoom) map.setZoom(targetZoom);
    },
    [setSelectedNodeId],
  );
}

function mdOptions(
  locale: string,
  t: (key: string, opts?: { fallback?: string }) => string,
  focusMarker: (nodeId: string) => void,
) {
  const linkClass =
    "text-amber-400 underline underline-offset-2 hover:text-amber-300";
  return {
    forceBlock: false,
    overrides: {
      a: {
        component: ({
          href,
          children,
        }: {
          href?: string;
          children?: ReactNode;
        }) => {
          if (typeof href === "string" && href.startsWith("/maps/")) {
            const resolved = localizePath(resolveMapLink(href, t), locale);
            const m = href.match(/[?&]id=([^&]+)/);
            const nodeId = m ? decodeURIComponent(m[1]) : undefined;
            return (
              <a
                href={resolved}
                className={linkClass}
                onClick={(e) => {
                  // Let modified / non-left clicks open the real URL (new tab, cross-map SSR).
                  if (
                    !nodeId ||
                    e.metaKey ||
                    e.ctrlKey ||
                    e.shiftKey ||
                    e.button !== 0
                  )
                    return;
                  e.preventDefault();
                  e.stopPropagation();
                  focusMarker(nodeId);
                }}
              >
                {children}
              </a>
            );
          }
          if (typeof href === "string" && href.startsWith("/")) {
            return (
              <Link
                href={localizePath(href, locale)}
                prefetch={false}
                className={linkClass}
                onClick={(e) => e.stopPropagation()}
              >
                {children}
              </Link>
            );
          }
          return (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className={linkClass}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </a>
          );
        },
      },
    },
  };
}

/** Renders a marker description string as markdown with cross-link handling (map pan / db links). */
export function DescriptionMarkdown({ children }: { children: string }) {
  const locale = useLocale();
  const t = useT();
  const focusMarker = useFocusMarker();
  return (
    <Markdown options={mdOptions(locale, t, focusMarker)}>{children}</Markdown>
  );
}
