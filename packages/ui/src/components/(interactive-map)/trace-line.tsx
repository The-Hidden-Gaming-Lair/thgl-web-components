"use client";

import { useEffect, useRef } from "react";
import { useMap } from "./store";
import { rotateCoordinate } from "./rotation";
import { useSettingsStore, useGameState } from "@repo/lib";
import { playerAnchor } from "@repo/lib";
import type { ActorPlayer } from "@repo/lib/overwolf";
import { DrawingLayer, IconMarkerLayer } from "@repo/lib/web-map";

/** Create a solid-color circle canvas (no border) for trace dots */
function createDotCanvas(color: string): HTMLCanvasElement {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  return canvas;
}

export function TraceLine() {
  const map = useMap();
  const showTraceLine = useSettingsStore((state) => state.showTraceLine);
  const traceLineLength = useSettingsStore((state) => state.traceLineLength);
  const traceLineRate = useSettingsStore((state) => state.traceLineRate);
  const traceLineColor = useSettingsStore((state) => state.traceLineColor);
  const traceLineStyle = useSettingsStore((state) => state.traceLineStyle);

  // DrawingLayer for line mode
  const lineLayerRef = useRef<DrawingLayer | null>(null);
  // IconMarkerLayer for dots mode
  const dotLayerRef = useRef<IconMarkerLayer | null>(null);
  const positionsRef = useRef<[number, number][]>([]);
  const updateCountRef = useRef(0);
  const lastPlayerPosRef = useRef<string>("");

  // Reset positions and clear when toggled off or map changes
  useEffect(() => {
    positionsRef.current = [];
    if (lineLayerRef.current) {
      lineLayerRef.current.clearShapes();
    }
    if (dotLayerRef.current) {
      dotLayerRef.current.clear();
    }
  }, [map?.mapName, showTraceLine]);

  // Main effect: subscribe to the player IMPERATIVELY and render the trace on
  // each update. Using a store subscription (not a render-hook) means this
  // component never re-renders on the ~16Hz player stream — only when the trace
  // settings or map change. Behaviour is otherwise identical to before.
  useEffect(() => {
    if (!map || !showTraceLine) return;

    const record = (player: ActorPlayer | null) => {
      if (!player) return;

      const isOnMap = !player.mapName || player.mapName === map.mapName;
      if (!isOnMap) return;
      // Party games report the camera as the player: the trace records where the party
      // (its leader) has been, not where the player looked.
      if (player.camera && !player.party?.length) return;
      const anchor = playerAnchor(player);

      // Only count actual player position changes for rate limiting
      const posKey = `${anchor.x},${anchor.y}`;
      if (posKey === lastPlayerPosRef.current) return;
      lastPlayerPosRef.current = posKey;

      updateCountRef.current += 1;
      if (updateCountRef.current < traceLineRate) return;
      updateCountRef.current = 0;

      // Apply rotation to player position if configured
      let playerPosition: [number, number] = [anchor.x, anchor.y];
      const rotationDegrees = map._rotationDegrees;
      const rotationCenter = map._rotationCenter;
      if (rotationDegrees && rotationCenter) {
        playerPosition = rotateCoordinate(
          [anchor.x, anchor.y],
          rotationDegrees,
          rotationCenter,
        );
      }

      // Add new position
      const positions = positionsRef.current;
      positions.push(playerPosition);

      // Cap at max length
      while (positions.length > traceLineLength) {
        positions.shift();
      }

      if (traceLineStyle === "line") {
        // Line mode: use DrawingLayer
        if (!lineLayerRef.current) {
          lineLayerRef.current = new DrawingLayer({ interactive: false });
          map.addLayer(lineLayerRef.current, { zIndex: 30 });
        }
        // Remove dot layer if switching
        if (dotLayerRef.current) {
          dotLayerRef.current.clear();
          map.removeLayer(dotLayerRef.current);
          dotLayerRef.current = null;
        }

        lineLayerRef.current.clearShapes();
        if (positions.length >= 2) {
          lineLayerRef.current.addShape({
            id: "trace-line",
            type: "line",
            positions: [...positions],
            color: traceLineColor,
            size: 3,
            mapName: map.mapName,
          });
        }
      } else {
        // Dots mode: use IconMarkerLayer with circle sheet
        if (!dotLayerRef.current) {
          dotLayerRef.current = new IconMarkerLayer();
          map.addLayer(dotLayerRef.current, { zIndex: 30 });
        }
        // Remove line layer if switching
        if (lineLayerRef.current) {
          lineLayerRef.current.clearShapes();
          map.removeLayer(lineLayerRef.current);
          lineLayerRef.current = null;
        }

        dotLayerRef.current.clear();
        const dotCanvas = createDotCanvas(traceLineColor);
        dotLayerRef.current.setSheet("__trace_dot__", dotCanvas);
        for (let i = 0; i < positions.length; i++) {
          dotLayerRef.current.add({
            id: `trace-dot-${i}`,
            latLng: positions[i],
            size: 6,
            sheet: "__trace_dot__",
            rect: { x: 0, y: 0, width: 32, height: 32 },
          });
        }
      }
    };

    record(useGameState.getState().player);
    const unsub = useGameState.subscribe((s) => s.player, record);
    return () => unsub();
  }, [
    map,
    showTraceLine,
    traceLineLength,
    traceLineRate,
    traceLineColor,
    traceLineStyle,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (lineLayerRef.current && map) {
        lineLayerRef.current.clearShapes();
        map.removeLayer(lineLayerRef.current);
        lineLayerRef.current = null;
      }
      if (dotLayerRef.current && map) {
        dotLayerRef.current.clear();
        map.removeLayer(dotLayerRef.current);
        dotLayerRef.current = null;
      }
    };
  }, [map]);

  return null;
}
