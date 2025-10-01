"use client";
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
import { useEffect, useMemo, useRef, useState } from "react";
import { Spawns, useCoordinates } from "../(providers)";
import { HoverCard, HoverCardContent, HoverCardPortal } from "../ui/hover-card";
import WebMapMarker, {
  webMapMarkerImgs,
  DEFAULT_Z_NORMALIZATION,
  type WebMapMarkerOptions,
} from "./webmap-marker";
import { IconMarkerLayer } from "@repo/lib/web-map";
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
import { getWebMapTooltipContainer } from "./webmap-portal-container";

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
  const handleMapMouseMoveRef = useRef<((e: WebMapMouseEvent) => void) | null>(
    null,
  );
  const [isLoadingSprite, setIsLoadingSprite] = useState(
    markerOptions.imageSprite && !webMapMarkerImgs["icons.webp"],
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

  const isHoverCardVisible = tooltipIsOpen && !isDrawing;

  useEffect(() => {
    if (markerOptions.imageSprite && !webMapMarkerImgs["icons.webp"]) {
      const iconSprite = new Image();
      iconSprite.src = getAppUrl(appName, iconsPath);
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
                position: "absolute",
                left: `${tooltipData.x}px`,
                top: `${tooltipData.y}px`,
                transform: `translate(-50%, -100%)`,
                marginTop: `-${tooltipData.radius + 8}px`,
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
    ((e: WebMapMouseEvent) => void) | null
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

  // Track hidden marker IDs for bulk visibility control
  const hiddenMarkerIds = useRef<Set<string>>(new Set());
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
  const fallbackNormalization = useMemo(() => {
    const distance = markerOptions.zPos?.zDistance;
    if (typeof distance === "number" && distance > 0) {
      return Math.max(1, distance * 2);
    }
    return DEFAULT_Z_NORMALIZATION;
  }, [markerOptions.zPos?.zDistance]);

  const zRange = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const spawn of spawns) {
      if (spawn.p.length > 2) {
        const raw = Number(spawn.p[2]);
        if (Number.isFinite(raw)) {
          if (raw < min) min = raw;
          if (raw > max) max = raw;
        }
      }
    }
    if (!Number.isFinite(min) || !Number.isFinite(max) || max - min <= 0) {
      return undefined;
    }
    return { min, max } as const;
  }, [spawns]);

  const existingSpawnIds = useRef<Map<string | number, WebMapMarker>>();
  const player = useGameState((state) => state.player);
  const throttledPlayer = useThrottle(player, 1000);
  const firstRender = useRef(true);

  useEffect(() => {
    if (!map) {
      return;
    }
    if (!existingSpawnIds.current) {
      existingSpawnIds.current = new Map();
    }

    // Initialize IconMarkerLayer for WebMap compatibility
    const layers = (map as any).layers || [];
    let iconLayer = layers.find(
      (layerEntry: any) => layerEntry.layer instanceof IconMarkerLayer,
    )?.layer as IconMarkerLayer;

    if (!iconLayer) {
      iconLayer = new IconMarkerLayer();
      map.addLayer(iconLayer, { zIndex: 12 });

      iconLayer
        .loadFilterIconMap(
          getAppUrl(appName, "/config/filters.json"),
          getAppUrl(appName, "/icons/"),
        )
        .catch((error) => {
          console.warn("Failed to load filter icon map:", error);
        });
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

      const spawnCoords = spawn.p as number[];
      const spawnLatLng = [spawnCoords[0], spawnCoords[1]] as [number, number];
      const rawZ = spawnCoords.length > 2 ? Number(spawnCoords[2]) : undefined;
      const spawnZ =
        rawZ !== undefined && Number.isFinite(rawZ) ? rawZ : undefined;
      const spawnZMag =
        spawnZ !== undefined
          ? zRange && zRange.max - zRange.min > 0
            ? Math.min(
                1,
                Math.max(0, (spawnZ - zRange.min) / (zRange.max - zRange.min)),
              )
            : Math.min(1, Math.abs(spawnZ) / fallbackNormalization)
          : undefined;

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
        // Handle visibility through hidden set instead of removeFrom
        if (isDiscovered && hideDiscoveredNodes) {
          hiddenMarkerIds.current.add(existingMarker.options.id);
        } else {
          hiddenMarkerIds.current.delete(existingMarker.options.id);
        }

        if (existingMarker.options.isDiscovered !== isDiscovered) {
          existingMarker.toggleDiscovered();
        }
        const [lat, lng] = existingMarker.getLatLng();
        if (lat !== spawnLatLng[0] || lng !== spawnLatLng[1]) {
          existingMarker.setLatLng(spawnLatLng);
        }
        existingMarker.setZ(spawnZ, zRange ?? null, fallbackNormalization);
        if (existingMarker.options.isHighlighted !== isHighlighted) {
          existingMarker.setHighlight(isHighlighted);
        }
        return;
      }
      if (isDiscovered && hideDiscoveredNodes) {
        // Don't skip creation, just mark as hidden
        hiddenMarkerIds.current.add(id);
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

      const marker = new WebMapMarker(spawnLatLng, {
        id,
        typeId: spawn.type,
        icon: markerIcon,
        fillColor: spawn.color,
        baseRadius:
          baseRadius * baseIconSize * groupMultiplier * typeMultiplier,
        isDiscovered,
        isCluster,
        isHighlighted,
        colorBlindMode,
        colorBlindSeverity,
        z: spawnZ,
        zMag: spawnZMag,
        zRange,
        zNormalization: fallbackNormalization,
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
            const pointX = event.sourceTarget._point.x;
            const pointY = event.sourceTarget._point.y;
            onTooltipData({
              x: pointX,
              y: pointY,
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
          handleMapMouseMoveRef.current = (e: WebMapMouseEvent) => {
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
    // Clear hidden set at the start of processing
    hiddenMarkerIds.current.clear();

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

    // Apply bulk visibility update to IconMarkerLayer
    if (iconLayer) {
      iconLayer.setHiddenById(
        hiddenMarkerIds.current.size > 0 ? hiddenMarkerIds.current : undefined,
      );
    }

    for (const [key, marker] of existingSpawnIds.current.entries()) {
      if (spawnIds.has(key)) {
        continue;
      }
      existingSpawnIds.current.delete(key);

      try {
        marker.off();
        marker.removeFrom(map);
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
    fallbackNormalization,
    zRange?.min,
    zRange?.max,
  ]);

  useEffect(() => {
    if (!markerOptions.zPos || !existingSpawnIds.current) return;

    // If no player position, clear all zPos arrows
    if (!throttledPlayer) {
      for (const marker of existingSpawnIds.current.values()) {
        if (marker.options.zPos !== null) {
          marker.setZPos(null);
        }
      }
      return;
    }

    // If player is on different map, clear all zPos arrows
    if (
      throttledPlayer?.mapName &&
      player?.mapName &&
      player.mapName !== map?.mapName
    ) {
      for (const marker of existingSpawnIds.current.values()) {
        if (marker.options.zPos !== null) {
          marker.setZPos(null);
        }
      }
      return;
    }

    for (const marker of existingSpawnIds.current.values()) {
      if (!marker.options || !marker.options.id) continue;
      const spawnP = marker._latLngTuple as [number, number, number];
      if (spawnP.length !== 3) continue;

      const dx = throttledPlayer.x - spawnP[0];
      const dy = throttledPlayer.y - spawnP[1];
      const xyDistSq = dx * dx + dy * dy;

      let newZPos: WebMapMarkerOptions["zPos"] = null;
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
  }, [throttledPlayer, markerOptions.zPos, player?.mapName, map?.mapName]);

  useEffect(() => {
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

  useEffect(() => {
    existingSpawnIds.current?.forEach((marker) => {
      marker.setZ(
        marker.options.z ?? null,
        zRange ?? null,
        fallbackNormalization,
      );
    });
  }, [zRange?.min, zRange?.max, fallbackNormalization]);

  // Update markers when color blind mode changes
  useEffect(() => {
    existingSpawnIds.current?.forEach((marker) => {
      try {
        marker.setColorBlindMode(colorBlindMode);
      } catch (e) {}
    });
  }, [colorBlindMode]);

  // Update markers when color blind severity changes
  useEffect(() => {
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
