import { TileOptions, cn } from "@repo/lib";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createWorld } from "./world";
import { createCanvasLayer } from "./canvas-layer";
import { useMapStore } from "./store";

export function SimpleMap({
  mapName,
  tileOptions,
  className,
}: {
  mapName: string;
  tileOptions: TileOptions;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapTileOptions = tileOptions?.[mapName];
  const { map, setMap } = useMapStore();

  useLayoutEffect(() => {
    if (!containerRef.current) {
      throw new Error("Map ref is not defined");
    }
    const world = createWorld(containerRef.current, {}, mapTileOptions);
    setMap(world);

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
      const canvasLayer = createCanvasLayer(mapTileOptions.url, {
        minZoom: map.getMinZoom(),
        maxZoom: map.getMaxZoom(),
        filter: "none",
        ...mapTileOptions.options,
      });
      canvasLayer.addTo(map);

      return () => {
        canvasLayer.removeFrom(map);
      };
    } catch (e) {
      //
    }
  }, [map, mapTileOptions]);

  return (
    <div
      className={cn(`h-full !bg-inherit outline-none`, className)}
      ref={containerRef}
    />
  );
}
