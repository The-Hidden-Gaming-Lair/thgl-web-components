import type { LeafletMouseEventHandlerFn } from "leaflet";
import { FeatureGroup, Polygon } from "leaflet";
import { useEffect, useState } from "react";
import { isPointInsidePolygon, useSettingsStore } from "@repo/lib";
import {
  REGION_FILTERS,
  useCoordinates,
  useT,
  useUserStore,
} from "../(providers)";
import { Tooltip, TooltipContent, TooltipPortal } from "../ui/tooltip";
import { useMap } from "./store";
import CanvasMarker from "./canvas-marker";

export function Regions(): JSX.Element {
  const map = useMap();
  const t = useT();
  const { regions } = useCoordinates();
  const filters = useUserStore((state) => state.filters);
  const mapName = useUserStore((state) => state.mapName);
  const baseIconSize = useSettingsStore((state) => state.baseIconSize);

  const mapContainer = map?.getPane("mapPane");
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    id: string;
  } | null>(null);

  const showRegionBorders = filters.includes(REGION_FILTERS[0].id);
  const showRegionNames = filters.includes(REGION_FILTERS[1].id);

  useEffect(() => {
    if (!map || (!showRegionBorders && !showRegionNames)) {
      return;
    }
    const featureGroup = new FeatureGroup(undefined, { pane: "shadowPane" });
    let tooltipDelayTimeout: NodeJS.Timeout | undefined;
    regions.forEach((region, index) => {
      if ("mapName" in region && region.mapName !== mapName) {
        return;
      }

      const hue = (index * 360) / regions.length;
      const polygon = new Polygon(region.border, {
        color: `hsl(${hue} 60% 50%)`,
        weight: 3,
        fillOpacity: 0,
        interactive: true,
        pane: "shadowPane",
      });
      const onMouseOver: LeafletMouseEventHandlerFn = () => {
        polygon.setStyle({ fillOpacity: 0.1 });
      };
      const onMouseMove: LeafletMouseEventHandlerFn = (event) => {
        clearTimeout(tooltipDelayTimeout);
        setTooltipData(null);
        tooltipDelayTimeout = setTimeout(() => {
          setTooltipData({
            x: event.layerPoint.x,
            y: event.layerPoint.y,
            id: region.id,
          });
        }, 200);
      };

      const onMouseOut: LeafletMouseEventHandlerFn = (event) => {
        clearTimeout(tooltipDelayTimeout);
        setTooltipData(null);
        if (
          isPointInsidePolygon(
            [event.latlng.lat, event.latlng.lng],
            region.border,
          )
        ) {
          return;
        }

        polygon.setStyle({ fillOpacity: 0 });
      };

      polygon.on({
        mouseover: onMouseOver,
        mousemove: onMouseMove,
        mouseout: onMouseOut,
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
          }).addTo(featureGroup);
        }
      } catch (e) {}
    });
    featureGroup.addTo(map);
    return () => {
      featureGroup.remove();
    };
  }, [map, baseIconSize, showRegionBorders, showRegionNames]);

  return (
    <>
      {mapContainer && tooltipData ? (
        <Tooltip open={false}>
          <TooltipPortal container={mapContainer}>
            <TooltipContent
              style={{
                transform: `translate3d(calc(${tooltipData.x}px - 50%), calc(${tooltipData.y}px + 100% - 20px), 0px)`,
              }}
            >
              <h3 className="text-lg">{t(tooltipData.id)}</h3>
            </TooltipContent>
          </TooltipPortal>
        </Tooltip>
      ) : null}
    </>
  );
}
