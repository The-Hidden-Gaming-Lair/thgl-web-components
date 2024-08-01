import { useCallback, useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useMap } from "./store";
import { Info, Spline, Upload } from "lucide-react";
import { Button, ColorPicker } from "../(controls)";
import {
  cn,
  openFileOrFiles,
  putSharedFilters,
  useConnectionStore,
  useSettingsStore,
  type PrivateDrawing as PrivateDrawningDTO,
} from "@repo/lib";
import { Label } from "../ui/label";
import { trackEvent } from "../(header)";
import { useUserStore } from "../(providers)";
import { Separator } from "../ui/separator";
import { Slider } from "../ui/slider";
import {
  Circle,
  FeatureGroup,
  LatLng,
  LayerGroup,
  Marker,
  Polygon,
  Polyline,
  Rectangle,
  circle,
  marker,
  polygon,
  polyline,
  rectangle,
} from "leaflet";
import { PM } from "leaflet";
import { Util } from "leaflet";
import { FilterSelect } from "../(controls)/filter-select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";

export function PrivateDrawing({ hidden }: { hidden?: boolean }) {
  const map = useMap();
  const drawingColor = useSettingsStore((state) => state.drawingColor);
  const setDrawingColor = useSettingsStore((state) => state.setDrawingColor);
  const drawingSize = useSettingsStore((state) => state.drawingSize);
  const setDrawingSize = useSettingsStore((state) => state.setDrawingSize);
  const textColor = useSettingsStore((state) => state.textColor);
  const setTextColor = useSettingsStore((state) => state.setTextColor);
  const textSize = useSettingsStore((state) => state.textSize);
  const setTextSize = useSettingsStore((state) => state.setTextSize);
  const [globalMode, setGlobalMode] = useState("none");
  const mapName = useUserStore((state) => state.mapName);
  const myFilters = useSettingsStore((state) => state.myFilters);
  const setMyFilters = useSettingsStore((state) => state.setMyFilters);
  const tempPrivateDrawing = useSettingsStore(
    (state) => state.tempPrivateDrawing,
  );
  const setTempPrivateDrawing = useSettingsStore(
    (state) => state.setTempPrivateDrawing,
  );

  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);
  const isEditing = tempPrivateDrawing !== null;
  const setPolylines = useCallback(
    (polylineLayers: Polyline[], mapName: string) => {
      const tempPrivateDrawing = useSettingsStore.getState().tempPrivateDrawing;
      if (!tempPrivateDrawing) {
        return;
      }

      const polylines: PrivateDrawningDTO["polylines"] = [];
      polylineLayers.forEach((polylineLayer) => {
        const latLngs = polylineLayer.getLatLngs() as LatLng[];
        if (latLngs.length === 0) {
          return;
        }
        const layerPositions = latLngs.map((latLng) => {
          return [latLng.lat, latLng.lng] as [number, number];
        });
        polylines.push({
          positions: layerPositions,
          size: polylineLayer.options.weight!,
          color: polylineLayer.options.color!,
          mapName: mapName,
        });
      });
      const existingPolylines =
        tempPrivateDrawing.polylines?.filter(
          (drawing) => drawing.mapName !== mapName,
        ) ?? [];
      setTempPrivateDrawing({
        polylines: [...existingPolylines, ...polylines],
      });
    },
    [],
  );

  const setRectangles = useCallback(
    (rectangleLayers: Rectangle[], mapName: string) => {
      const tempPrivateDrawing = useSettingsStore.getState().tempPrivateDrawing;
      if (!tempPrivateDrawing) {
        return;
      }

      const rectangles: PrivateDrawningDTO["rectangles"] = [];
      rectangleLayers.forEach((rectangleLayer) => {
        const latLngs = rectangleLayer.getLatLngs() as LatLng[][];
        if (latLngs.length === 0) {
          return;
        }
        const layerPositions = latLngs[0].map((latLng) => {
          return [latLng.lat, latLng.lng] as [number, number];
        });
        rectangles.push({
          positions: layerPositions,
          size: rectangleLayer.options.weight!,
          color: rectangleLayer.options.color!,
          mapName: mapName,
        });
      });
      const existingRectangles =
        tempPrivateDrawing.rectangles?.filter(
          (drawing) => drawing.mapName !== mapName,
        ) ?? [];
      setTempPrivateDrawing({
        rectangles: [...existingRectangles, ...rectangles],
      });
    },
    [],
  );

  const setPolygons = useCallback(
    (polygonLayers: Polygon[], mapName: string) => {
      const tempPrivateDrawing = useSettingsStore.getState().tempPrivateDrawing;
      if (!tempPrivateDrawing) {
        return;
      }

      const polygons: PrivateDrawningDTO["polygons"] = [];
      polygonLayers.forEach((polygonLayer) => {
        const latLngs = polygonLayer.getLatLngs() as LatLng[];
        if (latLngs.length === 0) {
          return;
        }
        const layerPositions = latLngs.map((latLng) => {
          return [latLng.lat, latLng.lng] as [number, number];
        });
        polygons.push({
          positions: layerPositions,
          size: polygonLayer.options.weight!,
          color: polygonLayer.options.color!,
          mapName: mapName,
        });
      });
      const existingPolygons =
        tempPrivateDrawing.polygons?.filter(
          (drawing) => drawing.mapName !== mapName,
        ) ?? [];
      setTempPrivateDrawing({
        polygons: [...existingPolygons, ...polygons],
      });
    },
    [],
  );

  const setCircles = useCallback((circleLayers: Circle[], mapName: string) => {
    const tempPrivateDrawing = useSettingsStore.getState().tempPrivateDrawing;
    if (!tempPrivateDrawing) {
      return;
    }

    const circles: PrivateDrawningDTO["circles"] = [];
    circleLayers.forEach((circleLayer) => {
      const center = circleLayer.getLatLng();
      const radius = circleLayer.getRadius();

      circles.push({
        center: [center.lat, center.lng] as [number, number],
        radius: radius,
        size: circleLayer.options.weight!,
        color: circleLayer.options.color!,
        mapName: mapName,
      });
    });
    const existingCircles =
      tempPrivateDrawing.circles?.filter(
        (drawing) => drawing.mapName !== mapName,
      ) ?? [];
    setTempPrivateDrawing({
      circles: [...existingCircles, ...circles],
    });
  }, []);

  const setTexts = useCallback((textLayers: Marker[], mapName: string) => {
    const tempPrivateDrawing = useSettingsStore.getState().tempPrivateDrawing;
    if (!tempPrivateDrawing) {
      return;
    }

    const texts: PrivateDrawningDTO["texts"] = [];
    textLayers.forEach((textLayer) => {
      const latLngs = textLayer.getLatLng();
      texts.push({
        position: [latLngs.lat, latLngs.lng] as [number, number],
        text: textLayer.pm.getText(),
        color: textLayer.pm.getElement().style.color,
        size: parseInt(textLayer.pm.getElement().style.fontSize),
        mapName: mapName,
      });
    });
    const existingTexts =
      tempPrivateDrawing.texts?.filter(
        (drawing) => drawing.mapName !== mapName,
      ) ?? [];
    setTempPrivateDrawing({
      texts: [...existingTexts, ...texts],
    });
  }, []);

  useEffect(() => {
    if (!map) {
      return;
    }
    const activeShape = map.pm.Draw.getActiveShape();
    map.pm.setPathOptions({
      color: drawingColor,
      weight: drawingSize,
    });
    map.pm.setGlobalOptions({
      templineStyle: {
        radius: drawingSize,
        color: drawingColor,
        weight: drawingSize,
      },
      hintlineStyle: {
        color: drawingColor,
        weight: drawingSize,
        dashArray: [5, 5],
      },
    });
    setGlobalMode(activeShape);
  }, [map, drawingColor, drawingSize]);

  const sharedTempPrivateDrawing = useConnectionStore(
    (state) => state.tempPrivateDrawing,
  );
  const sharedMyFilters = useConnectionStore((state) => state.myFilters);
  useEffect(() => {
    if (!map) {
      return;
    }
    const layerGroup = new LayerGroup();
    try {
      layerGroup.addTo(map);
    } catch (e) {}
    const sharedPrivateDrawings = sharedMyFilters
      .map((myFilter) => myFilter.drawing)
      .filter(Boolean) as PrivateDrawningDTO[];
    const drawings = sharedTempPrivateDrawing
      ? [sharedTempPrivateDrawing, ...sharedPrivateDrawings]
      : sharedPrivateDrawings;
    drawings.forEach((drawing) => {
      const { polylines, rectangles, polygons, circles, texts } = drawing;
      polylines?.forEach((polylineData) => {
        if (polylineData.mapName !== mapName) {
          return;
        }
        const polylineLayer = polyline(polylineData.positions, {
          pmIgnore: false,
          stroke: true,
          color: polylineData.color,
          weight: polylineData.size,
        });

        try {
          polylineLayer.addTo(layerGroup);
        } catch (e) {}
      });
      rectangles?.forEach((rectangleData) => {
        if (rectangleData.mapName !== mapName) {
          return;
        }
        const rectangleLayer = rectangle(rectangleData.positions, {
          pmIgnore: false,
          stroke: true,
          color: rectangleData.color,
          weight: rectangleData.size,
        });

        try {
          rectangleLayer.addTo(layerGroup);
        } catch (e) {}
      });
      polygons?.forEach((polygonData) => {
        if (polygonData.mapName !== mapName) {
          return;
        }
        const polygonLayer = polygon(polygonData.positions, {
          pmIgnore: false,
          stroke: true,
          color: polygonData.color,
          weight: polygonData.size,
        });

        try {
          polygonLayer.addTo(layerGroup);
        } catch (e) {}
      });
      circles?.forEach((circleData) => {
        if (circleData.mapName !== mapName) {
          return;
        }
        const circleLayer = circle(circleData.center, {
          pmIgnore: false,
          stroke: true,
          color: circleData.color,
          weight: circleData.size,
          radius: circleData.radius,
        });

        try {
          circleLayer.addTo(layerGroup);
        } catch (e) {}
      });
      texts?.forEach((textPositions) => {
        if (textPositions.mapName !== mapName) {
          return;
        }
        const textLayer = marker(textPositions.position, {
          pmIgnore: false,
          interactive: false,
          textMarker: true,
          text: textPositions.text,
        });
        try {
          textLayer.addTo(layerGroup);
        } catch (e) {}
        const element = textLayer.pm.getElement() as HTMLTextAreaElement;
        element.classList.add("protected-text");
        element.style.setProperty("color", textPositions.color, "important");
        element.style.fontSize = `${textPositions.size}px`;
        element.style.width = `100vw`;
        element.style.height = `fit-content`;
        element.autocomplete = "off";
        element.autocapitalize = "off";
        element.spellcheck = false;
      });
    });
    return () => {
      try {
        layerGroup.remove();
      } catch (e) {}
    };
  }, [map, mapName, sharedTempPrivateDrawing, sharedMyFilters]);

  useEffect(() => {
    if (!isEditing || !map) {
      return;
    }

    const polylines: Polyline[] = [];
    const rectangles: Rectangle[] = [];
    const polygons: Polygon[] = [];
    const circles: Circle[] = [];
    const texts: Marker[] = [];
    tempPrivateDrawing.polylines?.forEach((polylineData) => {
      if (polylineData.mapName !== mapName) {
        return;
      }
      if (polylineData.positions.length < 2) {
        return;
      }
      const polylineLayer = polyline(polylineData.positions, {
        pmIgnore: false,
        stroke: true,
        color: polylineData.color,
        weight: polylineData.size,
      });
      polylineLayer.on("pm:edit", () => {
        setPolylines(polylines, mapName);
        updateGlobalMode();
      });
      polylineLayer.on("pm:remove", () => {
        polylines.splice(polylines.indexOf(polylineLayer), 1);
        setPolylines(polylines, mapName);
        updateGlobalMode();
      });

      polylines.push(polylineLayer);
      try {
        polylineLayer.addTo(map);
      } catch (e) {}
      setPolylines(polylines, mapName);
    });
    tempPrivateDrawing.rectangles?.forEach((rectangleData) => {
      if (rectangleData.mapName !== mapName) {
        return;
      }
      if (rectangleData.positions.length < 2) {
        return;
      }
      const rectangleLayer = rectangle(rectangleData.positions, {
        pmIgnore: false,
        stroke: true,
        color: rectangleData.color,
        weight: rectangleData.size,
      });
      rectangleLayer.on("pm:edit", () => {
        setRectangles(rectangles, mapName);
        updateGlobalMode();
      });
      rectangleLayer.on("pm:remove", () => {
        rectangles.splice(rectangles.indexOf(rectangleLayer), 1);
        setRectangles(rectangles, mapName);
        updateGlobalMode();
      });

      rectangles.push(rectangleLayer);
      try {
        rectangleLayer.addTo(map);
      } catch (e) {}
      setRectangles(rectangles, mapName);
    });
    tempPrivateDrawing.circles?.forEach((circleData) => {
      if (circleData.mapName !== mapName) {
        return;
      }
      const circleLayer = circle(circleData.center, {
        pmIgnore: false,
        stroke: true,
        color: circleData.color,
        weight: circleData.size,
        radius: circleData.radius,
      });
      circleLayer.on("pm:edit", () => {
        setCircles(circles, mapName);
        updateGlobalMode();
      });
      circleLayer.on("pm:remove", () => {
        circles.splice(circles.indexOf(circleLayer), 1);
        setCircles(circles, mapName);
        updateGlobalMode();
      });

      circles.push(circleLayer);
      try {
        circleLayer.addTo(map);
      } catch (e) {}
      setCircles(circles, mapName);
    });
    tempPrivateDrawing.polygons?.forEach((polygonData) => {
      if (polygonData.mapName !== mapName) {
        return;
      }
      if (polygonData.positions.length < 2) {
        return;
      }
      const polygonLayer = polygon(polygonData.positions, {
        pmIgnore: false,
        stroke: true,
        color: polygonData.color,
        weight: polygonData.size,
      });
      polygonLayer.on("pm:edit", () => {
        setPolygons(polygons, mapName);
        updateGlobalMode();
      });
      polygonLayer.on("pm:remove", () => {
        polygons.splice(polygons.indexOf(polygonLayer), 1);
        setPolygons(polygons, mapName);
        updateGlobalMode();
      });

      polygons.push(polygonLayer);
      try {
        polygonLayer.addTo(map);
      } catch (e) {}
      setPolygons(polygons, mapName);
    });
    tempPrivateDrawing.texts?.forEach((textPositions) => {
      if (textPositions.mapName !== mapName) {
        return;
      }

      const textLayer = marker(textPositions.position, {
        textMarker: true,
        text: textPositions.text,
        pmIgnore: false,
      });
      const element = textLayer.pm.getElement() as HTMLTextAreaElement;
      element.style.setProperty("color", textPositions.color, "important");
      element.style.fontSize = `${textPositions.size}px`;
      element.autocomplete = "off";
      element.autocapitalize = "off";
      element.spellcheck = false;

      textLayer.on("pm:edit", () => {
        setTexts(texts, mapName);
        updateGlobalMode();
      });
      textLayer.on("pm:remove", () => {
        texts.splice(texts.indexOf(textLayer), 1);
        setTexts(texts, mapName);
        updateGlobalMode();
      });

      texts.push(textLayer);
      try {
        textLayer.addTo(map);
      } catch (e) {}
      setTexts(texts, mapName);
    });
    map.on("pm:drawstart", ({ workingLayer, shape }) => {
      if (shape === "Line") {
        workingLayer.on("pm:vertexadded", () => {
          setPolylines(polylines, mapName);
        });
        workingLayer.on("pm:vertexremoved", () => {
          setPolylines(polylines, mapName);
        });
        workingLayer.on("pm:markerdragend", () => {
          setPolylines(polylines, mapName);
        });
        workingLayer.on("pm:edit", () => {
          setPolylines(polylines, mapName);
        });
      } else if (shape === "Rectangle") {
        workingLayer.on("pm:vertexadded", () => {
          setRectangles(rectangles, mapName);
        });
        workingLayer.on("pm:vertexremoved", () => {
          setRectangles(rectangles, mapName);
        });
        workingLayer.on("pm:markerdragend", () => {
          setRectangles(rectangles, mapName);
        });
        workingLayer.on("pm:edit", () => {
          setRectangles(rectangles, mapName);
        });
      } else if (shape === "Polygon") {
        workingLayer.on("pm:vertexadded", () => {
          setPolygons(polygons, mapName);
        });
        workingLayer.on("pm:vertexremoved", () => {
          setPolygons(polygons, mapName);
        });
        workingLayer.on("pm:markerdragend", () => {
          setPolygons(polygons, mapName);
        });
        workingLayer.on("pm:edit", () => {
          setPolygons(polygons, mapName);
        });
      } else if (shape === "Circle") {
        workingLayer.on("pm:centerplaced", () => {
          setCircles(circles, mapName);
        });
        workingLayer.on("pm:markerdragend", () => {
          setCircles(circles, mapName);
        });
        workingLayer.on("pm:edit", () => {
          setCircles(circles, mapName);
        });
      }
    });

    map.on("pm:drawend", () => {
      setPolylines(polylines, mapName);
      setRectangles(rectangles, mapName);
      setCircles(circles, mapName);
      updateGlobalMode();
    });

    map.on("pm:create", ({ shape, layer }) => {
      layer.options.pmIgnore = false;
      PM.reInitLayer(layer);

      if (shape === "Line") {
        const polylineLayer = layer as Polyline;
        polylines.push(polylineLayer);
        polylineLayer.on("pm:edit", (e) => {
          setPolylines(polylines, mapName);
        });
        polylineLayer.on("pm:remove", () => {
          polylines.splice(polylines.indexOf(polylineLayer), 1);
          setPolylines(polylines, mapName);
          updateGlobalMode();
        });
      } else if (shape === "Rectangle") {
        const rectangle = layer as Rectangle;
        rectangles.push(rectangle);
        rectangle.on("pm:edit", () => {
          setRectangles(rectangles, mapName);
        });
        rectangle.on("pm:remove", () => {
          rectangles.splice(rectangles.indexOf(rectangle), 1);
          setRectangles(rectangles, mapName);
          updateGlobalMode();
        });
      } else if (shape === "Polygon") {
        const polygon = layer as Polygon;
        polygons.push(polygon);
        polygon.on("pm:edit", () => {
          setPolygons(polygons, mapName);
        });
        polygon.on("pm:remove", () => {
          polygons.splice(polygons.indexOf(polygon), 1);
          setPolygons(polygons, mapName);
          updateGlobalMode();
        });
      } else if (shape === "Circle") {
        const circle = layer as Circle;
        circles.push(circle);
        circle.on("pm:edit", () => {
          setCircles(circles, mapName);
        });
        circle.on("pm:remove", () => {
          circles.splice(circles.indexOf(circle), 1);
          setCircles(circles, mapName);
          updateGlobalMode();
        });
      } else if (shape === "Text") {
        const textLayer = layer as Marker;
        texts.push(textLayer);
        Util.setOptions(layer, {
          draggable: true,
        });

        textLayer.pm.enable({});
        const element = textLayer.pm.getElement() as HTMLTextAreaElement;
        const { textColor, textSize } = useSettingsStore.getState();

        element.focus();
        element.style.setProperty("color", textColor, "important");
        element.style.fontSize = `${textSize}px`;
        element.autocomplete = "off";
        element.autocapitalize = "off";
        element.spellcheck = false;

        layer.on("pm:edit", () => {
          updateGlobalMode();
          setTexts(texts, mapName);
        });
        layer.on("pm:remove", () => {
          texts.splice(texts.indexOf(textLayer), 1);
          setTexts(texts, mapName);
          updateGlobalMode();
        });
      }
    });

    map.pm.enableDraw("Line");
    updateGlobalMode();

    return () => {
      try {
        map.pm.disableDraw();
        map.pm.disableGlobalEditMode();
        map.off("pm:drawstart");
        map.off("pm:create");
        map.pm.getGeomanLayers().forEach((layer) => {
          if (layer instanceof Marker) {
            const element = layer.getElement();
            if (element?.children[0]?.classList.contains("protected-text")) {
              return;
            }
          }
          layer.remove();
        });
      } catch (e) {}
    };
  }, [isEditing, map, tempPrivateDrawing?.id]);

  const updateGlobalMode = useCallback(() => {
    if (!map) {
      return;
    }
    if (map.pm.globalRemovalModeEnabled()) {
      setGlobalMode("Removal");
    } else if (map.pm.globalEditModeEnabled()) {
      setGlobalMode("Edit");
    } else if (map.pm.globalDragModeEnabled()) {
      setGlobalMode("Drag");
    } else {
      const activeShape = map.pm.Draw.getActiveShape();
      setGlobalMode(activeShape);
    }
  }, [map]);

  useEffect(() => {
    if (!map) {
      return;
    }
    const featureGroup = new FeatureGroup();
    try {
      featureGroup.addTo(map);
    } catch (e) {}

    myFilters.forEach((myFilter) => {
      if (
        !myFilter.drawing ||
        !filters.includes(myFilter.name) ||
        tempPrivateDrawing?.id === myFilter.drawing.id
      ) {
        return;
      }
      myFilter.drawing.polylines?.forEach((polylineData) => {
        if (polylineData.mapName !== mapName) {
          return;
        }

        if (polylineData.positions.length < 2) {
          return;
        }
        const polylineLayer = polyline(polylineData.positions, {
          stroke: true,
          color: polylineData.color,
          weight: polylineData.size,
          pane: "shadowPane",
        });

        polylineLayer.addTo(featureGroup);
      });
      myFilter.drawing.rectangles?.forEach((rectangleData) => {
        if (rectangleData.mapName !== mapName) {
          return;
        }

        if (rectangleData.positions.length < 2) {
          return;
        }
        const rectangleLayer = rectangle(rectangleData.positions, {
          stroke: true,
          color: rectangleData.color,
          weight: rectangleData.size,
          pane: "shadowPane",
        });

        rectangleLayer.addTo(featureGroup);
      });
      myFilter.drawing.polygons?.forEach((polygonData) => {
        if (polygonData.mapName !== mapName) {
          return;
        }

        if (polygonData.positions.length < 2) {
          return;
        }
        const polygonLayer = polygon(polygonData.positions, {
          stroke: true,
          color: polygonData.color,
          weight: polygonData.size,
          pane: "shadowPane",
        });

        polygonLayer.addTo(featureGroup);
      });
      myFilter.drawing.circles?.forEach((circleData) => {
        if (circleData.mapName !== mapName) {
          return;
        }

        const circleLayer = circle(circleData.center, {
          stroke: true,
          color: circleData.color,
          weight: circleData.size,
          radius: circleData.radius,
          pane: "shadowPane",
        });

        circleLayer.addTo(featureGroup);
      });
      myFilter.drawing.texts?.forEach((textPositions) => {
        if (textPositions.mapName !== mapName) {
          return;
        }
        const textLayer = marker(textPositions.position, {
          pmIgnore: false,
          interactive: false,
          textMarker: true,
          text: textPositions.text,
          pane: "shadowPane",
        });
        textLayer.addTo(featureGroup);
        const element = textLayer.pm.getElement() as HTMLTextAreaElement;
        element.classList.add("protected-text");
        element.style.setProperty("color", textPositions.color, "important");
        element.style.fontSize = `${textPositions.size}px`;
        element.style.width = `100vw`;
        element.style.height = `fit-content`;
        element.autocomplete = "off";
        element.autocapitalize = "off";
        element.spellcheck = false;
      });
    });
    return () => {
      try {
        featureGroup.remove();
      } catch (e) {}
    };
  }, [map, myFilters, filters, tempPrivateDrawing?.id]);

  if (hidden) {
    return <></>;
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!tempPrivateDrawing?.name) {
      return;
    }
    const newId = `drawing_${tempPrivateDrawing.name}_${Date.now()}`;
    const id = tempPrivateDrawing.id ?? newId;

    const drawing: PrivateDrawningDTO = {
      id,
      name: tempPrivateDrawing.name,
      polylines: tempPrivateDrawing.polylines,
      rectangles: tempPrivateDrawing.rectangles,
      polygons: tempPrivateDrawing.polygons,
      circles: tempPrivateDrawing.circles,
      texts: tempPrivateDrawing.texts,
    };

    const newMyFilters = [...myFilters];
    const myFilter = newMyFilters.find(
      (filter) => filter.name === tempPrivateDrawing.name,
    );
    if (!myFilter) {
      return;
    }

    if (tempPrivateDrawing.id) {
      myFilter.drawing = drawing;
      trackEvent("Private Drawing: Update", {
        props: { name: tempPrivateDrawing.name },
      });
      setFilters([...filters.filter((f) => f !== id), tempPrivateDrawing.id]);
    } else {
      myFilter.drawing = {
        ...drawing,
        polylines: [
          ...(drawing.polylines || []),
          ...(myFilter.drawing?.polylines || []),
        ],
        rectangles: [
          ...(drawing.rectangles || []),
          ...(myFilter.drawing?.rectangles || []),
        ],
        polygons: [
          ...(drawing.polygons || []),
          ...(myFilter.drawing?.polygons || []),
        ],
        circles: [
          ...(drawing.circles || []),
          ...(myFilter.drawing?.circles || []),
        ],
        texts: [...(drawing.texts || []), ...(myFilter.drawing?.texts || [])],
      };

      trackEvent("Private Drawing: Add", {
        props: { name: tempPrivateDrawing.name },
      });
      setFilters([...filters, id]);
    }

    if (myFilter.isShared && myFilter.url) {
      putSharedFilters(myFilter.url, myFilter);
    }
    setMyFilters(newMyFilters);
    setFilters([...filters.filter((f) => f !== drawing.name), drawing.name]);
    setTempPrivateDrawing(null);
  };

  const isText = globalMode === "Text";
  const isShape = ["Line", "Rectangle", "Polygon", "Circle"].includes(
    globalMode,
  );
  return (
    <Popover
      open={isEditing}
      onOpenChange={(open) => {
        setTempPrivateDrawing(open ? {} : null);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant={isEditing ? "secondary" : "outline"}
          className={cn("md:w-auto md:h-9 md:px-4 md:py-2")}
        >
          <Spline className="md:mr-2 h-4 w-4" />
          <span className="hidden md:inline">Add Drawing</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent onInteractOutside={(e) => e.preventDefault()}>
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
                    setTempPrivateDrawing({
                      name: value,
                    });
                  }}
                  disabled={tempPrivateDrawing?.id !== undefined}
                />
              </div>
              <Separator className="my-2" />
              <div className="flex items-center space-x-2 flex-wrap">
                <Button
                  size="icon"
                  variant={globalMode === "Line" ? "default" : "outline"}
                  type="button"
                  title="Draw Line"
                  onClick={() => {
                    map?.pm.enableDraw("Line");
                    updateGlobalMode();
                  }}
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
                  variant={globalMode === "Rectangle" ? "default" : "outline"}
                  type="button"
                  title="Draw Rectangle"
                  onClick={() => {
                    map?.pm.enableDraw("Rectangle");
                    updateGlobalMode();
                  }}
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
                  variant={globalMode === "Polygon" ? "default" : "outline"}
                  type="button"
                  title="Draw Polygon"
                  onClick={() => {
                    map?.pm.enableDraw("Polygon");
                    updateGlobalMode();
                  }}
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
                  variant={globalMode === "Circle" ? "default" : "outline"}
                  type="button"
                  title="Draw Circle"
                  onClick={() => {
                    map?.pm.enableDraw("Circle");
                    updateGlobalMode();
                  }}
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
                  variant={isText ? "default" : "outline"}
                  title="Add Text"
                  type="button"
                  onClick={() => {
                    map?.pm.enableDraw("Text");
                    updateGlobalMode();
                  }}
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
                  variant={globalMode === "Edit" ? "default" : "outline"}
                  title="Edit Mode"
                  type="button"
                  onClick={() => {
                    map?.pm.toggleGlobalEditMode();
                    updateGlobalMode();
                  }}
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
                  variant={globalMode === "Drag" ? "default" : "outline"}
                  title="Drag Text"
                  type="button"
                  onClick={() => {
                    map?.pm.toggleGlobalDragMode();
                    updateGlobalMode();
                  }}
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
                  variant={globalMode === "Removal" ? "default" : "outline"}
                  title="Remove Layer"
                  type="button"
                  onClick={() => {
                    map?.pm.toggleGlobalRemovalMode();
                    updateGlobalMode();
                  }}
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
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="radius">Size</Label>
                {globalMode === "Text" ? (
                  <Slider
                    id="radius"
                    className="col-span-2 h-8 p-0"
                    value={[textSize]}
                    onValueChange={(values) => {
                      setTextSize(values[0]);
                    }}
                    min={1}
                    max={50}
                  />
                ) : isShape ? (
                  <Slider
                    id="radius"
                    className="col-span-2 h-8 p-0"
                    value={[drawingSize]}
                    onValueChange={(values) => {
                      setDrawingSize(values[0]);
                    }}
                    step={0.5}
                    min={0.5}
                    max={20}
                  />
                ) : (
                  <Slider id="radius" className="col-span-2 h-8 p-0" disabled />
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
              onClick={() => setTempPrivateDrawing(null)}
              type="button"
            >
              Cancel
            </Button>
            <div className="flex-1" />
            <Button
              size="sm"
              type="button"
              variant="secondary"
              onClick={async () => {
                const file = await openFileOrFiles();
                if (!file) {
                  return;
                }
                const reader = new FileReader();
                reader.addEventListener("load", (loadEvent) => {
                  const text = loadEvent.target?.result;
                  if (!text || typeof text !== "string") {
                    return;
                  }
                  try {
                    const data = JSON.parse(text);
                    if (typeof data !== "object") {
                      return;
                    }
                    if ("positions" in data && Array.isArray(data.positions)) {
                      // Convert deprecate routes to polylines
                      data.polylines = data.positions.map((b: any) => ({
                        positions: b.map((c: any) => c.position),
                        size: 4,
                        color: "#FFFFFFAA",
                        mapName: mapName,
                      }));
                      delete data.positions;
                    }
                    if ("types" in data) {
                      delete data.types;
                    }
                    setTempPrivateDrawing(data);
                  } catch (error) {
                    // Do nothing
                  }
                });
                reader.readAsText(file);
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Drawing
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
