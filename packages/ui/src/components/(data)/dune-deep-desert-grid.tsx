"use client";
import { useCallback, useEffect, useRef } from "react";
import { useSettingsStore } from "@repo/lib";
import { DrawingLayer } from "@repo/lib/web-map";
import { useT } from "../(providers)";
import { useMap } from "../(interactive-map)/store";
import type { InteractiveMap } from "../(interactive-map)/store";

const deepDesertPadding = 0;
const deepDesertGrid = [
  [-1270399 - deepDesertPadding, -1270399 - deepDesertPadding],
  [1167999 + deepDesertPadding, 1167999 + deepDesertPadding],
] as [[number, number], [number, number]];

export function DuneDeepDesertGrid() {
  const t = useT();
  const map = useMap();
  const mapName = map?.mapName;
  const lockedWindow = useSettingsStore((state) => state.lockedWindow);
  const drawingLayerRef = useRef<DrawingLayer | null>(null);
  const attachedMapRef = useRef<InteractiveMap | null>(null);

  const detachLayer = useCallback(() => {
    if (drawingLayerRef.current && attachedMapRef.current) {
      attachedMapRef.current.removeLayer(drawingLayerRef.current);
      drawingLayerRef.current = null;
      attachedMapRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!map || mapName !== "deepdesert_1") {
      detachLayer();
      return;
    }

    const currentMapName = map.mapName;

    if (!drawingLayerRef.current || attachedMapRef.current !== map) {
      detachLayer();
      const layer = new DrawingLayer({ interactive: false });
      map.addLayer(layer, { zIndex: 8 });
      drawingLayerRef.current = layer;
      attachedMapRef.current = map;
    }

    const layer = drawingLayerRef.current;
    if (!layer) {
      return;
    }

    layer.clearShapes();

    const areas = 9;
    const offset = 0;
    const zoneSize = (deepDesertGrid[1][1] - deepDesertGrid[0][1]) / areas;

    for (let i = 0; i < areas; i++) {
      for (let j = 0; j < areas; j++) {
        const minLat = deepDesertGrid[0][0] + j * zoneSize + offset;
        const minLng = deepDesertGrid[0][1] + i * zoneSize + offset;
        const maxLat = minLat + zoneSize;
        const maxLng = minLng + zoneSize;

        layer.addShape({
          id: `deepdesert-grid-${i}-${j}`,
          type: "rectangle",
          positions: [
            [minLat, minLng],
            [maxLat, maxLng],
          ],
          color: "#2c2c2e",
          size: 1,
          mapName: currentMapName,
        });

        const label =
          `${String.fromCharCode(97 + areas - 1 - j)}${i + 1}`.toUpperCase();

        layer.addShape({
          id: `deepdesert-grid-label-${i}-${j}`,
          type: "text",
          center: [minLat + zoneSize / 2 + 6, minLng + zoneSize / 2 - 6],
          text: label,
          color: "#2c2c2e",
          size: 14,
          mapName: currentMapName,
        });
      }
    }

    layer.addShape({
      id: "deepdesert-grid-highlight",
      type: "rectangle",
      positions: [
        [
          (deepDesertGrid[0][0] + deepDesertGrid[1][0]) / 2,
          deepDesertGrid[0][1],
        ],
        [deepDesertGrid[1][0], deepDesertGrid[1][1]],
      ],
      color: "#00ff00",
      size: 1,
      mapName: currentMapName,
    });

    return () => {
      layer.clearShapes();
    };
  }, [detachLayer, map, mapName]);

  useEffect(() => {
    return () => {
      detachLayer();
    };
  }, [detachLayer]);

  if (lockedWindow) {
    return <></>;
  }

  if (mapName === "deepdesert_1") {
    return (
      <div className="italic text-xs text-muted-foreground px-2.5 py-1 h-7">
        {t("dune.deepDesert.description")}
      </div>
    );
  }

  return <></>;
}
