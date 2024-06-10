"use client";
import type { LeafletMouseEvent } from "leaflet";
import { DomEvent, FeatureGroup } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { useCoordinates, useT, useUserStore } from "../(providers)";
import { HoverCard, HoverCardContent, HoverCardPortal } from "../ui/hover-card";
import CanvasMarker from "./canvas-marker";
import { useMap } from "./store";
import { MarkerOptions, useGameState, useSettingsStore } from "@repo/lib";
import { MarkerHoverCard, TooltipItems } from "./marker-tooltip";

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

  const featureGroups = useRef<Record<string, FeatureGroup<CanvasMarker>>>({});
  const mapName = useUserStore((state) => state.mapName);
  const tempPrivateNode = useSettingsStore((state) => state.tempPrivateNode);
  const highlightSpawnIDs = useGameState((state) => state.highlightSpawnIDs);

  useEffect(() => {
    if (!map) {
      return;
    }

    Object.values(featureGroups.current).forEach((featureGroup) => {
      try {
        featureGroup.addTo(map);
      } catch (e) {
        //
      }
    });
  }, [map]);

  useEffect(() => {
    if (!map) {
      return;
    }
    let tooltipDelayTimeout: NodeJS.Timeout | undefined;

    const unusedFeatureGroups = Object.keys(featureGroups.current);
    const activeIDs: string[] = [];
    spawns.forEach((spawn) => {
      if (spawn.mapName && spawn.mapName !== mapName) {
        return;
      }
      if (tempPrivateNode?.id && tempPrivateNode.id === spawn.id) {
        return;
      }
      const nodeId = spawn.isPrivate
        ? spawn.id!
        : `${spawn.id ?? spawn.type}@${spawn.p[0]}:${spawn.p[1]}`;

      const isCluster = Boolean(spawn.cluster && spawn.cluster.length > 0);
      let isDiscovered = isCluster
        ? discoveredNodes.includes(nodeId) &&
          !spawn.cluster!.some(
            (a) =>
              !discoveredNodes.includes(
                `${a.id ?? t(a.type)}@${a.p[0]}:${a.p[1]}`,
              ),
          )
        : discoveredNodes.includes(nodeId);

      const id = isCluster ? `${nodeId}:${isCluster}` : nodeId;
      activeIDs.push(id);

      if (!featureGroups.current[spawn.type]) {
        featureGroups.current[spawn.type] = new FeatureGroup();
        try {
          featureGroups.current[spawn.type].addTo(map);
        } catch (e) {
          //
        }
      }
      const featureGroup = featureGroups.current[spawn.type];
      if (unusedFeatureGroups.includes(spawn.type)) {
        unusedFeatureGroups.splice(unusedFeatureGroups.indexOf(spawn.type), 1);
      }
      const existingMarker = featureGroup.getLayers().find((_layer) => {
        const layer = _layer as CanvasMarker;
        if (layer.options.id === id) {
          return true;
        }
        if (layer.options.address && layer.options.address === spawn.address) {
          return true;
        }
        return false;
      }) as CanvasMarker | undefined;
      if (existingMarker) {
        if (isDiscovered && hideDiscoveredNodes) {
          existingMarker.remove();
          featureGroup.removeLayer(existingMarker);
        } else if (existingMarker.options.isDiscovered !== isDiscovered) {
          existingMarker.toggleDiscovered();
        }
        if (!existingMarker.getLatLng().equals(spawn.p)) {
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
      try {
        marker.addTo(featureGroup);
      } catch (e) {
        //
      }
    });

    unusedFeatureGroups.forEach((type) => {
      try {
        featureGroups.current[type].clearLayers();
      } catch (e) {
        //
      }
    });
    Object.values(featureGroups.current).forEach((featureGroup) => {
      featureGroup.getLayers().forEach((layer) => {
        if (!activeIDs.includes((layer as CanvasMarker).options.id)) {
          try {
            layer.remove();
            featureGroup.removeLayer(layer);
          } catch (e) {
            //
          }
        }
      });
    });
  }, [map, spawns, hideDiscoveredNodes, discoveredNodes, tempPrivateNode]);

  useEffect(() => {
    Object.values(featureGroups.current).forEach((featureGroup) => {
      featureGroup.getLayers().forEach((layer) => {
        const marker = layer as CanvasMarker;
        marker.setRadius(marker.options.baseRadius * baseIconSize);
      });
    });
  }, [baseIconSize]);

  useEffect(() => {
    Object.values(featureGroups.current).forEach((featureGroup) => {
      featureGroup.getLayers().forEach((layer) => {
        const marker = layer as CanvasMarker;
        const isHighlighted = highlightSpawnIDs.includes(marker.options.id);
        if (marker.options.isHighlighted !== isHighlighted) {
          marker.setHighlight(isHighlighted);
        }
      });
    });
  }, [highlightSpawnIDs]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (liveMode || spawns.length === 0 || !map) {
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
              <MarkerHoverCard
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
