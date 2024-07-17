"use client";
import type { LeafletMouseEvent } from "leaflet";
import { DomEvent } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { Spawns, useCoordinates, useT, useUserStore } from "../(providers)";
import { HoverCard, HoverCardContent, HoverCardPortal } from "../ui/hover-card";
import CanvasMarker from "./canvas-marker";
import { useMap } from "./store";
import {
  MarkerOptions,
  useConnectionStore,
  useGameState,
  useSettingsStore,
} from "@repo/lib";
import { MarkerTooltip, TooltipItems } from "./marker-tooltip";

export function Markers({
  markerOptions,
}: {
  markerOptions: MarkerOptions;
}): JSX.Element {
  const map = useMap();
  const { spawns, icons, filters } = useCoordinates();
  const hideDiscoveredNodes = useSettingsStore(
    (state) => state.hideDiscoveredNodes,
  );
  const discoveredNodes = useSettingsStore((state) => state.discoveredNodes);
  const setDiscoverNode = useSettingsStore((state) => state.setDiscoverNode);
  const t = useT();
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const liveMode = useSettingsStore((state) => state.liveMode);
  const sharedPrivateNodes = useConnectionStore((state) => state.privateNodes);

  const handleMapMouseMoveRef = useRef<((e: LeafletMouseEvent) => void) | null>(
    null,
  );
  const [tooltipIsOpen, setTooltipIsOpen] = useState(false);
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    radius: number;
    latLng: [number, number];
    items: TooltipItems;
  } | null>(null);

  const tempPrivateNodeId = useSettingsStore(
    (state) => state.tempPrivateNode?.id,
  );
  const highlightSpawnIDs = useGameState((state) => state.highlightSpawnIDs);
  const isDrawing = useSettingsStore((state) => !!state.tempPrivateDrawing);
  const fitBoundsOnChange = useSettingsStore(
    (state) => state.fitBoundsOnChange,
  );

  const existingSpawnIds = useRef<Map<string | number, CanvasMarker>>();

  useEffect(() => {
    if (!map) {
      return;
    }

    return () => {
      existingSpawnIds.current?.forEach((marker) => {
        try {
          marker.remove();
        } catch (e) {}
      });
      existingSpawnIds.current?.clear();
    };
  }, [map]);

  useEffect(() => {
    if (!map || !map._mapPane) {
      return;
    }
    if (!existingSpawnIds.current) {
      existingSpawnIds.current = new Map();
    }

    let tooltipDelayTimeout: NodeJS.Timeout | undefined;
    const sharedPrivateSpawns = sharedPrivateNodes.map<Spawns[number]>(
      (node) => {
        return {
          type: node.filter ?? "private_Unsorted",
          mapName: node.mapName,
          id: node.id,
          name: node.name,
          description: node.description,
          p: node.p,
          color: node.color,
          icon: node.icon,
          radius: node.radius,
          isPrivate: true,
        };
      },
    );
    const spawnIds = new Set<string | number>();
    [...spawns, ...sharedPrivateSpawns].forEach((spawn) => {
      if (spawn.mapName && spawn.mapName !== map.mapName) {
        return;
      }
      if (tempPrivateNodeId && tempPrivateNodeId === spawn.id) {
        return;
      }
      const nodeId = spawn.isPrivate
        ? spawn.id!
        : `${spawn.id ?? spawn.type}@${spawn.p[0]}:${spawn.p[1]}`;

      const isCluster = Boolean(spawn.cluster && spawn.cluster.length > 0);

      const id = isCluster ? `${nodeId}:${isCluster}` : nodeId;
      spawnIds.add(spawn.address || id);

      let isDiscovered = isCluster
        ? discoveredNodes.includes(nodeId) &&
          !spawn.cluster!.some(
            (a) =>
              !discoveredNodes.includes(
                `${a.id ?? t(a.type)}@${a.p[0]}:${a.p[1]}`,
              ),
          )
        : discoveredNodes.includes(nodeId);
      const existingMarker = existingSpawnIds.current!.get(spawn.address || id);
      if (existingMarker) {
        if (isDiscovered && hideDiscoveredNodes) {
          existingMarker.remove();
          existingSpawnIds.current!.delete(spawn.address || id);
        } else if (existingMarker.options.isDiscovered !== isDiscovered) {
          existingMarker.toggleDiscovered();
        }
        if (spawn.address && !existingMarker.getLatLng().equals(spawn.p)) {
          existingMarker.setLatLng(spawn.p);
        }
        return;
      }
      if (isDiscovered && hideDiscoveredNodes) {
        return;
      }
      const icon = icons.find((icon) => icon.id === spawn.type);
      const baseRadius =
        spawn.radius ??
        markerOptions.radius * (icon?.size ?? 1) * (isCluster ? 1.5 : 1);
      const marker = new CanvasMarker(spawn.p, {
        id,
        icon: spawn.icon?.url || (icon ? `/icons/${icon.icon}` : null),
        fillColor: spawn.color,
        baseRadius,
        radius: baseRadius * baseIconSize,
        isDiscovered,
        isCluster,
        isHighlighted: highlightSpawnIDs.includes(nodeId),
      });

      marker.on({
        mouseover: (event) => {
          if (handleMapMouseMoveRef.current) {
            map.off("mousemove", handleMapMouseMoveRef.current);
            handleMapMouseMoveRef.current = null;
          }

          clearTimeout(tooltipDelayTimeout);
          tooltipDelayTimeout = setTimeout(() => {
            const filter = filters.find((filter) =>
              filter.values.some((filter) => filter.id === spawn.type),
            );
            const items = [
              {
                id: nodeId,
                termId: spawn.name ?? spawn.id ?? spawn.type,
                description: spawn.description,
                type: spawn.type,
                group: filter?.group,
                isPrivate: spawn.isPrivate,
              },
            ];
            if (isCluster) {
              items.push(
                ...spawn.cluster!.map((spawn) => ({
                  id: spawn.isPrivate
                    ? spawn.id!
                    : `${spawn.id ?? spawn.type}@${spawn.p[0]}:${spawn.p[1]}`,
                  termId: spawn.name ?? spawn.id ?? spawn.type,
                  description: spawn.description,
                  type: spawn.type,
                  group: filter?.group,
                  isPrivate: spawn.isPrivate,
                })),
              );
            }

            setTooltipData({
              x: event.sourceTarget._point.x,
              y: event.sourceTarget._point.y,
              radius: marker.getRadius(),
              items: items,
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
          DomEvent.stopPropagation(event);
          if (spawn.isPrivate) {
            return;
          }
          isDiscovered = !isDiscovered;
          if (isCluster) {
            spawn.cluster!.forEach((spawn) => {
              setDiscoverNode(
                `${spawn.id ?? t(spawn.type)}@${spawn.p[0]}:${spawn.p[1]}`,
                isDiscovered,
              );
            });
          }
          setDiscoverNode(nodeId, isDiscovered);
        },
        click: () => {
          console.log(`clicked on ${id} @ ${spawn.p.join(",")}`);
        },
      });
      existingSpawnIds.current!.set(spawn.address || id, marker);
      try {
        marker.addTo(map);
      } catch (e) {
        //
      }
    });

    for (const [key, marker] of existingSpawnIds.current.entries()) {
      if (spawnIds.has(key)) {
        continue;
      }
      existingSpawnIds.current.delete(key);
      try {
        marker.remove();
      } catch (e) {}
    }
  }, [
    map,
    spawns,
    sharedPrivateNodes,
    hideDiscoveredNodes,
    discoveredNodes,
    tempPrivateNodeId,
  ]);

  useEffect(() => {
    existingSpawnIds.current?.forEach((marker) => {
      marker.setRadius(marker.options.baseRadius * baseIconSize);
    });
  }, [baseIconSize]);

  useEffect(() => {
    existingSpawnIds.current?.forEach((marker) => {
      const isHighlighted = highlightSpawnIDs.includes(marker.options.id);
      if (marker.options.isHighlighted !== isHighlighted) {
        marker.setHighlight(isHighlighted);
      }
    });
  }, [highlightSpawnIDs]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (!fitBoundsOnChange || liveMode || spawns.length === 0 || !map) {
      return;
    }
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const bounds = spawns.map((spawn) => spawn.p);
    try {
      map.flyToBounds(bounds, {
        duration: 0.5,
        maxZoom: 3,
        padding: [25, 25],
      });
    } catch (e) {
      //
    }
  }, [spawns]);

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
          open={tooltipIsOpen && !isDrawing}
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
                latLng={tooltipData.latLng}
                items={tooltipData.items}
                onClose={() => {
                  setTooltipIsOpen(false);
                }}
              />
            </HoverCardContent>
          </HoverCardPortal>
        </HoverCard>
      ) : null}
    </>
  );
}
