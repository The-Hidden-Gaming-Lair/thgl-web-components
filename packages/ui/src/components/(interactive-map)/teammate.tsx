"use client";

import { useEffect, useRef, type JSX } from "react";
import { useMap } from "./store";
import { PlayerMarker } from "./player-marker";
import { rotateCoordinate } from "./rotation";
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
  icon,
  sizeScale = 1,
}: {
  appName: string;
  player: RemotePlayer;
  markerOptions: MarkerOptions;
  iconsPath: string;
  tilesConfig: TilesConfig;
  /** Icon file under the game's /icons (default: the player icon); "" = just the colour disc. */
  icon?: string;
  /** Marker size factor (party members match the game's character markers). */
  sizeScale?: number;
}): JSX.Element {
  const map = useMap();
  const marker = useRef<PlayerMarker | null>(null);
  const labelIdRef = useRef<string | null>(null);
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const playerIconSize = useSettingsStore((state) => state.playerIconSize);
  const colorBlindMode = useSettingsStore((state) => state.colorBlindMode);
  const colorBlindSeverity = useSettingsStore(
    (state) => state.colorBlindSeverity,
  );
  const showPeerLabels = useSettingsStore((state) => state.showPeerLabels);
  const labelTextSize = useSettingsStore((state) => state.labelTextSize);

  const iconImageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  async function buildIconImage(
    iconUrl: string,
    mode: ColorBlindMode,
    severity: number,
    tint?: string,
  ): Promise<HTMLImageElement> {
    const cacheKey = `${iconUrl}:${mode}:${severity.toFixed(2)}:${tint ?? ""}`;
    const cached = iconImageCache.current.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Load the source image
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("teammate-icon-load"));
      image.src = iconUrl;
    });

    // If no transform needed, return original
    if ((mode === "none" || severity <= 0) && !tint) {
      iconImageCache.current.set(cacheKey, img);
      return img;
    }

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;

    // Draw a colored disc *behind* the icon so the peer's color identifies
    // them at a glance without altering the icon's own colors/outlines.
    if (tint) {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = Math.min(canvas.width, canvas.height) / 2 - 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = tint;
      ctx.fill();
      // Subtle dark rim so the disc reads against any map background.
      ctx.lineWidth = Math.max(1, r * 0.12);
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.stroke();
    }

    // Icon on top, unmodified.
    ctx.drawImage(img, 0, 0);

    // Apply color blind transform on top of the (optionally) tinted icon
    if (mode !== "none" && severity > 0) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      applyColorBlindTransform(
        imageData.data,
        mode as Exclude<ColorBlindMode, "none">,
        severity,
      );
      ctx.putImageData(imageData, 0, 0);
    }

    // Create a new image from the processed canvas
    const processedImg = await new Promise<HTMLImageElement>(
      (resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("teammate-icon-process"));
        image.src = canvas.toDataURL();
      },
    );

    iconImageCache.current.set(cacheKey, processedImg);
    return processedImg;
  }

  /** A plain coloured disc (party members without a game portrait). */
  async function buildDiscImage(tint: string): Promise<HTMLImageElement> {
    const cacheKey = `disc:${tint}`;
    const cached = iconImageCache.current.get(cacheKey);
    if (cached) return cached;
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
    ctx.fillStyle = tint;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.stroke();
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("teammate-disc"));
      image.src = canvas.toDataURL();
    });
    iconImageCache.current.set(cacheKey, img);
    return img;
  }

  /**
   * The marker image: `icon` (default the player icon) on the member's colour disc. An empty
   * `icon` - or one that does not load (a party member's custom portrait that the game data
   * does not have) - draws just the coloured disc.
   */
  async function loadIcon(): Promise<HTMLImageElement> {
    const tint = player.color ?? "#f2c14e";
    if (icon === "") return buildDiscImage(tint);
    const iconFile = icon ?? markerOptions.playerIcon;
    const iconName = iconFile
      ? `/icons/${iconFile}`
      : "https://th.gl/global_icons/player.png";
    const iconUrl = getIconsUrl(appName, iconName, iconsPath);
    try {
      return await buildIconImage(
        iconUrl,
        colorBlindMode,
        colorBlindSeverity,
        player.color,
      );
    } catch (err) {
      if (icon === undefined) throw err;
      return buildDiscImage(tint);
    }
  }

  // Render the peer's name as a text label anchored above their marker.
  // Mirrors the marker-label approach in markers.tsx (canvas text → WebGL
  // marker on the main marker layer, kept upright and non-interactive).
  function placeOrUpdateLabel(position: [number, number]) {
    const markerLayer = map?.markerLayer;
    if (!markerLayer || !marker.current) {
      return;
    }

    const labelId = `${marker.current.id}-label`;
    const shouldShow = showPeerLabels && Boolean(player.name);
    if (!shouldShow) {
      if (labelIdRef.current) {
        markerLayer.remove(labelIdRef.current);
        labelIdRef.current = null;
      }
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const fontSize = Math.round(13 * labelTextSize);
    const pad = 5;
    const text = player.name;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const font = `700 ${fontSize}px Arial, system-ui, sans-serif`;
    ctx.font = font;
    const metrics = ctx.measureText(text);
    const w = Math.ceil(metrics.width) + pad * 2;
    const h = fontSize + pad * 2;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.scale(dpr, dpr);
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Dark outline for legibility over any map background
    ctx.fillStyle = "#1a1a1a";
    for (const [dx, dy] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ]) {
      ctx.fillText(text, w / 2 + dx, h / 2 + dy);
    }
    // White text for legibility regardless of the peer's chosen color.
    ctx.fillStyle = "#FFFFFFEE";
    ctx.fillText(text, w / 2, h / 2);

    const sheetName = `__teammate_label_${labelId}`;
    markerLayer.setSheet(sheetName, canvas);

    // Offset the label just above the marker icon (icon size is in device px).
    const iconSizeDevice =
      Math.max(10, Math.round(30 * baseIconSize * playerIconSize * sizeScale)) *
      dpr;
    // Re-add to pick up new sheet/size when the name or text size changes.
    markerLayer.remove(labelId);
    markerLayer.add({
      id: labelId,
      latLng: position,
      size: h * dpr,
      sizeW: w * dpr,
      screenOffsetY: -(iconSizeDevice / 2 + (h * dpr) / 2 + 4),
      sheet: sheetName,
      rect: { x: 0, y: 0, width: canvas.width, height: canvas.height },
      keepUpright: true,
      noHitTest: true,
      alwaysOnTop: true,
    });
    labelIdRef.current = labelId;
  }

  useEffect(() => {
    if (!map?.mapName || !map.markerLayer) {
      return;
    }

    const isOnMap = !player.mapName || player.mapName === map.mapName;
    if (!isOnMap) {
      return;
    }

    // An area change can hand us a new map/marker layer: a run that resolves after its
    // cleanup must not add a marker to a layer nobody removes it from.
    let cancelled = false;
    const markerLayer = map.markerLayer;
    const run = async () => {
      // Use a different icon for teammates
      const iconImage = await loadIcon();
      if (cancelled) return;

      const tile = tilesConfig[map.mapName];
      const rotationOffset = tile?.rotation?.angle;

      // Apply rotation to teammate position if configured
      let teammatePosition: [number, number] = [player.x, player.y];
      const rotationDegrees = map._rotationDegrees;
      const rotationCenter = map._rotationCenter;
      if (rotationDegrees && rotationCenter) {
        teammatePosition = rotateCoordinate(
          [player.x, player.y],
          rotationDegrees,
          rotationCenter,
        );
      }

      // Slightly smaller size for teammates (30px base instead of 36px)
      const size = Math.max(
        10,
        Math.round(30 * baseIconSize * playerIconSize * sizeScale),
      );

      if (!marker.current) {
        // Use a unique ID for each teammate based on their peer ID or name
        const markerId = `teammate-${player.name || player.id || "unknown"}`;
        marker.current = new PlayerMarker(teammatePosition, {
          id: markerId,
          rotation: player.r,
          rotationOffset,
          size,
        });
        marker.current.setIcon(iconImage);
        marker.current.addTo(markerLayer);
      } else {
        marker.current.setIcon(iconImage);
        marker.current.setSize(size);
        marker.current.updatePosition({
          ...player,
          x: teammatePosition[0],
          y: teammatePosition[1],
        });
      }

      placeOrUpdateLabel(teammatePosition);
    };

    run();

    return () => {
      cancelled = true;
      marker.current?.remove();
      marker.current = null;
      if (labelIdRef.current) {
        markerLayer.remove(labelIdRef.current);
        labelIdRef.current = null;
      }
    };
  }, [map, map?.markerLayer, map?.mapName, player?.mapName]);

  // Re-render the name label when its inputs change.
  useEffect(() => {
    if (!marker.current) return;
    let teammatePosition: [number, number] = [player.x, player.y];
    const rotationDegrees = map?._rotationDegrees;
    const rotationCenter = map?._rotationCenter;
    if (rotationDegrees && rotationCenter) {
      teammatePosition = rotateCoordinate(
        [player.x, player.y],
        rotationDegrees,
        rotationCenter,
      );
    }
    placeOrUpdateLabel(teammatePosition);
  }, [showPeerLabels, player.name, player.color, labelTextSize]);

  // Update icon when size or color-blind mode changes
  useEffect(() => {
    if (!marker.current) return;
    const run = async () => {
      const iconImage = await loadIcon();
      marker.current?.setIcon(iconImage);
      const size = Math.max(
        10,
        Math.round(30 * baseIconSize * playerIconSize * sizeScale),
      );
      marker.current?.setSize(size);
    };
    run();
  }, [
    baseIconSize,
    playerIconSize,
    colorBlindMode,
    colorBlindSeverity,
    player.color,
    icon,
    sizeScale,
  ]);

  useThrottledEffect(
    () => {
      if (!map?.mapName || !player || !marker.current) {
        return;
      }

      // Apply rotation to teammate position if configured
      let teammatePosition: [number, number] = [player.x, player.y];
      const rotationDegrees = map._rotationDegrees;
      const rotationCenter = map._rotationCenter;
      if (rotationDegrees && rotationCenter) {
        teammatePosition = rotateCoordinate(
          [player.x, player.y],
          rotationDegrees,
          rotationCenter,
        );
      }

      marker.current.updatePosition({
        ...player,
        x: teammatePosition[0],
        y: teammatePosition[1],
      });

      // Keep the name label following the marker without rebuilding the canvas.
      if (labelIdRef.current) {
        map.markerLayer?.updateMarker(labelIdRef.current, {
          latLng: teammatePosition,
        });
      }
    },
    [map?.mapName, player],
    50,
  );

  return <></>;
}
