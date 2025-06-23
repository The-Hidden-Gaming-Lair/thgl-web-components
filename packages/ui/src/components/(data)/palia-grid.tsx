"use client";
import { useMapStore } from "../(interactive-map)/store";
import { useEffect } from "react";
import { useSettingsStore } from "@repo/lib";

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

export function PaliaGrid({ force }: { force?: boolean }) {
  const { map, leaflet } = useMapStore();
  const showGrid = force || useSettingsStore((state) => state.showGrid);

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
    } else if (map.mapName === "AZ2_Root") {
      grid = elderwoodGrid;
    } else {
      return;
    }

    const layerGroup = new leaflet.LayerGroup();
    try {
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
  }, [map, showGrid]);

  return <></>;
}
