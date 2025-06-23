"use client";
import { FeatureGroup, Polygon } from "leaflet";
import { useEffect } from "react";
import { useSettingsStore, useUserStore } from "@repo/lib";
import { REGION_FILTERS, useCoordinates, useT } from "../(providers)";
import { useMap } from "./store";
import CanvasMarker from "./canvas-marker";

export function Regions(): JSX.Element {
  const map = useMap();
  const t = useT();
  const { regions } = useCoordinates();
  const mapName = useUserStore((state) => state.mapName);
  const filters = useUserStore((state) => state.filters);
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);

  const showRegionBorders = filters.includes(REGION_FILTERS[0].id);
  const showRegionNames = filters.includes(REGION_FILTERS[1].id);

  useEffect(() => {
    if (!map || (!showRegionBorders && !showRegionNames)) {
      return;
    }
    const featureGroup = new FeatureGroup(undefined, { pane: "shadowPane" });
    regions.forEach((region, index) => {
      if ("mapName" in region && region.mapName !== mapName) {
        return;
      }

      const hue = (index * 360) / regions.length;
      const polygon = new Polygon(region.border, {
        color: `hsl(${hue} 60% 50%)`,
        weight: 3,
        fillOpacity: 0,
        interactive: false,
        pane: "shadowPane",
      });

      try {
        if (showRegionBorders) {
          polygon.addTo(featureGroup);
        }
        if (showRegionNames) {
          new CanvasMarker(region.center, {
            id: region.id,
            text: t(region.id),
            interactive: false,
            baseRadius: 10,
            radius: 10 * baseIconSize,
            pane: "markerPane",
          }).addTo(featureGroup);
        }
      } catch (e) {}
    });
    try {
      featureGroup.addTo(map);
    } catch (e) {}
    return () => {
      try {
        featureGroup.remove();
      } catch (e) {}
    };
  }, [map, baseIconSize, showRegionBorders, showRegionNames]);

  return <></>;
}
