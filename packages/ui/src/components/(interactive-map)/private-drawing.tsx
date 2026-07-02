"use client";
import { useUserStore } from "../(providers)";
import { useCallback, useEffect, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useMap } from "./store";
import { Info, Spline } from "lucide-react";
import { Button } from "../ui/button";
import { ColorPicker } from "../(controls)/color-picker";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useSettingsStore, type Drawing } from "@repo/lib";
import {
  DrawingManager,
  DrawingLayer,
  type DrawingShape,
  type DrawingMode,
} from "@repo/lib/web-map";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Slider } from "../ui/slider";
import { FilterSelect } from "../(controls)/filter-select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { AddSharedFilter } from "./add-shared-filter";
import { UploadFilter } from "./upload-filter";
import { inverseRotateCoordinate, rotateCoordinate } from "./rotation";
import { useCoordinates } from "../(providers)";

export function PrivateDrawing({ hidden }: { hidden?: boolean }) {
  const map = useMap();
  const drawingColor = useSettingsStore((state) => state.drawingColor);
  const setDrawingColor = useSettingsStore((state) => state.setDrawingColor);
  const drawingFillColor = useSettingsStore((state) => state.drawingFillColor);
  const setDrawingFillColor = useSettingsStore(
    (state) => state.setDrawingFillColor,
  );
  const drawingSize = useSettingsStore((state) => state.drawingSize);
  const setDrawingSize = useSettingsStore((state) => state.setDrawingSize);
  const textColor = useSettingsStore((state) => state.textColor);
  const setTextColor = useSettingsStore((state) => state.setTextColor);
  const textSize = useSettingsStore((state) => state.textSize);
  const setTextSize = useSettingsStore((state) => state.setTextSize);
  const [globalMode, setGlobalMode] = useState<DrawingMode>("none");
  const myFilters = useSettingsStore((state) => state.myFilters);
  const mapName = useUserStore((state) => state.mapName);
  const setMyFilter = useSettingsStore((state) => state.setMyFilter);
  const addMyFilter = useSettingsStore((state) => state.addMyFilter);
  const tempPrivateDrawing = useSettingsStore(
    (state) => state.tempPrivateDrawing,
  );
  const setTempPrivateDrawing = useSettingsStore(
    (state) => state.setTempPrivateDrawing,
  );

  const dynamicIconSize = useSettingsStore((state) => state.dynamicIconSize);
  const dynamicIconSizeFactor = useSettingsStore(
    (state) => state.dynamicIconSizeFactor,
  );
  const { staticDrawings } = useCoordinates();
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);
  const isEditing = tempPrivateDrawing !== null;

  const drawingManagerRef = useRef<DrawingManager | null>(null);
  const savedDrawingsLayerRef = useRef<DrawingLayer | null>(null);
  // Suppress the load effect when tempPrivateDrawing changes due to edit/remove events
  const suppressReloadRef = useRef(false);

  // Convert DrawingShape to stored Drawing format
  const shapeToDrawing = useCallback(
    (shape: DrawingShape): Partial<Drawing> => {
      const rotationDegrees = map?.rotationDegrees ?? map?._rotationDegrees;
      const rotationCenter = map?.rotationCenter ?? map?._rotationCenter;

      const transformPositions = (positions: [number, number][]) => {
        return positions.map((pos) => {
          if (rotationDegrees && rotationCenter) {
            return inverseRotateCoordinate(
              pos,
              rotationDegrees,
              rotationCenter,
            );
          }
          return pos;
        });
      };

      switch (shape.type) {
        case "line":
          return {
            polylines: [
              {
                positions: transformPositions(
                  shape.positions as [number, number][],
                ),
                size: shape.size,
                color: shape.color,
                mapName: shape.mapName,
              },
            ],
          };
        case "rectangle":
          return {
            rectangles: [
              {
                positions: transformPositions(
                  shape.positions as [number, number][],
                ),
                size: shape.size,
                color: shape.color,
                fillColor: shape.fillColor,
                mapName: shape.mapName,
              },
            ],
          };
        case "polygon":
          return {
            polygons: [
              {
                positions: transformPositions(
                  shape.positions as [number, number][],
                ),
                size: shape.size,
                color: shape.color,
                fillColor: shape.fillColor,
                mapName: shape.mapName,
              },
            ],
          };
        case "circle":
          const center = shape.center as [number, number];
          const transformedCenter =
            rotationDegrees && rotationCenter
              ? inverseRotateCoordinate(center, rotationDegrees, rotationCenter)
              : center;
          return {
            circles: [
              {
                center: transformedCenter,
                radius: shape.radius ?? 0,
                size: shape.size,
                color: shape.color,
                fillColor: shape.fillColor,
                mapName: shape.mapName,
              },
            ],
          };
        case "text":
          const textCenter = shape.center as [number, number];
          const transformedTextCenter =
            rotationDegrees && rotationCenter
              ? inverseRotateCoordinate(
                  textCenter,
                  rotationDegrees,
                  rotationCenter,
                )
              : textCenter;
          return {
            texts: [
              {
                position: transformedTextCenter,
                text: shape.text ?? "",
                size: shape.size,
                color: shape.color,
                mapName: shape.mapName,
              },
            ],
          };
        default:
          return {};
      }
    },
    [map],
  );

  // Pre-select line mode when editing starts
  useEffect(() => {
    if (isEditing) {
      setGlobalMode("line");
    }
  }, [isEditing]);

  // Initialize drawing manager when editing starts
  useEffect(() => {
    if (!map || !isEditing) {
      // Clean up when not editing
      if (drawingManagerRef.current) {
        drawingManagerRef.current.destroy();
        drawingManagerRef.current = null;
      }
      return;
    }

    // Create drawing manager
    const dm = new DrawingManager(map, {
      defaultColor: drawingColor,
      defaultFillColor: drawingFillColor,
      defaultSize: drawingSize,
      textColor: textColor,
      textSize: textSize,
    });

    drawingManagerRef.current = dm;

    // Handle drawing creation
    dm.on("drawing:create", ({ shape }) => {
      const currentDrawing = useSettingsStore.getState().tempPrivateDrawing;
      if (!currentDrawing) return;

      // Update shape with current mapName
      shape.mapName = mapName;

      // Convert shape to drawing format and merge with existing
      const newDrawingPart = shapeToDrawing(shape);

      // Merge with existing drawings
      const updatedDrawing: Partial<Drawing> = { ...currentDrawing };

      if (newDrawingPart.polylines) {
        updatedDrawing.polylines = [
          ...(currentDrawing.polylines ?? []),
          ...newDrawingPart.polylines,
        ];
      }
      if (newDrawingPart.rectangles) {
        updatedDrawing.rectangles = [
          ...(currentDrawing.rectangles ?? []),
          ...newDrawingPart.rectangles,
        ];
      }
      if (newDrawingPart.polygons) {
        updatedDrawing.polygons = [
          ...(currentDrawing.polygons ?? []),
          ...newDrawingPart.polygons,
        ];
      }
      if (newDrawingPart.circles) {
        updatedDrawing.circles = [
          ...(currentDrawing.circles ?? []),
          ...newDrawingPart.circles,
        ];
      }
      if (newDrawingPart.texts) {
        updatedDrawing.texts = [
          ...(currentDrawing.texts ?? []),
          ...newDrawingPart.texts,
        ];
      }

      setTempPrivateDrawing(updatedDrawing);
    });

    // Handle shape removal (from remove mode)
    dm.on("drawing:remove", () => {
      const currentDrawing = useSettingsStore.getState().tempPrivateDrawing;
      if (!currentDrawing) return;

      const remainingShapes = dm.getAllShapes();
      const updatedDrawing: Partial<Drawing> = { ...currentDrawing };
      updatedDrawing.polylines = [];
      updatedDrawing.rectangles = [];
      updatedDrawing.polygons = [];
      updatedDrawing.circles = [];
      updatedDrawing.texts = [];

      for (const shape of remainingShapes) {
        shape.mapName = mapName;
        const part = shapeToDrawing(shape);
        if (part.polylines) updatedDrawing.polylines.push(...part.polylines);
        if (part.rectangles) updatedDrawing.rectangles.push(...part.rectangles);
        if (part.polygons) updatedDrawing.polygons.push(...part.polygons);
        if (part.circles) updatedDrawing.circles.push(...part.circles);
        if (part.texts) updatedDrawing.texts.push(...part.texts);
      }

      suppressReloadRef.current = true;
      setTempPrivateDrawing(updatedDrawing);
    });

    // Handle shape edit (from edit/drag mode)
    dm.on("drawing:edit", () => {
      const currentDrawing = useSettingsStore.getState().tempPrivateDrawing;
      if (!currentDrawing) return;

      // Rebuild the entire drawing from current shapes
      const remainingShapes = dm.getAllShapes();
      const updatedDrawing: Partial<Drawing> = { ...currentDrawing };
      updatedDrawing.polylines = [];
      updatedDrawing.rectangles = [];
      updatedDrawing.polygons = [];
      updatedDrawing.circles = [];
      updatedDrawing.texts = [];

      for (const shape of remainingShapes) {
        shape.mapName = mapName;
        const part = shapeToDrawing(shape);
        if (part.polylines) updatedDrawing.polylines.push(...part.polylines);
        if (part.rectangles) updatedDrawing.rectangles.push(...part.rectangles);
        if (part.polygons) updatedDrawing.polygons.push(...part.polygons);
        if (part.circles) updatedDrawing.circles.push(...part.circles);
        if (part.texts) updatedDrawing.texts.push(...part.texts);
      }

      suppressReloadRef.current = true;
      setTempPrivateDrawing(updatedDrawing);
    });

    return () => {
      dm.destroy();
      drawingManagerRef.current = null;
    };
  }, [map, isEditing, mapName, shapeToDrawing]);

  // Update drawing manager options when colors/sizes change
  useEffect(() => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setPathOptions({
        color: drawingColor,
        fillColor: drawingFillColor,
        weight: drawingSize,
      });
      drawingManagerRef.current.setTextOptions({
        color: textColor,
        size: textSize,
      });
    }
  }, [drawingColor, drawingFillColor, drawingSize, textColor, textSize]);

  // Handle mode changes
  useEffect(() => {
    if (drawingManagerRef.current && globalMode !== "none") {
      drawingManagerRef.current.enableDraw(globalMode);
    } else if (drawingManagerRef.current) {
      drawingManagerRef.current.disableDraw();
    }
  }, [globalMode]);

  // Handle Enter key to finish line/polygon
  useEffect(() => {
    if (!map) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        if (globalMode === "line") {
          drawingManagerRef.current?.finishLine();
        } else if (globalMode === "polygon") {
          drawingManagerRef.current?.finishPolygon();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [map, globalMode]);

  // Load existing drawings when editing starts or filter changes
  useEffect(() => {
    if (!drawingManagerRef.current || !isEditing || !tempPrivateDrawing) return;

    // Skip reload when the change was triggered by edit/remove events
    if (suppressReloadRef.current) {
      suppressReloadRef.current = false;
      return;
    }

    const dm = drawingManagerRef.current;

    // Clear existing shapes before loading new ones (for when filter selection changes)
    dm.clearShapes();

    const rotationDegrees = map?.rotationDegrees ?? map?._rotationDegrees;
    const rotationCenter = map?.rotationCenter ?? map?._rotationCenter;

    const transformPosition = (pos: [number, number]): [number, number] => {
      if (rotationDegrees && rotationCenter) {
        return rotateCoordinate(pos, rotationDegrees, rotationCenter);
      }
      return pos;
    };

    // Add existing polylines
    tempPrivateDrawing.polylines?.forEach((polyline, idx) => {
      if (polyline.mapName !== mapName) return;
      dm.addShape({
        id: `polyline_${idx}`,
        type: "line",
        positions: polyline.positions.map(transformPosition),
        color: polyline.color,
        size: polyline.size,
        mapName: polyline.mapName,
      });
    });

    // Add existing rectangles
    tempPrivateDrawing.rectangles?.forEach((rect, idx) => {
      if (rect.mapName !== mapName) return;
      dm.addShape({
        id: `rectangle_${idx}`,
        type: "rectangle",
        positions: rect.positions.map(transformPosition),
        color: rect.color,
        fillColor: rect.fillColor,
        size: rect.size,
        mapName: rect.mapName,
      });
    });

    // Add existing polygons
    tempPrivateDrawing.polygons?.forEach((poly, idx) => {
      if (poly.mapName !== mapName) return;
      dm.addShape({
        id: `polygon_${idx}`,
        type: "polygon",
        positions: poly.positions.map(transformPosition),
        color: poly.color,
        fillColor: poly.fillColor,
        size: poly.size,
        mapName: poly.mapName,
      });
    });

    // Add existing circles
    tempPrivateDrawing.circles?.forEach((circle, idx) => {
      if (circle.mapName !== mapName) return;
      dm.addShape({
        id: `circle_${idx}`,
        type: "circle",
        center: transformPosition(circle.center),
        radius: circle.radius,
        color: circle.color,
        fillColor: circle.fillColor,
        size: circle.size,
        mapName: circle.mapName,
      });
    });

    // Add existing texts
    tempPrivateDrawing.texts?.forEach((text, idx) => {
      if (text.mapName !== mapName) return;
      dm.addShape({
        id: `text_${idx}`,
        type: "text",
        center: transformPosition(text.position),
        text: text.text,
        color: text.color,
        size: text.size,
        mapName: text.mapName,
      });
    });
  }, [isEditing, tempPrivateDrawing, mapName, map]);

  // Render saved drawings when filters are selected (keep visible during editing)
  useEffect(() => {
    if (!map) {
      return;
    }

    const rotationDegrees = map?.rotationDegrees ?? map?._rotationDegrees;
    const rotationCenter = map?.rotationCenter ?? map?._rotationCenter;

    const transformPosition = (pos: [number, number]): [number, number] => {
      if (rotationDegrees && rotationCenter) {
        return rotateCoordinate(pos, rotationDegrees, rotationCenter);
      }
      return pos;
    };

    // Get selected drawings from myFilters + staticDrawings (exclude currently editing drawing)
    const editingName = isEditing ? tempPrivateDrawing?.name : null;
    const allDrawingFilters = [...myFilters, ...(staticDrawings || [])];
    const selectedDrawings = allDrawingFilters.filter(
      (filter) =>
        filters.includes(filter.name) &&
        filter.drawing &&
        filter.name !== editingName,
    );

    if (selectedDrawings.length === 0) {
      // No drawings to show
      if (savedDrawingsLayerRef.current) {
        map?.removeLayer?.(savedDrawingsLayerRef.current);
        savedDrawingsLayerRef.current.destroy();
        savedDrawingsLayerRef.current = null;
      }
      return;
    }

    // Create or reuse the drawing layer
    if (!savedDrawingsLayerRef.current) {
      savedDrawingsLayerRef.current = new DrawingLayer({ interactive: false });
      map.addLayer(savedDrawingsLayerRef.current, { zIndex: 40 });
    }

    const layer = savedDrawingsLayerRef.current;
    layer.clearShapes();

    // Add all selected drawings
    let shapeIdx = 0;
    for (const filter of selectedDrawings) {
      const drawing = filter.drawing;
      if (!drawing) continue;

      // Add polylines
      drawing.polylines?.forEach((polyline) => {
        // Empty mapName = legacy import (routes from before per-shape map
        // tagging existed); treat it as "show on any map" so those still render.
        if (polyline.mapName && polyline.mapName !== mapName) return;
        layer.addShape({
          id: `saved_polyline_${shapeIdx++}`,
          type: "line",
          positions: polyline.positions.map(transformPosition),
          color: polyline.color,
          size: polyline.size,
          mapName: polyline.mapName,
        });
      });

      // Add rectangles
      drawing.rectangles?.forEach((rect) => {
        if (rect.mapName && rect.mapName !== mapName) return;
        layer.addShape({
          id: `saved_rectangle_${shapeIdx++}`,
          type: "rectangle",
          positions: rect.positions.map(transformPosition),
          color: rect.color,
          fillColor: rect.fillColor,
          size: rect.size,
          mapName: rect.mapName,
        });
      });

      // Add polygons
      drawing.polygons?.forEach((poly) => {
        if (poly.mapName && poly.mapName !== mapName) return;
        layer.addShape({
          id: `saved_polygon_${shapeIdx++}`,
          type: "polygon",
          positions: poly.positions.map(transformPosition),
          color: poly.color,
          fillColor: poly.fillColor,
          size: poly.size,
          mapName: poly.mapName,
        });
      });

      // Add circles
      drawing.circles?.forEach((circle) => {
        if (circle.mapName && circle.mapName !== mapName) return;
        layer.addShape({
          id: `saved_circle_${shapeIdx++}`,
          type: "circle",
          center: transformPosition(circle.center),
          radius: circle.radius,
          color: circle.color,
          fillColor: circle.fillColor,
          size: circle.size,
          mapName: circle.mapName,
        });
      });

      // Add texts
      drawing.texts?.forEach((text) => {
        if (text.mapName && text.mapName !== mapName) return;
        layer.addShape({
          id: `saved_text_${shapeIdx++}`,
          type: "text",
          center: transformPosition(text.position),
          text: text.text,
          color: text.color,
          size: text.size,
          mapName: text.mapName,
        });
      });
    }

    return () => {
      if (savedDrawingsLayerRef.current) {
        map?.removeLayer?.(savedDrawingsLayerRef.current);
        savedDrawingsLayerRef.current.destroy();
        savedDrawingsLayerRef.current = null;
      }
    };
  }, [
    map,
    filters,
    myFilters,
    staticDrawings,
    mapName,
    isEditing,
    tempPrivateDrawing?.name,
  ]);

  // Sync dynamic size factor to drawing layers
  useEffect(() => {
    const factor = dynamicIconSize ? dynamicIconSizeFactor : 0;
    drawingManagerRef.current?.getDrawingLayer().setDynamicSizeFactor(factor);
    savedDrawingsLayerRef.current?.setDynamicSizeFactor(factor);
  }, [dynamicIconSize, dynamicIconSizeFactor]);

  if (hidden) {
    return null;
  }

  const updateGlobalMode = (mode: DrawingMode) => {
    if (globalMode === mode) {
      setGlobalMode("none");
    } else {
      setGlobalMode(mode);
    }
  };

  const isShape =
    globalMode === "line" ||
    globalMode === "rectangle" ||
    globalMode === "polygon" ||
    globalMode === "circle";
  const isText = globalMode === "text";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!tempPrivateDrawing?.name) {
      return;
    }

    const existing = myFilters.find(
      (filter) => filter.name === tempPrivateDrawing.name,
    );

    // Go through the syncing store actions (setMyFilter / addMyFilter) rather
    // than setMyFilters (plural), which is local-only. Otherwise the drawing
    // stays unsynced and hydrateFiltersFromServer overwrites it with the
    // drawing-less server copy on the next reload.
    if (existing) {
      setMyFilter(tempPrivateDrawing.name, {
        drawing: tempPrivateDrawing as Drawing,
      });
    } else {
      void addMyFilter({
        name: tempPrivateDrawing.name,
        drawing: tempPrivateDrawing as Drawing,
      });
    }
    setFilters([
      ...filters.filter((f) => f !== tempPrivateDrawing.name),
      tempPrivateDrawing.name,
    ]);
    setGlobalMode("none");
    setTempPrivateDrawing(null);
  };

  return (
    <Popover
      open={isEditing}
      onOpenChange={(open) => {
        setTempPrivateDrawing(open ? {} : null);
      }}
    >
      <Tooltip delayDuration={200} disableHoverableContent>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant={isEditing ? "secondary" : "outline"}
              aria-label="Add drawing"
            >
              <Spline className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Add Drawing</TooltipContent>
      </Tooltip>
      <PopoverContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          // Prevent closing dialog when in drawing mode - ESC should cancel current action
          if (globalMode !== "none") {
            e.preventDefault();
          }
        }}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">
                {tempPrivateDrawing?.id ? "Edit" : "Add"} Drawing
              </h4>
              <p className="text-sm text-muted-foreground">
                You can draw multiple shapes and add texts the map. The drawing
                can be toggled in the filters section by the following name.
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="filter" className="flex gap-1 items-center">
                  Filter
                  <HoverCard openDelay={50} closeDelay={50}>
                    <HoverCardTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </HoverCardTrigger>
                    <HoverCardContent>
                      You can group nodes by filters. For example, you can use a
                      filter to group all nodes related to a specific quest. The
                      filter is toggled on and off in the search. Shared nodes
                      can be imported by other users.
                    </HoverCardContent>
                  </HoverCard>
                </Label>
                <FilterSelect
                  id="filter"
                  className="col-span-2 h-8"
                  filter={tempPrivateDrawing?.name}
                  onFilterSelect={(value) => {
                    // Clear current shapes from the drawing manager immediately
                    drawingManagerRef.current?.clearShapes();

                    // Check if this filter already has a drawing
                    const existingFilter = myFilters.find(
                      (f) => f.name === value && f.drawing,
                    );
                    if (existingFilter?.drawing) {
                      // Load the existing drawing
                      setTempPrivateDrawing({
                        ...existingFilter.drawing,
                        name: value,
                      });
                    } else {
                      // Create a new drawing - clear any previous drawing data
                      setTempPrivateDrawing({
                        name: value,
                        polylines: [],
                        rectangles: [],
                        polygons: [],
                        circles: [],
                        texts: [],
                      });
                    }
                  }}
                  disabled={tempPrivateDrawing?.id !== undefined}
                />
              </div>
              <Separator className="my-2" />
              <div className="flex items-center space-x-2 flex-wrap">
                <Button
                  size="icon"
                  variant={globalMode === "line" ? "default" : "outline"}
                  type="button"
                  title="Draw Line"
                  onClick={() => updateGlobalMode("line")}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 30 30"
                    fill="currentColor"
                  >
                    <path d="M9.16509725,19.4206892 L18.4206892,10.1650973 C18.1523681,9.66992914 18,9.10275831 18,8.5 C18,6.56700338 19.5670034,5 21.5,5 C23.4329966,5 25,6.56700338 25,8.5 C25,10.4329966 23.4329966,12 21.5,12 C20.8972417,12 20.3300709,11.8476319 19.8349027,11.5793108 L10.5793108,20.8349027 C10.8476319,21.3300709 11,21.8972417 11,22.5 C11,24.4329966 9.43299662,26 7.5,26 C5.56700338,26 4,24.4329966 4,22.5 C4,20.5670034 5.56700338,19 7.5,19 C8.10275831,19 8.66992914,19.1523681 9.16509725,19.4206892 Z M21.5,10 C22.3284271,10 23,9.32842712 23,8.5 C23,7.67157288 22.3284271,7 21.5,7 C20.6715729,7 20,7.67157288 20,8.5 C20,9.32842712 20.6715729,10 21.5,10 Z M7.5,24 C8.32842712,24 9,23.3284271 9,22.5 C9,21.6715729 8.32842712,21 7.5,21 C6.67157288,21 6,21.6715729 6,22.5 C6,23.3284271 6.67157288,24 7.5,24 Z" />
                  </svg>
                </Button>
                <Button
                  size="icon"
                  variant={globalMode === "rectangle" ? "default" : "outline"}
                  type="button"
                  title="Draw Rectangle"
                  onClick={() => updateGlobalMode("rectangle")}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 30 30"
                    fill="currentColor"
                  >
                    <path d="M23,10.9645556 L23,19.0354444 C24.6961471,19.2780593 26,20.736764 26,22.5 C26,24.4329966 24.4329966,26 22.5,26 C20.736764,26 19.2780593,24.6961471 19.0354444,23 L10.9645556,23 C10.7219407,24.6961471 9.26323595,26 7.5,26 C5.56700338,26 4,24.4329966 4,22.5 C4,20.736764 5.30385293,19.2780593 7,19.0354444 L7,10.9645556 C5.30385293,10.7219407 4,9.26323595 4,7.5 C4,5.56700338 5.56700338,4 7.5,4 C9.26323595,4 10.7219407,5.30385293 10.9645556,7 L19.0354444,7 C19.2780593,5.30385293 20.736764,4 22.5,4 C24.4329966,4 26,5.56700338 26,7.5 C26,9.26323595 24.6961471,10.7219407 23,10.9645556 Z M21,10.6631844 C20.272154,10.3174225 19.6825775,9.72784598 19.3368156,9 L10.6631844,9 C10.3174225,9.72784598 9.72784598,10.3174225 9,10.6631844 L9,19.3368156 C9.72784598,19.6825775 10.3174225,20.272154 10.6631844,21 L19.3368156,21 C19.6825775,20.272154 20.272154,19.6825775 21,19.3368156 L21,10.6631844 Z M7.5,9 C8.32842712,9 9,8.32842712 9,7.5 C9,6.67157288 8.32842712,6 7.5,6 C6.67157288,6 6,6.67157288 6,7.5 C6,8.32842712 6.67157288,9 7.5,9 Z M22.5,9 C23.3284271,9 24,8.32842712 24,7.5 C24,6.67157288 23.3284271,6 22.5,6 C21.6715729,6 21,6.67157288 21,7.5 C21,8.32842712 21.6715729,9 22.5,9 Z M22.5,24 C23.3284271,24 24,23.3284271 24,22.5 C24,21.6715729 23.3284271,21 22.5,21 C21.6715729,21 21,21.6715729 21,22.5 C21,23.3284271 21.6715729,24 22.5,24 Z M7.5,24 C8.32842712,24 9,23.3284271 9,22.5 C9,21.6715729 8.32842712,21 7.5,21 C6.67157288,21 6,21.6715729 6,22.5 C6,23.3284271 6.67157288,24 7.5,24 Z" />
                  </svg>
                </Button>
                <Button
                  size="icon"
                  variant={globalMode === "polygon" ? "default" : "outline"}
                  type="button"
                  title="Draw Polygon"
                  onClick={() => updateGlobalMode("polygon")}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 30 30"
                    fill="currentColor"
                  >
                    <path d="M19.4206892,9.16509725 C19.1523681,8.66992914 19,8.10275831 19,7.5 C19,5.56700338 20.5670034,4 22.5,4 C24.4329966,4 26,5.56700338 26,7.5 C26,9.26323595 24.6961471,10.7219407 23,10.9645556 L23,19.0354444 C24.6961471,19.2780593 26,20.736764 26,22.5 C26,24.4329966 24.4329966,26 22.5,26 C20.736764,26 19.2780593,24.6961471 19.0354444,23 L10.9645556,23 C10.7219407,24.6961471 9.26323595,26 7.5,26 C5.56700338,26 4,24.4329966 4,22.5 C4,20.5670034 5.56700338,19 7.5,19 C8.10275831,19 8.66992914,19.1523681 9.16509725,19.4206892 L19.4206892,9.16509725 Z M20.8349073,10.5793063 L10.5793108,20.8349027 C10.6086731,20.8890888 10.6366469,20.9441372 10.6631844,21 L19.3368156,21 C19.6825775,20.272154 20.272154,19.6825775 21,19.3368156 L21,10.6631844 C20.9441372,10.6366469 20.8890888,10.6086731 20.8349027,10.5793108 Z M22.5,9 C23.3284271,9 24,8.32842712 24,7.5 C24,6.67157288 23.3284271,6 22.5,6 C21.6715729,6 21,6.67157288 21,7.5 C21,8.32842712 21.6715729,9 22.5,9 Z M22.5,24 C23.3284271,24 24,23.3284271 24,22.5 C24,21.6715729 23.3284271,21 22.5,21 C21.6715729,21 21,21.6715729 21,22.5 C21,23.3284271 21.6715729,24 22.5,24 Z M7.5,24 C8.32842712,24 9,23.3284271 9,22.5 C9,21.6715729 8.32842712,21 7.5,21 C6.67157288,21 6,21.6715729 6,22.5 C6,23.3284271 6.67157288,24 7.5,24 Z" />
                  </svg>
                </Button>
                <Button
                  size="icon"
                  variant={globalMode === "circle" ? "default" : "outline"}
                  type="button"
                  title="Draw Circle"
                  onClick={() => updateGlobalMode("circle")}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 30 30"
                    fill="currentColor"
                  >
                    <path d="M18.2897751,6.78602275 C18.8924131,6.29464981 19.661797,6 20.5,6 C22.4329966,6 24,7.56700338 24,9.5 C24,10.338203 23.7053502,11.1075869 23.2139772,11.7102249 C23.719599,12.8712053 24,14.1528571 24,15.5 C24,20.7467051 19.7467051,25 14.5,25 C9.25329488,25 5,20.7467051 5,15.5 C5,10.2532949 9.25329488,6 14.5,6 C15.8471429,6 17.1287947,6.28040098 18.2897751,6.78602275 Z M17.1504228,8.4817586 C16.3263581,8.17039236 15.4330777,8 14.5,8 C10.3578644,8 7,11.3578644 7,15.5 C7,19.6421356 10.3578644,23 14.5,23 C18.6421356,23 22,19.6421356 22,15.5 C22,14.5669223 21.8296076,13.6736419 21.5182414,12.8495772 C21.1960383,12.9473968 20.8541622,13 20.5,13 C18.5670034,13 17,11.4329966 17,9.5 C17,9.14583778 17.0526032,8.80396169 17.1504228,8.4817586 Z M14.5,17 C13.6715729,17 13,16.3284271 13,15.5 C13,14.6715729 13.6715729,14 14.5,14 C15.3284271,14 16,14.6715729 16,15.5 C16,16.3284271 15.3284271,17 14.5,17 Z M20.5,11 C21.3284271,11 22,10.3284271 22,9.5 C22,8.67157288 21.3284271,8 20.5,8 C19.6715729,8 19,8.67157288 19,9.5 C19,10.3284271 19.6715729,11 20.5,11 Z" />
                  </svg>
                </Button>
                <Button
                  size="icon"
                  variant={globalMode === "text" ? "default" : "outline"}
                  title="Add Text"
                  type="button"
                  onClick={() => updateGlobalMode("text")}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <polyline points="19.64 7.27 19.64 4 12 4 12 20 15.91 20 8.09 20 12 20 12 4 4.36 4 4.36 7.27" />
                  </svg>
                </Button>
              </div>
              <div className="flex items-center space-x-2 flex-wrap">
                <Button
                  size="icon"
                  variant={globalMode === "edit" ? "default" : "outline"}
                  title="Edit Mode"
                  type="button"
                  onClick={() => updateGlobalMode("edit")}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M13.5,11 C11.5670034,11 10,9.43299662 10,7.5 C10,5.56700338 11.5670034,4 13.5,4 C15.4329966,4 17,5.56700338 17,7.5 C17,9.43299662 15.4329966,11 13.5,11 Z M13.5,9 C14.3284271,9 15,8.32842712 15,7.5 C15,6.67157288 14.3284271,6 13.5,6 C12.6715729,6 12,6.67157288 12,7.5 C12,8.32842712 12.6715729,9 13.5,9 Z M12.0002889,7.52973893 C12.0125983,8.16273672 12.4170197,8.6996643 12.9807111,8.90767966 L3,15 L3,13 L12.0002889,7.52973893 Z M14.2172722,6.18228472 L19.453125,3 L22.6589355,3 L14.989102,7.68173885 C14.9962971,7.62216459 15,7.56151472 15,7.5 C15,6.93138381 14.6836098,6.4366645 14.2172722,6.18228472 Z M23.4434042,19.2851736 L20.1282799,19.2851736 L21.8729983,23.5349525 C21.9945296,23.8295773 21.8556546,24.1599209 21.5778734,24.2849208 L20.0414675,24.9545142 C19.7550613,25.0795141 19.4338738,24.9366704 19.3123426,24.6509518 L17.6544367,20.6154541 L14.9461873,23.4010151 C14.5852811,23.7721711 14,23.4860463 14,22.9992653 L14,9.57183533 C14,9.05933561 14.6225311,8.809492 14.946156,9.17008555 L23.8340292,18.3120179 C24.1925291,18.6613615 23.9279979,19.2851736 23.4434042,19.2851736 Z" />
                  </svg>
                </Button>
                <Button
                  size="icon"
                  variant={globalMode === "drag" ? "default" : "outline"}
                  title="Drag Mode"
                  type="button"
                  onClick={() => updateGlobalMode("drag")}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 30 30"
                    fill="currentColor"
                  >
                    <path d="M21,14 L21,10 L27,15 L21,20 L21,16 L16,16 L16,21 L20,21 L15,27 L10,21 L14,21 L14,16 L9,16 L9,20 L3,15 L9,10 L9,14 L14,14 L14,9 L10,9 L15,3 L20,9 L16,9 L16,14 L21,14 Z" />
                  </svg>
                </Button>
                <Button
                  size="icon"
                  variant={globalMode === "remove" ? "default" : "outline"}
                  title="Remove Layer"
                  type="button"
                  onClick={() => updateGlobalMode("remove")}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 30 30"
                    fill="currentColor"
                  >
                    <path d="M17.7874219,18.4812552 L11.6480079,13.3498184 L6.40466009,19.3816001 L10.5539156,22.9884929 L13.86934,22.9884929 L17.7874219,18.4812552 Z M16.5074252,22.9884929 L26.0000002,22.9884929 L26.0000002,24.9884929 L10.0000002,24.9884929 L9.80708313,24.9884929 L5.09254204,20.8910192 C4.25891285,20.1663564 4.17057814,18.9031112 4.89524093,18.069482 L16.0482444,5.23941916 C16.7729072,4.40578998 18.0361525,4.31745526 18.8697816,5.04211806 L24.9074583,10.2905903 C25.7410875,11.0152531 25.8294222,12.2784983 25.1047594,13.1121275 L16.5074252,22.9884929 Z" />
                  </svg>
                </Button>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="color">Color</Label>
                {isText ? (
                  <ColorPicker
                    id="color"
                    className="col-span-2 h-8"
                    value={textColor}
                    onChange={setTextColor}
                  />
                ) : isShape ? (
                  <ColorPicker
                    id="color"
                    className="col-span-2 h-8"
                    value={drawingColor}
                    onChange={setDrawingColor}
                  />
                ) : (
                  <ColorPicker
                    id="color"
                    className="col-span-2 h-8"
                    disabled
                    value=""
                    onChange={() => {}}
                  />
                )}
              </div>
              {(globalMode === "rectangle" ||
                globalMode === "polygon" ||
                globalMode === "circle") && (
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="fillColor">Background</Label>
                  <ColorPicker
                    id="fillColor"
                    className="col-span-2 h-8"
                    value={drawingFillColor}
                    onChange={setDrawingFillColor}
                  />
                </div>
              )}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="radius">Size</Label>
                {globalMode === "text" ? (
                  <Slider
                    id="radius"
                    className="col-span-2 h-8 p-0"
                    value={[textSize]}
                    onValueChange={(values) => {
                      setTextSize(values[0]);
                    }}
                    min={8}
                    max={64}
                  />
                ) : isShape ? (
                  <Slider
                    id="radius"
                    className="col-span-2 h-8 p-0"
                    value={[drawingSize]}
                    onValueChange={(values) => {
                      setDrawingSize(values[0]);
                    }}
                    min={1}
                    max={20}
                  />
                ) : (
                  <Slider
                    id="radius"
                    className="col-span-2 h-8 p-0"
                    disabled
                    value={[1]}
                    onValueChange={() => {}}
                    min={1}
                    max={10}
                  />
                )}
              </div>
              <Separator className="my-2" />
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <Button
              size="sm"
              type="submit"
              disabled={!tempPrivateDrawing?.name}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setGlobalMode("none");
                setTempPrivateDrawing(null);
              }}
              type="button"
            >
              Cancel
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
