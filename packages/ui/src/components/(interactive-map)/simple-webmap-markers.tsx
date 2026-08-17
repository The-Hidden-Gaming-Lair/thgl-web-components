"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  IconMarkerLayer,
  type IconMarkerInstance,
  DEFAULT_CIRCLE_SHEET,
} from "@repo/lib/web-map";
import {
  getIconsUrl,
  getNodeId,
  useSettingsStore,
  useGameState,
  type SimpleSpawn,
  type MarkerOptions,
} from "@repo/lib";
import { MarkerTooltip, TooltipItems } from "./marker-tooltip";
import { AdditionalTooltipType } from "../(content)";
import type { SimpleWebMapRef } from "./simple-webmap";

export function SimpleWebMarkers({
  appName,
  spawns,
  onClick,
  highlightedIds = [],
  iconsPath,
  withoutDiscoveredNodes = false,
  additionalTooltip,
  mapRef,
  markerOptions,
}: {
  appName: string;
  spawns: SimpleSpawn[];
  onClick?: (spawn: SimpleSpawn) => void;
  highlightedIds?: string[];
  iconsPath: string;
  withoutDiscoveredNodes?: boolean;
  additionalTooltip?: AdditionalTooltipType;
  mapRef: React.MutableRefObject<SimpleWebMapRef | null>;
  markerOptions?: MarkerOptions;
}) {
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const iconSizeByFilter = useSettingsStore((state) => state.iconSizeByFilter);
  const player = useGameState((state) => state.player);
  const [tooltipIsOpen, setTooltipIsOpen] = useState(false);
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    radius: number;
    latLng: [number, number] | [number, number, number];
    items: TooltipItems;
  } | null>(null);
  const hideDiscoveredNodes = useSettingsStore(
    (state) => state.hideDiscoveredNodes,
  );
  const setDiscoverNode = useSettingsStore((state) => state.setDiscoverNode);
  const discoveredNodes = useSettingsStore((state) => state.discoveredNodes);
  const discoveredSet = useMemo(
    () => new Set(discoveredNodes),
    [discoveredNodes],
  );
  // Keep a ref to the latest discoveredSet for use in event handlers
  const discoveredSetRef = useRef(discoveredSet);
  discoveredSetRef.current = discoveredSet;
  const spawnMapRef = useRef<Map<string, SimpleSpawn>>(new Map());
  const containerRef = useRef<HTMLElement | null>(null);
  const justClickedMarkerRef = useRef(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track if mouse is in the "safe zone" (marker, tooltip, or between them)
  useEffect(() => {
    if (!tooltipIsOpen || !tooltipData || !containerRef.current) return;

    const container = containerRef.current;

    const isInSafeZone = (e: MouseEvent): boolean => {
      // tooltipData.x/y are in viewport coordinates (position: fixed)
      const { x, y, radius } = tooltipData;
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Check if mouse is over the tooltip element (with padding for easier hover)
      if (tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const pad = 5;
        if (
          mouseX >= tooltipRect.left - pad &&
          mouseX <= tooltipRect.right + pad &&
          mouseY >= tooltipRect.top - pad &&
          mouseY <= tooltipRect.bottom + pad
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

      // Narrow corridor connecting marker center to tooltip edge
      if (tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const corridorHW = radius + 4;
        if (Math.abs(mouseX - x) <= corridorHW) {
          const minY = Math.min(y - radius, tooltipRect.top);
          const maxY = Math.max(y + radius, tooltipRect.bottom);
          if (mouseY >= minY && mouseY <= maxY) {
            return true;
          }
        }
      }

      return false;
    };

    const handleMouseMove = (e: MouseEvent) => {
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

  // Callback ref to attach wheel event listener when tooltip mounts
  const tooltipWheelRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Store in tooltipRef for other uses
      tooltipRef.current = node;

      if (!node) return;

      const canvas = mapRef.current?.webmap?.getContainer();
      if (!canvas) return;

      const handleWheel = (e: WheelEvent) => {
        // Forward wheel event to the map canvas for zooming
        e.preventDefault();
        e.stopPropagation();
        const wheelEvent = new WheelEvent("wheel", {
          deltaX: e.deltaX,
          deltaY: e.deltaY,
          deltaZ: e.deltaZ,
          deltaMode: e.deltaMode,
          clientX: e.clientX,
          clientY: e.clientY,
          screenX: e.screenX,
          screenY: e.screenY,
          bubbles: true,
          cancelable: true,
        });
        canvas.dispatchEvent(wheelEvent);
      };

      // Use capture phase to intercept all wheel events on the tooltip
      node.addEventListener("wheel", handleWheel, {
        passive: false,
        capture: true,
      });
    },
    [mapRef],
  );

  // Load sprite sheet and add markers
  useEffect(() => {
    const ref = mapRef.current;
    if (!ref?.markerLayer || !ref?.webmap) {
      return;
    }

    const markerLayer = ref.markerLayer;
    const webmap = ref.webmap;

    // Load the icon sprite sheet
    const iconUrl = getIconsUrl(appName, "icons.webp", iconsPath);
    markerLayer.addSheet("icons", iconUrl);

    // Build spawn map for lookups
    const spawnMap = new Map<string, SimpleSpawn>();
    spawns.forEach((spawn) => {
      spawnMap.set(spawn.id, spawn);
    });
    spawnMapRef.current = spawnMap;

    // Compute z range across all spawns for absolute elevation visualization
    let minZ = Infinity;
    let maxZ = -Infinity;
    let hasZ = false;
    for (const spawn of spawns) {
      if (spawn.p[2] !== undefined) {
        hasZ = true;
        minZ = Math.min(minZ, spawn.p[2]);
        maxZ = Math.max(maxZ, spawn.p[2]);
      }
    }
    const zRange = hasZ && maxZ > minZ ? maxZ - minZ : 0;

    // Get container for tooltip portal
    containerRef.current = webmap.getContainer()?.parentElement ?? null;

    // Add markers
    const baseRadius = 12;
    const dpr = window.devicePixelRatio || 1;
    const markerIds: string[] = [];

    for (const spawn of spawns) {
      let isDiscovered = false;
      if (!withoutDiscoveredNodes) {
        const nodeId = getNodeId(spawn);
        if (nodeId.includes("@")) {
          const [baseId] = nodeId.split("@");
          isDiscovered = discoveredSet.has(nodeId) || discoveredSet.has(baseId);
        } else {
          isDiscovered = discoveredSet.has(nodeId);
        }

        if (isDiscovered && hideDiscoveredNodes) {
          continue;
        }
      }

      const rawIcon = spawn.icon;
      // Multiply by DPR to maintain consistent visual size across devices
      // Apply per-filter icon size multiplier if available
      // Multiply by 1.5 for consistent visual sizing at typical zoom levels
      const filterMultiplier = spawn.type
        ? (iconSizeByFilter[spawn.type] ?? 1)
        : 1;
      const size = baseRadius * 2 * 1.5 * baseIconSize * filterMultiplier * dpr;

      // Determine sheet and icon rect
      // If no icon is provided, use the default circle sheet
      let sheetName = "icons";
      let iconRect = { x: 0, y: 0, width: 64, height: 64 };

      if (!rawIcon) {
        // No icon - use default circle
        sheetName = DEFAULT_CIRCLE_SHEET;
        iconRect = { x: 0, y: 0, width: 64, height: 64 };
      } else if (
        typeof rawIcon !== "string" &&
        "url" in rawIcon &&
        rawIcon.url
      ) {
        // Custom URL-based icon
        const iconUrl = rawIcon.url as string;

        // Check if this is a standalone icon (single image) or a sprite sheet
        const hasValidSpriteCoords =
          "x" in rawIcon &&
          typeof rawIcon.x === "number" &&
          typeof rawIcon.y === "number";

        // Check if this is from the game-icons sprite sheets (local paths)
        const isGameIconsSprite =
          iconUrl.includes("/game-icons/") && hasValidSpriteCoords;

        // Treat as standalone only if it's a data URL, external URL, or has no sprite coords
        const isStandaloneIcon =
          iconUrl.startsWith("data:") ||
          iconUrl.includes("game-icons.net") ||
          (!hasValidSpriteCoords && iconUrl.includes("/my_")); // Custom uploaded icons without coords

        if (isGameIconsSprite) {
          // Game-icons sprite sheet - use full URL as sheet name and register it
          sheetName = getIconsUrl(appName, iconUrl, iconsPath);
          markerLayer.addSheet(sheetName, sheetName);
          iconRect = {
            x: rawIcon.x ?? 0,
            y: rawIcon.y ?? 0,
            width: rawIcon.width ?? 32,
            height: rawIcon.height ?? 32,
          };
        } else if (isStandaloneIcon) {
          // Standalone icons - use full URL as sheet name and register it
          sheetName = getIconsUrl(appName, iconUrl, iconsPath);
          markerLayer.addSheet(sheetName, sheetName);
          iconRect = {
            x: 0,
            y: 0,
            width: rawIcon.width ?? 64,
            height: rawIcon.height ?? 64,
          };
        } else if (hasValidSpriteCoords) {
          // Other sprite sheet with coords - use default "icons" sheet
          iconRect = {
            x: rawIcon.x ?? 0,
            y: rawIcon.y ?? 0,
            width: rawIcon.width ?? 32,
            height: rawIcon.height ?? 32,
          };
        }
      } else if (typeof rawIcon !== "string" && "x" in rawIcon) {
        // Icon sprite from default sheet (has x,y but no url)
        iconRect = {
          x: rawIcon.x ?? 0,
          y: rawIcon.y ?? 0,
          width: rawIcon.width ?? 32,
          height: rawIcon.height ?? 32,
        };
      }

      // Calculate altitude indicator
      let markerZPos: "top" | "bottom" | "needle" | null = null;
      let zValue: number | undefined = undefined;
      let zMag: number | undefined = undefined;

      if (markerOptions?.zPos && player && spawn.p[2] !== undefined) {
        // Player-relative z indicator (proximity based)
        const { xyMaxDistance, zDistance } = markerOptions.zPos;
        const dx = player.x - spawn.p[0];
        const dy = player.y - spawn.p[1];
        const xyDistSq = dx * dx + dy * dy;
        const maxDistSq = xyMaxDistance * xyMaxDistance;

        if (xyDistSq <= maxDistSq) {
          const dz = player.z - spawn.p[2];
          if (dz > zDistance) {
            markerZPos = "bottom";
            zValue = -dz;
          } else if (dz < -zDistance) {
            markerZPos = "top";
            zValue = -dz;
          }
        }
      } else if (zRange > 0 && spawn.p[2] !== undefined) {
        // Absolute elevation visualization (needle stem, no arrow)
        markerZPos = "needle";
        zMag = (spawn.p[2] - minZ) / zRange;
      }

      const marker: IconMarkerInstance = {
        id: spawn.id,
        latLng: [spawn.p[0], spawn.p[1]],
        size,
        sheet: sheetName,
        rect: iconRect,
        key: spawn.name,
        z: zValue,
        zPos: markerZPos,
        zMag,
        isHighlighted: highlightedIds.includes(spawn.id),
        isDiscovered,
        keepUpright: true,
      };

      markerLayer.add(marker);
      markerIds.push(spawn.id);

      // Helper to show tooltip for a marker
      const showTooltipForMarker = (m: IconMarkerInstance) => {
        const s = spawnMapRef.current.get(m.id);
        if (!s) return;

        // Get screen position
        const canvas = webmap.getContainer();
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const state = (webmap as any).lastState;
        if (!state) return;

        const worldPos = state.projection(m.latLng);
        const view = state.viewMatrix;
        const clipX = view[0] * worldPos.x + view[3] * worldPos.y + view[6];
        const clipY = view[1] * worldPos.x + view[4] * worldPos.y + view[7];
        const screenX = rect.left + (clipX * 0.5 + 0.5) * rect.width;
        const screenY = rect.top + (1 - (clipY * 0.5 + 0.5)) * rect.height;

        setTooltipData({
          x: screenX,
          y: screenY,
          radius: m.size / 2 / (window.devicePixelRatio || 1), // Convert to CSS pixels
          items: [
            {
              id: s.id,
              termId: s.name,
              label: s.label,
              description: s.description,
              type: s.type || "",
              data: s.data,
            },
          ],
          latLng: s.p,
        });
        setTooltipIsOpen(true);
      };

      // Register event handlers — delay tooltip open to prevent flickering
      // when moving between overlapping markers or from tooltip back to marker
      markerLayer.registerEventHandler(spawn.id, "mouseover", (m) => {
        if (tooltipDelayRef.current) clearTimeout(tooltipDelayRef.current);
        tooltipDelayRef.current = setTimeout(() => {
          tooltipDelayRef.current = null;
          showTooltipForMarker(m);
        }, 200);
      });
      markerLayer.registerEventHandler(spawn.id, "mouseout", () => {
        if (tooltipDelayRef.current) {
          clearTimeout(tooltipDelayRef.current);
          tooltipDelayRef.current = null;
        }
      });
      // Note: full mouseout closing is handled by safe zone tracking above

      // Click handler - show tooltip on tap (for touch devices) and call onClick
      markerLayer.registerEventHandler(spawn.id, "click", (m) => {
        const s = spawnMapRef.current.get(m.id);
        if (!s) return;

        // Mark that we just clicked a marker (to prevent map click from closing tooltip)
        justClickedMarkerRef.current = true;

        // Show tooltip on click/tap (essential for touch devices)
        showTooltipForMarker(m);

        // Also call onClick if provided
        if (onClick) {
          onClick(s);
        }
      });

      markerLayer.registerEventHandler(spawn.id, "contextmenu", (m) => {
        if (withoutDiscoveredNodes) return;
        const s = spawnMapRef.current.get(m.id);
        if (!s) return;
        const nodeId = getNodeId(s);
        // Use ref to get latest discoveredSet (avoids stale closure)
        const wasDiscovered = discoveredSetRef.current.has(nodeId);
        setDiscoverNode(nodeId, !wasDiscovered);
      });
    }

    // Listen for map clicks to close tooltip when clicking elsewhere
    const handleMapClick = () => {
      // If we just clicked a marker, don't close the tooltip
      if (justClickedMarkerRef.current) {
        justClickedMarkerRef.current = false;
        return;
      }
      setTooltipIsOpen(false);
    };
    webmap.on("click", handleMapClick);

    // Close tooltip on zoom/pan so it doesn't stay stuck
    const handleZoom = () => setTooltipIsOpen(false);
    webmap.on("zoomend", handleZoom);

    // Listen for clicks outside the map to close tooltip
    const handleDocumentClick = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      // If click is outside the container, close tooltip
      if (!container.contains(e.target as Node)) {
        setTooltipIsOpen(false);
      }
    };
    document.addEventListener("click", handleDocumentClick);

    return () => {
      // Remove listeners
      document.removeEventListener("click", handleDocumentClick);
      webmap.off("click", handleMapClick);
      webmap.off("zoomend", handleZoom);
      // Remove all markers and event handlers
      for (const id of markerIds) {
        markerLayer.unregisterAllEventHandlers(id);
      }
      markerLayer.clear();
    };
  }, [
    mapRef.current?.markerLayer,
    mapRef.current?.webmap,
    spawns,
    highlightedIds,
    discoveredSet,
    hideDiscoveredNodes,
    baseIconSize,
    iconSizeByFilter,
    player,
    markerOptions?.zPos,
  ]);

  // Update tooltip position on map pan/zoom, close if marker goes out of view
  useEffect(() => {
    if (!tooltipIsOpen || !tooltipData) return;

    const ref = mapRef.current;
    if (!ref?.webmap) return;

    const webmap = ref.webmap;
    let rafId: number;

    const updatePosition = () => {
      const canvas = webmap.getContainer();
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const state = (webmap as any).lastState;
      if (!state) return;

      const worldPos = state.projection(tooltipData.latLng);
      const view = state.viewMatrix;
      const clipX = view[0] * worldPos.x + view[3] * worldPos.y + view[6];
      const clipY = view[1] * worldPos.x + view[4] * worldPos.y + view[7];
      const localX = (clipX * 0.5 + 0.5) * canvasRect.width;
      const localY = (1 - (clipY * 0.5 + 0.5)) * canvasRect.height;
      const screenX = canvasRect.left + localX;
      const screenY = canvasRect.top + localY;

      // Close tooltip if marker is outside the canvas bounds
      const margin = tooltipData.radius;
      if (
        localX < -margin ||
        localX > canvasRect.width + margin ||
        localY < -margin ||
        localY > canvasRect.height + margin
      ) {
        setTooltipIsOpen(false);
        return;
      }

      // Only update if position changed
      if (screenX !== tooltipData.x || screenY !== tooltipData.y) {
        setTooltipData((prev) =>
          prev ? { ...prev, x: screenX, y: screenY } : null,
        );
      }

      rafId = requestAnimationFrame(updatePosition);
    };

    rafId = requestAnimationFrame(updatePosition);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [tooltipIsOpen, tooltipData?.latLng]);

  return (
    <>
      {containerRef.current && tooltipData && tooltipIsOpen
        ? createPortal(
            <div
              ref={tooltipWheelRef}
              className="cursor-default z-50 rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md outline-none w-[260px]"
              onClick={(event) => {
                event.stopPropagation();
              }}
              onDoubleClick={(event) => {
                event.stopPropagation();
              }}
              onMouseEnter={() => {
                // Cancel any pending tooltip switch when mouse enters current tooltip
                if (tooltipDelayRef.current) {
                  clearTimeout(tooltipDelayRef.current);
                  tooltipDelayRef.current = null;
                }
              }}
              style={{
                position: "fixed",
                left: 0,
                top: 0,
                transform: `translate3d(calc(${tooltipData.x}px - 50%), calc(${tooltipData.y}px - 100% - ${tooltipData.radius}px - 2px), 0px)`,
                pointerEvents: "auto",
              }}
            >
              <MarkerTooltip
                appName={appName}
                latLng={tooltipData.latLng}
                items={tooltipData.items}
                onClose={() => {
                  setTooltipIsOpen(false);
                }}
                hideComments
                hideDiscovered={withoutDiscoveredNodes}
                additionalTooltip={additionalTooltip}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
