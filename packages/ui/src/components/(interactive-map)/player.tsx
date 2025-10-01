"use client";

import { useEffect, useRef } from "react";
import { useMap } from "./store";
import { PlayerMarker } from "./player-marker";
import leaflet from "leaflet";
import type { ActorPlayer } from "@repo/lib/overwolf";
import {
  getIconsUrl,
  MarkerOptions,
  TilesConfig,
  useUserStore,
} from "@repo/lib";
import { useSettingsStore } from "@repo/lib";
import { useT } from "../(providers)";
import { applyColorBlindTransform } from "./color-blind";
import type { ColorBlindMode } from "@repo/lib";
import { useThrottledEffect } from "../ui/useThrottleEffect";

export function Player({
  appName,
  player,
  markerOptions,
  iconsPath,
  tilesConfig,
}: {
  appName: string;
  player: ActorPlayer;
  markerOptions: MarkerOptions;
  iconsPath: string;
  tilesConfig: TilesConfig;
}): JSX.Element {
  const map = useMap();
  const marker = useRef<PlayerMarker | null>(null);
  const followPlayerPosition = true;
  const setMapName = useUserStore((state) => state.setMapName);
  const t = useT();
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
        img.onerror = () => reject(new Error("player-icon-load"));
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
      const iconName = markerOptions.playerIcon
        ? `/icons/${markerOptions.playerIcon}`
        : "https://th.gl/global_icons/player.png";
      const iconUrl = getIconsUrl(appName, iconName, iconsPath);
      const size = [
        36 * baseIconSize * playerIconSize,
        36 * baseIconSize * playerIconSize,
      ];
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
          interactive: false,
          rotation: player.r,
          pane: "tooltipPane",
          rotationOffset,
        });
      } else {
        marker.current.setIcon(icon);
        marker.current.updatePosition(player);
      }
      console.log(
        "Rebuilding player icon with URL:",
        iconUrl,
        icon,
        marker.current.getIcon(),
      );

      try {
        marker.current.addTo(map);
        map.panTo([player.x, player.y], {
          animate: false,
          duration: 0,
          easeLinearity: 1,
          noMoveStart: true,
        });
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
      const size = [
        36 * baseIconSize * playerIconSize,
        36 * baseIconSize * playerIconSize,
      ];
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

  const lastAnimation = useRef(0);

  useThrottledEffect(
    () => {
      if (!map?.mapName || !player || !marker.current) {
        return;
      }
      marker.current.updatePosition(player);

      const isOnMap = !player.mapName || player.mapName === map.mapName;
      if (!isOnMap) {
        return;
      }

      if (followPlayerPosition) {
        const now = Date.now();
        if (now - lastAnimation.current > 500) {
          lastAnimation.current = now;
          document
            .querySelector(".leaflet-map-pane")
            ?.classList.add(
              "transition-transform",
              "ease-linear",
              "duration-1000",
            );
          map.panTo([player.x, player.y], {
            animate: false,
            duration: 0,
            easeLinearity: 1,
            noMoveStart: true,
          });
        }
      }
    },
    [map?.mapName, player, followPlayerPosition],
    50,
  );

  useEffect(() => {
    if (!player?.mapName || !map) {
      return;
    }
    if (!Object.keys(tilesConfig).includes(player.mapName)) {
      return;
    }
    if (player.mapName !== map.mapName) {
      console.log("Setting map name", player.mapName);
      setMapName(player.mapName, [player.x, player.y], map.getZoom());
      if (location.pathname.includes("/maps/")) {
        window.history.pushState({}, "", `/maps/${t(player.mapName)}`);
      }
    }
  }, [player?.mapName]);

  return <></>;
}
