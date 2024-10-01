"use client";
import { useMapStore } from "../(interactive-map)/store";
import { useEffect } from "react";
import { useSettingsStore } from "@repo/lib";

const villageGrid = [
  [-67000 * 0.98, -57250 * 0.98],
  [51344 * 0.98, 60000 * 0.98],
] as [[number, number], [number, number]];

const bayGrid = [
  [-125825, 35226],
  [27248, 188416],
] as [[number, number], [number, number]];
const fairgroundsGrid = [
  [-20000, -20000],
  [28000, 28000],
] as [[number, number], [number, number]];
const housingGrid = [
  [-46349 * 0.955, -45999 * 0.955],
  [45649 * 0.955, 45999 * 0.955],
] as [[number, number], [number, number]];

export function PaliaGrid() {
  const { map, leaflet } = useMapStore();
  const showGrid = useSettingsStore((state) => state.showGrid);

  useEffect(() => {
    if (!map || !leaflet || !showGrid) {
      return;
    }
    let grid: [[number, number], [number, number]];
    if (map.mapName === "VillageWorld") {
      grid = villageGrid;
    } else if (map.mapName === "AdventureZoneWorld") {
      grid = bayGrid;
    } else if (map.mapName === "MajiMarket") {
      grid = fairgroundsGrid;
    } else if (map.mapName === "HousingPlot") {
      grid = housingGrid;
    } else {
      return;
    }

    const layerGroup = new leaflet.LayerGroup();
    layerGroup.addTo(map);

    const areas = 10;
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
                html: `${String.fromCharCode(97 + i)}${j + 1}`.toUpperCase(),
              }),
              interactive: false,
              pane: "shadowPane",
            },
          )
          .addTo(layerGroup);
      }
    }

    return () => {
      layerGroup.removeFrom(map);
    };
  }, [map, showGrid]);

  return <></>;
}
