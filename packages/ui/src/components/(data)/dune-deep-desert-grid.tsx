"use client";
import { useMapStore } from "../(interactive-map)/store";
import { useEffect } from "react";

const deepDesertPadding = 0;
const deepDesertGrid = [
  [-1270399 - deepDesertPadding, -1270399 - deepDesertPadding],
  [1167999 + deepDesertPadding, 1167999 + deepDesertPadding],
] as [[number, number], [number, number]];

export function DuneDeepDesertGrid() {
  const { map, leaflet } = useMapStore();

  useEffect(() => {
    if (!map || !leaflet) {
      return;
    }

    let grid: [[number, number], [number, number]];
    if (map.mapName === "deepdesert_1") {
      grid = deepDesertGrid;
    } else {
      return;
    }

    const layerGroup = new leaflet.LayerGroup();
    try {
      layerGroup.addTo(map);

      const areas = 9;
      const offset = 0;
      const zoneSize = (grid[1][1] - grid[0][1]) / areas;

      for (let i = 0; i < areas; i++) {
        for (let j = 0; j < areas; j++) {
          leaflet
            .rectangle(
              [
                [
                  grid[0][0] + j * zoneSize + offset,
                  grid[0][1] + i * zoneSize + offset,
                ],
                [
                  grid[0][0] + j * zoneSize + zoneSize + offset,
                  grid[0][1] + i * zoneSize + zoneSize + offset,
                ],
              ],
              {
                color: "#fff",
                fill: false,
                opacity: 0.2,
                weight: 1,
                interactive: false,
                pane: "shadowPane",
              },
            )
            .addTo(layerGroup);
          leaflet
            .marker(
              [
                grid[0][0] + j * zoneSize + zoneSize / 2 + offset + 6,
                grid[0][1] + i * zoneSize + zoneSize / 2 + offset - 6,
              ],
              {
                icon: leaflet.divIcon({
                  className: "zone-label",
                  html: `${String.fromCharCode(97 + areas - 1 - j)}${i + 1}`.toUpperCase(),
                }),
                interactive: false,
                pane: "shadowPane",
              },
            )
            .addTo(layerGroup);
        }
      }
    } catch (e) {
      //
    }

    return () => {
      try {
        layerGroup.removeFrom(map);
      } catch (e) {
        //
      }
    };
  }, [map]);

  if (map?.mapName === "deepdesert_1") {
    return (
      <div className="italic text-xs text-muted-foreground px-2.5 py-1 h-7">
        The Deep Desert map is updated weekly.
      </div>
    );
  }

  return <></>;
}
