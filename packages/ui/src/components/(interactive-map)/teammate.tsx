"use client";

import { useEffect, useRef } from "react";
import { useMap } from "./store";
import { PlayerMarker } from "./player-marker";
import leaflet from "leaflet";
import { getIconsUrl, MarkerOptions, TilesConfig } from "@repo/lib";
import { useSettingsStore } from "@repo/lib";
import { applyColorBlindTransform } from "./color-blind";
import type { ColorBlindMode } from "@repo/lib";
import { useThrottledEffect } from "../ui/useThrottleEffect";
import type { RemotePlayer } from "../(providers)/peers-store";

export function Teammate({
  appName,
  player,
  markerOptions,
  iconsPath,
  tilesConfig,
}: {
  appName: string;
  player: RemotePlayer;
  markerOptions: MarkerOptions;
  iconsPath: string;
  tilesConfig: TilesConfig;
}): JSX.Element {
  const map = useMap();
  const marker = useRef<PlayerMarker | null>(null);
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const playerIconSize = useSettingsStore((state) => state.playerIconSize);
  const colorBlindMode = useSettingsStore((state) => state.colorBlindMode);
  const colorBlindSeverity = useSettingsStore(
    (state) => state.colorBlindSeverity,
  );

  const iconCache = useRef<Map<string, string>>(new Map());

  async function buildIcon(
    iconUrl: string,
    size: number[],
    mode: ColorBlindMode,
    severity: number,
  ) {
    const cacheKey = `${iconUrl}@${size[0]}x${size[1]}:${mode}:${severity.toFixed(2)}`;
    const cached = iconCache.current.get(cacheKey);
    if (cached) {
      return leaflet.icon({
        iconUrl: cached,
        className: "player",
        iconSize: size as any,
      });
    }
    if (mode === "none" || severity <= 0) {
      return leaflet.icon({
        iconUrl,
        className: "player",
        iconSize: size as any,
      });
    }
    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("teammate-icon-load"));
        img.src = iconUrl;
      });
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = iconUrl;
      const canvas = document.createElement("canvas");
      const [w, h] = size;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      applyColorBlindTransform(
        imageData.data,
        mode as Exclude<ColorBlindMode, "none">,
        severity,
      );
      ctx.putImageData(imageData, 0, 0);
      const dataUrl = canvas.toDataURL();
      iconCache.current.set(cacheKey, dataUrl);
      return leaflet.icon({
        iconUrl: dataUrl,
        className: "player",
        iconSize: size as any,
      });
    } catch (e) {
      // Fallback to unprocessed icon on error
      return leaflet.icon({
        iconUrl,
        className: "player",
        iconSize: size as any,
      });
    }
  }

  useEffect(() => {
    if (!map?.mapName) {
      return;
    }

    const isOnMap = !player.mapName || player.mapName === map.mapName;
    if (!isOnMap) {
      return;
    }

    const run = async () => {
      // Use a different icon for teammates
      const iconName = markerOptions.playerIcon
        ? `/icons/${markerOptions.playerIcon}`
        : "https://th.gl/global_icons/player.png";
      const iconUrl = getIconsUrl(appName, iconName, iconsPath);
      // Slightly smaller size for teammates (30px base instead of 36px)
      const width = Math.max(
        10,
        Math.round(30 * baseIconSize * playerIconSize),
      );
      const height = Math.max(
        10,
        Math.round(30 * baseIconSize * playerIconSize),
      );
      const size = [width, height];
      const icon = await buildIcon(
        iconUrl,
        size,
        colorBlindMode,
        colorBlindSeverity,
      );

      if (!marker.current) {
        const tile = tilesConfig[map.mapName];
        const rotationOffset = tile?.rotation?.angle;
        marker.current = new PlayerMarker([player.x, player.y], {
          icon,
          interactive: true, // Enable interaction for tooltip
          rotation: player.r,
          pane: "tooltipPane",
          rotationOffset,
        });
        // Add tooltip with player name
        if (player.name) {
          marker.current.bindTooltip(player.name, {
            permanent: false,
            direction: "top",
            offset: [0, -20],
            className: "teammate-tooltip",
          });
        }
      } else {
        marker.current.setIcon(icon);
        marker.current.updatePosition(player);
        // Update tooltip if name changed
        if (player.name) {
          marker.current.unbindTooltip();
          marker.current.bindTooltip(player.name, {
            permanent: false,
            direction: "top",
            offset: [0, -20],
            className: "teammate-tooltip",
          });
        }
      }
      try {
        marker.current.addTo(map);
      } catch (e) {}
    };

    run();

    return () => {
      try {
        marker.current?.remove();
        marker.current = null;
      } catch (e) {}
    };
  }, [map?.mapName, player?.mapName]);

  // Update icon when size or color-blind mode changes
  useEffect(() => {
    if (!marker.current) return;
    const run = async () => {
      const iconName = markerOptions.playerIcon
        ? `/icons/${markerOptions.playerIcon}`
        : "https://th.gl/global_icons/player.png";
      const iconUrl = getIconsUrl(appName, iconName, iconsPath);
      const width = Math.max(
        10,
        Math.round(30 * baseIconSize * playerIconSize),
      );
      const height = Math.max(
        10,
        Math.round(30 * baseIconSize * playerIconSize),
      );
      const size = [width, height];
      const newIcon = await buildIcon(
        iconUrl,
        size,
        colorBlindMode,
        colorBlindSeverity,
      );
      try {
        marker.current?.setIcon(newIcon);
      } catch (e) {}
    };
    run();
  }, [baseIconSize, playerIconSize, colorBlindMode]);

  useThrottledEffect(
    () => {
      if (!map?.mapName || !player || !marker.current) {
        return;
      }
      marker.current.updatePosition(player);
    },
    [map?.mapName, player],
    50,
  );

  return <></>;
}
