"use client";
import { useMapStore } from "../(interactive-map)/store";
import { useEffect, useRef } from "react";
import { useSettingsStore } from "@repo/lib";
import { GridLayer } from "@repo/lib/web-map";

const villagePadding = ((-68999 - -59999) / 2) * 0.6;
const villageGrid = [
  [-68999 - villagePadding, -59999 - villagePadding],
  [52999 + villagePadding, 61999 + villagePadding],
] as [[number, number], [number, number]];
const bayPadding = ((-129947 - 31292.997999999992) / 2) * 0.05;
const bayGrid = [
  [-129947 - bayPadding, 31292.997999999992 - bayPadding],
  [30307.002000000008 + bayPadding, 191547 + bayPadding],
] as [[number, number], [number, number]];
const fairgroundsGrid = [
  [-23099 * 0.98, -22429 * 0.98],
  [28499 * 0.98, 29169 * 0.98],
] as [[number, number], [number, number]];
const housingGrid = [
  [-46349 * 0.955, -45999 * 0.955],
  [45649 * 0.955, 45999 * 0.955],
] as [[number, number], [number, number]];
const elderwoodPadding = ((-68999 - -59999) / 2) * 0.6;
const elderwoodGrid = [
  [-29989 - elderwoodPadding, -55068 - elderwoodPadding],
  [52008 + elderwoodPadding, 26929 + elderwoodPadding],
] as [[number, number], [number, number]];
const royalHighlandsGrid = [
  [-20249, 8098],
  [183150, 211205],
] as [[number, number], [number, number]];

type GridConfig = {
  bounds: [[number, number], [number, number]];
  divisions?: number;
};

const gridBoundsMap: Record<string, GridConfig> = {
  VillageWorld: { bounds: villageGrid },
  AdventureZoneWorld: { bounds: bayGrid },
  MajiMarket: { bounds: fairgroundsGrid },
  HousingPlot: { bounds: housingGrid },
  AZ2_Root: { bounds: elderwoodGrid },
  AZ3_Root: { bounds: royalHighlandsGrid, divisions: 11 },
};

export function PaliaGrid({ force }: { force?: boolean }) {
  const map = useMapStore((state) => state.map);
  const showGrid = force || useSettingsStore((state) => state.showGrid);
  const gridLabelSize = useSettingsStore((state) => state.gridLabelSize);
  const gridLayerRef = useRef<GridLayer | null>(null);

  useEffect(() => {
    if (!map || !showGrid) {
      return;
    }

    const config = gridBoundsMap[map.mapName];
    if (!config) {
      return;
    }

    const gridLayer = new GridLayer({
      bounds: config.bounds,
      divisions: config.divisions ?? 10,
      color: "#ffffff",
      opacity: 0.6,
      showLabels: true,
      labelOpacity: 1,
      labelScale: gridLabelSize,
    });

    map.addLayer(gridLayer, { zIndex: 30 });
    gridLayerRef.current = gridLayer;

    return () => {
      if (map && gridLayerRef.current) {
        map.removeLayer(gridLayerRef.current);
        gridLayerRef.current = null;
      }
    };
  }, [map, showGrid, gridLabelSize]);

  return <></>;
}
