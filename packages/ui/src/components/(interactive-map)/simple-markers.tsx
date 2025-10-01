"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMap } from "./store";
import CanvasMarker, {
  canvasMarkerImgs,
  clearCanvasCache,
} from "./canvas-marker";
import {
  getIconsUrl,
  getNodeId,
  useSettingsStore,
  type SimpleSpawn,
} from "@repo/lib";
import { MarkerTooltip, TooltipItems } from "./marker-tooltip";
import { DomEvent, LeafletMouseEvent } from "leaflet";
import { HoverCard, HoverCardContent, HoverCardPortal } from "../ui/hover-card";
import { AdditionalTooltipType } from "../(content)";

export function SimpleMarkers({
  appName,
  spawns,
  onClick,
  imageSprite,
  highlightedIds = [],
  iconsPath,
  withoutDiscoveredNodes = false,
  additionalTooltip,
}: {
  appName: string;
  spawns: SimpleSpawn[];
  onClick?: (spawn: SimpleSpawn) => void;
  imageSprite?: boolean;
  highlightedIds?: string[];
  iconsPath: string;
  withoutDiscoveredNodes?: boolean;
  additionalTooltip?: AdditionalTooltipType;
}) {
  const map = useMap();
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const handleMapMouseMoveRef = useRef<((e: LeafletMouseEvent) => void) | null>(
    null,
  );
  const [tooltipIsOpen, setTooltipIsOpen] = useState(false);
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    radius: number;
    latLng: [number, number] | [number, number, number];
    items: TooltipItems;
  } | null>(null);
  const [isLoadingSprite, setIsLoadingSprite] = useState(
    imageSprite && !canvasMarkerImgs["icons.webp"],
  );
  const hideDiscoveredNodes = useSettingsStore(
    (state) => state.hideDiscoveredNodes,
  );
  const colorBlindMode = useSettingsStore((state) => state.colorBlindMode);
  const colorBlindSeverity = useSettingsStore(
    (state) => state.colorBlindSeverity,
  );
  const setDiscoverNode = useSettingsStore((state) => state.setDiscoverNode);
  const discoveredNodes = useSettingsStore((state) => state.discoveredNodes);
  const discoveredSet = useMemo(
    () => new Set(discoveredNodes),
    [discoveredNodes],
  );

  useEffect(() => {
    if (imageSprite && !canvasMarkerImgs["icons.webp"]) {
      const iconSprite = new Image();
      iconSprite.src = getIconsUrl(appName, "icons.webp", iconsPath);
      iconSprite.crossOrigin = "anonymous";
      canvasMarkerImgs["icons.webp"] = iconSprite;
      canvasMarkerImgs["/icons/icons.webp"] = iconSprite;
      iconSprite.onload = () => {
        setIsLoadingSprite(false);
      };
      iconSprite.onerror = () => {
        setIsLoadingSprite(false);
      };
    }
  }, []);

  useEffect(() => {
    if (!map || isLoadingSprite) {
      return;
    }
    clearCanvasCache();
    let tooltipDelayTimeout: NodeJS.Timeout | undefined;
    const baseRadius = 12;
    const markers = spawns.map((spawn) => {
      let isDiscovered: boolean;
      if (!withoutDiscoveredNodes) {
        const nodeId = getNodeId(spawn);
        if (nodeId.includes("@")) {
          const [baseId] = nodeId.split("@");
          isDiscovered = discoveredSet.has(nodeId) || discoveredSet.has(baseId);
        } else {
          isDiscovered = discoveredSet.has(nodeId);
        }

        if (isDiscovered && hideDiscoveredNodes) {
          return;
        }
      } else {
        isDiscovered = false;
      }

      const marker = new CanvasMarker(spawn.p, {
        id: spawn.id,
        icon: typeof spawn.icon === "string" ? { url: spawn.icon } : spawn.icon,
        color: spawn.color,
        baseRadius: baseRadius,
        radius: baseRadius * baseIconSize,
        isHighlighted: highlightedIds.includes(spawn.id),
        isDiscovered,
        colorBlindMode,
        colorBlindSeverity,
      });
      marker.on({
        mouseover: (event) => {
          if (handleMapMouseMoveRef.current) {
            map.off("mousemove", handleMapMouseMoveRef.current);
            handleMapMouseMoveRef.current = null;
          }

          clearTimeout(tooltipDelayTimeout);
          tooltipDelayTimeout = setTimeout(() => {
            setTooltipData({
              x: event.sourceTarget._point.x,
              y: event.sourceTarget._point.y,
              radius: marker.getRadius(),
              items: [
                {
                  id: spawn.id,
                  termId: spawn.name,
                  description: spawn.description,
                  type: "",
                },
              ],
              latLng: spawn.p,
            });
            setTooltipIsOpen(true);
          }, 50);
        },
        mouseout: () => {
          clearTimeout(tooltipDelayTimeout);
          handleMapMouseMoveRef.current = (e: LeafletMouseEvent) => {
            const distanceFromMarker = Math.sqrt(
              Math.pow(e.layerPoint.x - marker._point.x, 2) +
                Math.pow(e.layerPoint.y - marker._point.y, 2),
            );
            const maxDistance = marker.getRadius() + 15;

            if (distanceFromMarker > maxDistance) {
              setTooltipIsOpen(false);
              if (handleMapMouseMoveRef.current) {
                map.off("mousemove", handleMapMouseMoveRef.current);
                handleMapMouseMoveRef.current = null;
              }
            }
          };
          map.on("mousemove", handleMapMouseMoveRef.current);
        },
        contextmenu: (event) => {
          if (withoutDiscoveredNodes) {
            return;
          }
          DomEvent.stopPropagation(event);
          isDiscovered = !isDiscovered;
          const nodeId = getNodeId(spawn);
          setDiscoverNode(nodeId, isDiscovered);
        },
        click: () => {
          if (onClick) {
            onClick(spawn);
          }
        },
      });
      try {
        marker.addTo(map);
      } catch (e) {}
      return marker;
    });
    return () => {
      markers.forEach((marker) => {
        try {
          marker?.remove();
        } catch (e) {}
      });
    };
  }, [
    map,
    spawns,
    isLoadingSprite,
    highlightedIds,
    discoveredSet,
    colorBlindMode,
    colorBlindSeverity,
  ]);

  const mapContainer = map?.getPane("mapPane");

  return (
    <>
      {mapContainer && tooltipData ? (
        <HoverCard
          closeDelay={0}
          onOpenChange={(open) => {
            if (!open) {
              setTooltipIsOpen(false);
            }
          }}
          open={tooltipIsOpen}
        >
          <HoverCardPortal container={mapContainer}>
            <HoverCardContent
              className="cursor-default"
              onClick={(event) => {
                event.stopPropagation();
              }}
              onDoubleClick={(event) => {
                event.stopPropagation();
              }}
              onMouseEnter={() => {
                if (handleMapMouseMoveRef.current) {
                  map?.off("mousemove", handleMapMouseMoveRef.current);
                  handleMapMouseMoveRef.current = null;
                }
              }}
              style={{
                transform: `translate3d(calc(${tooltipData.x}px - 50%), calc(${tooltipData.y}px + 100% - ${tooltipData.radius}px - 2px), 0px)`,
              }}
            >
              <MarkerTooltip
                appName={appName}
                latLng={tooltipData.latLng}
                items={tooltipData.items}
                onClose={() => {
                  setTooltipIsOpen(false);
                }}
                hideDiscovered
                hideComments
                additionalTooltip={additionalTooltip}
              />
            </HoverCardContent>
          </HoverCardPortal>
        </HoverCard>
      ) : null}
    </>
  );
}
