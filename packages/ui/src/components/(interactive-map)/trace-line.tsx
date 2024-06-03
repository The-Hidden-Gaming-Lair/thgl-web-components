"use client";
import leaflet from "leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "./store";
import { useGameState, useSettingsStore } from "@repo/lib";

export function TraceLine() {
  const map = useMap();
  const player = useGameState((state) => state.player);
  const lastPosition = useRef<{ x: number; y: number }>({
    x: Number.MAX_VALUE,
    y: Number.MAX_VALUE,
  });
  const traceDots = useRef<leaflet.Circle[]>();
  const layerGroup = useRef<leaflet.LayerGroup>();
  if (!traceDots.current) {
    traceDots.current = [];
  }
  if (!layerGroup.current) {
    layerGroup.current = new leaflet.LayerGroup([], {
      pane: "shadowPane",
    });
  }

  const showTraceLine = useSettingsStore((state) => state.showTraceLine);
  const traceLineLength = useSettingsStore((state) => state.traceLineLength);
  const traceLineRate = useSettingsStore((state) => state.traceLineRate);
  const traceLineColor = useSettingsStore((state) => state.traceLineColor);

  useEffect(() => {
    if (!showTraceLine || !map) {
      return;
    }
    const targetLayerGroup = layerGroup.current!;
    try {
      targetLayerGroup.addTo(map);
    } catch (e) {}
    return () => {
      try {
        targetLayerGroup.removeFrom(map);
      } catch (e) {}
    };
  }, [showTraceLine, map]);

  const traceLineRateRef = useRef(0);
  useEffect(() => {
    if (!player) {
      return;
    }
    traceLineRateRef.current++;
    if (traceLineRateRef.current < traceLineRate) {
      return;
    }
    traceLineRateRef.current = 0;

    const targetLayerGroup = layerGroup.current!;

    const traceDotsGroup = traceDots.current!;
    lastPosition.current = {
      x: player.x,
      y: player.y,
    };
    const circle = leaflet.circle(
      [lastPosition.current.x, lastPosition.current.y] as [number, number],
      {
        radius: 0,
        interactive: false,
        color: traceLineColor,
      }
    );
    traceDotsGroup.push(circle);
    circle.addTo(targetLayerGroup);

    const layers = targetLayerGroup.getLayers();
    if (layers.length > traceLineLength) {
      layers[layers.length - 1 - traceLineLength]?.remove();
    }
  }, [player?.x, player?.y]);

  useEffect(() => {
    if (!map) {
      return;
    }
    const traceDotsGroup = traceDots.current!;
    const targetLayerGroup = layerGroup.current!;

    for (let i = 0; i < traceDotsGroup.length; i++) {
      const traceDot = traceDotsGroup[i];
      if (i < traceDotsGroup.length - traceLineLength) {
        if (targetLayerGroup.hasLayer(traceDot)) {
          targetLayerGroup.removeLayer(traceDot);
        }
      } else if (!targetLayerGroup.hasLayer(traceDot)) {
        traceDot.addTo(targetLayerGroup);
      }
    }
  }, [traceLineLength]);

  useEffect(() => {
    const targetLayerGroup = layerGroup.current!;
    targetLayerGroup.clearLayers();
  }, [player?.mapName]);

  return <></>;
}
