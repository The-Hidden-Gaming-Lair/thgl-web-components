"use client";
import { useEffect } from "react";
import { ExternalLink } from "lucide-react";
import {
  apiGetByCode,
  serverFilterToLocal,
  useConnectionStore,
  type AppConfig,
  type TilesConfig,
} from "@repo/lib";
import { PrivateDrawing } from "../(interactive-map)";
import { AdditionalTooltipType } from "../(content)";
import { useT } from "../(providers)";
import { FullMapDynamic } from "./full-map-dynamic";

import type { JSX } from "react";

/**
 * A player's shared custom filter (`?share=<code>`): markers + drawings. Fed
 * through the Peer Link store, which the marker and drawing layers render for
 * every filter in it without touching the visitor's own saved filters.
 */
function SharedFilterLoader({ appName }: { appName: string }): null {
  const setMyFilters = useConnectionStore((state) => state.setMyFilters);
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("share");
    if (!code) return;
    let cancelled = false;
    apiGetByCode(code)
      .then((server) => {
        if (cancelled || (server.game && server.game !== appName)) return;
        setMyFilters([serverFilterToLocal(server)]);
      })
      .catch(() => {
        // Unknown / revoked code: the embed still shows the map.
      });
    return () => {
      cancelled = true;
    };
  }, [appName, setMyFilters]);
  return null;
}

/**
 * The map of an embed page (`<game>.th.gl/embed/maps/<Map>`): markers,
 * regions, drawings and tooltips, no filter panel or ads, plus a link to the
 * full map on th.gl.
 */
export function EmbedMap({
  appConfig,
  tilesConfig,
  iconsPath,
  additionalTooltip,
  fullMapUrl,
  title,
}: {
  appConfig: AppConfig;
  tilesConfig: TilesConfig;
  iconsPath: string;
  additionalTooltip?: AdditionalTooltipType;
  fullMapUrl: string;
  title: string;
}): JSX.Element {
  const t = useT();
  return (
    <div className="relative h-dscreen w-full overflow-hidden">
      <FullMapDynamic
        appConfig={appConfig}
        tilesConfig={tilesConfig}
        iconsPath={iconsPath}
        additionalTooltip={additionalTooltip}
        simple
      />
      <PrivateDrawing hidden />
      <SharedFilterLoader appName={appConfig.name} />
      <a
        href={fullMapUrl}
        target="_blank"
        rel="noopener"
        className="absolute left-2 top-2 z-500 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-md border border-input bg-background/90 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm transition-colors hover:bg-accent"
      >
        <span className="truncate">{title}</span>
        <span className="shrink-0 text-muted-foreground">
          {t("embed.openFullMap", { fallback: "Open full map" })}
        </span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      </a>
    </div>
  );
}
