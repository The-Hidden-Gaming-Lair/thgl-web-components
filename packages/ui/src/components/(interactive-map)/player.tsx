"use client";

import { useEffect, useMemo, useRef, type JSX } from "react";
import { useUserStore } from "../(providers)";
import { useMap } from "./store";
import { PlayerMarker } from "./player-marker";
import { rotateCoordinate } from "./rotation";
import type { ActorPlayer } from "@repo/lib/overwolf";
import {
  getIconsUrl,
  isSameWorld,
  MarkerOptions,
  TilesConfig,
} from "@repo/lib";
import { useSettingsStore } from "@repo/lib";
import { useT } from "../(providers)";
import { applyColorBlindTransform } from "./color-blind";
import type { ColorBlindMode } from "@repo/lib";
import { DrawingLayer } from "@repo/lib/web-map";

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
  const setMapName = useUserStore((state) => state.setMapName);
  const t = useT();
  const followPlayerPosition = useSettingsStore((state) => state.followPlayer);
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const playerIconSize = useSettingsStore((state) => state.playerIconSize);
  const colorBlindMode = useSettingsStore((state) => state.colorBlindMode);
  const colorBlindSeverity = useSettingsStore(
    (state) => state.colorBlindSeverity,
  );

  // Memoize icon URL and size to avoid recalculating on every render
  const iconUrl = useMemo(() => {
    const iconName = markerOptions.playerIcon
      ? `/icons/${markerOptions.playerIcon}`
      : "https://th.gl/global_icons/player.png";
    return getIconsUrl(appName, iconName, iconsPath);
  }, [appName, markerOptions.playerIcon, iconsPath]);

  const iconSize = useMemo(
    () => [
      36 * baseIconSize * playerIconSize,
      36 * baseIconSize * playerIconSize,
    ],
    [baseIconSize, playerIconSize],
  );

  const iconImageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  async function buildIconImage(
    iconUrl: string,
    mode: ColorBlindMode,
    severity: number,
  ): Promise<HTMLImageElement> {
    const cacheKey = `${iconUrl}:${mode}:${severity.toFixed(2)}`;
    const cached = iconImageCache.current.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Load the source image
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("player-icon-load"));
      image.src = iconUrl;
    });

    // If no color blind transform needed, return original
    if (mode === "none" || severity <= 0) {
      iconImageCache.current.set(cacheKey, img);
      return img;
    }

    // Apply color blind transform
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyColorBlindTransform(
      imageData.data,
      mode as Exclude<ColorBlindMode, "none">,
      severity,
    );
    ctx.putImageData(imageData, 0, 0);

    // Create a new image from the processed canvas
    const processedImg = await new Promise<HTMLImageElement>(
      (resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("player-icon-process"));
        image.src = canvas.toDataURL();
      },
    );

    iconImageCache.current.set(cacheKey, processedImg);
    return processedImg;
  }

  useEffect(() => {
    const playerLayer = map?.liveMarkerLayer ?? map?.markerLayer;
    if (!map?.mapName || !playerLayer) {
      return;
    }

    const isOnMap =
      !player.mapName || isSameWorld(player.mapName, map.mapName, tilesConfig);
    if (!isOnMap) {
      return;
    }

    // This effect re-runs on map/player mapName changes and `run()` is async
    // (it awaits the icon image load), so guard against a stale in-flight run
    // mutating the marker after this effect has been cleaned up / superseded.
    let cancelled = false;

    const run = async () => {
      // Load the player icon. Previously this `await` could reject (image
      // `onerror` — a transient network failure, a cached 404, or a CORS-tainted
      // cached response since the image uses crossOrigin) and `run()` rejected
      // UNHANDLED — so the marker was never created and the player icon silently
      // failed to appear (intermittently, on restart). Catch it, log it, and
      // retry once with a cache-busted URL to bypass a poisoned cache entry.
      let iconImage: HTMLImageElement;
      try {
        iconImage = await buildIconImage(
          iconUrl,
          colorBlindMode,
          colorBlindSeverity,
        );
      } catch (err) {
        if (cancelled) return;
        const retryUrl =
          iconUrl + (iconUrl.includes("?") ? "&" : "?") + "r=" + Date.now();
        console.warn(
          `[player] icon load failed for ${iconUrl}; retrying with ${retryUrl}`,
          err,
        );
        try {
          iconImage = await buildIconImage(
            retryUrl,
            colorBlindMode,
            colorBlindSeverity,
          );
        } catch (err2) {
          console.error(
            `[player] icon load failed again for ${iconUrl}; player marker not drawn`,
            err2,
          );
          return;
        }
      }

      if (cancelled) return;

      const tile = tilesConfig[map.mapName];
      const rotationOffset = tile?.rotation?.angle;

      // Apply rotation to player position if configured
      let playerPosition: [number, number] = [player.x, player.y];
      const rotationDegrees = map._rotationDegrees;
      const rotationCenter = map._rotationCenter;
      if (rotationDegrees && rotationCenter) {
        playerPosition = rotateCoordinate(
          [player.x, player.y],
          rotationDegrees,
          rotationCenter,
        );
      }

      // Calculate pixel size
      const size = Math.max(10, Math.round(iconSize[0]));

      if (!marker.current) {
        marker.current = new PlayerMarker(playerPosition, {
          id: "player",
          rotation: player.r,
          rotationOffset,
          size,
        });
        marker.current.setIcon(iconImage);
        marker.current.addTo(playerLayer);
      } else {
        marker.current.setIcon(iconImage);
        marker.current.setSize(size);
        // Create a modified player object with rotated coordinates
        marker.current.updatePosition({
          ...player,
          x: playerPosition[0],
          y: playerPosition[1],
        });
      }

      // Pan to player position
      map.setCenter(playerPosition);
    };

    run();

    return () => {
      cancelled = true;
      marker.current?.remove();
      marker.current = null;
    };
  }, [map?.mapName, player?.mapName]);

  // Update icon when size or color-blind mode changes
  useEffect(() => {
    if (!marker.current) return;
    const run = async () => {
      let iconImage: HTMLImageElement;
      try {
        iconImage = await buildIconImage(
          iconUrl,
          colorBlindMode,
          colorBlindSeverity,
        );
      } catch (err) {
        console.warn(`[player] icon reload failed for ${iconUrl}`, err);
        return; // keep the existing icon rather than rejecting unhandled
      }
      marker.current?.setIcon(iconImage);
      const size = Math.max(10, Math.round(iconSize[0]));
      marker.current?.setSize(size);
    };
    run();
  }, [iconUrl, iconSize, colorBlindMode, colorBlindSeverity]);

  // Use stable primitives as deps so this effect only fires when the
  // player position or facing direction (rotation) actually changes, not on every game state emission.
  const px = player?.x;
  const py = player?.y;
  const pz = player?.z;
  const pr = player?.r;
  const pMap = player?.mapName;

  useEffect(() => {
    if (!map?.mapName || px == null || py == null || !marker.current) {
      return;
    }

    // Apply rotation to player position if configured on the map projection
    let playerPosition: [number, number] = [px, py];
    const rotationDegrees = map._rotationDegrees;
    const rotationCenter = map._rotationCenter;
    if (rotationDegrees && rotationCenter) {
      playerPosition = rotateCoordinate(
        [px, py],
        rotationDegrees,
        rotationCenter,
      );
    }

    // Update player marker position (DOM marker with CSS transition, cheap)
    marker.current.updatePosition({
      ...player,
      x: playerPosition[0],
      y: playerPosition[1],
    });

    const isOnMap = !pMap || isSameWorld(pMap, map.mapName, tilesConfig);
    if (!isOnMap) {
      return;
    }

    if (followPlayerPosition) {
      map.panTo(playerPosition);
    }
  }, [map?.mapName, px, py, pz, pr, pMap, followPlayerPosition, tilesConfig]);

  // Live map-follow: when the player crosses to a DIFFERENT map (game map / instance),
  // switch the viewed map to theirs. Edge-triggered on the player's map so it doesn't
  // fight manual browsing. It does NOT follow the player into a layered interior: the
  // `sameWorld` guard keeps a manual layer pick (e.g. viewing the parent's Underground)
  // from being yanked back to the surface, since the player's position already shows
  // on both.
  const lastPlayerMapRef = useRef<string | null>(null);
  useEffect(() => {
    if (!pMap || !map || !(pMap in tilesConfig)) {
      return;
    }
    if (pMap === lastPlayerMapRef.current) {
      return;
    }
    lastPlayerMapRef.current = pMap;
    if (isSameWorld(pMap, map.mapName, tilesConfig)) {
      return;
    }
    // Carry the current zoom only when both maps share tiles (same coordinate
    // space). Across different tile spaces the current zoom is meaningless —
    // and on a transiently misdetected switch (e.g. Once Human reads server
    // "unknown" while loading into a world and briefly maps to Eternaland)
    // carrying it would overwrite the target map's remembered zoom with the
    // wrong map's zoomed-out fit zoom ("Manibus starts fully zoomed out after
    // a game restart"). Omitting it keeps the target's saved zoom, falling
    // back to its default fit zoom on a first visit.
    const sameTiles = tilesConfig[pMap]?.url === tilesConfig[map.mapName]?.url;
    setMapName(
      pMap,
      [player.x, player.y],
      sameTiles ? map.getZoom() : undefined,
    );
    if (location.pathname.includes("/maps/")) {
      // Slug = dict term; a defaultTitle equal to the map id isn't a real title.
      const dt = tilesConfig[pMap]?.defaultTitle;
      const title = (dt && dt !== pMap ? dt : t(pMap)) || pMap;
      window.history.pushState({}, "", `/maps/${title}`);
    }
  }, [!!map, pMap, tilesConfig]);

  // Audio alert range circle
  const showAudioAlertRange = useSettingsStore(
    (state) => state.showAudioAlertRange,
  );
  const audioAlertRange = useSettingsStore((state) => state.audioAlertRange);
  const audioAlertsMuted = useSettingsStore((state) => state.audioAlertsMuted);
  const alertCircleLayerRef = useRef<DrawingLayer | null>(null);
  const alertCircleRafRef = useRef<number>(0);
  const alertCircleTargetRef = useRef<[number, number] | null>(null);
  const alertCircleDisplayRef = useRef<[number, number] | null>(null);

  // Set up / tear down range circle layer
  useEffect(() => {
    if (!map) return;
    const shouldShow = showAudioAlertRange && !audioAlertsMuted;
    if (!shouldShow) {
      if (alertCircleLayerRef.current) {
        alertCircleLayerRef.current.clearShapes();
        map.removeLayer(alertCircleLayerRef.current);
        alertCircleLayerRef.current = null;
      }
      if (alertCircleRafRef.current) {
        cancelAnimationFrame(alertCircleRafRef.current);
        alertCircleRafRef.current = 0;
      }
      return;
    }
    if (!alertCircleLayerRef.current) {
      alertCircleLayerRef.current = new DrawingLayer({ interactive: false });
      map.addLayer(alertCircleLayerRef.current, { zIndex: 90 });
    }
    return () => {
      if (alertCircleRafRef.current) {
        cancelAnimationFrame(alertCircleRafRef.current);
        alertCircleRafRef.current = 0;
      }
      if (alertCircleLayerRef.current) {
        alertCircleLayerRef.current.clearShapes();
        map.removeLayer(alertCircleLayerRef.current);
        alertCircleLayerRef.current = null;
      }
    };
  }, [map, showAudioAlertRange, audioAlertsMuted]);

  // Update range circle position with smooth interpolation
  useEffect(() => {
    if (!map || !player || !showAudioAlertRange || audioAlertsMuted) return;
    const isOnMap = !player.mapName || player.mapName === map.mapName;
    if (!isOnMap) return;

    let pos: [number, number] = [player.x, player.y];
    const rotationDegrees = map._rotationDegrees;
    const rotationCenter = map._rotationCenter;
    if (rotationDegrees && rotationCenter) {
      pos = rotateCoordinate(
        [player.x, player.y],
        rotationDegrees,
        rotationCenter,
      );
    }
    alertCircleTargetRef.current = pos;
    if (!alertCircleDisplayRef.current) {
      alertCircleDisplayRef.current = [...pos] as [number, number];
    }

    // Apply the current radius immediately so range changes take effect even
    // while an animation loop is already running with a stale closure value.
    if (alertCircleLayerRef.current?.getShape("audio-alert-range")) {
      alertCircleLayerRef.current.updateShape("audio-alert-range", {
        radius: audioAlertRange,
      });
    }

    // Start animation loop if not running
    if (alertCircleRafRef.current) return;
    let lastTs = performance.now();
    const tick = () => {
      const layer = alertCircleLayerRef.current;
      const target = alertCircleTargetRef.current;
      const display = alertCircleDisplayRef.current;
      if (!layer || !target || !display) {
        alertCircleRafRef.current = 0;
        return;
      }

      const now = performance.now();
      const dt = Math.min(100, now - lastTs);
      lastTs = now;
      const alpha = 1 - Math.exp(-dt / 100);

      const dlat = target[0] - display[0];
      const dlng = target[1] - display[1];
      const settled = Math.abs(dlat) < 0.001 && Math.abs(dlng) < 0.001;
      if (settled) {
        display[0] = target[0];
        display[1] = target[1];
      } else {
        display[0] += dlat * alpha;
        display[1] += dlng * alpha;
      }

      const existing = layer.getShape("audio-alert-range");
      if (existing) {
        layer.updateShape("audio-alert-range", {
          center: [...display] as [number, number],
          radius: audioAlertRange,
        });
      } else {
        layer.addShape({
          id: "audio-alert-range",
          type: "circle",
          center: [...display] as [number, number],
          radius: audioAlertRange,
          color: "#00FF0066",
          size: 2,
          mapName: map.mapName,
        });
      }

      if (settled) {
        alertCircleRafRef.current = 0;
        return;
      }
      alertCircleRafRef.current = requestAnimationFrame(tick);
    };
    alertCircleRafRef.current = requestAnimationFrame(tick);
  }, [map, player, showAudioAlertRange, audioAlertsMuted, audioAlertRange]);

  return <></>;
}
