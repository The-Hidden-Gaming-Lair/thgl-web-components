"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMap } from "./store";
import WebMapMarker, { webMapMarkerImgs, DEFAULT_Z_NORMALIZATION } from "./webmap-marker";
import { IconMarkerLayer } from "@repo/lib/web-map";
import {
  getIconsUrl,
  getNodeId,
  useSettingsStore,
  type SimpleSpawn,
} from "@repo/lib";
import { MarkerTooltip, TooltipItems } from "./marker-tooltip";
// WebMap-compatible event types
type WebMapMouseEvent = {
  layerPoint: { x: number; y: number };
  latlng: [number, number];
  originalEvent: MouseEvent;
};
const DomEvent = {
  stopPropagation: (e: any) => {
    if (e && e.originalEvent) {
      e.originalEvent.stopPropagation?.();
      e.originalEvent.preventDefault?.();
    }
  },
};
import { HoverCard, HoverCardContent, HoverCardPortal } from "../ui/hover-card";
import { AdditionalTooltipType } from "../(content)";
import { getWebMapTooltipContainer } from "./webmap-portal-container";

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
  const handleMapMouseMoveRef = useRef<((e: WebMapMouseEvent) => void) | null>(
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
    imageSprite && !webMapMarkerImgs["icons.webp"],
  );
  const hideDiscoveredNodes = useSettingsStore(
    (state) => state.hideDiscoveredNodes,
  );
  const colorBlindMode = useSettingsStore((state) => state.colorBlindMode);
  const colorBlindSeverity = useSettingsStore(
    (state) => state.colorBlindSeverity,
  );
  const fallbackNormalization = useMemo(() => {
    let max = 0;
    for (const spawn of spawns) {
      if (spawn.p.length > 2) {
        const value = Math.abs(Number(spawn.p[2]));
        if (Number.isFinite(value) && value > max) {
          max = value;
        }
      }
    }
    return max > 0 ? max : DEFAULT_Z_NORMALIZATION;
  }, [spawns]);

  const zRange = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const spawn of spawns) {
      if (spawn.p.length > 2) {
        const value = Number(spawn.p[2]);
        if (Number.isFinite(value)) {
          if (value < min) min = value;
          if (value > max) max = value;
        }
      }
    }
    if (!Number.isFinite(min) || !Number.isFinite(max) || max - min <= 0) {
      return undefined;
    }
    return { min, max } as const;
  }, [spawns]);

  const setDiscoverNode = useSettingsStore((state) => state.setDiscoverNode);
  const discoveredNodes = useSettingsStore((state) => state.discoveredNodes);
  const discoveredSet = useMemo(
    () => new Set(discoveredNodes),
    [discoveredNodes],
  );

  useEffect(() => {
    if (imageSprite && !webMapMarkerImgs["icons.webp"]) {
      const iconSprite = new Image();
      iconSprite.src = getIconsUrl(appName, "icons.webp", iconsPath);
      iconSprite.crossOrigin = "anonymous";
      webMapMarkerImgs["icons.webp"] = iconSprite;
      webMapMarkerImgs["/icons/icons.webp"] = iconSprite;
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

    // Initialize markers asynchronously like in the demo
    (async () => {
      let tooltipDelayTimeout: NodeJS.Timeout | undefined;
      const baseRadius = 12;

      // Find or create IconMarkerLayer
      const layers = (map as any).layers || [];
      let iconLayer = layers.find(
        (layerEntry: any) => layerEntry.layer instanceof IconMarkerLayer,
      )?.layer as IconMarkerLayer;

      if (!iconLayer) {
        // Create a new IconMarkerLayer if none exists
        iconLayer = new IconMarkerLayer();
        map.addLayer(iconLayer, { zIndex: 12 }); // Use z-index 12 like demo
      }

      // Try to load filter icon map if appName is provided
      if (appName && imageSprite) {
        try {
          await iconLayer.loadFilterIconMap(
            getIconsUrl(appName, "filters.json", iconsPath),
            getIconsUrl(appName, "", iconsPath),
          );
        } catch (error) {
          console.warn("Failed to load filter icon map:", error);
        }
      }

      const markers = spawns.map((spawn) => {
        let isDiscovered: boolean;
        if (!withoutDiscoveredNodes) {
          const nodeId = getNodeId(spawn);
          if (nodeId.includes("@")) {
            const [baseId] = nodeId.split("@");
            isDiscovered =
              discoveredSet.has(nodeId) || discoveredSet.has(baseId);
          } else {
            isDiscovered = discoveredSet.has(nodeId);
          }

          if (isDiscovered && hideDiscoveredNodes) {
            return;
          }
        } else {
          isDiscovered = false;
        }

        const spawnCoords = spawn.p as number[];
        const spawnLatLng = [spawnCoords[0], spawnCoords[1]] as [number, number];
        const rawZ = spawnCoords.length > 2 ? Number(spawnCoords[2]) : undefined;
        const spawnZ = rawZ !== undefined && Number.isFinite(rawZ) ? rawZ : undefined;
        const spawnZMag =
          spawnZ !== undefined
            ? zRange && zRange.max - zRange.min > 0
              ? Math.min(1, Math.max(0, (spawnZ - zRange.min) / (zRange.max - zRange.min)))
              : Math.min(1, Math.abs(spawnZ) / fallbackNormalization)
            : undefined;
        const marker = new WebMapMarker(
          spawnLatLng,
          {
            id: spawn.id,
            icon:
              typeof spawn.icon === "string" ? { url: spawn.icon } : spawn.icon,
            fillColor: spawn.color,
            baseRadius: baseRadius * baseIconSize,
            isHighlighted: highlightedIds.includes(spawn.id),
            isDiscovered,
            z: spawnZ,
            zMag: spawnZMag,
            zRange,
            zNormalization: fallbackNormalization,
            colorBlindMode,
            colorBlindSeverity,
          },
        );
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
            handleMapMouseMoveRef.current = (e: WebMapMouseEvent) => {
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
      return markers;
    })().then((markers) => {
      // Store markers for cleanup
      (map as any)._simpleMarkers = markers;
    });

    return () => {
      const markers = (map as any)._simpleMarkers;
      if (markers) {
        markers.forEach((marker: any) => {
          try {
            marker?.removeFrom(map);
          } catch (e) {}
        });
        delete (map as any)._simpleMarkers;
      }
    };
  }, [
    map,
    spawns,
    isLoadingSprite,
    highlightedIds,
    discoveredSet,
    colorBlindMode,
    colorBlindSeverity,
    fallbackNormalization,
    zRange?.min,
    zRange?.max,
  ]);

  // Use WebMap-compatible portal container for proper z-index layering
  const mapContainer = map
    ? (() => {
        try {
          return getWebMapTooltipContainer(map);
        } catch (error) {
          console.warn(
            "WebMap portal container not available, falling back to body",
          );
          return document.body;
        }
      })()
    : null;

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
