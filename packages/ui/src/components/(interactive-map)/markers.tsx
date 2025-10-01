"use client";
import type { LeafletMouseEvent } from "leaflet";
import { DomEvent } from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { Spawns, useCoordinates } from "../(providers)";
import { HoverCard, HoverCardContent, HoverCardPortal } from "../ui/hover-card";
import CanvasMarker, {
  canvasMarkerImgs,
  CanvasMarkerOptions,
  clearCanvasCache,
} from "./canvas-marker";
import { useMap } from "./store";
import {
  getAppUrl,
  getIconsUrl,
  getNodeId,
  MarkerOptions,
  Spawn,
  useConnectionStore,
  useGameState,
  useSettingsStore,
  useUserStore,
} from "@repo/lib";
import { MarkerTooltip, TooltipItems } from "./marker-tooltip";
import { useThrottle } from "@uidotdev/usehooks";
import { AdditionalTooltipType } from "../(content)";

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
  const handleMapMouseMoveRef = useRef<((e: LeafletMouseEvent) => void) | null>(
    null,
  );
  const [isLoadingSprite, setIsLoadingSprite] = useState(
    markerOptions.imageSprite && !canvasMarkerImgs["icons.webp"],
  );

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

  const mapContainer = map?.getPane("mapPane");

  const isHoverCardVisible = tooltipIsOpen && !isDrawing;

  useEffect(() => {
    if (markerOptions.imageSprite && !canvasMarkerImgs["icons.webp"]) {
      const iconSprite = new Image();
      iconSprite.src = getAppUrl(appName, iconsPath);
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
    if (!map) {
      return;
    }
    const handleClick = () => {
      setSelectedNodeId(null);
    };
    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
    };
  }, [map]);

  if (isLoadingSprite) {
    return <></>;
  }

  return (
    <>
      <MarkersContent
        markerOptions={markerOptions}
        onTooltipData={setTooltipData}
        onTooltipOpen={setTooltipIsOpen}
        handleMapMouseMoveRef={handleMapMouseMoveRef}
        onClick={setSelectedNodeId}
        appName={appName}
      />
      {mapContainer && tooltipData ? (
        <HoverCard
          closeDelay={0}
          onOpenChange={(open) => {
            if (!open) {
              setTooltipIsOpen(false);
            }
          }}
          open={isHoverCardVisible}
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
                onClick={setSelectedNodeId}
                onClose={() => {
                  setTooltipIsOpen(false);
                }}
                hideComments={hideComments}
                additionalTooltip={additionalTooltip}
              />
            </HoverCardContent>
          </HoverCardPortal>
        </HoverCard>
      ) : null}
    </>
  );
}

function MarkersContent({
  markerOptions,
  onTooltipData,
  onTooltipOpen,
  handleMapMouseMoveRef,
  onClick,
  appName,
}: {
  markerOptions: MarkerOptions;
  onTooltipData: (data: {
    x: number;
    y: number;
    radius: number;
    latLng: [number, number] | [number, number, number];
    items: TooltipItems;
  }) => void;
  onTooltipOpen: (open: boolean) => void;
  handleMapMouseMoveRef: React.MutableRefObject<
    ((e: LeafletMouseEvent) => void) | null
  >;
  onClick: (id: string) => void;
  appName: string;
}) {
  const map = useMap();
  const { spawns, icons, filters } = useCoordinates();
  const hideDiscoveredNodes = useSettingsStore(
    (state) => state.hideDiscoveredNodes,
  );
  const discoveredNodes = useSettingsStore((state) => state.discoveredNodes);
  const discoveredSet = useMemo(
    () => new Set(discoveredNodes),
    [discoveredNodes],
  );
  const setDiscoverNode = useSettingsStore((state) => state.setDiscoverNode);
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const iconSizeByGroup = useSettingsStore((state) => state.iconSizeByGroup);
  const iconSizeByFilter = useSettingsStore((state) => state.iconSizeByFilter);
  const sharedMyFilters = useConnectionStore((state) => state.myFilters);
  const liveMode = useSettingsStore((state) => state.liveMode);
  const selectedNodeId = useUserStore((state) => state.selectedNodeId);
  const typeToGroup = useMemo(() => {
    const mapTypeToGroup = new Map<string, string>();
    filters.forEach((g) => {
      g.values.forEach((v) => mapTypeToGroup.set(v.id, g.group));
    });
    return mapTypeToGroup;
  }, [filters]);

  const fitBoundsOnChange = useSettingsStore(
    (state) => state.fitBoundsOnChange,
  );
  const colorBlindMode = useSettingsStore((state) => state.colorBlindMode);
  const colorBlindSeverity = useSettingsStore(
    (state) => state.colorBlindSeverity,
  );
  const tempPrivateNodeId = useSettingsStore(
    (state) => state.tempPrivateNode?.id,
  );
  const highlightSpawnIDs = useGameState((state) => state.highlightSpawnIDs);
  const existingSpawnIds = useRef<Map<string | number, CanvasMarker>>();
  const player = useGameState((state) => state.player);
  const throttledPlayer = useThrottle(player, 1000);
  const firstRender = useRef(true);

  useEffect(() => {
    if (!map || !map._mapPane) {
      return;
    }
    if (!existingSpawnIds.current) {
      existingSpawnIds.current = new Map();
    }

    let tooltipDelayTimeout: NodeJS.Timeout | undefined;

    const handleSpawn = (spawn: Spawn) => {
      if (spawn.mapName && spawn.mapName !== map.mapName) {
        return;
      }
      if (tempPrivateNodeId && tempPrivateNodeId === spawn.id.split("@")[0]) {
        return;
      }
      const isCluster = Boolean(spawn.cluster && spawn.cluster.length > 0);

      const nodeId = getNodeId(spawn);
      let isDiscovered: boolean;
      if (nodeId.includes("@")) {
        const [baseId] = nodeId.split("@");
        isDiscovered = discoveredSet.has(nodeId) || discoveredSet.has(baseId);
      } else {
        isDiscovered = discoveredSet.has(nodeId);
      }
      if (isCluster && isDiscovered) {
        if (
          spawn.cluster!.some(
            (a) =>
              !discoveredSet.has(
                a.id?.includes("@")
                  ? a.id
                  : `${a.id || a.type}@${a.p[0]}:${a.p[1]}`,
              ),
          )
        ) {
          isDiscovered = false;
        }
      }

      const id = isCluster ? `${nodeId}:${isCluster}` : nodeId;
      spawnIds.add(spawn.address || id);

      const isHighlighted =
        highlightSpawnIDs.includes(nodeId) || selectedNodeId === nodeId;
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
        if (existingMarker.options.isHighlighted !== isHighlighted) {
          existingMarker.setHighlight(isHighlighted);
        }
        return;
      }
      if (isDiscovered && hideDiscoveredNodes) {
        return;
      }
      const icon = icons.get(spawn.type);
      const baseRadius =
        spawn.radius ??
        markerOptions.radius * (icon?.size ?? 1) * (isCluster ? 1.5 : 1);

      const markerIcon =
        spawn.icon ||
        (typeof icon?.icon === "string"
          ? {
              url: getIconsUrl(appName, icon.icon),
            }
          : icon?.icon) ||
        null;

      const groupId = typeToGroup.get(spawn.type);
      const groupMultiplier = groupId ? (iconSizeByGroup[groupId] ?? 1) : 1;
      const typeMultiplier = iconSizeByFilter[spawn.type] ?? 1;

      const marker = new CanvasMarker(spawn.p, {
        id,
        typeId: spawn.type,
        icon: markerIcon,
        fillColor: spawn.color,
        baseRadius,
        radius: baseRadius * baseIconSize * groupMultiplier * typeMultiplier,
        isDiscovered,
        isCluster,
        isHighlighted,
        colorBlindMode,
        colorBlindSeverity,
        pane: "tooltipPane",
      });
      const getItems = () => {
        const filter = filters.find((filter) =>
          filter.values.some((filter) => filter.id === spawn.type),
        );
        const items = [
          {
            id: nodeId,
            termId: (spawn.name ?? spawn.id ?? spawn.type).replace(
              /my_\d+_/,
              "",
            ),
            description: spawn.description,
            type: spawn.type,
            group: filter?.group,
            isPrivate: spawn.isPrivate,
            isLive: Boolean(spawn.address),
          },
        ];
        if (isCluster) {
          items.push(
            ...spawn.cluster!.map((spawn) => ({
              id: spawn.id,
              termId: (spawn.name ?? spawn.id ?? spawn.type).replace(
                /my_\d+_/,
                "",
              ),
              description: spawn.description,
              type: spawn.type,
              group: filter?.group,
              isPrivate: spawn.isPrivate,
              isLive: Boolean(spawn.address),
            })),
          );
        }
        return items;
      };

      marker.on({
        mousedown: () => {
          clearTimeout(tooltipDelayTimeout);
        },
        mouseover: (event) => {
          if (handleMapMouseMoveRef.current) {
            map.off("mousemove", handleMapMouseMoveRef.current);
            handleMapMouseMoveRef.current = null;
          }

          clearTimeout(tooltipDelayTimeout);
          tooltipDelayTimeout = setTimeout(() => {
            onTooltipData({
              x: event.sourceTarget._point.x,
              y: event.sourceTarget._point.y,
              radius: marker.getRadius(),
              items: getItems(),
              latLng: spawn.p,
            });
            onTooltipOpen(true);
          }, 50);
        },
        mouseout: (event) => {
          DomEvent.stopPropagation(event);

          clearTimeout(tooltipDelayTimeout);
          handleMapMouseMoveRef.current = (e: LeafletMouseEvent) => {
            const distanceFromMarker = Math.sqrt(
              Math.pow(e.layerPoint.x - marker._point.x, 2) +
                Math.pow(e.layerPoint.y - marker._point.y, 2),
            );
            const maxDistance = marker.getRadius() + 15;

            if (distanceFromMarker > maxDistance) {
              onTooltipOpen(false);
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
          isDiscovered = !isDiscovered;
          if (isCluster) {
            spawn.cluster!.forEach((spawn) => {
              setDiscoverNode(getNodeId(spawn), isDiscovered);
            });
          }
          setDiscoverNode(nodeId, isDiscovered);
        },
        click: (event) => {
          DomEvent.stopPropagation(event);
          if (spawn.address) {
            return;
          }
          onClick(nodeId);
        },
      });
      existingSpawnIds.current!.set(spawn.address || id, marker);
      try {
        marker.addTo(map);
      } catch (e) {
        //
      }
    };
    const spawnIds = new Set<string | number>();
    spawns.forEach(handleSpawn);

    const sharedPrivateSpawns = sharedMyFilters.flatMap<Spawns[number]>(
      (myFilter) => {
        return (
          myFilter.nodes?.map((node) => {
            return {
              type: myFilter.name,
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
          }) ?? []
        );
      },
    );
    sharedPrivateSpawns.forEach(handleSpawn);

    for (const [key, marker] of existingSpawnIds.current.entries()) {
      if (spawnIds.has(key)) {
        continue;
      }
      existingSpawnIds.current.delete(key);

      try {
        marker.off();
        marker.remove();
      } catch (e) {}
    }
  }, [
    map,
    spawns,
    sharedMyFilters,
    hideDiscoveredNodes,
    discoveredSet,
    tempPrivateNodeId,
    selectedNodeId,
    highlightSpawnIDs,
  ]);

  useEffect(() => {
    if (!markerOptions.zPos || !throttledPlayer || !existingSpawnIds.current)
      return;
    if (
      throttledPlayer?.mapName &&
      throttledPlayer?.mapName &&
      player?.mapName !== map?.mapName
    ) {
      return;
    }

    for (const marker of existingSpawnIds.current.values()) {
      if (!marker.options || !marker.options.id) continue;
      const spawnP = marker._latLngTuple as [number, number, number];
      if (spawnP.length !== 3) continue;

      const dx = throttledPlayer.x - spawnP[0];
      const dy = throttledPlayer.y - spawnP[1];
      const xyDistSq = dx * dx + dy * dy;

      let newZPos: CanvasMarkerOptions["zPos"] = null;
      const maxDistSq =
        markerOptions.zPos.xyMaxDistance * markerOptions.zPos.xyMaxDistance;
      if (xyDistSq <= maxDistSq) {
        const dz = throttledPlayer.z - spawnP[2];
        if (dz > markerOptions.zPos.zDistance) {
          newZPos = "bottom";
        }
        if (dz < -markerOptions.zPos.zDistance) {
          newZPos = "top";
        }
      }

      if (marker.options.zPos !== newZPos) {
        marker.setZPos(newZPos);
      }
    }
  }, [throttledPlayer, markerOptions.zPos]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const handleZoomEnd = () => {
      clearCanvasCache();
    };
    map.on("zoomend", handleZoomEnd);
    return () => {
      map.off("zoomend", handleZoomEnd);
      clearCanvasCache();
      existingSpawnIds.current?.forEach((marker) => {
        try {
          marker.off();
          marker.remove();
        } catch (e) {}
      });
      existingSpawnIds.current?.clear();
    };
  }, [map]);

  useEffect(() => {
    clearCanvasCache();
    existingSpawnIds.current?.forEach((marker) => {
      const typeId = (marker.options as any).typeId as string | undefined;
      const filterSize = typeId ? (iconSizeByFilter[typeId] ?? 1) : 1;
      const groupId = typeId ? typeToGroup.get(typeId) : undefined;
      const groupSize = groupId ? (iconSizeByGroup[groupId] ?? 1) : 1;
      marker.setRadius(
        marker.options.baseRadius * baseIconSize * groupSize * filterSize,
      );
    });
  }, [baseIconSize, iconSizeByFilter, iconSizeByGroup, typeToGroup]);

  useEffect(() => {
    existingSpawnIds.current?.forEach((marker) => {
      const isHighlighted = highlightSpawnIDs.includes(marker.options.id);
      if (marker.options.isHighlighted !== isHighlighted) {
        marker.setHighlight(isHighlighted);
      }
    });
  }, [highlightSpawnIDs]);

  // Update markers when color blind mode changes
  useEffect(() => {
    clearCanvasCache();
    existingSpawnIds.current?.forEach((marker) => {
      try {
        marker.setColorBlindMode(colorBlindMode);
      } catch (e) {}
    });
  }, [colorBlindMode]);

  // Update markers when color blind severity changes
  useEffect(() => {
    clearCanvasCache();
    existingSpawnIds.current?.forEach((marker) => {
      try {
        marker.setColorBlindSeverity(colorBlindSeverity);
      } catch (e) {}
    });
  }, [colorBlindSeverity]);

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

  return <></>;
}
