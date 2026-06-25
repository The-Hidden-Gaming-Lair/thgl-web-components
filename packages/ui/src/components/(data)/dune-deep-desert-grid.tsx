"use client";
import { useMapStore } from "../(interactive-map)/store";
import { useEffect, useRef } from "react";
import { useT } from "../(providers)";
import { useSettingsStore } from "@repo/lib";
import { GridLayer } from "@repo/lib/web-map";

const deepDesertPadding = 0;
const deepDesertGrid = [
  [-1270399 - deepDesertPadding, -1270399 - deepDesertPadding],
  [1167999 + deepDesertPadding, 1167999 + deepDesertPadding],
] as [[number, number], [number, number]];

export function DuneDeepDesertGrid() {
  const t = useT();
  const map = useMapStore((state) => state.map);
  const lockedWindow = useSettingsStore((state) => state.lockedWindow);
  const gridLayerRef = useRef<GridLayer | null>(null);

  useEffect(() => {
    if (!map) {
      return;
    }

    if (map.mapName !== "deepdesert_1") {
      return;
    }

    const gridLayer = new GridLayer({
      bounds: deepDesertGrid,
      divisions: 9,
      color: "#ffffff",
      opacity: 0.3,
      showLabels: true,
      labelOpacity: 0.9,
      labelFormatter: (row, col, divisions) =>
        `${String.fromCharCode(65 + divisions - 1 - col)}${row + 1}`,
    });

    map.addLayer(gridLayer, { zIndex: 30 });
    gridLayerRef.current = gridLayer;

    return () => {
      if (map && gridLayerRef.current) {
        map.removeLayer(gridLayerRef.current);
        gridLayerRef.current = null;
      }
    };
  }, [map]);

  if (lockedWindow) {
    return <></>;
  }
  if (map?.mapName === "deepdesert_1") {
    return (
      <div className="italic text-xs text-muted-foreground px-2.5 py-1 h-7">
        {t("dune.deepDesert.description")}
      </div>
    );
  }

  return <></>;
}
