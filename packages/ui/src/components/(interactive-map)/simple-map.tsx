"use client";
import "leaflet/dist/leaflet.css";
import { cn, getAppUrl, TilesConfig, useSettingsStore } from "@repo/lib";
import { useEffect, useLayoutEffect, useRef } from "react";
import { createWorld } from "./world";
import { createCanvasLayer } from "./canvas-layer";
import { useMapStore } from "./store";
import leaflet from "leaflet";

export function SimpleMap({
  appName,
  mapName,
  tileOptions,
  className,
  view = {},
}: {
  appName: string;
  mapName: string;
  tileOptions: TilesConfig;
  className?: string;
  view?: { center?: [number, number]; zoom?: number };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapTileOptions = tileOptions?.[mapName];
  const { map, setMap, setLeaflet } = useMapStore();
  const colorBlindMode = useSettingsStore((state) => state.colorBlindMode);

  useLayoutEffect(() => {
    if (!containerRef.current) {
      throw new Error("Map ref is not defined");
    }
    const world = createWorld(
      containerRef.current,
      view,
      mapTileOptions,
      mapName,
    );
    world.mapName = mapName;
    setLeaflet(leaflet);
    world.whenReady(() => {
      setMap(world);
    });

    world.on("mousedown", () => {
      document
        .querySelector(".leaflet-map-pane")
        ?.classList.remove(
          "transition-transform",
          "ease-linear",
          "duration-1000",
        );
    });

    world.on("contextmenu", () => {
      return;
    });

    return () => {
      // setMap(null);
      try {
        world.off();
        world.remove();
      } catch (e) {}
    };
  }, [mapTileOptions]);

  useEffect(() => {
    if (!map || !mapTileOptions?.url) {
      return;
    }
    try {
      const url = getAppUrl(appName, mapTileOptions.url);
      const canvasLayer = createCanvasLayer(url, {
        minZoom: map.getMinZoom(),
        maxZoom: map.getMaxZoom(),
        filter: "none",
        colorBlindMode,
        ...mapTileOptions.options,
      });
      canvasLayer.addTo(map);

      return () => {
        canvasLayer.removeFrom(map);
      };
    } catch (e) {
      //
    }
  }, [map, mapTileOptions, colorBlindMode]);

  return (
    <div
      className={cn(`h-full !bg-inherit outline-none`, className)}
      ref={containerRef}
    />
  );
}
