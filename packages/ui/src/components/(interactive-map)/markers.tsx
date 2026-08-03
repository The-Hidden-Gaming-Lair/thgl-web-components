"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react";
import { useUserStore, useUserStoreApi } from "../(providers)";
import { createPortal } from "react-dom";
import { Spawns, useCoordinates, useT } from "../(providers)";
import { useMap } from "./store";
import { rotateCoordinate } from "./rotation";
import {
  buildDiscoveryLookup,
  checkNodeDiscovered,
  getPositionedDiscoverTypes,
  getPermanentTypes,
  getAppUrl,
  getEffectiveLiveMode,
  getIconsUrl,
  getNodeId,
  isLiveReadingActive,
  MarkerOptions,
  resolveLiveModeForType,
  Spawn,
  useAccountStore,
  useConnectionStore,
  useEffectiveLiveMode,
  useGameState,
  useSettingsStore,
} from "@repo/lib";
import { useShallow } from "zustand/react/shallow";
import {
  IconMarkerLayer,
  type IconMarkerInstance,
  DEFAULT_CIRCLE_SHEET,
} from "@repo/lib/web-map";
import { SpatialGrid } from "./spatial-grid";
import { MarkerTooltip, TooltipItems } from "./marker-tooltip";
import { toast } from "sonner";
import { AdditionalTooltipType } from "../(content)";
import { playAlertSound } from "../(controls)/audio-alert";
import {
  getSourceImage,
  setSourceImage,
  getProcessedImage,
  setProcessedImage,
  createProcessedImageKey,
} from "./icon-cache";

type ZPosConfig = { xyMaxDistance: number; zDistance: number };

// Player-relative elevation indicator (the up/down height arrows). Given a
// marker's already-rotated XY, its raw world Z, and the current player,
// returns the arrow direction + signed magnitude. Shared by the static
// rebuild, the static player-move effect, and the live-actor pipeline so
// every marker source shows consistent height arrows.
function computeRelativeZPos(
  spawnZ: number | undefined,
  markerX: number,
  markerY: number,
  player: { x: number; y: number; z: number } | null | undefined,
  rotationCache: {
    getRotated: (x: number, y: number) => [number, number];
  } | null,
  cfg: ZPosConfig | undefined,
): { zPos: "top" | "bottom" | null; zValue: number | undefined } {
  if (!cfg || !player || spawnZ === undefined) {
    return { zPos: null, zValue: undefined };
  }
  let px = player.x;
  let py = player.y;
  if (rotationCache) {
    const rp = rotationCache.getRotated(px, py);
    px = rp[0];
    py = rp[1];
  }
  const dx = px - markerX;
  const dy = py - markerY;
  if (dx * dx + dy * dy > cfg.xyMaxDistance * cfg.xyMaxDistance) {
    return { zPos: null, zValue: undefined };
  }
  const dz = player.z - spawnZ;
  if (dz > cfg.zDistance) return { zPos: "bottom", zValue: -dz };
  if (dz < -cfg.zDistance) return { zPos: "top", zValue: -dz };
  return { zPos: null, zValue: undefined };
}

export function Markers({
  appName,
  markerOptions,
  hideComments,
  iconsPath,
  additionalTooltip,
}: {
  appName: string;
  markerOptions: MarkerOptions;
  hideComments?: boolean;
  iconsPath: string;
  additionalTooltip?: AdditionalTooltipType;
}): JSX.Element {
  const map = useMap();
  const [tooltipIsOpen, setTooltipIsOpen] = useState(false);
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    radius: number;
    latLng: [number, number] | [number, number, number];
    items: TooltipItems;
  } | null>(null);
  const isDrawing = useSettingsStore((state) => !!state.tempPrivateDrawing);
  const setSelectedNodeId = useUserStore((state) => state.setSelectedNodeId);

  const containerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const isHoverCardVisible = tooltipIsOpen && !isDrawing;

  // Block wheel events from reaching the map canvas when over the tooltip
  const tooltipWheelRef = useCallback((node: HTMLDivElement | null) => {
    tooltipRef.current = node;
    if (!node) return;

    const handleWheel = (e: WheelEvent) => {
      // Check if inside a scrollable child that can still scroll
      let el = e.target as HTMLElement | null;
      while (el && el !== node) {
        if (el.scrollHeight > el.clientHeight) {
          const atTop = el.scrollTop <= 0;
          const atBottom =
            el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
          if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
            // Let the scrollable child handle it, but still block page/map scroll
            e.stopPropagation();
            return;
          }
        }
        el = el.parentElement;
      }
      // Block both page scroll and map zoom
      e.preventDefault();
      e.stopPropagation();
    };

    node.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });
  }, []);

  // Track if mouse is in the "safe zone" (marker, tooltip, or between them)
  useEffect(() => {
    if (!tooltipIsOpen || !tooltipData || !containerRef.current) return;

    const container = containerRef.current;

    const isInSafeZone = (e: MouseEvent): boolean => {
      const { x, y, radius } = tooltipData;

      // Get mouse position relative to container
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Check if mouse is over the tooltip element
      if (tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        if (
          e.clientX >= tooltipRect.left &&
          e.clientX <= tooltipRect.right &&
          e.clientY >= tooltipRect.top &&
          e.clientY <= tooltipRect.bottom
        ) {
          return true;
        }
      }

      // Check if mouse is within expanded marker radius (with padding)
      const markerPadding = 10;
      const dx = mouseX - x;
      const dy = mouseY - y;
      const distToMarker = Math.sqrt(dx * dx + dy * dy);
      if (distToMarker <= radius + markerPadding) {
        return true;
      }

      // Check if mouse is in the corridor between marker and tooltip
      if (tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();
        const tl = tooltipRect.left - containerRect.left;
        const tr = tooltipRect.right - containerRect.left;
        const tt = tooltipRect.top - containerRect.top;
        const tb = tooltipRect.bottom - containerRect.top;

        // Expanded tooltip rect with small padding for easier hover
        const pad = 5;
        if (
          mouseX >= tl - pad &&
          mouseX <= tr + pad &&
          mouseY >= tt - pad &&
          mouseY <= tb + pad
        ) {
          return true;
        }

        // Narrow corridor connecting icon center to tooltip edge
        const corridorHW = radius + 4;
        // Vertical corridor (tooltip above or below)
        if (Math.abs(mouseX - x) <= corridorHW) {
          const minY = Math.min(y - radius, tt);
          const maxY = Math.max(y + radius, tb);
          if (mouseY >= minY && mouseY <= maxY) {
            return true;
          }
        }
      }

      return false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Close tooltip if hovering over any UI overlay outside the map canvas and tooltip
      const target = e.target as HTMLElement;
      const canvas = containerRef.current?.querySelector("canvas");
      const isOverCanvas = canvas && canvas.contains(target);
      const isOverTooltip = tooltipRef.current?.contains(target);
      if (!isOverCanvas && !isOverTooltip) {
        setTooltipIsOpen(false);
        return;
      }
      if (!isInSafeZone(e)) {
        setTooltipIsOpen(false);
      }
    };

    // Small delay before adding listener to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousemove", handleMouseMove);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [tooltipIsOpen, tooltipData]);

  // Get container for tooltip coordinate reference
  useEffect(() => {
    if (map) {
      containerRef.current = map.getContainer()?.parentElement ?? null;
    }
  }, [map]);

  return (
    <>
      <MarkersContent
        appName={appName}
        markerOptions={markerOptions}
        iconsPath={iconsPath}
        onTooltipData={setTooltipData}
        onTooltipOpen={setTooltipIsOpen}
        onClick={setSelectedNodeId}
      />
      {containerRef.current && tooltipData && isHoverCardVisible
        ? createPortal(
            <TooltipPositioner
              ref={tooltipWheelRef}
              x={tooltipData.x}
              y={tooltipData.y}
              radius={tooltipData.radius}
              containerRef={containerRef}
            >
              <MarkerTooltip
                appName={appName}
                latLng={tooltipData.latLng}
                items={tooltipData.items}
                onClick={setSelectedNodeId}
                onClose={() => setTooltipIsOpen(false)}
                hideComments={hideComments}
                additionalTooltip={additionalTooltip}
                coordinateCopyFormat={markerOptions.coordinateCopyFormat}
              />
            </TooltipPositioner>,
            document.body,
          )
        : null}
    </>
  );
}

/** Viewport-aware tooltip that repositions if it would overflow */
const TooltipPositioner = React.forwardRef<
  HTMLDivElement,
  {
    x: number;
    y: number;
    radius: number;
    containerRef: React.RefObject<HTMLElement | null>;
    children: React.ReactNode;
  }
>(function TooltipPositioner({ x, y, radius, containerRef, children }, ref) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ transform: "" });

  const reposition = useCallback(() => {
    const el = innerRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const gap = 2;
    const rect = el.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // Convert container-relative x/y to viewport coordinates
    const vx = cRect.left + x;
    const vy = cRect.top + y;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Default: above, centered
    let tx = vx - w / 2;
    let ty = vy - h - radius - gap;

    // If overflows top, place below
    if (ty < 0) {
      ty = vy + radius + gap;
    }
    // If overflows bottom too, just clamp
    if (ty + h > vh) {
      ty = Math.max(0, vh - h);
    }
    // Clamp horizontal to viewport
    if (tx < 0) tx = 0;
    if (tx + w > vw) tx = Math.max(0, vw - w);

    setPos({ transform: `translate3d(${tx}px, ${ty}px, 0px)` });
  }, [x, y, radius, containerRef]);

  // Reposition on mount and when tooltip resizes (e.g. async content loads)
  useEffect(() => {
    reposition();
    const el = innerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(reposition);
    observer.observe(el);
    return () => observer.disconnect();
  }, [reposition]);

  return (
    <div
      ref={(node) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref)
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className="cursor-default z-999999 rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md outline-none w-[260px] max-h-[70vh]"
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        pointerEvents: "auto",
        ...pos,
      }}
    >
      {children}
    </div>
  );
});

function MarkersContent({
  appName,
  markerOptions,
  iconsPath,
  onTooltipData,
  onTooltipOpen,
  onClick,
}: {
  appName: string;
  markerOptions: MarkerOptions;
  iconsPath: string;
  onTooltipData: (data: {
    x: number;
    y: number;
    radius: number;
    latLng: [number, number] | [number, number, number];
    items: TooltipItems;
  }) => void;
  onTooltipOpen: (open: boolean) => void;
  onClick: (id: string | null) => void;
}) {
  const map = useMap();
  const t = useT();
  const { spawns, searchableNodes, icons, filters, typesIdMap } =
    useCoordinates();
  // Group settings into logical selectors to minimize re-render triggers
  const {
    hideDiscoveredNodes,
    discoveredNodes,
    setDiscoverNode,
    baseIconSize,
    iconSizeByGroup,
    iconSizeByFilter,
    fitBoundsOnChange,
    dynamicIconSize,
    dynamicIconSizeFactor,
    tempPrivateNodeId,
    labelModeByFilter,
    labelTextSize,
  } = useSettingsStore(
    useShallow((state) => ({
      hideDiscoveredNodes: state.hideDiscoveredNodes,
      discoveredNodes: state.discoveredNodes,
      setDiscoverNode: state.setDiscoverNode,
      baseIconSize: state.baseIconSize,
      iconSizeByGroup: state.iconSizeByGroup,
      iconSizeByFilter: state.iconSizeByFilter,
      fitBoundsOnChange: state.fitBoundsOnChange,
      dynamicIconSize: state.dynamicIconSize,
      dynamicIconSizeFactor: state.dynamicIconSizeFactor,
      tempPrivateNodeId: state.tempPrivateNode?.id,
      labelModeByFilter: state.labelModeByFilter,
      labelTextSize: state.labelTextSize,
    })),
  );
  const liveMode = useEffectiveLiveMode();
  const {
    audioAlertsMuted,
    audioAlertNotifications,
    audioAlertRange,
    audioAlertByFilter,
    audioAlertSound,
    audioAlertVolume,
  } = useSettingsStore(
    useShallow((state) => ({
      audioAlertsMuted: state.audioAlertsMuted,
      audioAlertNotifications: state.audioAlertNotifications,
      audioAlertRange: state.audioAlertRange,
      audioAlertByFilter: state.audioAlertByFilter,
      audioAlertSound: state.audioAlertSound,
      audioAlertVolume: state.audioAlertVolume,
    })),
  );
  const {
    colorBlindMode,
    colorBlindSeverity,
    highContrastMode,
    highContrastColor,
    highContrastThickness,
  } = useSettingsStore(
    useShallow((state) => ({
      colorBlindMode: state.colorBlindMode,
      colorBlindSeverity: state.colorBlindSeverity,
      highContrastMode: state.highContrastMode,
      highContrastColor: state.highContrastColor,
      highContrastThickness: state.highContrastThickness,
    })),
  );
  const discoveryLookup = useMemo(
    () => buildDiscoveryLookup(discoveredNodes),
    [discoveredNodes],
  );
  // Types that have a fixed static position (effigies, chests, …). A live
  // detection of a positioned type is a *confirmation* of that fixed spawn, so
  // we treat its marker as the predicted spawn (discoverable) rather than a
  // live-only actor. Live-only/moving types (other players) stay non-positioned
  // and therefore never become discoverable. Built from the FULL static set,
  // not the live-mode render list (which drops live-resolved predictions).
  const positionedTypes = useMemo(
    () => getPositionedDiscoverTypes(searchableNodes),
    [searchableNodes],
  );
  const positionedTypesRef = useRef(positionedTypes);
  positionedTypesRef.current = positionedTypes;
  // Types with a permanent (static:true) node — effigies, chests. These always
  // render from the static set (realStaticNodes) in every mode, so the imperative
  // live pipeline must NOT draw a live twin on top (that's the double-marker +
  // doubled-discovered-alpha bug). See getPermanentTypes / coordinates-provider.
  const permanentTypes = useMemo(
    () => getPermanentTypes(searchableNodes),
    [searchableNodes],
  );
  const permanentTypesRef = useRef(permanentTypes);
  permanentTypesRef.current = permanentTypes;
  const sharedMyFilters = useConnectionStore((state) => state.myFilters);
  const selectedNodeId = useUserStore((state) => state.selectedNodeId);
  const userStoreApi = useUserStoreApi();
  const highlightSpawnIDs = useGameState((state) => state.highlightSpawnIDs);
  // Subscribe to the ~1Hz throttledPlayer, NOT the raw player. The raw player
  // updates ~16×/s while moving in-game; subscribing this large component to it
  // re-rendered the entire marker subtree at that rate — the dominant
  // main-thread cost during movement. Everything below only needs a ~1s-fresh
  // player (the audio-alert / zPos effects and the rotated-player memo); live
  // actors render imperatively and don't depend on it.
  const throttledPlayer = useGameState((state) => state.throttledPlayer);
  // Stable ref for hot-path reads inside the static-markers effect — keeps
  // throttledPlayer OUT of that effect's deps so player movement (every 1s)
  // does NOT trigger a full rebuild of every static marker. Z-position
  // arrows stay at the value captured during the last full rebuild; a
  // separate small effect could later update them via updateMarker.
  const throttledPlayerRef = useRef(throttledPlayer);
  throttledPlayerRef.current = throttledPlayer;
  const firstRender = useRef(true);

  // Track which marker IDs this component owns. Split by source so static
  // and live updates don't trample each other. spawnMapRef is the union for
  // lookups (tooltips, audio alerts, click handlers).
  const spawnMapRef = useRef<Map<string, Spawn>>(new Map());
  const staticSpawnMapRef = useRef<Map<string, Spawn>>(new Map());
  const liveSpawnMapRef = useRef<Map<string, Spawn>>(new Map());
  const justClickedMarkerRef = useRef(false);
  const tooltipDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Shared tooltip helper updated each render via the static effect — lets
  // the parallel live-marker effect reuse the same tooltip logic without
  // duplicating the projection / item-building code.
  const showTooltipForMarkerRef = useRef<
    ((m: IconMarkerInstance) => void) | null
  >(null);

  // Cache for colored circle images (for private nodes without icons)
  const coloredCircleCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Counter to trigger re-render when images finish loading
  const [iconLoadVersion, setIconLoadVersion] = useState(0);

  // Spatial grid for efficient proximity queries (audio alerts, z-position)
  const spatialGridRef =
    useRef<SpatialGrid<{ id: string; spawn: Spawn; latLng: [number, number] }>>(
      undefined,
    );

  // Audio alert tracking - tracks if we've already alerted for current in-range spawns
  const hasAlertedRef = useRef<boolean>(false);

  // Hotkey state for showing all labels temporarily (set by MapHotkeys in Overwolf/THGL apps)
  const showLabelsActive = useGameState((state) => state.showLabelsActive);

  // Label layer for rendering per-marker text labels
  // Cache for text label canvases (keyed by text content + fontSize)
  const labelCanvasCache = useRef<
    Map<string, { canvas: HTMLCanvasElement; width: number; height: number }>
  >(new Map());
  // labelId → last-rendered state, used for incremental diff so live-actor
  // label updates can be applied without tearing down the whole label set.
  const activeLabelIds = useRef<
    Map<string, { pos: [number, number]; text: string }>
  >(new Map());

  // Helper to extract RGB (without alpha) from color string
  const getRgbFromColor = (colorStr: string): string => {
    if (colorStr.length === 9 && colorStr.startsWith("#")) {
      return colorStr.slice(0, 7); // #RRGGBB from #RRGGBBAA
    } else if (colorStr.length === 5 && colorStr.startsWith("#")) {
      return `#${colorStr[1]}${colorStr[1]}${colorStr[2]}${colorStr[2]}${colorStr[3]}${colorStr[3]}`;
    }
    return colorStr;
  };

  // Helper to extract alpha from color string
  const getAlphaFromColor = (colorStr: string): number => {
    if (colorStr.length === 9 && colorStr.startsWith("#")) {
      return parseInt(colorStr.slice(7, 9), 16) / 255;
    } else if (colorStr.length === 5 && colorStr.startsWith("#")) {
      return parseInt(colorStr[4] + colorStr[4], 16) / 255;
    }
    return 1;
  };

  // Helper to process an icon with glow effect for private nodes
  // Returns the image and its dimensions (since img.width may not be set immediately from data URL)
  const processIconWithGlow = (
    sourceImg: HTMLImageElement,
    iconRect: { x: number; y: number; width: number; height: number } | null,
    color: string,
    isGameIcon: boolean,
  ): { img: HTMLImageElement; width: number; height: number } => {
    const width = iconRect?.width ?? sourceImg.naturalWidth;
    const height = iconRect?.height ?? sourceImg.naturalHeight;
    const srcX = iconRect?.x ?? 0;
    const srcY = iconRect?.y ?? 0;
    const rgbColor = getRgbFromColor(color);
    const alpha = getAlphaFromColor(color);

    const canvas = document.createElement("canvas");
    const outputCanvas = document.createElement("canvas");
    let outputWidth: number;
    let outputHeight: number;

    if (isGameIcon) {
      // Game icons: Fill with the selected color, use icon as mask
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = rgbColor;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(sourceImg, srcX, srcY, width, height, 0, 0, width, height);

      // Apply opacity
      outputCanvas.width = width;
      outputCanvas.height = height;
      outputWidth = width;
      outputHeight = height;
      const outCtx = outputCanvas.getContext("2d")!;
      outCtx.globalAlpha = alpha;
      outCtx.drawImage(canvas, 0, 0);
    } else {
      // App icons: Draw original with colored glow effect
      const glowSize = 8;
      const totalSize = Math.max(width, height) + glowSize * 2;

      canvas.width = totalSize;
      canvas.height = totalSize;
      const ctx = canvas.getContext("2d")!;

      const iconX = (totalSize - width) / 2;
      const iconY = (totalSize - height) / 2;

      // Only apply glow if color is not white (default)
      const isWhite = rgbColor.toUpperCase() === "#FFFFFF";
      if (!isWhite) {
        // Draw colored glow using shadow
        ctx.shadowColor = rgbColor;
        ctx.shadowBlur = glowSize;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        // Draw icon multiple times to intensify the glow
        for (let i = 0; i < 3; i++) {
          ctx.drawImage(
            sourceImg,
            srcX,
            srcY,
            width,
            height,
            iconX,
            iconY,
            width,
            height,
          );
        }
        // Reset shadow for final clean draw
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      // Draw the original icon on top
      ctx.drawImage(
        sourceImg,
        srcX,
        srcY,
        width,
        height,
        iconX,
        iconY,
        width,
        height,
      );

      // Apply opacity
      outputCanvas.width = totalSize;
      outputCanvas.height = totalSize;
      outputWidth = totalSize;
      outputHeight = totalSize;
      const outCtx = outputCanvas.getContext("2d")!;
      outCtx.globalAlpha = alpha;
      outCtx.drawImage(canvas, 0, 0);
    }

    const img = new Image();
    img.src = outputCanvas.toDataURL();
    return { img, width: outputWidth, height: outputHeight };
  };

  // Helper to process a sprite sheet icon using canvas 2D.
  // Isolates each icon from the atlas to prevent cross-icon bleeding in WebGL,
  // and applies a subtle shadow like the old Leaflet canvas-marker approach.
  // Returns a canvas element directly (no data URL conversion needed).
  // Padding accommodates shadow blur (2px) + max high contrast outline (6px).
  const ICON_PADDING = 8;
  const processedIconCache = useRef<
    Map<
      string,
      { canvas: HTMLCanvasElement; logicalWidth: number; logicalHeight: number }
    >
  >(new Map());
  const processSheetIcon = (
    sourceImg: HTMLImageElement,
    rect: { x: number; y: number; width: number; height: number },
  ): {
    canvas: HTMLCanvasElement;
    logicalWidth: number;
    logicalHeight: number;
  } => {
    // Render at device pixel ratio for crisp icons on high-DPI displays.
    const dpr = window.devicePixelRatio || 1;
    const logicalW = rect.width + ICON_PADDING * 2;
    const logicalH = rect.height + ICON_PADDING * 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(logicalW * dpr);
    canvas.height = Math.round(logicalH * dpr);
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    // Apply subtle shadow like old Leaflet canvas-marker.ts
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowColor = "black";
    ctx.shadowBlur = 1;

    // Draw icon cropped from sprite sheet at full resolution.
    // This isolates the icon from the atlas, preventing WebGL bilinear
    // filtering from bleeding adjacent icon pixels across boundaries.
    ctx.drawImage(
      sourceImg,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      ICON_PADDING,
      ICON_PADDING,
      rect.width,
      rect.height,
    );

    return { canvas, logicalWidth: logicalW, logicalHeight: logicalH };
  };

  // Pre-process a sprite-sheet ("icons") icon into a padded, shadowed INDIVIDUAL canvas so it's
  // isolated in the atlas AND inset within its quad — the ICON_PADDING is exactly what lets the
  // relative-Z chevron/arrow clear the icon. Shared by BOTH the static and live pipelines so the
  // SAME marker looks identical whether it's drawn from its predicted spawn (Predicted) or its
  // live actor (Live). Without this the live pipeline used the raw sheet edge-to-edge, so e.g.
  // treasure chests showed the chevron ON the icon in Live but gapped in Predicted. Returns null
  // (caller keeps the raw sheet/rect/size) when it's not an "icons" sprite or the source sheet
  // isn't loaded yet. The size multiplier keeps the visible icon the right size despite the pad.
  const resolveProcessedSpriteIcon = (
    layer: IconMarkerLayer,
    sheet: string,
    rect: { x: number; y: number; width: number; height: number },
    spriteSheetSource: HTMLImageElement | null | undefined,
  ): {
    sheet: string;
    rect: { x: number; y: number; width: number; height: number };
    sizeMul: number;
  } | null => {
    if (sheet !== "icons" || !spriteSheetSource || rect.width <= 0) return null;
    const dpr = window.devicePixelRatio || 1;
    const processedKey = `__processed_icon_${rect.x}_${rect.y}_${rect.width}_${rect.height}_${dpr}__`;
    let cached = processedIconCache.current.get(processedKey);
    if (!cached) {
      cached = processSheetIcon(spriteSheetSource, rect);
      processedIconCache.current.set(processedKey, cached);
    }
    layer.setSheet(processedKey, cached.canvas);
    return {
      sheet: processedKey,
      rect: {
        x: 0,
        y: 0,
        width: cached.canvas.width,
        height: cached.canvas.height,
      },
      sizeMul: cached.logicalWidth / rect.width,
    };
  };

  // Helper to create a colored circle image for private nodes
  const createColoredCircleImage = (color: string): HTMLImageElement => {
    const cacheKey = `__circle_${color}__`;
    const cached = coloredCircleCache.current.get(cacheKey);
    if (cached && cached.complete) {
      return cached;
    }

    const size = 64;
    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    // Draw colored circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Add a subtle border
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const img = new Image();
    img.src = canvas.toDataURL();
    coloredCircleCache.current.set(cacheKey, img);
    return img;
  };

  // Keep refs for latest values to avoid stale closures
  const discoveryLookupRef = useRef(discoveryLookup);
  discoveryLookupRef.current = discoveryLookup;

  const typeToGroup = useMemo(() => {
    const mapTypeToGroup = new Map<string, string>();
    filters.forEach((g) => {
      g.values.forEach((v) => mapTypeToGroup.set(v.id, g.group));
    });
    return mapTypeToGroup;
  }, [filters]);

  // typeToCategory: top-level "Fishing" / "Bugs" / "Mining" etc. The category
  // slider in the FilterSettingsPopover writes iconSizeByGroup[<category>],
  // which is a different key than the per-group slider (e.g. fishing_legendary).
  // Without this, only the per-subcategory slider had any effect.
  const typeToCategory = useMemo(() => {
    const m = new Map<string, string>();
    filters.forEach((g) => {
      if (g.category) {
        g.values.forEach((v) => m.set(v.id, g.category!));
      }
    });
    return m;
  }, [filters]);

  // Cache rotated coordinates to avoid recalculating on every render
  const rotationCache = useMemo(() => {
    const rotationDegrees = map?.rotationDegrees ?? map?._rotationDegrees;
    const rotationCenter = map?.rotationCenter ?? map?._rotationCenter;

    if (!rotationDegrees || !rotationCenter) {
      return null;
    }

    const cache = new Map<string, [number, number]>();

    return {
      getRotated: (x: number, y: number): [number, number] => {
        const key = `${x}:${y}`;
        let rotated = cache.get(key);
        if (!rotated) {
          rotated = rotateCoordinate([x, y], rotationDegrees, rotationCenter);
          cache.set(key, rotated);
        }
        return rotated;
      },
    };
  }, [
    map,
    map?.rotationDegrees,
    map?._rotationDegrees,
    map?.rotationCenter,
    map?._rotationCenter,
  ]);

  // Memoize rotated player position for label rendering
  const rotatedPlayer = useMemo(() => {
    if (!throttledPlayer) return null;
    if (!rotationCache) return { x: throttledPlayer.x, y: throttledPlayer.y };
    const rotated = rotationCache.getRotated(
      throttledPlayer.x,
      throttledPlayer.y,
    );
    return { x: rotated[0], y: rotated[1] };
  }, [throttledPlayer, rotationCache]);

  // Track effect runs for debugging

  // Reverse lookup: translated icon name → current icon coords from filter config.
  // Used to fix stale sprite x,y in old shared private nodes that lack filterId.
  const sharedIconNameLookup = useMemo(() => {
    const lookup = new Map<
      string,
      { x: number; y: number; width: number; height: number; filterId: string }
    >();
    for (const filter of filters) {
      for (const value of filter.values) {
        if (typeof value.icon !== "string") {
          lookup.set(t(value.id), { ...value.icon, filterId: value.id });
        }
      }
    }
    return lookup;
  }, [filters, t]);

  // Main effect: add/update/remove markers
  useEffect(() => {
    const markerLayer = map?.markerLayer;
    const liveMarkerLayer = map?.liveMarkerLayer;
    if (!map || !markerLayer) return;

    // Load the icon sprite sheet
    const iconUrl = getIconsUrl(appName, "icons.webp", iconsPath);
    markerLayer.addSheet("icons", iconUrl);

    // Load sprite sheet source image for CPU-side icon processing.
    // When loaded, each icon is individually processed using canvas 2D's
    // high-quality downsampling (replicating the old Leaflet canvas approach).
    const spriteSheetSource = getSourceImage(iconUrl);
    if (!spriteSheetSource) {
      const spriteImg = new Image();
      spriteImg.crossOrigin = "anonymous";
      spriteImg.onload = () => {
        setSourceImage(iconUrl, spriteImg);
        setIconLoadVersion((v) => v + 1);
      };
      spriteImg.src = iconUrl;
    }

    // Set color blind mode
    markerLayer.setColorBlindMode(colorBlindMode);
    markerLayer.setColorBlindSeverity(colorBlindSeverity);

    // Set dynamic icon sizing
    markerLayer.setDynamicSizeFactor(
      dynamicIconSize ? dynamicIconSizeFactor : 0,
    );

    // Set high contrast mode
    markerLayer.setHighContrastMode(highContrastMode);
    markerLayer.setHighContrastColor(highContrastColor);
    markerLayer.setHighContrastThickness(highContrastThickness);

    // Mirror settings to live marker layer
    if (liveMarkerLayer) {
      liveMarkerLayer.setColorBlindMode(colorBlindMode);
      liveMarkerLayer.setColorBlindSeverity(colorBlindSeverity);
      liveMarkerLayer.setDynamicSizeFactor(
        dynamicIconSize ? dynamicIconSizeFactor : 0,
      );
      liveMarkerLayer.setHighContrastMode(highContrastMode);
      liveMarkerLayer.setHighContrastColor(highContrastColor);
      liveMarkerLayer.setHighContrastThickness(highContrastThickness);
    }

    const baseRadius = 12;
    const dpr = window.devicePixelRatio || 1;
    const markerInstances: IconMarkerInstance[] = [];
    const newSpawnMap = new Map<string, Spawn>();
    // Track raw Z values for height visualization without player
    const markerZValues = new Map<number, number>(); // index in markerInstances -> raw Z
    const newSpatialGrid = new SpatialGrid<{
      id: string;
      spawn: Spawn;
      latLng: [number, number];
    }>(100);

    const handleSpawn = (spawn: Spawn) => {
      if (spawn.mapName && spawn.mapName !== map.mapName) {
        return;
      }
      if (tempPrivateNodeId && tempPrivateNodeId === spawn.id?.split("@")[0]) {
        return;
      }

      const isStacked = Boolean(spawn.cluster && spawn.cluster.length > 0);
      const nodeId = getNodeId(spawn);
      let isDiscovered = checkNodeDiscovered(nodeId, discoveryLookup);

      if (isStacked && isDiscovered) {
        if (
          spawn.cluster!.some(
            (a) =>
              !checkNodeDiscovered(
                a.id?.includes("@")
                  ? a.id
                  : `${a.id || a.type}@${a.p[0]}:${a.p[1]}`,
                discoveryLookup,
              ),
          )
        ) {
          isDiscovered = false;
        }
      }

      if (isDiscovered && hideDiscoveredNodes) {
        return;
      }

      const id = String(
        spawn.address ?? (isStacked ? `${nodeId}:${isStacked}` : nodeId),
      );
      newSpawnMap.set(id, spawn);

      const isHighlighted =
        highlightSpawnIDs.includes(nodeId) || selectedNodeId === nodeId;

      const icon = icons.get(spawn.type);
      const iconBaseSize = icon?.size ?? 1;
      const groupId = typeToGroup.get(spawn.type);
      const groupMultiplier = groupId ? (iconSizeByGroup[groupId] ?? 1) : 1;
      const categoryId = typeToCategory.get(spawn.type);
      const categoryMultiplier = categoryId
        ? (iconSizeByGroup[categoryId] ?? 1)
        : 1;
      const typeMultiplier = iconSizeByFilter[spawn.type] ?? 1;
      const spawnRadius = spawn.radius ?? markerOptions.radius * iconBaseSize;
      let size =
        (spawnRadius * 4 - 1) *
        baseIconSize *
        categoryMultiplier *
        groupMultiplier *
        typeMultiplier *
        dpr;

      // Get icon from filter config (NOT resolved to URL yet - we need the raw icon data)
      const markerIcon =
        spawn.icon ||
        (typeof icon?.icon === "string" ? null : icon?.icon) ||
        null;
      // String icons are direct image filenames (e.g. "sifuu.webp")
      const stringIcon =
        !spawn.icon && typeof icon?.icon === "string" ? icon.icon : null;

      let rect = { x: 0, y: 0, width: 64, height: 64 };
      let sheet = "icons"; // Default to the main sprite sheet
      let useProcessedIcon = false; // Track if we're using a processed icon (glow already applied)

      if (stringIcon) {
        // Direct image URL icon (e.g. NPC villager icons)
        const fullUrl = getIconsUrl(appName, stringIcon, iconsPath);
        sheet = fullUrl;
        markerLayer.addSheet(sheet, fullUrl);
        rect = { x: 0, y: 0, width: 64, height: 64 };
      } else if (markerIcon && "url" in markerIcon && markerIcon.url) {
        // Custom URL-based icon (from spawn.icon or custom filters)
        const iconUrlStr = markerIcon.url as string;

        // Check if this is a standalone icon (single image) or a sprite sheet
        const hasValidSpriteCoords =
          "x" in markerIcon &&
          typeof markerIcon.x === "number" &&
          typeof markerIcon.y === "number";

        // Check if this is from the game-icons sprite sheets (local paths)
        const isGameIconsSprite =
          iconUrlStr.includes("/game-icons/") && hasValidSpriteCoords;

        // Treat as standalone only if it's a data URL, external URL, or has no sprite coords
        const isStandaloneIcon =
          iconUrlStr.startsWith("data:") ||
          iconUrlStr.includes("game-icons.net") ||
          (!hasValidSpriteCoords && iconUrlStr.includes("/my_"));

        // For private nodes with icons, apply glow/color effect
        if (spawn.isPrivate && spawn.color) {
          const nodeColor = spawn.color;
          const fullIconUrl = getIconsUrl(appName, iconUrlStr, iconsPath);
          const iconRect = hasValidSpriteCoords
            ? {
                x: markerIcon.x as number,
                y: markerIcon.y as number,
                width: markerIcon.width as number,
                height: markerIcon.height as number,
              }
            : null;
          // Include iconRect in cache key so different icons on same sprite sheet have different cache entries
          const cacheKey = createProcessedImageKey(
            fullIconUrl,
            nodeColor,
            iconRect,
          );

          // Check if we have a cached processed image (shared cache)
          const cachedProcessed = getProcessedImage(cacheKey);
          if (cachedProcessed) {
            // Use cached processed image with stored dimensions
            sheet = cacheKey;
            markerLayer.setSheet(sheet, cachedProcessed.img);
            rect = {
              x: 0,
              y: 0,
              width: cachedProcessed.width,
              height: cachedProcessed.height,
            };
            useProcessedIcon = true; // Color is already baked in
          } else {
            // Check if source image is loaded (shared cache)
            const cachedSource = getSourceImage(fullIconUrl);
            if (cachedSource) {
              // Process the image
              const {
                img: processedImg,
                width: procWidth,
                height: procHeight,
              } = processIconWithGlow(
                cachedSource,
                iconRect,
                nodeColor,
                isGameIconsSprite,
              );
              setProcessedImage(cacheKey, processedImg, procWidth, procHeight);
              sheet = cacheKey;
              markerLayer.setSheet(sheet, processedImg);
              rect = { x: 0, y: 0, width: procWidth, height: procHeight };
              useProcessedIcon = true; // Color is already baked in
            } else {
              // Start loading source image
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                setSourceImage(fullIconUrl, img);
                // Trigger re-render so the processed icon gets created
                setIconLoadVersion((v) => v + 1);
              };
              img.src = fullIconUrl;
              // Use fallback for now - plain icon without glow (tint will be applied)
              sheet = fullIconUrl;
              markerLayer.addSheet(sheet, fullIconUrl);
              rect = iconRect ?? { x: 0, y: 0, width: 64, height: 64 };
            }
          }
        } else if (isGameIconsSprite) {
          // Game-icons sprite sheet - use full URL as sheet name and register it
          sheet = getIconsUrl(appName, iconUrlStr, iconsPath);
          markerLayer.addSheet(sheet, sheet);
          rect = {
            x: markerIcon.x as number,
            y: markerIcon.y as number,
            width: markerIcon.width as number,
            height: markerIcon.height as number,
          };
        } else if (isStandaloneIcon) {
          // Standalone icon - use full URL as sheet name
          sheet = getIconsUrl(appName, iconUrlStr, iconsPath);
          markerLayer.addSheet(sheet, sheet);
          rect = {
            x: 0,
            y: 0,
            width: (markerIcon as any).width ?? 64,
            height: (markerIcon as any).height ?? 64,
          };
        } else if (hasValidSpriteCoords) {
          // Other sprite sheet with coords - use default "icons" sheet
          rect = {
            x: markerIcon.x as number,
            y: markerIcon.y as number,
            width: markerIcon.width as number,
            height: markerIcon.height as number,
          };
        }
      } else if (markerIcon && "x" in markerIcon) {
        // Icon sprite from default sheet (has x,y but no url)
        rect = {
          x: markerIcon.x as number,
          y: markerIcon.y as number,
          width: markerIcon.width as number,
          height: markerIcon.height as number,
        };
      } else if (spawn.isPrivate && !markerIcon) {
        // Private node without icon - use colored circle
        const nodeColor = spawn.color ?? "#FFFFFFCC";
        const circleSheetName = `__circle_${nodeColor}__`;
        const circleImg = createColoredCircleImage(nodeColor);
        markerLayer.setSheet(circleSheetName, circleImg);
        sheet = circleSheetName;
        // Use physical pixel size for UV mapping (canvas was DPR-scaled)
        const circlePx = Math.round(64 * (window.devicePixelRatio || 1));
        rect = { x: 0, y: 0, width: circlePx, height: circlePx };
      } else if (!markerIcon) {
        // No icon at all - use default circle sheet
        sheet = DEFAULT_CIRCLE_SHEET;
        const defaultCirclePx = Math.round(64 * (window.devicePixelRatio || 1));
        rect = { x: 0, y: 0, width: defaultCirclePx, height: defaultCirclePx };
      }

      // Pre-process sprite-sheet icons into a padded, isolated canvas (prevents atlas
      // bleeding, adds a subtle shadow, and insets the icon so the z-chevron clears it).
      // Shared with the live pipeline via resolveProcessedSpriteIcon so both look identical.
      if (!useProcessedIcon) {
        const proc = resolveProcessedSpriteIcon(
          markerLayer,
          sheet,
          rect,
          spriteSheetSource,
        );
        if (proc) {
          sheet = proc.sheet;
          rect = proc.rect;
          size *= proc.sizeMul; // compensate for padding so the icon stays the right size
        }
      }

      // Apply rotation if map has rotation configured
      let markerPosition: [number, number] = [spawn.p[0], spawn.p[1]];
      if (rotationCache) {
        markerPosition = rotationCache.getRotated(spawn.p[0], spawn.p[1]);
      }

      // Calculate z position indicator (player-relative mode).
      // Reads throttledPlayer via ref so player movement doesn't trigger
      // a full static-marker rebuild every second.
      const playerNow = throttledPlayerRef.current;
      let zPos: "top" | "bottom" | null = null;
      let zValue: number | undefined = undefined;
      if (markerOptions.zPos && playerNow && spawn.p[2] !== undefined) {
        const { xyMaxDistance, zDistance } = markerOptions.zPos;
        let playerX = playerNow.x;
        let playerY = playerNow.y;
        if (rotationCache) {
          const rotatedPlayer = rotationCache.getRotated(playerX, playerY);
          playerX = rotatedPlayer[0];
          playerY = rotatedPlayer[1];
        }
        const dx = playerX - markerPosition[0];
        const dy = playerY - markerPosition[1];
        const xyDistSq = dx * dx + dy * dy;
        const maxDistSq = xyMaxDistance * xyMaxDistance;

        if (xyDistSq <= maxDistSq) {
          const dz = playerNow.z - spawn.p[2];
          if (dz > zDistance) {
            zPos = "bottom";
            zValue = -dz;
          } else if (dz < -zDistance) {
            zPos = "top";
            zValue = -dz;
          }
        }
      }

      // Read spider offset from pre-processed synthetic spawns
      const spiderOffsetX = spawn.spiderOffsetX;
      const spiderOffsetY = spawn.spiderOffsetY;

      const instance: IconMarkerInstance = {
        id,
        latLng: markerPosition,
        size,
        sheet,
        rect,
        key: spawn.type,
        z: zValue,
        zPos,
        isHighlighted,
        isDiscovered,
        // Fade predicted spawns whose resolved live mode is `combined` (live +
        // predicted shown together). Set per-spawn in coordinates-provider so a
        // per-filter override fades only the filters it applies to.
        isMuted: !!spawn.muted,
        isSelected: selectedNodeId === nodeId,
        keepUpright: true,
        tint:
          spawn.isPrivate && markerIcon && !useProcessedIcon
            ? spawn.color
            : undefined,
        isStacked,
        spiderOffsetX,
        spiderOffsetY,
      };

      markerInstances.push(instance);

      // Track raw Z for height visualization without player.
      // Skip z=0 — these are spawns without real elevation data and
      // would skew the normalization range for all other markers.
      if (!playerNow && spawn.p[2] !== undefined && spawn.p[2] !== 0) {
        markerZValues.set(markerInstances.length - 1, spawn.p[2]);
      }

      // Add to spatial grid for proximity queries
      newSpatialGrid.add(
        { id, spawn, latLng: markerPosition },
        markerPosition[0],
        markerPosition[1],
      );
    };

    // Pre-process static spawns. Live actors are handled by the imperative
    // pipeline below (writes to liveMarkerLayer, bypasses React entirely).
    const processedSpawns: Spawn[] = [];
    for (const spawn of spawns) {
      if (!spawn.cluster || spawn.cluster.length === 0) {
        processedSpawns.push(spawn);
        continue;
      }
      // Check how many unique types are in this cluster (including the parent)
      // Only include items whose type has an active filter (is in the icons map or is private)
      const allItems = [spawn, ...spawn.cluster].filter(
        (item) => icons.has(item.type) || item.isPrivate,
      );
      if (allItems.length === 0) continue; // all types filtered out
      const typeGroups = new Map<string, (Spawn | Omit<Spawn, "cluster">)[]>();
      for (const item of allItems) {
        const arr = typeGroups.get(item.type) ?? [];
        arr.push(item);
        typeGroups.set(item.type, arr);
      }

      if (typeGroups.size <= 1) {
        // Same-type cluster — keep as-is (original stacked behavior)
        processedSpawns.push(spawn);
        continue;
      }

      // Mixed-type: create one sub-spawn per type group, arranged in a circle
      const groupCount = typeGroups.size;
      const iconSize =
        (markerOptions.radius * (icons.get(spawn.type)?.size ?? 1) * 4 - 1) *
        baseIconSize *
        dpr;
      const radius = iconSize * 0.75; // 3/4 icon size from center
      let groupIdx = 0;
      for (const [type, items] of typeGroups) {
        const angle = (2 * Math.PI * groupIdx) / groupCount - Math.PI / 2;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;

        // Use the first item as the representative spawn
        const representative = items[0] as Spawn;
        // Build sub-cluster from remaining same-type items (if any)
        const subCluster =
          items.length > 1
            ? items
                .slice(1)
                .map((item) => ({ ...item }) as Omit<Spawn, "cluster">)
            : undefined;

        // Create synthetic spawn with spider offset.
        // Use the parent's position as center so all groups share the same origin.
        const syntheticSpawn: Spawn = {
          ...representative,
          p: spawn.p,
          cluster: subCluster,
          spiderOffsetX: offsetX,
          spiderOffsetY: offsetY,
        };

        processedSpawns.push(syntheticSpawn);
        groupIdx++;
      }
    }

    processedSpawns.forEach(handleSpawn);

    // Process shared private spawns
    const sharedPrivateSpawns = sharedMyFilters.flatMap<Spawns[number]>(
      (myFilter) => {
        return (
          myFilter.nodes?.map((node) => {
            // Resolve stale sprite coords for old private nodes missing filterId
            let icon = node.icon;
            if (
              icon &&
              !icon.filterId &&
              icon.name &&
              icon.url?.includes("/icons/")
            ) {
              const current = sharedIconNameLookup.get(icon.name);
              if (current) {
                icon = {
                  ...icon,
                  x: current.x,
                  y: current.y,
                  width: current.width,
                  height: current.height,
                  filterId: current.filterId,
                };
              }
            }
            return {
              type: myFilter.name,
              mapName: node.mapName,
              id: node.id,
              name: node.name,
              description: node.description,
              p: node.p,
              color: node.color,
              icon,
              radius: node.radius,
              isPrivate: true,
            };
          }) ?? []
        );
      },
    );
    sharedPrivateSpawns.forEach(handleSpawn);

    // Height visualization without player: absolute or relative to selected marker
    if (markerZValues.size > 0) {
      // Find selected marker's Z for relative mode
      let referenceZ: number | undefined;
      if (selectedNodeId) {
        for (const [idx, z] of markerZValues) {
          const inst = markerInstances[idx];
          if (
            inst.id === selectedNodeId ||
            inst.id === String(selectedNodeId)
          ) {
            referenceZ = z;
            break;
          }
        }
      }

      // Collect all Z values for robust percentile-based normalization
      const allZ: number[] = [];
      for (const [, z] of markerZValues) allZ.push(z);
      allZ.sort((a, b) => a - b);

      // Use 5th/95th percentile to ignore outliers
      const p05 = allZ[Math.floor(allZ.length * 0.05)] ?? allZ[0]!;
      const p95 =
        allZ[Math.ceil(allZ.length * 0.95 - 1)] ?? allZ[allZ.length - 1]!;

      if (referenceZ !== undefined) {
        // Relative mode: show height relative to selected marker
        const maxDz = Math.max(
          Math.abs(p95 - referenceZ),
          Math.abs(p05 - referenceZ),
          1,
        );
        for (const [idx, z] of markerZValues) {
          const dz = z - referenceZ;
          if (Math.abs(dz) < 0.01 * maxDz) continue; // skip near-zero differences
          const inst = markerInstances[idx];
          inst.zPos = dz > 0 ? "needle" : "needle-down";
          inst.zMag = Math.min(Math.abs(dz) / maxDz, 1);
        }
      } else {
        // Absolute mode: needle only, no arrows (no reference point)
        const robustRange = p95 - p05;
        if (robustRange > 0) {
          for (const [idx, z] of markerZValues) {
            const inst = markerInstances[idx];
            inst.zPos = "needle";
            inst.zMag = Math.max(0, Math.min(1, (z - p05) / robustRange));
          }
        }
      }
    }

    // Add center dots for spiderfied clusters.
    // Insert each dot right before the first spider marker of that cluster
    // so it renders behind the spider icons but not on top of unrelated markers.
    // Uses a single O(n) pass instead of O(n²) splice operations.
    {
      // First pass: find indices where center dots need to be inserted
      const seenCenters = new Set<string>();
      const insertAtIndex = new Set<number>(); // indices that need a dot before them
      const dotDataByIndex = new Map<
        number,
        { key: string; inst: IconMarkerInstance }
      >();
      const len = markerInstances.length;
      for (let ci = 0; ci < len; ci++) {
        const inst = markerInstances[ci];
        if (!inst.spiderOffsetX && !inst.spiderOffsetY) continue;
        const key = `${inst.latLng[0]}_${inst.latLng[1]}`;
        if (!seenCenters.has(key)) {
          seenCenters.add(key);
          insertAtIndex.add(ci);
          dotDataByIndex.set(ci, { key, inst });
        }
      }

      if (insertAtIndex.size > 0) {
        // Single-pass rebuild: copy elements and insert dots at marked positions
        const newInstances: IconMarkerInstance[] = [];
        newInstances.length = len + insertAtIndex.size; // pre-allocate
        let wi = 0;
        for (let ci = 0; ci < len; ci++) {
          if (insertAtIndex.has(ci)) {
            const { key, inst } = dotDataByIndex.get(ci)!;
            const centerId = `__center_${key}`;
            newSpawnMap.set(centerId, {
              id: centerId,
              p: inst.latLng,
              type: "__center",
            } as Spawn);
            newInstances[wi++] = {
              id: centerId,
              latLng: inst.latLng,
              size: Math.max(inst.size * 0.25, 6 * dpr),
              sheet: DEFAULT_CIRCLE_SHEET,
              rect: {
                x: 0,
                y: 0,
                width: Math.round(64 * dpr),
                height: Math.round(64 * dpr),
              },
              key: "__center",
              keepUpright: true,
              noHitTest: true,
              z: inst.z,
              zPos: inst.zPos,
              zMag: inst.zMag,
            };
          }
          newInstances[wi++] = markerInstances[ci];
        }
        markerInstances.length = wi;
        for (let k = 0; k < wi; k++) markerInstances[k] = newInstances[k];
      }
    }

    // Update spatial grid ref
    spatialGridRef.current = newSpatialGrid;

    // Diff vs previously rendered STATIC markers only. Live actor markers
    // are tracked in liveSpawnMapRef and managed by the parallel effect.
    const oldIds = new Set(staticSpawnMapRef.current.keys());
    const newIds = new Set(newSpawnMap.keys());

    const toRemove: string[] = [];
    for (const id of oldIds) {
      if (!newIds.has(id)) toRemove.push(id);
    }
    if (toRemove.length > 0) {
      for (const id of toRemove) {
        markerLayer.unregisterAllEventHandlers(id);
      }
      markerLayer.removeMany(toRemove);
    }

    // Share icon sheets with live marker layer so live actors can use the same sprites
    if (liveMarkerLayer) {
      markerLayer.copySheets(liveMarkerLayer);
    }

    // Tooltip helper. Defined once (not per marker) and stored in a ref so
    // the parallel live-marker effect can reuse it without duplicating the
    // projection / item-building logic.
    const showTooltipForMarker = (m: IconMarkerInstance) => {
      const s = spawnMapRef.current.get(m.id);
      if (!s) return;

      const canvas = map.getContainer();
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const state = (map as any).lastState;
      if (!state) return;

      const worldPos = state.projection(m.latLng);
      const view = state.viewMatrix;
      const clipX = view[0] * worldPos.x + view[3] * worldPos.y + view[6];
      const clipY = view[1] * worldPos.x + view[4] * worldPos.y + view[7];
      let screenX = (clipX * 0.5 + 0.5) * rect.width;
      let screenY = (1 - (clipY * 0.5 + 0.5)) * rect.height;

      // Offset for spiderfied markers (screen-space, scaled by dynamic icon size)
      if (m.spiderOffsetX || m.spiderOffsetY) {
        const midZoom = (state.minZoom + state.maxZoom) * 0.5;
        const factor = dynamicIconSize ? dynamicIconSizeFactor : 0;
        const zoomSizeScale =
          factor > 0.001
            ? Math.max(
                0.25,
                Math.min(
                  2.5,
                  Math.pow(Math.pow(2, state.zoom - midZoom), factor),
                ),
              )
            : 1;
        screenX += ((m.spiderOffsetX ?? 0) * zoomSizeScale) / dpr;
        screenY += ((m.spiderOffsetY ?? 0) * zoomSizeScale) / dpr;
      }

      // Offset tooltip to elevated icon position when height stem is active
      if (state.pitch > 0 && m.zPos) {
        const rawZ = typeof m.z === "number" ? m.z : 0;
        let hI =
          m.zMag !== undefined ? Math.min(1, Math.max(0, m.zMag)) : undefined;
        if (hI === undefined)
          hI = rawZ === 0 ? 0 : Math.min(1, Math.abs(rawZ) / 200);
        let dir =
          m.zPos === "top" || m.zPos === "needle"
            ? 1
            : m.zPos === "bottom" || m.zPos === "needle-down"
              ? -1
              : 0;
        if (dir !== 0 && hI >= 0.01) {
          const heightWorld =
            20 *
            hI *
            Math.abs(Math.sin(state.pitch)) *
            Math.pow(2, state.zoom) *
            500;
          const viewScale = Math.sqrt(view[0] * view[0] + view[1] * view[1]);
          const heightClip =
            heightWorld * viewScale * (2 / (rect.height * dpr));
          screenY -= (heightClip * dir * rect.height) / 2;
        }
      }

      const group = typeToGroup.get(s.type);
      const nodeId = getNodeId(s);
      const isStacked = Boolean(s.cluster && s.cluster.length > 0);

      const items: TooltipItems = [
        {
          id: nodeId,
          termId: (s.name ?? s.id ?? s.type).replace(/my_\d+_/, ""),
          description: s.description,
          type: s.type,
          group,
          isPrivate: s.isPrivate,
          // A live detection of a positioned (fixed) type IS its predicted
          // spawn — treat it as non-live so it stays discoverable. Roaming
          // live-only actors (no static position) remain live.
          isLive: Boolean(s.address) && !positionedTypesRef.current.has(s.type),
          data: s.data,
          p: s.p,
        },
      ];

      if (isStacked) {
        items.push(
          ...s.cluster!.map((stackedSpawn) => {
            const stackedGroup =
              stackedSpawn.type !== s.type
                ? typeToGroup.get(stackedSpawn.type)
                : group;
            return {
              id: stackedSpawn.id,
              termId: (
                stackedSpawn.name ??
                stackedSpawn.id ??
                stackedSpawn.type
              ).replace(/my_\d+_/, ""),
              description: stackedSpawn.description,
              type: stackedSpawn.type,
              group: stackedGroup,
              isPrivate: stackedSpawn.isPrivate,
              isLive:
                Boolean(stackedSpawn.address) &&
                !positionedTypesRef.current.has(stackedSpawn.type),
              data: stackedSpawn.data,
              p: stackedSpawn.p,
            };
          }),
        );
      }

      // Compute screen-pixel radius by projecting the icon edge
      const midZoom = (state.minZoom + state.maxZoom) * 0.5;
      const factor = dynamicIconSize ? dynamicIconSizeFactor : 0;
      const zoomSizeScale =
        factor > 0.001
          ? Math.max(
              0.25,
              Math.min(
                2.5,
                Math.pow(Math.pow(2, state.zoom - midZoom), factor),
              ),
            )
          : 1;
      const halfWorld = (m.size * zoomSizeScale) / 2;
      const edgeClipX =
        view[0] * (worldPos.x + halfWorld) + view[3] * worldPos.y + view[6];
      const edgeScreenX = (edgeClipX * 0.5 + 0.5) * rect.width;
      const screenRadius = Math.abs(edgeScreenX - screenX);

      onTooltipData({
        x: screenX,
        y: screenY,
        radius: screenRadius,
        items,
        latLng: s.p,
      });
      onTooltipOpen(true);
    };
    // Make the tooltip helper available to the live-markers effect.
    showTooltipForMarkerRef.current = showTooltipForMarker;

    // Add or update STATIC markers on markerLayer + register handlers.
    // (Live actors handled by the parallel effect — see below.)
    for (const instance of markerInstances) {
      const spawn = newSpawnMap.get(instance.id);
      markerLayer.add(instance);
      if (!spawn) continue;

      markerLayer.registerEventHandler(instance.id, "mouseover", (m) => {
        if (tooltipDelayRef.current) clearTimeout(tooltipDelayRef.current);
        tooltipDelayRef.current = setTimeout(() => {
          tooltipDelayRef.current = null;
          const canvas = map?.getContainer();
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const state = (map as any).lastState;
            if (state) {
              const worldPos = state.projection(m.latLng);
              const view = state.viewMatrix;
              const clipX =
                view[0] * worldPos.x + view[3] * worldPos.y + view[6];
              const clipY =
                view[1] * worldPos.x + view[4] * worldPos.y + view[7];
              const sx = (clipX * 0.5 + 0.5) * rect.width + rect.left;
              const sy = (1 - (clipY * 0.5 + 0.5)) * rect.height + rect.top;
              const topEl = document.elementFromPoint(sx, sy);
              if (topEl && !canvas.contains(topEl)) return;
            }
          }
          showTooltipForMarkerRef.current?.(m);
        }, 200);
      });
      markerLayer.registerEventHandler(instance.id, "mouseout", () => {
        if (tooltipDelayRef.current) {
          clearTimeout(tooltipDelayRef.current);
          tooltipDelayRef.current = null;
        }
      });
      markerLayer.registerEventHandler(instance.id, "click", (m) => {
        if (tooltipDelayRef.current) {
          clearTimeout(tooltipDelayRef.current);
          tooltipDelayRef.current = null;
        }
        justClickedMarkerRef.current = true;
        const isMobile = window.innerWidth < 768;
        if (!isMobile) showTooltipForMarkerRef.current?.(m);
        const s = spawnMapRef.current.get(m.id);
        if (s && !s.address) {
          const nodeId = getNodeId(s);
          onClick(selectedNodeId === nodeId ? null : nodeId);
        }
      });
      markerLayer.registerEventHandler(instance.id, "contextmenu", (m) => {
        const s = spawnMapRef.current.get(m.id);
        if (!s) return;
        const nodeId = getNodeId(s);
        const isStacked = Boolean(s.cluster && s.cluster.length > 0);
        const wasDiscovered = checkNodeDiscovered(
          nodeId,
          discoveryLookupRef.current,
        );
        if (isStacked) {
          s.cluster!.forEach((stackedSpawn) => {
            setDiscoverNode(getNodeId(stackedSpawn), !wasDiscovered);
          });
        }
        setDiscoverNode(nodeId, !wasDiscovered);
      });
    }

    // Update spawn map refs: static portion + union (with live).
    staticSpawnMapRef.current = newSpawnMap;
    spawnMapRef.current = new Map([...newSpawnMap, ...liveSpawnMapRef.current]);

    // Handle map click to close tooltip and deselect node
    // When a marker is clicked, justClickedMarkerRef is set to prevent
    // the generic map click from undoing the selection.
    const handleMapClick = () => {
      if (justClickedMarkerRef.current) {
        justClickedMarkerRef.current = false;
        return;
      }
      onTooltipOpen(false);
      onClick(null);
    };
    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
      // Cleanup STATIC markers only. Live markers are owned by the parallel
      // live-markers effect and cleaned up by its own teardown.
      const staticIds = Array.from(newSpawnMap.keys());
      for (const id of staticIds) {
        markerLayer.unregisterAllEventHandlers(id);
      }
      if (staticIds.length > 0) markerLayer.removeMany(staticIds);
    };
  }, [
    map,
    map?.markerLayer,
    spawns,
    sharedMyFilters,
    hideDiscoveredNodes,
    discoveryLookup,
    tempPrivateNodeId,
    selectedNodeId,
    highlightSpawnIDs,
    rotationCache,
    baseIconSize,
    iconSizeByFilter,
    iconSizeByGroup,
    typeToGroup,
    typeToCategory,
    // throttledPlayer intentionally OMITTED — read via ref to avoid
    // rebuilding every static marker every second when the player moves.
    markerOptions.zPos,
    colorBlindMode,
    colorBlindSeverity,
    dynamicIconSize,
    dynamicIconSizeFactor,
    iconLoadVersion, // Re-run when images finish loading to apply processed icons
    sharedIconNameLookup, // Re-resolve stale shared private icon coords
  ]);

  // Player-relative height arrows (up/down elevation indicators).
  //
  // zPos/zValue are also computed where markers are built (static rebuild and
  // live-actor pipeline), but those read the player via ref/snapshot and don't
  // re-run on every 1s player tick (the static rebuild deliberately excludes
  // player from its deps to avoid rebuilding every marker). So the arrows are
  // absent whenever the player position arrives after the build (the norm in
  // live mode) and don't update as the player moves while spawns are static.
  // This effect keeps them current by recomputing zPos/zValue on player
  // movement and applying via updateMarker: cheap O(N) field updates, no icon
  // reprocessing or rebuild. Covers both layers. Guarded on a present player
  // so it never clobbers the no-player absolute-elevation "needle" mode.
  useEffect(() => {
    if (!map || !markerOptions.zPos || !throttledPlayer) return;
    const cfg = markerOptions.zPos;
    const player = throttledPlayer;

    const refresh = (
      layer: typeof map.markerLayer,
      spawnMap: Map<string, Spawn>,
    ) => {
      if (!layer) return false;
      let dirty = false;
      for (const [id, spawn] of spawnMap) {
        let mx = spawn.p[0];
        let my = spawn.p[1];
        if (rotationCache) {
          const rm = rotationCache.getRotated(spawn.p[0], spawn.p[1]);
          mx = rm[0];
          my = rm[1];
        }
        const { zPos, zValue } = computeRelativeZPos(
          spawn.p[2],
          mx,
          my,
          player,
          rotationCache,
          cfg,
        );
        const existing = layer.getMarker(id);
        if (!existing) continue;
        if ((existing.zPos ?? null) !== zPos || existing.z !== zValue) {
          layer.updateMarker(id, { z: zValue, zPos });
          dirty = true;
        }
      }
      return dirty;
    };

    const staticDirty = refresh(map.markerLayer, staticSpawnMapRef.current);
    const liveDirty = refresh(map.liveMarkerLayer, liveSpawnMapRef.current);
    if (staticDirty || liveDirty) map.requestRedraw();
  }, [map, throttledPlayer, markerOptions.zPos, rotationCache]);

  // Imperative live-actors pipeline.
  // Bypasses React's render cycle entirely for live actors. Subscribes
  // directly to useGameState.actors + user/settings stores; on each tick:
  //   - reuses existing markers in-place (updateMarker for position)
  //   - adds new actors with a single registerEventHandler pass
  //   - removes gone actors via removeMany
  // No useState, no useEffect re-runs, no React reconciliation, no setSpawns
  // → no propagation to consumers that depend on spawns.
  useEffect(() => {
    const liveMarkerLayer = map?.liveMarkerLayer;
    const markerLayerForSheets = map?.markerLayer;
    if (!map || !liveMarkerLayer || !typesIdMap) return;

    if (markerLayerForSheets) markerLayerForSheets.copySheets(liveMarkerLayer);

    const dpr = window.devicePixelRatio || 1;

    const processActors = () => {
      const actorsList = useGameState.getState().actors || [];
      const userState = userStoreApi.getState();
      const settingsState = useSettingsStore.getState();
      // Live data renders unless mode is 'static'. (Preview-only modes
      // collapse to 'live' for non-preview users, but both still mean
      // "show live actors" — the only difference is static-marker muting,
      // which is handled by the static effect.)
      const isLiveActive = settingsState.liveMode !== "static";

      // Auto-discovery runs in EVERY mode incl. Predicted ('static') — marking a
      // node collected is independent of whether we render live markers; it only
      // needs the app to be feeding live actors. So it sits ABOVE the render-mode
      // early-return below. The memory reader can flag an actor as already collected
      // (e.g. a picked-up Palworld effigy — bPickedInClient stays true and the actor
      // persists in memory); permanently mark its node discovered. Only positioned
      // (fixed) types — a roaming/live-only actor is never auto-discovered.
      // Independent of active filters and the discovered-hide toggle. Collect the
      // newly-collected ids and write them in ONE store update: a per-node
      // setDiscoverNode would fire the discoveredNodes subscription (which re-runs
      // this pass) synchronously each call — O(n^2) reentrancy on a first load where
      // many effigies are already collected.
      if (settingsState.autoDiscoverCollected) {
        const newlyCollected: string[] = [];
        for (const actor of actorsList) {
          if (!actor.discovered || !actor.address) {
            continue;
          }
          const displayType = typesIdMap[actor.type];
          if (!displayType || !positionedTypesRef.current.has(displayType)) {
            continue;
          }
          const autoId = `${displayType}@${actor.x.toFixed(2)}:${actor.y.toFixed(2)}`;
          if (!checkNodeDiscovered(autoId, discoveryLookupRef.current)) {
            newlyCollected.push(autoId);
          }
        }
        if (newlyCollected.length > 0) {
          // Adds to discoveredNodes (all discovery logic applies) AND
          // autoDiscoveredNodes (so the tooltip can flag it as auto-discovered).
          useSettingsStore.getState().markAutoDiscovered(newlyCollected);
        }
      }

      if (!isLiveActive) {
        if (liveSpawnMapRef.current.size > 0) {
          const ids = Array.from(liveSpawnMapRef.current.keys());
          for (const id of ids) liveMarkerLayer.unregisterAllEventHandlers(id);
          liveMarkerLayer.removeMany(ids);
          liveSpawnMapRef.current.clear();
          spawnMapRef.current = new Map(staticSpawnMapRef.current);
          map.requestRedraw();
        }
        return;
      }

      // Per-type live-mode resolution: a filter overridden to "Predicted"
      // (resolved 'static') suppresses its live actors — the static effect
      // renders its predictions instead. 'combined'/'live' both show actors.
      const liveModeByFilterNow = settingsState.liveModeByFilter;
      const hasPreviewNow =
        useAccountStore.getState().perks.previewReleaseAccess;
      const globalEffectiveMode = getEffectiveLiveMode(
        settingsState.liveMode,
        hasPreviewNow,
      );

      const activeFilters = new Set(userState.filters);
      const currentMapName = userState.mapName;
      const selectedNodeIdNow = userState.selectedNodeId;
      const highlightSpawnIDsNow = useGameState.getState().highlightSpawnIDs;
      const baseIconSizeNow = settingsState.baseIconSize;
      const iconSizeByGroupNow = settingsState.iconSizeByGroup;
      const iconSizeByFilterNow = settingsState.iconSizeByFilter;
      const hideDiscoveredNow = settingsState.hideDiscoveredNodes;
      const setDiscoverNodeFn = settingsState.setDiscoverNode;
      const playerNow = useGameState.getState().player;

      // Marker size from the icon base + the base / category / group / type
      // size multipliers. Shared by the create and in-place-update paths so a
      // size-slider change re-applies to already-rendered live markers (the
      // static rebuild reacts to these settings via deps; the imperative live
      // pipeline must recompute them itself).
      const computeMarkerSize = (displayType: string) => {
        const icon = icons.get(displayType);
        const iconBaseSize = icon?.size ?? 1;
        const groupId = typeToGroup.get(displayType);
        const groupMultiplier = groupId
          ? (iconSizeByGroupNow[groupId] ?? 1)
          : 1;
        const categoryId = typeToCategory.get(displayType);
        const categoryMultiplier = categoryId
          ? (iconSizeByGroupNow[categoryId] ?? 1)
          : 1;
        const typeMultiplier = iconSizeByFilterNow[displayType] ?? 1;
        const spawnRadius = markerOptions.radius * iconBaseSize;
        return (
          (spawnRadius * 4 - 1) *
          baseIconSizeNow *
          categoryMultiplier *
          groupMultiplier *
          typeMultiplier *
          dpr
        );
      };

      // Collect actors that should render (after visibility filters), then group
      // them into render units. With clusterPrecision > 0, same-type actors that
      // snap to the same grid cell collapse into one stacked marker — mirroring
      // how predicted spawns cluster in coordinates-provider, which this
      // imperative live pipeline otherwise skipped.
      const clusterPrecision = markerOptions.clusterPrecision ?? 0;
      type LiveActor = (typeof actorsList)[number];

      const visible: { actor: LiveActor; displayType: string }[] = [];
      for (const actor of actorsList) {
        if (!actor.address) continue;
        // Memory readers may flag actors as hidden (e.g. Palia villagers with
        // bHiddenForRelevance = 1, looted rummage piles, faded characters).
        // Respect that — otherwise we render markers for entities the game
        // has hidden.
        if (actor.hidden) continue;
        const displayType = typesIdMap[actor.type];
        if (!displayType) continue;
        if (!activeFilters.has(displayType)) continue;
        // Merge/replace: a live actor for a PERMANENT (static:true) type is already
        // represented by its always-rendered static marker (realStaticNodes) at the
        // same fixed position — don't draw a live twin on top (double marker +
        // doubled discovered alpha). Auto-discovery already ran above over ALL
        // actors, so collection still registers; we just suppress the duplicate.
        if (permanentTypesRef.current.has(displayType)) continue;
        // Skip live actors for filters the user pinned to Predicted-only.
        if (
          resolveLiveModeForType(
            displayType,
            globalEffectiveMode,
            liveModeByFilterNow,
            hasPreviewNow,
          ) === "static"
        ) {
          continue;
        }
        if (actor.mapName && actor.mapName !== currentMapName) continue;
        visible.push({ actor, displayType });
      }

      type LiveUnit = {
        id: string;
        displayType: string;
        members: LiveActor[];
        // Snapped cell center (raw, pre-rotation). Used as the marker origin
        // when a cell holds multiple types so they spider out from one point.
        cx: number;
        cy: number;
        useCenter: boolean;
        spiderOffsetX: number;
        spiderOffsetY: number;
      };
      const units: LiveUnit[] = [];
      if (clusterPrecision > 0) {
        const byCell = new Map<string, LiveUnit>();
        const cellUnits = new Map<string, LiveUnit[]>();
        for (const { actor, displayType } of visible) {
          const sx = Math.round(actor.x / clusterPrecision) * clusterPrecision;
          const sy = Math.round(actor.y / clusterPrecision) * clusterPrecision;
          const cellKey = `${sx}:${sy}`;
          const key = `${displayType}@${cellKey}`;
          let unit = byCell.get(key);
          if (!unit) {
            unit = {
              id: key,
              displayType,
              members: [],
              cx: sx,
              cy: sy,
              useCenter: false,
              spiderOffsetX: 0,
              spiderOffsetY: 0,
            };
            byCell.set(key, unit);
            const arr = cellUnits.get(cellKey) ?? [];
            arr.push(unit);
            cellUnits.set(cellKey, arr);
          }
          unit.members.push(actor);
        }
        // Spider cells that hold more than one type so their icons don't stack
        // on top of each other (same arrangement as the static cluster path).
        const iconSize = (markerOptions.radius * 4 - 1) * baseIconSizeNow * dpr;
        const spiderRadius = iconSize * 0.75;
        for (const group of cellUnits.values()) {
          if (group.length <= 1) continue;
          const n = group.length;
          group.forEach((unit, i) => {
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            unit.useCenter = true;
            unit.spiderOffsetX = Math.cos(angle) * spiderRadius;
            unit.spiderOffsetY = Math.sin(angle) * spiderRadius;
          });
        }
        for (const unit of byCell.values()) {
          // Stable representative (lowest address) so the marker doesn't hop
          // between actors in the cell across ticks.
          unit.members.sort((a, b) => a.address - b.address);
          units.push(unit);
        }
      } else {
        for (const { actor, displayType } of visible) {
          units.push({
            // Key by type + address (not address alone): the same entity address
            // can change species in place (e.g. Heartopia re-types pooled fish on
            // time-period rollover), and the in-place update path never refreshes
            // the icon — a new id forces remove + recreate with the correct icon.
            id: `${displayType}@${actor.address}`,
            displayType,
            members: [actor],
            cx: actor.x,
            cy: actor.y,
            useCenter: false,
            spiderOffsetX: 0,
            spiderOffsetY: 0,
          });
        }
      }

      const seen = new Set<string>();
      const newSpawns = new Map<string, Spawn>();
      let dirty = false;

      for (const unit of units) {
        const { id, displayType, members } = unit;
        const rep = members[0];
        const isStacked = members.length > 1;

        // Spidered units share the cell center as origin; otherwise sit on the
        // representative actor.
        const baseX = unit.useCenter ? unit.cx : rep.x;
        const baseY = unit.useCenter ? unit.cy : rep.y;
        let pos: [number, number] = [baseX, baseY];
        if (rotationCache) pos = rotationCache.getRotated(baseX, baseY);

        const memberNodeId = (a: LiveActor) =>
          `${displayType}@${a.x.toFixed(2)}:${a.y.toFixed(2)}`;
        const nodeId = memberNodeId(rep);
        // A cluster counts as discovered only when every member is.
        const isDiscoveredFlag = members.every((a) =>
          checkNodeDiscovered(memberNodeId(a), discoveryLookupRef.current),
        );
        // hideDiscoveredNow + discovered → omit from seen so the remove loop
        // takes the marker off the layer. (If we added to seen first, the
        // marker would stay rendered with stale state.)
        if (isDiscoveredFlag && hideDiscoveredNow) continue;
        seen.add(id);

        const toSpawn = (a: LiveActor): Spawn => ({
          id: memberNodeId(a),
          type: displayType,
          p:
            a.z != null
              ? ([a.x, a.y, a.z] as [number, number, number])
              : ([a.x, a.y] as [number, number]),
          mapName: a.mapName,
          address: a.address,
          source: "live",
        });
        const spawn: Spawn = {
          ...toSpawn(rep),
          cluster: isStacked ? members.slice(1).map(toSpawn) : undefined,
        };
        newSpawns.set(id, spawn);
        const newIsHighlighted =
          highlightSpawnIDsNow.includes(nodeId) || selectedNodeIdNow === nodeId;
        const newIsSelected = selectedNodeIdNow === nodeId;

        const { zPos, zValue } = computeRelativeZPos(
          spawn.p[2],
          pos[0],
          pos[1],
          playerNow,
          rotationCache,
          markerOptions.zPos,
        );

        const existing = liveMarkerLayer.getMarker(id);
        if (existing) {
          // In-place update — position OR derived state (discovery, highlight,
          // selection, height arrow, size) so right-click-to-discover and
          // icon-size slider changes reflect immediately without recreating
          // the marker.
          const size = computeMarkerSize(displayType);
          const posChanged =
            existing.latLng[0] !== pos[0] || existing.latLng[1] !== pos[1];
          const flagsChanged =
            !!existing.isDiscovered !== isDiscoveredFlag ||
            !!existing.isHighlighted !== newIsHighlighted ||
            !!existing.isSelected !== newIsSelected ||
            !!existing.isStacked !== isStacked ||
            (existing.spiderOffsetX ?? 0) !== unit.spiderOffsetX ||
            (existing.spiderOffsetY ?? 0) !== unit.spiderOffsetY ||
            (existing.zPos ?? null) !== zPos ||
            existing.z !== zValue ||
            existing.size !== size;
          if (posChanged || flagsChanged) {
            liveMarkerLayer.updateMarker(id, {
              latLng: pos,
              size,
              isDiscovered: isDiscoveredFlag,
              isHighlighted: newIsHighlighted,
              isSelected: newIsSelected,
              isStacked,
              spiderOffsetX: unit.spiderOffsetX,
              spiderOffsetY: unit.spiderOffsetY,
              z: zValue,
              zPos,
            });
            dirty = true;
          }
          continue;
        }

        // New marker: resolve icon, build instance once.
        const icon = icons.get(displayType);
        let sheet = "icons";
        let rect = { x: 0, y: 0, width: 64, height: 64 };
        const markerIcon =
          (typeof icon?.icon === "string" ? null : icon?.icon) ?? null;
        const stringIcon = typeof icon?.icon === "string" ? icon.icon : null;
        if (stringIcon) {
          const fullUrl = getIconsUrl(appName, stringIcon, iconsPath);
          sheet = fullUrl;
          liveMarkerLayer.addSheet(sheet, fullUrl);
        } else if (markerIcon && "x" in markerIcon) {
          rect = {
            x: markerIcon.x as number,
            y: markerIcon.y as number,
            width: markerIcon.width as number,
            height: markerIcon.height as number,
          };
        } else if (!markerIcon) {
          sheet = DEFAULT_CIRCLE_SHEET;
          const px = Math.round(64 * dpr);
          rect = { x: 0, y: 0, width: px, height: px };
        }

        const size = computeMarkerSize(displayType);

        const instance: IconMarkerInstance = {
          id,
          latLng: pos,
          size,
          sheet,
          rect,
          key: displayType,
          isHighlighted: newIsHighlighted,
          isDiscovered: isDiscoveredFlag,
          isMuted: false,
          isSelected: newIsSelected,
          isStacked,
          spiderOffsetX: unit.spiderOffsetX,
          spiderOffsetY: unit.spiderOffsetY,
          keepUpright: true,
          z: zValue,
          zPos,
        };
        liveMarkerLayer.add(instance);

        // Register handlers ONCE per marker (not re-registered on subsequent
        // ticks since we early-return for existing markers above).
        liveMarkerLayer.registerEventHandler(id, "mouseover", (m) => {
          if (tooltipDelayRef.current) clearTimeout(tooltipDelayRef.current);
          tooltipDelayRef.current = setTimeout(() => {
            tooltipDelayRef.current = null;
            showTooltipForMarkerRef.current?.(m);
          }, 200);
        });
        liveMarkerLayer.registerEventHandler(id, "mouseout", () => {
          if (tooltipDelayRef.current) {
            clearTimeout(tooltipDelayRef.current);
            tooltipDelayRef.current = null;
          }
        });
        liveMarkerLayer.registerEventHandler(id, "click", (m) => {
          if (tooltipDelayRef.current) {
            clearTimeout(tooltipDelayRef.current);
            tooltipDelayRef.current = null;
          }
          justClickedMarkerRef.current = true;
          const isMobile = window.innerWidth < 768;
          if (!isMobile) showTooltipForMarkerRef.current?.(m);
        });
        liveMarkerLayer.registerEventHandler(id, "contextmenu", (m) => {
          const s = spawnMapRef.current.get(m.id);
          if (!s) return;
          // Toggle discovery for the whole cluster (or just the one spawn).
          const group =
            s.cluster && s.cluster.length > 0 ? [s, ...s.cluster] : [s];
          const allDiscovered = group.every((g) =>
            checkNodeDiscovered(getNodeId(g), discoveryLookupRef.current),
          );
          for (const g of group) {
            setDiscoverNodeFn(getNodeId(g), !allDiscovered);
          }
        });
        dirty = true;
      }

      // Remove gone actors.
      const toRemove: string[] = [];
      for (const id of liveSpawnMapRef.current.keys()) {
        if (!seen.has(id)) toRemove.push(id);
      }
      if (toRemove.length > 0) {
        for (const id of toRemove)
          liveMarkerLayer.unregisterAllEventHandlers(id);
        liveMarkerLayer.removeMany(toRemove);
        dirty = true;
      }

      liveSpawnMapRef.current = newSpawns;
      spawnMapRef.current = new Map([
        ...staticSpawnMapRef.current,
        ...newSpawns,
      ]);
      if (dirty) map.requestRedraw();
    };

    // Subscribe ONLY to the state that genuinely affects what live markers
    // show. Note these are zustand subscriptions, NOT React useEffect deps
    // — they don't tear down/rebuild the marker pipeline.
    const unsubActors = useGameState.subscribe((s) => s.actors, processActors);
    const unsubHighlight = useGameState.subscribe(
      (s) => s.highlightSpawnIDs,
      processActors,
    );
    const unsubFilters = userStoreApi.subscribe(
      (s) => s.filters,
      processActors,
    );
    const unsubMapName = userStoreApi.subscribe(
      (s) => s.mapName,
      processActors,
    );
    const unsubSelected = userStoreApi.subscribe(
      (s) => s.selectedNodeId,
      processActors,
    );
    const unsubLiveMode = useSettingsStore.subscribe(
      (s) => s.liveMode,
      processActors,
    );
    // Per-filter live-mode overrides: re-resolve which actors render live.
    const unsubLiveModeByFilter = useSettingsStore.subscribe(
      (s) => s.liveModeByFilter,
      processActors,
    );
    // Preview access gates the 'combined' override → re-resolve on change.
    const unsubPreviewAccess = useAccountStore.subscribe(
      (s) => s.perks.previewReleaseAccess,
      processActors,
    );
    const unsubHideDiscovered = useSettingsStore.subscribe(
      (s) => s.hideDiscoveredNodes,
      processActors,
    );
    // Re-process when a node gets marked discovered/undiscovered so the
    // existing live marker reflects the new state immediately (right-click
    // contextmenu fix). Rebuild the lookup HERE — the zustand subscription
    // fires before React re-renders discoveryLookupRef, so processActors would
    // otherwise recompute against the stale (pre-toggle) lookup and the marker
    // wouldn't greyscale until the next actor tick.
    const unsubDiscovered = useSettingsStore.subscribe(
      (s) => s.discoveredNodes,
      (discoveredNodes) => {
        discoveryLookupRef.current = buildDiscoveryLookup(discoveredNodes);
        processActors();
      },
    );
    // Re-process on icon-size changes so the sliders resize live markers in
    // place. Without these the static (predicted) markers resize via the
    // rebuild effect's deps, but live markers stay frozen until a mode toggle
    // recreates them.
    const unsubBaseIconSize = useSettingsStore.subscribe(
      (s) => s.baseIconSize,
      processActors,
    );
    const unsubIconSizeByGroup = useSettingsStore.subscribe(
      (s) => s.iconSizeByGroup,
      processActors,
    );
    const unsubIconSizeByFilter = useSettingsStore.subscribe(
      (s) => s.iconSizeByFilter,
      processActors,
    );
    // Initial run.
    processActors();

    return () => {
      unsubActors();
      unsubHighlight();
      unsubFilters();
      unsubMapName();
      unsubSelected();
      unsubLiveMode();
      unsubLiveModeByFilter();
      unsubPreviewAccess();
      unsubHideDiscovered();
      unsubDiscovered();
      unsubBaseIconSize();
      unsubIconSizeByGroup();
      unsubIconSizeByFilter();
      const ids = Array.from(liveSpawnMapRef.current.keys());
      for (const id of ids) liveMarkerLayer.unregisterAllEventHandlers(id);
      if (ids.length > 0) liveMarkerLayer.removeMany(ids);
      liveSpawnMapRef.current.clear();
    };
  }, [
    map,
    map?.liveMarkerLayer,
    map?.markerLayer,
    typesIdMap,
    icons,
    rotationCache,
    markerOptions.radius,
    appName,
    iconsPath,
    typeToGroup,
    typeToCategory,
  ]);

  // Update high contrast uniforms without rebuilding markers
  useEffect(() => {
    const markerLayer = map?.markerLayer;
    if (!markerLayer) return;
    markerLayer.setHighContrastMode(highContrastMode);
    markerLayer.setHighContrastColor(highContrastColor);
    markerLayer.setHighContrastThickness(highContrastThickness);
    const liveMarkerLayer = map?.liveMarkerLayer;
    if (liveMarkerLayer) {
      liveMarkerLayer.setHighContrastMode(highContrastMode);
      liveMarkerLayer.setHighContrastColor(highContrastColor);
      liveMarkerLayer.setHighContrastThickness(highContrastThickness);
    }
    map.requestRedraw();
  }, [map, highContrastMode, highContrastColor, highContrastThickness]);

  // Audio alerts when player is within range of tracked spawns.
  // Uses `spawns` directly (not spawnMapRef) because spawns is the
  // authoritative filtered list from useCoordinates() — it excludes
  // disabled filters immediately, avoiding stale-ref race conditions.
  useEffect(() => {
    // Need a player position and at least one enabled alert. Note we do NOT
    // bail on spawns.length === 0: in live mode `spawns` holds only permanent
    // landmarks + custom nodes, so a purely-live tracked type would otherwise
    // never reach the live-actor check below.
    if (audioAlertsMuted || !throttledPlayer) return;

    const hasAnyAudioAlert = Object.values(audioAlertByFilter).some(Boolean);
    if (!hasAnyAudioAlert) return;

    const rangeSq = audioAlertRange * audioAlertRange;

    // Apply rotation to player position if needed
    let playerX = throttledPlayer.x;
    let playerY = throttledPlayer.y;
    if (rotationCache) {
      const rotatedPlayer = rotationCache.getRotated(
        throttledPlayer.x,
        throttledPlayer.y,
      );
      playerX = rotatedPlayer[0];
      playerY = rotatedPlayer[1];
    }

    const checkProximity = () => {
      // Collect the distinct alert TYPES in range (not just a boolean) so the
      // fire-time notification can name what dinged. Skip predicted-only
      // spawns (source === 'static' in combined mode) — they're faded ghost
      // markers we haven't confirmed live, so alerting on them would fire on
      // phantom locations. The per-type guard makes the loop cheap (only
      // enabled-alert types do any work).
      const inRangeTypes = new Set<string>();
      for (const spawn of spawns) {
        if (!audioAlertByFilter[spawn.type]) continue;
        if (spawn.source === "static") continue;
        // Skip nodes the user already marked discovered — they're collected, so
        // re-pinging when the player passes the old location is unwanted. The
        // render path hides them the same way (checkNodeDiscovered above).
        if (checkNodeDiscovered(getNodeId(spawn), discoveryLookup)) continue;

        let spawnX = spawn.p[0];
        let spawnY = spawn.p[1];
        if (rotationCache) {
          const rotatedSpawn = rotationCache.getRotated(spawnX, spawnY);
          spawnX = rotatedSpawn[0];
          spawnY = rotatedSpawn[1];
        }

        const dx = playerX - spawnX;
        const dy = playerY - spawnY;

        if (dx * dx + dy * dy <= rangeSq) {
          inRangeTypes.add(spawn.type);
        }
      }

      // Live actors: iterate raw actor list with type mapping. Read fresh from
      // the store on every call so the subscription below sees current actors.
      if (typesIdMap) {
        const liveActorsList = useGameState.getState().actors || [];
        for (const actor of liveActorsList) {
          const displayType = typesIdMap[actor.type];
          if (!displayType || !audioAlertByFilter[displayType]) continue;
          // Same discovered-node skip as static spawns above. Node id matches
          // the live-marker pipeline's format (type@x:y, 2-decimal coords).
          const actorNodeId = `${displayType}@${actor.x.toFixed(
            2,
          )}:${actor.y.toFixed(2)}`;
          if (checkNodeDiscovered(actorNodeId, discoveryLookup)) continue;

          let actorX = actor.x;
          let actorY = actor.y;
          if (rotationCache) {
            const rotated = rotationCache.getRotated(actorX, actorY);
            actorX = rotated[0];
            actorY = rotated[1];
          }

          const dx = playerX - actorX;
          const dy = playerY - actorY;
          if (dx * dx + dy * dy <= rangeSq) {
            inRangeTypes.add(displayType);
          }
        }
      }

      if (inRangeTypes.size > 0) {
        // Play sound (and notify) only on transition from none to some.
        if (!hasAlertedRef.current) {
          hasAlertedRef.current = true;
          playAlertSound(audioAlertSound, audioAlertVolume);
          if (audioAlertNotifications) {
            const names = [...inRangeTypes].map((tp) => t(tp) || tp);
            const label =
              names.length <= 2
                ? names.join(", ")
                : `${names[0]} +${names.length - 1} more`;
            toast(`🔔 ${label} nearby`);
          }
        }
      } else {
        // Reset when all spawns are out of range
        hasAlertedRef.current = false;
      }
    };

    // Initial check covers player movement (throttledPlayer dep), static-spawn
    // and settings changes.
    checkProximity();

    // Live actors flow imperatively into useGameState.actors and are NOT in
    // this effect's deps, so without a direct subscription a tracked actor
    // moving into range while the player stands still would never trigger an
    // alert (the marker appears but no sound plays). Mirror the live-marker
    // pipeline: re-check on every actor tick.
    const unsubActors = useGameState.subscribe((s) => s.actors, checkProximity);
    return () => {
      unsubActors();
    };
  }, [
    throttledPlayer,
    spawns,
    audioAlertsMuted,
    audioAlertNotifications,
    audioAlertRange,
    audioAlertByFilter,
    audioAlertSound,
    audioAlertVolume,
    rotationCache,
    typesIdMap,
    t,
    // Re-run on discovery changes so a newly-discovered in-range node stops
    // alerting immediately (and re-checks with a fresh lookup, not a stale ref).
    discoveryLookup,
  ]);

  // Label rendering using canvas-rendered text as WebGL markers on the main marker layer
  useEffect(() => {
    const markerLayer = map?.markerLayer;
    if (!map || !markerLayer) return;

    const dpr = window.devicePixelRatio || 1;
    const fontSize = Math.round(14 * labelTextSize);
    const pad = 6;
    const cache = labelCanvasCache.current;

    // Helper: get or create a DPR-scaled canvas with rendered text.
    // Returns logical width/height; the canvas pixels are DPR-scaled for crisp text.
    const getTextCanvas = (text: string) => {
      const key = `${text}__${fontSize}__${dpr}`;
      let entry = cache.get(key);
      if (entry) return entry;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const font = `700 ${fontSize}px Arial, system-ui, sans-serif`;
      ctx.font = font;
      const metrics = ctx.measureText(text);
      const w = Math.ceil(metrics.width) + pad * 2;
      const h = fontSize + pad * 2;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      // Scale context for high-DPI rendering
      ctx.scale(dpr, dpr);

      // Re-set font after resize
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Text shadow (outline)
      const shadowColor = "#594f42";
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
        ctx.fillStyle = shadowColor;
        ctx.fillText(text, w / 2 + dx, h / 2 + dy);
      }
      ctx.fillStyle = "#FFFFFFEE";
      ctx.fillText(text, w / 2, h / 2);

      entry = { canvas, width: w, height: h };
      cache.set(key, entry);
      return entry;
    };

    // Place a label on the main marker layer. Caller is responsible for
    // tracking the entry in activeLabelIds.
    const placeLabel = (
      labelId: string,
      anchorId: string,
      pos: [number, number],
      text: string,
    ) => {
      const { canvas, width, height } = getTextCanvas(text);
      const sheetName = `__label_${text}__${fontSize}`;
      markerLayer.setSheet(sheetName, canvas);
      // Anchor over the icon marker (static OR live layer) if present.
      const iconSize =
        markerLayer.getMarker(anchorId)?.size ??
        map.liveMarkerLayer?.getMarker(anchorId)?.size ??
        40 * dpr;
      markerLayer.add({
        id: labelId,
        latLng: pos,
        size: height * dpr,
        sizeW: width * dpr,
        screenOffsetY: -(iconSize / 2 + (height * dpr) / 2 + 2),
        sheet: sheetName,
        // Use physical pixel dimensions for UV mapping (canvas is DPR-scaled)
        rect: { x: 0, y: 0, width: canvas.width, height: canvas.height },
        keepUpright: true,
        noHitTest: true,
      });
    };

    // Diff-based label sync — called on mount, on React-dep changes, and on
    // live-actor / player-position subscription updates. The label set lives
    // on the main marker layer, but its inputs include live actors merged
    // into spawnMapRef.current by the live-marker effect. Without the
    // imperative re-sync below, live-fish labels never appear (the React
    // effect doesn't see actor mutations) and stick to stale positions when
    // they do (no per-tick update path).
    const syncLabels = () => {
      const hasAnyLabels = Object.values(labelModeByFilter).some(
        (m) => m && m !== "off",
      );
      if (!hasAnyLabels) {
        if (activeLabelIds.current.size === 0) return;
        for (const labelId of activeLabelIds.current.keys()) {
          markerLayer.remove(labelId);
        }
        activeLabelIds.current.clear();
        map.requestRedraw();
        return;
      }

      // Build the target set: labelId → desired state.
      const target = new Map<
        string,
        { anchorId: string; pos: [number, number]; text: string }
      >();

      // "always" and "hotkey" mode labels
      for (const [id, spawn] of spawnMapRef.current) {
        const mode = labelModeByFilter[spawn.type];
        if (!mode || mode === "off" || mode === "inRange") continue;
        if (mode === "hotkey" && !showLabelsActive) continue;

        let pos: [number, number] = [spawn.p[0], spawn.p[1]];
        if (rotationCache) {
          pos = rotationCache.getRotated(spawn.p[0], spawn.p[1]);
        }
        target.set(`__label_${id}`, { anchorId: id, pos, text: t(spawn.type) });
      }

      // "inRange" mode labels
      if (rotatedPlayer) {
        const playerX = rotatedPlayer.x;
        const playerY = rotatedPlayer.y;
        const rangeSq = audioAlertRange * audioAlertRange;

        const useSpatialGrid =
          spatialGridRef.current && spatialGridRef.current.size > 100;

        const itemsToCheck = useSpatialGrid
          ? spatialGridRef.current!.getNearby(playerX, playerY, audioAlertRange)
          : Array.from(spawnMapRef.current.entries()).map(([id, spawn]) => {
              let latLng: [number, number] = [spawn.p[0], spawn.p[1]];
              if (rotationCache) {
                latLng = rotationCache.getRotated(spawn.p[0], spawn.p[1]);
              }
              return { id, spawn, latLng };
            });

        for (const item of itemsToCheck) {
          const mode = labelModeByFilter[item.spawn.type];
          if (mode !== "inRange") continue;

          const dx = playerX - item.latLng[0];
          const dy = playerY - item.latLng[1];
          if (dx * dx + dy * dy <= rangeSq) {
            target.set(`__label_${item.id}`, {
              anchorId: item.id,
              pos: item.latLng,
              text: t(item.spawn.type),
            });
          }
        }
      }

      // Diff target vs activeLabelIds.
      let dirty = false;
      for (const [labelId, next] of target) {
        const prev = activeLabelIds.current.get(labelId);
        if (!prev) {
          placeLabel(labelId, next.anchorId, next.pos, next.text);
          activeLabelIds.current.set(labelId, {
            pos: next.pos,
            text: next.text,
          });
          dirty = true;
          continue;
        }
        const posChanged =
          prev.pos[0] !== next.pos[0] || prev.pos[1] !== next.pos[1];
        const textChanged = prev.text !== next.text;
        if (textChanged) {
          // Text drives the sheet — easiest path is remove + re-place.
          markerLayer.remove(labelId);
          placeLabel(labelId, next.anchorId, next.pos, next.text);
          activeLabelIds.current.set(labelId, {
            pos: next.pos,
            text: next.text,
          });
          dirty = true;
        } else if (posChanged) {
          markerLayer.updateMarker(labelId, { latLng: next.pos });
          activeLabelIds.current.set(labelId, {
            pos: next.pos,
            text: next.text,
          });
          dirty = true;
        }
      }

      // Remove gone labels.
      for (const labelId of Array.from(activeLabelIds.current.keys())) {
        if (!target.has(labelId)) {
          markerLayer.remove(labelId);
          activeLabelIds.current.delete(labelId);
          dirty = true;
        }
      }

      if (dirty) map.requestRedraw();
    };

    syncLabels();

    // Live actors mutate spawnMapRef via zustand subscriptions outside React
    // (see live-marker effect at ~line 1525). Mirror that subscription so
    // labels track live fish/etc. Static spawn changes re-run via the
    // `spawns` dep, and player movement re-runs via the `rotatedPlayer` dep,
    // so neither needs its own subscription here.
    const unsubActors = useGameState.subscribe((s) => s.actors, syncLabels);

    return () => {
      unsubActors();
      if (map?.markerLayer) {
        for (const labelId of activeLabelIds.current.keys()) {
          map.markerLayer.remove(labelId);
        }
      }
      activeLabelIds.current.clear();
    };
  }, [
    map,
    spawns,
    labelModeByFilter,
    labelTextSize,
    showLabelsActive,
    rotatedPlayer,
    audioAlertRange,
    rotationCache,
    t,
  ]);

  // Fit bounds when spawns change
  useEffect(() => {
    if (
      !fitBoundsOnChange ||
      isLiveReadingActive(liveMode) ||
      spawns.length === 0 ||
      !map
    ) {
      return;
    }
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    // WebMap doesn't have flyToBounds, use fitBounds if available
    if (typeof (map as any).fitBounds === "function") {
      try {
        const bounds = spawns.map((spawn) => spawn.p);
        (map as any).fitBounds(bounds);
      } catch (e) {
        // ignore
      }
    }
  }, [spawns, fitBoundsOnChange, liveMode, map]);

  return <></>;
}
