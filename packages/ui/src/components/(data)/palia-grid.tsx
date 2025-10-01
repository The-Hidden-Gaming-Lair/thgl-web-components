"use client";
import { useEffect } from "react";
import { useMapStore } from "../(interactive-map)/store";
import { useSettingsStore } from "@repo/lib";

// Grid definitions (preserved for future WebMap implementation)
const villageGrid = [
  [-61104 - 100, -107856 - 100],
  [69872 + 100, 26320 + 100],
] as [[number, number], [number, number]];

const bayGrid = [
  [-51008 - 100, -77136 - 100],
  [79968 + 100, 53840 + 100],
] as [[number, number], [number, number]];

const fairgroundsGrid = [
  [-15072 - 100, -17872 - 100],
  [16000 + 100, 14192 + 100],
] as [[number, number], [number, number]];

const housingGrid = [
  [-13192 - 100, -11312 - 100],
  [18872 + 100, 20752 + 100],
] as [[number, number], [number, number]];

const elderwoodPadding = 500;
const elderwoodGrid = [
  [-14057 - elderwoodPadding, -20497 - elderwoodPadding],
  [52008 + elderwoodPadding, 26929 + elderwoodPadding],
] as [[number, number], [number, number]];

export function PaliaGrid({ force }: { force?: boolean }) {
  const { map } = useMapStore();
  const showGrid = force || useSettingsStore((state) => state.showGrid);

  useEffect(() => {
    if (!map || !showGrid) {
      return;
    }

    // TODO: Implement grid overlay support in WebMap
    console.log("Grid overlay not yet supported in WebMap");
    return () => {
      // Cleanup when WebMap supports grid overlays
    };
  }, [map, showGrid]);

  return null;
}