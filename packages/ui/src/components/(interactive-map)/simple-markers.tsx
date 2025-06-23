"use client";
import { useEffect, useRef, useState } from "react";
import { useMap } from "./store";
import CanvasMarker, { canvasMarkerImgs } from "./canvas-marker";
import { getIconsUrl, useSettingsStore, Version } from "@repo/lib";
import { MarkerTooltip, TooltipItems } from "./marker-tooltip";
import { LeafletMouseEvent } from "leaflet";
import { HoverCard, HoverCardContent, HoverCardPortal } from "../ui/hover-card";

export type SimpleSpawn = {
  id: string;
  p: [number, number] | [number, number, number];
  icon?:
    | string
    | {
        name: string;
        url: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      }
    | null;
  name: string;
  color?: string;
  description?: string;
};
export function SimpleMarkers({
  appName,
  spawns,
  onClick,
  imageSprite,
  highlightedMarkerId,
  iconsPath,
}: {
  appName?: string;
  spawns: SimpleSpawn[];
  onClick?: (spawn: SimpleSpawn) => void;
  imageSprite?: boolean;
  highlightedMarkerId?: string;
  iconsPath?: string;
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

  useEffect(() => {
    if (imageSprite && !canvasMarkerImgs["icons.webp"]) {
      const iconSprite = new Image();
      iconSprite.src = appName
        ? getIconsUrl(appName, "icons.webp", iconsPath)
        : "/icons/icons.webp";
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
    let tooltipDelayTimeout: NodeJS.Timeout | undefined;
    const baseRadius = 12;
    const markers = spawns.map((spawn) => {
      const marker = new CanvasMarker(spawn.p, {
        id: spawn.id,
        icon: typeof spawn.icon === "string" ? { url: spawn.icon } : spawn.icon,
        color: spawn.color,
        baseRadius: baseRadius,
        radius: baseRadius * baseIconSize,
        isHighlighted: spawn.id === highlightedMarkerId,
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
          marker.remove();
        } catch (e) {}
      });
    };
  }, [map, spawns, isLoadingSprite]);

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
              />
            </HoverCardContent>
          </HoverCardPortal>
        </HoverCard>
      ) : null}
    </>
  );
}
