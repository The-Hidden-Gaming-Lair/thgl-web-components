"use client";
import { useUserStore, useT } from "../(providers)";
import { useEffect, useRef, useState } from "react";
import { useMap } from "./store";
import { Button } from "../ui/button";
import {
  type PrivateNode,
  type PrivateNodeStyle,
  useSettingsStore,
  useConnectionStore,
  getIconsUrl,
} from "@repo/lib";
import {
  DEFAULT_CIRCLE_SHEET,
  type IconMarkerInstance,
  type IconMarkerLayer,
} from "@repo/lib/web-map";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { ColorPicker } from "../(controls)/color-picker";
import { Slider } from "../ui/slider";
import { ChevronDown, Info, MapPin } from "lucide-react";
import { IconPicker } from "../(controls)/icon-picker";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { FilterSelect } from "../(controls)/filter-select";
import { AddSharedFilter } from "./add-shared-filter";
import { UploadFilter } from "./upload-filter";
import { inverseRotateCoordinate, rotateCoordinate } from "./rotation";
import {
  getSourceImage,
  setSourceImage,
  getProcessedImage,
  setProcessedImage,
  createProcessedImageKey,
} from "./icon-cache";

const PRIVATE_NODE_MARKER_ID = "__private_node_preview__";
const PRIVATE_NODE_ICON_SHEET = "__private_node_icon_sheet__";
const SHARED_PRIVATE_NODE_MARKER_ID = "__shared_private_node_preview__";

// A short human label for a saved style, used in the "Use last" dropdown.
function styleLabel(
  style: PrivateNodeStyle,
  t: ReturnType<typeof useT>,
): string {
  return (
    style.name?.trim() ||
    style.icon?.name ||
    style.filter ||
    t("nodes.add.untitledStyle", { fallback: "Untitled style" })
  );
}

export function PrivateNode({
  appName,
  hidden,
  iconsPath,
}: {
  appName: string;
  hidden?: boolean;
  iconsPath: string;
}) {
  const t = useT();
  const map = useMap();
  const mapName = useUserStore((state) => state.mapName);
  const myFilters = useSettingsStore((state) => state.myFilters);
  const setMyFilter = useSettingsStore((state) => state.setMyFilter);
  const tempPrivateNode = useSettingsStore((state) => state.tempPrivateNode);
  const setTempPrivateNode = useSettingsStore(
    (state) => state.setTempPrivateNode,
  );
  const recentPrivateNodeStyles = useSettingsStore(
    (state) => state.recentPrivateNodeStyles,
  );
  const pushRecentPrivateNodeStyle = useSettingsStore(
    (state) => state.pushRecentPrivateNodeStyle,
  );
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const iconSizeByFilter = useSettingsStore((state) => state.iconSizeByFilter);
  const iconSizeByGroup = useSettingsStore((state) => state.iconSizeByGroup);
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);
  const isEditing = tempPrivateNode !== null;
  const radius = tempPrivateNode?.radius ?? 10;
  const color = tempPrivateNode?.color ?? "#FFFFFFCC";

  // Track current position for WebMap
  const positionRef = useRef<[number, number] | null>(null);

  // Version counter to trigger visual effect when marker is recreated
  const [markerVersion, setMarkerVersion] = useState(0);

  // Signature of the last node we persisted. Used to ignore a repeated save
  // (e.g. double-clicking "Save & next") when nothing has changed since, so we
  // never create two identical nodes at the same spot.
  const lastSavedSignatureRef = useRef<string | null>(null);

  // Local cache for colored circle images (not shared, specific to this component)
  const coloredCircleCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Helper to create a colored circle image (synchronous via canvas)
  const createColoredCircleImage = (markerColor: string): HTMLImageElement => {
    const cacheKey = `__circle_${markerColor}__`;
    const cached = coloredCircleCache.current.get(cacheKey);
    if (cached && cached.complete) {
      return cached;
    }

    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Draw colored circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = markerColor;
    ctx.fill();

    // Add a subtle border
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Create image from canvas - use canvas directly as image source
    const img = new Image();
    img.src = canvas.toDataURL();
    coloredCircleCache.current.set(cacheKey, img);
    return img;
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

  // Helper to extract RGB (without alpha) from color string
  const getRgbFromColor = (colorStr: string): string => {
    if (colorStr.length === 9 && colorStr.startsWith("#")) {
      return colorStr.slice(0, 7); // #RRGGBB from #RRGGBBAA
    } else if (colorStr.length === 5 && colorStr.startsWith("#")) {
      return `#${colorStr[1]}${colorStr[1]}${colorStr[2]}${colorStr[2]}${colorStr[3]}${colorStr[3]}`; // Expand #RGBA to #RRGGBB
    }
    return colorStr;
  };

  // Helper to process icon with glow effect (synchronous, for use when source is cached)
  // Returns the image and its dimensions (since img.width may not be set immediately from data URL)
  const processIconSync = (
    sourceImg: HTMLImageElement,
    iconRect: { x: number; y: number; width: number; height: number } | null,
    nodeColor: string,
    isGameIcon: boolean,
  ): { img: HTMLImageElement; width: number; height: number } => {
    const width = iconRect?.width ?? sourceImg.naturalWidth;
    const height = iconRect?.height ?? sourceImg.naturalHeight;
    const srcX = iconRect?.x ?? 0;
    const srcY = iconRect?.y ?? 0;
    const rgbColor = getRgbFromColor(nodeColor);
    const alpha = getAlphaFromColor(nodeColor);

    const canvas = document.createElement("canvas");
    const outputCanvas = document.createElement("canvas");
    let outputWidth: number;
    let outputHeight: number;

    if (isGameIcon) {
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = rgbColor;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(sourceImg, srcX, srcY, width, height, 0, 0, width, height);
      outputCanvas.width = width;
      outputCanvas.height = height;
      outputWidth = width;
      outputHeight = height;
      const outCtx = outputCanvas.getContext("2d")!;
      outCtx.globalAlpha = alpha;
      outCtx.drawImage(canvas, 0, 0);
    } else {
      const glowSize = 8;
      const totalSize = Math.max(width, height) + glowSize * 2;
      canvas.width = totalSize;
      canvas.height = totalSize;
      const ctx = canvas.getContext("2d")!;
      const iconX = (totalSize - width) / 2;
      const iconY = (totalSize - height) / 2;
      const isWhite = rgbColor.toUpperCase() === "#FFFFFF";
      if (!isWhite) {
        ctx.shadowColor = rgbColor;
        ctx.shadowBlur = glowSize;
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
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }
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

  // Main effect: Create marker, setup click handler
  // Only runs when editing starts - NOT on color/position/icon changes
  useEffect(() => {
    if (!isEditing || !map) {
      return;
    }

    const markerLayer = map.markerLayer;
    if (!markerLayer) {
      return;
    }

    // Initialize position
    let latLng: [number, number];
    if (!tempPrivateNode.p || tempPrivateNode.p.length !== 2) {
      const center = map.getCenter();
      latLng = [center.lat, center.lng];
      setTempPrivateNode({ p: latLng });
    } else {
      const rotationDegrees = map._rotationDegrees;
      const rotationCenter = map._rotationCenter;
      if (rotationDegrees && rotationCenter) {
        latLng = rotateCoordinate(
          tempPrivateNode.p,
          rotationDegrees,
          rotationCenter,
        );
      } else {
        latLng = tempPrivateNode.p;
      }
    }

    positionRef.current = latLng;
    const dpr = window.devicePixelRatio || 1;
    const filterName = tempPrivateNode?.filter;
    const typeMultiplier = filterName ? (iconSizeByFilter[filterName] ?? 1) : 1;
    // Private nodes don't belong to a group, so groupMultiplier is 1
    const size = (radius * 4 - 1) * baseIconSize * typeMultiplier * dpr;

    // Determine initial sheet - use cached icon if available, otherwise colored circle
    let initialSheet = DEFAULT_CIRCLE_SHEET;
    let initialRect = { x: 0, y: 0, width: 64, height: 64 };

    const iconUrl = tempPrivateNode?.icon?.url;
    if (iconUrl) {
      const fullIconUrl = getIconsUrl(appName, iconUrl, iconsPath);
      // Compute iconRect first so it can be included in cache key
      const iconWidth = tempPrivateNode.icon?.width ?? 0;
      const iconHeight = tempPrivateNode.icon?.height ?? 0;
      const iconRect =
        iconWidth > 0 && iconHeight > 0
          ? {
              x: tempPrivateNode.icon?.x ?? 0,
              y: tempPrivateNode.icon?.y ?? 0,
              width: iconWidth,
              height: iconHeight,
            }
          : null;
      // Include iconRect in cache key so different icons on same sprite sheet have different cache entries
      const cacheKey = createProcessedImageKey(fullIconUrl, color, iconRect);

      // First check shared processed image cache (ensures exact same dimensions as markers.tsx)
      const cachedProcessed = getProcessedImage(cacheKey);
      if (cachedProcessed) {
        markerLayer.setSheet(PRIVATE_NODE_ICON_SHEET, cachedProcessed.img);
        initialSheet = PRIVATE_NODE_ICON_SHEET;
        initialRect = {
          x: 0,
          y: 0,
          width: cachedProcessed.width,
          height: cachedProcessed.height,
        };
      } else {
        // Check if source image is cached
        const cachedSource = getSourceImage(fullIconUrl);
        if (cachedSource) {
          // Process and store in shared cache
          const isGameIcon = iconUrl.includes("game-icons");
          const {
            img: processedImg,
            width: procWidth,
            height: procHeight,
          } = processIconSync(cachedSource, iconRect, color, isGameIcon);

          // Store in shared cache so markers.tsx uses exact same entry
          setProcessedImage(cacheKey, processedImg, procWidth, procHeight);

          markerLayer.setSheet(PRIVATE_NODE_ICON_SHEET, processedImg);
          initialSheet = PRIVATE_NODE_ICON_SHEET;
          initialRect = { x: 0, y: 0, width: procWidth, height: procHeight };
        } else {
          // No cached source - use colored circle, visual effect will update when loaded
          const circleSheetName = `__circle_${color}__`;
          const circleImg = createColoredCircleImage(color);
          markerLayer.setSheet(circleSheetName, circleImg);
          initialSheet = circleSheetName;
        }
      }
    } else {
      // No icon - use colored circle
      const circleSheetName = `__circle_${color}__`;
      const circleImg = createColoredCircleImage(color);
      markerLayer.setSheet(circleSheetName, circleImg);
      initialSheet = circleSheetName;
    }

    const marker: IconMarkerInstance = {
      id: PRIVATE_NODE_MARKER_ID,
      latLng,
      size,
      sheet: initialSheet,
      rect: initialRect,
      key: "private-node-preview",
      isHighlighted: false, // Keep false to match normal marker size on map (highlighted = 1.15x bigger)
    };
    markerLayer.add(marker);
    // Increment version to trigger visual effect (in case color/icon changes later)
    setMarkerVersion((v) => v + 1);

    // Handle click to reposition (updates marker directly, no state-triggered re-render)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClick = (e: any) => {
      const clickLatLng = e.latlng as [number, number];
      if (!clickLatLng) return;
      const [lat, lng] = clickLatLng;

      const rotationDegrees = map._rotationDegrees;
      const rotationCenter = map._rotationCenter;
      let storageCoord: [number, number] = [lat, lng];
      if (rotationDegrees && rotationCenter) {
        storageCoord = inverseRotateCoordinate(
          [lat, lng],
          rotationDegrees,
          rotationCenter,
        );
      }

      positionRef.current = [lat, lng];
      // Update marker directly - this is instant
      markerLayer.updateMarker(PRIVATE_NODE_MARKER_ID, { latLng: [lat, lng] });
      // Update state for persistence (React will re-render but marker already moved)
      setTempPrivateNode({ p: storageCoord });
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
      markerLayer.remove(PRIVATE_NODE_MARKER_ID);
    };
  }, [isEditing, map]);

  // Unified visual effect: handles icon OR circle based on tempPrivateNode.icon
  // Uses requestAnimationFrame to ensure marker exists from main effect
  useEffect(() => {
    if (!isEditing || !map) return;

    const markerLayer = map.markerLayer;
    if (!markerLayer) return;

    // Use requestAnimationFrame to ensure marker is created by main effect
    const rafId = requestAnimationFrame(() => {
      const existingMarker = markerLayer.getMarker(PRIVATE_NODE_MARKER_ID);
      if (!existingMarker) return;

      const iconUrl = tempPrivateNode?.icon?.url;
      if (iconUrl) {
        // Apply icon with glow effect using the shared cache for consistency with markers.tsx
        const fullIconUrl = getIconsUrl(appName, iconUrl, iconsPath);
        // Compute iconRect first so it can be included in cache key
        const iconWidth = tempPrivateNode.icon?.width ?? 0;
        const iconHeight = tempPrivateNode.icon?.height ?? 0;
        const iconRect =
          iconWidth > 0 && iconHeight > 0
            ? {
                x: tempPrivateNode.icon?.x ?? 0,
                y: tempPrivateNode.icon?.y ?? 0,
                width: iconWidth,
                height: iconHeight,
              }
            : null;
        // Include iconRect in cache key so different icons on same sprite sheet have different cache entries
        const cacheKey = createProcessedImageKey(fullIconUrl, color, iconRect);
        const isGameIcon = iconUrl.includes("game-icons");

        // Check shared processed image cache first (same cache as markers.tsx)
        const cachedProcessed = getProcessedImage(cacheKey);
        if (cachedProcessed) {
          markerLayer.setSheet(PRIVATE_NODE_ICON_SHEET, cachedProcessed.img);
          markerLayer.updateMarker(PRIVATE_NODE_MARKER_ID, {
            sheet: PRIVATE_NODE_ICON_SHEET,
            rect: {
              x: 0,
              y: 0,
              width: cachedProcessed.width,
              height: cachedProcessed.height,
            },
          });
        } else {
          // Need to process - check source image cache
          const applyIcon = (sourceImg: HTMLImageElement) => {
            // Use the same processIconSync function for consistency
            const {
              img: processedImg,
              width: procWidth,
              height: procHeight,
            } = processIconSync(sourceImg, iconRect, color, isGameIcon);

            // Store in shared cache so markers.tsx uses the exact same entry
            setProcessedImage(cacheKey, processedImg, procWidth, procHeight);

            // Wait for the processed image to load before updating the marker
            const updateMarker = () => {
              const currentMarker = markerLayer.getMarker(
                PRIVATE_NODE_MARKER_ID,
              );
              if (!currentMarker) {
                return;
              }
              markerLayer.setSheet(PRIVATE_NODE_ICON_SHEET, processedImg);
              markerLayer.updateMarker(PRIVATE_NODE_MARKER_ID, {
                sheet: PRIVATE_NODE_ICON_SHEET,
                rect: { x: 0, y: 0, width: procWidth, height: procHeight },
              });
            };

            // Check if image is already loaded (data URL should be synchronous in most cases)
            if (processedImg.complete && processedImg.naturalWidth > 0) {
              updateMarker();
            } else {
              processedImg.onload = updateMarker;
            }
          };

          // Check shared source image cache
          const cachedSource = getSourceImage(fullIconUrl);
          if (cachedSource) {
            applyIcon(cachedSource);
          } else {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              // Check if marker still exists before applying
              if (!markerLayer.getMarker(PRIVATE_NODE_MARKER_ID)) {
                return;
              }
              // Store in shared cache for use by markers.tsx
              setSourceImage(fullIconUrl, img);
              applyIcon(img);
            };
            img.src = fullIconUrl;
          }
        }
      } else {
        // No icon - apply colored circle
        const circleSheetName = `__circle_${color}__`;
        const circleImg = createColoredCircleImage(color);
        markerLayer.setSheet(circleSheetName, circleImg);
        markerLayer.updateMarker(PRIVATE_NODE_MARKER_ID, {
          sheet: circleSheetName,
          rect: { x: 0, y: 0, width: 64, height: 64 },
        });
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [
    isEditing,
    map,
    color,
    appName,
    iconsPath,
    markerVersion,
    tempPrivateNode?.icon?.url,
    tempPrivateNode?.icon?.x,
    tempPrivateNode?.icon?.y,
    tempPrivateNode?.icon?.width,
    tempPrivateNode?.icon?.height,
  ]);

  // Effect for size changes only
  useEffect(() => {
    if (!isEditing || !map) return;

    const markerLayer = map.markerLayer;
    if (!markerLayer) return;

    const rafId = requestAnimationFrame(() => {
      const existingMarker = markerLayer.getMarker(PRIVATE_NODE_MARKER_ID);
      if (!existingMarker) return;

      const dpr = window.devicePixelRatio || 1;
      const filterName = tempPrivateNode?.filter;
      const tm = filterName ? (iconSizeByFilter[filterName] ?? 1) : 1;
      const size = (radius * 4 - 1) * baseIconSize * tm * dpr;
      markerLayer.updateMarker(PRIVATE_NODE_MARKER_ID, { size });
    });

    return () => cancelAnimationFrame(rafId);
  }, [
    isEditing,
    map,
    radius,
    baseIconSize,
    iconSizeByFilter,
    tempPrivateNode?.filter,
  ]);

  // Update marker position when coordinates change (e.g. from X/Y input fields)
  useEffect(() => {
    if (!isEditing || !map?.markerLayer) return;
    const p = tempPrivateNode?.p;
    if (!p) return;

    const markerLayer = map.markerLayer;
    const rafId = requestAnimationFrame(() => {
      const existing = markerLayer.getMarker(PRIVATE_NODE_MARKER_ID);
      if (!existing) return;

      let displayLatLng: [number, number] = [p[0], p[1]];
      const rotationDegrees = map._rotationDegrees;
      const rotationCenter = map._rotationCenter;
      if (rotationDegrees && rotationCenter) {
        displayLatLng = rotateCoordinate(
          p as [number, number],
          rotationDegrees,
          rotationCenter,
        );
      }
      positionRef.current = displayLatLng;
      markerLayer.updateMarker(PRIVATE_NODE_MARKER_ID, {
        latLng: displayLatLng,
      });
    });

    return () => cancelAnimationFrame(rafId);
  }, [isEditing, map, tempPrivateNode?.p?.[0], tempPrivateNode?.p?.[1]]);

  // Shared private node from collaboration
  const sharedTempPrivateNode = useConnectionStore(
    (state) => state.tempPrivateNode,
  );
  useEffect(() => {
    if (!sharedTempPrivateNode || !map) {
      return;
    }
    if (sharedTempPrivateNode.mapName !== mapName) {
      return;
    }
    const latLng = sharedTempPrivateNode.p;
    if (!latLng) {
      return;
    }

    const markerLayer = map.markerLayer;
    if (!markerLayer) {
      return;
    }

    // Apply rotation to display shared node correctly
    let displayLatLng: [number, number] = latLng;
    const rotationDegrees = map._rotationDegrees;
    const rotationCenter = map._rotationCenter;
    if (rotationDegrees && rotationCenter) {
      displayLatLng = rotateCoordinate(latLng, rotationDegrees, rotationCenter);
    }

    const sharedRadius = sharedTempPrivateNode.radius ?? 10;
    const dpr = window.devicePixelRatio || 1;
    const size = (sharedRadius * 4 - 1) * baseIconSize * dpr;

    const marker: IconMarkerInstance = {
      id: SHARED_PRIVATE_NODE_MARKER_ID,
      latLng: displayLatLng,
      size,
      sheet: DEFAULT_CIRCLE_SHEET,
      rect: { x: 0, y: 0, width: 64, height: 64 },
      key: "shared-private-node-preview",
      isHighlighted: false, // Keep false to match normal marker size on map (highlighted = 1.15x bigger)
    };

    markerLayer.add(marker);

    return () => {
      markerLayer.remove(SHARED_PRIVATE_NODE_MARKER_ID);
    };
  }, [sharedTempPrivateNode, baseIconSize, mapName, map]);

  // Update mapName when it changes
  useEffect(() => {
    if (tempPrivateNode) {
      setTempPrivateNode({ mapName });
    }
  }, [mapName]);

  if (hidden) {
    return <></>;
  }

  const saveNode = (keepOpen: boolean) => {
    if (!tempPrivateNode?.filter) {
      return;
    }

    // Get coordinates from stored tempPrivateNode.p
    if (!tempPrivateNode.p) {
      return;
    }
    const storageCoord = tempPrivateNode.p;

    // Guard against duplicate saves (e.g. double-clicking "Save & next"): if
    // nothing changed since the last save, ignore this one. The signature
    // covers everything that defines the node, including its position.
    const signature = JSON.stringify({
      filter: tempPrivateNode.filter,
      name: tempPrivateNode.name ?? "",
      description: tempPrivateNode.description ?? "",
      color,
      icon: tempPrivateNode.icon ?? null,
      radius,
      p: storageCoord,
    });
    if (signature === lastSavedSignatureRef.current) {
      return;
    }

    // Keep existing ID when editing, generate new one when creating
    const id = tempPrivateNode.id ?? `${tempPrivateNode.filter}_${Date.now()}`;
    const marker: PrivateNode = {
      id,
      name: tempPrivateNode.name,
      description: tempPrivateNode.description,
      color: color,
      icon: tempPrivateNode.icon || null,
      radius,
      p: storageCoord,
      mapName,
    };

    const myFilter = myFilters.find(
      (filter) => filter.name === tempPrivateNode.filter,
    );
    if (!myFilter) {
      return;
    }
    // Build a fresh nodes array instead of mutating the existing one in place,
    // and go through setMyFilter (singular) so the change is pushed to the
    // cloud. setMyFilters (plural) is local-only and would leave the node
    // unsynced — on the next reload hydrateFiltersFromServer would then
    // overwrite it with the node-less server copy.
    const newNodes = [
      ...(myFilter.nodes?.filter(
        (marker) => marker.id !== tempPrivateNode.id,
      ) ?? []),
      marker,
    ];
    setMyFilter(tempPrivateNode.filter, { nodes: newNodes });
    setFilters([
      ...filters.filter((f) => f !== tempPrivateNode.filter),
      tempPrivateNode.filter,
    ]);
    lastSavedSignatureRef.current = signature;

    // Remember this style so it can be reapplied to future nodes.
    pushRecentPrivateNodeStyle({
      filter: tempPrivateNode.filter,
      name: tempPrivateNode.name,
      description: tempPrivateNode.description,
      color,
      icon: tempPrivateNode.icon ?? null,
      radius,
    });

    if (keepOpen) {
      // Keep the style fields for the next node; clear the id so the next save
      // creates a new node instead of overwriting the one we just saved. The
      // position is kept so the preview marker stays visible until the user
      // clicks the map to place the next one.
      setTempPrivateNode({ id: undefined });
    } else {
      setTempPrivateNode(null);
    }
  };

  const applyStyle = (style: PrivateNodeStyle) => {
    setTempPrivateNode({
      filter: style.filter,
      name: style.name,
      description: style.description,
      color: style.color,
      icon: style.icon,
      radius: style.radius,
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveNode(false);
  };

  return (
    <Popover
      open={isEditing}
      onOpenChange={(open) => {
        setTempPrivateNode(open ? { mapName } : null);
        // Reset the duplicate-save guard so the next session starts clean.
        lastSavedSignatureRef.current = null;
      }}
    >
      <Tooltip delayDuration={200} disableHoverableContent>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant={isEditing ? "secondary" : "outline"}
              aria-label={t("nodes.add.title", { fallback: "Add node" })}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {t("nodes.add.title", { fallback: "Add Node" })}
        </TooltipContent>
      </Tooltip>
      <PopoverContent onInteractOutside={(e) => e.preventDefault()}>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">
                {t("nodes.add.title", { fallback: "Add Node" })}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t("nodes.add.clickToPlace", {
                  fallback: "Click on the map to change the node position.",
                })}
              </p>
              {!tempPrivateNode?.id && recentPrivateNodeStyles.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full justify-between gap-2 h-8"
                      title={t("nodes.add.useLastHint", {
                        fallback: "Reuse the style of a recently created node",
                      })}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className="h-3 w-3 rounded-full border shrink-0"
                          style={{
                            backgroundColor:
                              recentPrivateNodeStyles[0].color ?? "#FFFFFFCC",
                          }}
                        />
                        <span className="truncate text-muted-foreground">
                          {t("nodes.add.useLast", { fallback: "Use last:" })}{" "}
                          {styleLabel(recentPrivateNodeStyles[0], t)}
                        </span>
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="max-h-64 overflow-y-auto"
                  >
                    <DropdownMenuLabel>
                      {t("nodes.add.recentStyles", {
                        fallback: "Recent node styles",
                      })}
                    </DropdownMenuLabel>
                    {recentPrivateNodeStyles.map((style, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() => applyStyle(style)}
                        className="gap-2"
                      >
                        <span
                          className="h-3 w-3 rounded-full border shrink-0"
                          style={{
                            backgroundColor: style.color ?? "#FFFFFFCC",
                          }}
                        />
                        <span className="truncate">{styleLabel(style, t)}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="filter" className="flex gap-1 items-center">
                  {t("common.filter", { fallback: "Filter" })}
                  <HoverCard openDelay={50} closeDelay={50}>
                    <HoverCardTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </HoverCardTrigger>
                    <HoverCardContent>
                      {t("nodes.add.filterHelp", {
                        fallback:
                          "You can group nodes by filters. For example, you can use a filter to group all nodes related to a specific quest. The filter is toggled on and off in the search. Shared nodes can be imported by other users.",
                      })}
                    </HoverCardContent>
                  </HoverCard>
                </Label>
                <FilterSelect
                  id="filter"
                  className="col-span-2 h-8"
                  filter={tempPrivateNode?.filter}
                  onFilterSelect={(filter) => {
                    setTempPrivateNode({
                      filter,
                    });
                  }}
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="name" className="flex gap-1 items-center">
                  {t("common.name", { fallback: "Name" })}
                  <HoverCard openDelay={50} closeDelay={50}>
                    <HoverCardTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </HoverCardTrigger>
                    <HoverCardContent>
                      {t("nodes.add.nameHelp", {
                        fallback:
                          "An optional name for the node, which is visible in the search and tooltip.",
                      })}
                    </HoverCardContent>
                  </HoverCard>
                </Label>
                <Input
                  id="name"
                  className="col-span-2 h-8"
                  placeholder={t("nodes.add.namePlaceholder", {
                    fallback: "Optional name…",
                  })}
                  value={tempPrivateNode?.name ?? ""}
                  onChange={(e) => setTempPrivateNode({ name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label
                  htmlFor="description"
                  className="flex gap-1 items-center"
                >
                  {t("common.description", { fallback: "Description" })}
                </Label>
                <Textarea
                  id="description"
                  className="col-span-2 resize-none"
                  placeholder={t("nodes.add.descriptionPlaceholder", {
                    fallback: "Optional notes or description…",
                  })}
                  value={tempPrivateNode?.description ?? ""}
                  onChange={(e) =>
                    setTempPrivateNode({ description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="color">
                  {t("common.color", { fallback: "Color" })}
                </Label>
                <ColorPicker
                  id="color"
                  className="col-span-2 h-8"
                  value={color}
                  onChange={(color) => setTempPrivateNode({ color })}
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label>{t("common.icon", { fallback: "Icon" })}</Label>
                <IconPicker
                  appName={appName}
                  className="col-span-2 h-8"
                  value={tempPrivateNode?.icon ?? null}
                  onChange={(icon) => setTempPrivateNode({ icon })}
                  iconsPath={iconsPath}
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="radius">
                  {t("common.size", { fallback: "Size" })}
                </Label>
                <Slider
                  id="radius"
                  className="col-span-2 h-8 p-0"
                  value={[radius]}
                  onValueChange={(values) => {
                    setTempPrivateNode({ radius: values[0] });
                  }}
                  min={1}
                  max={30}
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label>X/Y</Label>
                <div className="flex basis-1/2 col-span-2">
                  <Input
                    className="h-8"
                    type="number"
                    value={tempPrivateNode?.p?.[1] ?? 0}
                    onChange={(e) => {
                      const newP: [number, number] = [
                        tempPrivateNode?.p?.[0] ?? 0,
                        +e.target.value,
                      ];
                      setTempPrivateNode({ p: newP });
                    }}
                  />
                  <Input
                    className="h-8"
                    type="number"
                    value={tempPrivateNode?.p?.[0] ?? 0}
                    onChange={(e) => {
                      const newP: [number, number] = [
                        +e.target.value,
                        tempPrivateNode?.p?.[1] ?? 0,
                      ];
                      setTempPrivateNode({ p: newP });
                    }}
                  />
                </div>
              </div>
              <Separator className="my-2" />
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <Button size="sm" type="submit" disabled={!tempPrivateNode?.filter}>
              {t("common.save", { fallback: "Save" })}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              type="button"
              disabled={!tempPrivateNode?.filter}
              onClick={() => saveNode(true)}
              title={t("nodes.add.saveAndNextHint", {
                fallback:
                  "Save this node and keep the dialog open to add another with the same style",
              })}
            >
              {t("nodes.add.saveAndNext", { fallback: "Save & next" })}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTempPrivateNode(null)}
              type="button"
            >
              {t("common.cancel", { fallback: "Cancel" })}
            </Button>
          </div>
        </form>
        <Separator className="my-2" />
        <div className="flex items-center space-x-2 mt-2">
          <UploadFilter
            mapName={mapName}
            onUploaded={(name) =>
              setFilters([...filters.filter((f) => f !== name), name])
            }
          />
          <AddSharedFilter
            onFilterAdded={(name) =>
              setFilters([...filters.filter((f) => f !== name), name])
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
