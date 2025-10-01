"use client";
// WebMap doesn't need leaflet CSS
import { cn, getAppUrl, TilesConfig, useSettingsStore } from "@repo/lib";
import { useEffect, useLayoutEffect, useRef } from "react";
import { createWorld } from "./world";
import { createCanvasLayer } from "./canvas-layer";
import { useMapStore } from "./store";
// WebMap doesn't need leaflet

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
  const { map, setMap } = useMapStore();
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
    // WebMap is ready immediately
    setMap(world);

    // WebMap events - remove leaflet-specific DOM manipulation
    world.on("mousedown" as any, () => {
      // WebMap handles transitions internally
    });

    world.on("contextmenu" as any, () => {
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
