"use client";

import { useEffect, useRef, type JSX } from "react";
import { useUserStore } from "../(providers)";
import { useMap } from "./store";
import { rotateCoordinate } from "./rotation";
import { useSettingsStore, type TilesConfig } from "@repo/lib";
import { REGION_FILTERS, useCoordinates, useT } from "../(providers)";
import { DrawingLayer } from "@repo/lib/web-map";

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function Regions({
  tilesConfig,
}: {
  tilesConfig: TilesConfig;
}): JSX.Element {
  const map = useMap();
  const t = useT();
  const { regions } = useCoordinates();
  const filters = useUserStore((state) => state.filters);
  // Map switches between maps sharing a webmap mutate map.mapName in place
  // (the map reference stays stable), so the store's mapName must trigger the
  // redraw — without it the previous map's borders stay on screen.
  const mapName = useUserStore((state) => state.mapName);
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const dynamicIconSize = useSettingsStore((state) => state.dynamicIconSize);
  const dynamicIconSizeFactor = useSettingsStore(
    (state) => state.dynamicIconSizeFactor,
  );
  const layerRef = useRef<DrawingLayer | null>(null);

  const showBorders = filters.includes("region_borders");
  const showNames = filters.includes("region_names");

  useEffect(() => {
    if (!map) return;

    if (!showBorders && !showNames) {
      // Remove layer if it exists
      if (layerRef.current) {
        layerRef.current.clearShapes();
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    // Create layer if needed
    if (!layerRef.current) {
      layerRef.current = new DrawingLayer({ interactive: false });
      map.addLayer(layerRef.current, { zIndex: 20 });
    }

    const layer = layerRef.current;
    layer.clearShapes();

    const rotationDegrees = map._rotationDegrees;
    const rotationCenter = map._rotationCenter;

    const applyRotation = (point: [number, number]): [number, number] => {
      if (rotationDegrees && rotationCenter) {
        return rotateCoordinate(point, rotationDegrees, rotationCenter);
      }
      return point;
    };

    // On a layer map (e.g. the Underground), show the PARENT surface's regions —
    // the layer reuses the parent's world space, and its own id has no regions.
    const parentMapName = tilesConfig[mapName]?.layer?.parent;
    const filteredRegions = regions.filter(
      (r) =>
        !r.mapName ||
        r.mapName === mapName ||
        (!!parentMapName && r.mapName === parentMapName),
    );

    for (let i = 0; i < filteredRegions.length; i++) {
      const region = filteredRegions[i];
      const hue = (i * 360) / filteredRegions.length;

      if (showBorders && region.border.length >= 3) {
        const positions = region.border.map(applyRotation);
        layer.addShape({
          id: `region_${region.id}`,
          type: "polygon",
          positions,
          color: hslToHex(hue, 60, 50),
          size: 3,
          mapName,
        });
      }

      if (showNames) {
        const center = applyRotation(region.center);
        layer.addShape({
          id: `region_label_${region.id}`,
          type: "text",
          center,
          text: t(region.id),
          size: 16 * baseIconSize,
          color: "#e6e5e3",
          mapName,
        });
      }
    }

    return () => {
      if (layerRef.current) {
        layerRef.current.clearShapes();
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [
    map,
    mapName,
    regions,
    showBorders,
    showNames,
    baseIconSize,
    t,
    tilesConfig,
  ]);

  // Sync dynamic size factor to region drawing layer
  useEffect(() => {
    layerRef.current?.setDynamicSizeFactor(
      dynamicIconSize ? dynamicIconSizeFactor : 0,
    );
  }, [dynamicIconSize, dynamicIconSizeFactor]);

  return <></>;
}
