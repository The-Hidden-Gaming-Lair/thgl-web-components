"use client";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

import type { TileOptions } from "@repo/lib";
import { cn, useSettingsStore } from "@repo/lib";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createCanvasLayer } from "./canvas-layer";
import { createWorld } from "./world";
import { useMapStore } from "./store";
import { useCoordinates, useIsHydrated, useUserStore } from "../(providers)";
import { ContextMenu } from "./context-menu";
// import { createCoordinatesControl } from "./coordinates-control";
import leaflet from "leaflet";

export function InteractiveMap({
  tileOptions,
  isOverlay = false,
  domain,
}: {
  tileOptions: TileOptions;
  isOverlay?: boolean;
  domain: string;
}): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const { map, setMap, setLeaflet } = useMapStore();
  const isHydrated = useIsHydrated();
  const mapFilter = useSettingsStore((state) => state.mapFilter);
  const mapName = useUserStore((state) => state.mapName);
  const { userStore } = useCoordinates();

  const mapTileOptions = tileOptions[mapName];

  const [contextMenuData, setContextMenuData] = useState<{
    x: number;
    y: number;
    p: [number, number];
  } | null>(null);

  useLayoutEffect(() => {
    if (!isHydrated || !mapTileOptions) {
      return;
    }
    if (!containerRef.current) {
      throw new Error("Map ref is not defined");
    }
    const { viewByMap, setViewByMap } = userStore.getState();
    const view = viewByMap[mapName] ?? {};

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

    world.on("contextmenu", (event) => {
      if (location.href.includes("embed")) {
        return;
      }
      setContextMenuData({
        x: event.layerPoint.x,
        y: event.layerPoint.y,
        p: [event.latlng.lat, event.latlng.lng],
      });
    });
    setViewByMap(
      mapName,
      [world.getCenter().lat, world.getCenter().lng],
      world.getZoom(),
    );

    let timeoutId: NodeJS.Timeout | null = null;
    world.on("moveend", () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        setViewByMap(
          mapName,
          [world.getCenter().lat, world.getCenter().lng],
          world.getZoom(),
        );
      }, 3000);
    });

    // createCoordinatesControl().addTo(world);
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // setMap(null);
      try {
        world.off();
        world.remove();
      } catch (e) {}
    };
  }, [isHydrated, mapTileOptions]);

  useEffect(() => {
    if ((isOverlay && mapFilter === "full") || !map || !mapTileOptions?.url) {
      return;
    }
    try {
      const canvasLayer = createCanvasLayer(mapTileOptions.url, {
        minZoom: map.getMinZoom(),
        maxZoom: map.getMaxZoom(),
        filter: isOverlay ? mapFilter : "none",
        ...mapTileOptions.options,
      });
      canvasLayer.addTo(map);

      return () => {
        canvasLayer.removeFrom(map);
      };
    } catch (e) {
      //
    }
  }, [mapFilter, map, isOverlay, mapTileOptions]);

  return (
    <>
      <div
        className={cn(`h-full !bg-inherit outline-none`)}
        ref={containerRef}
      />
      <ContextMenu
        domain={domain}
        contextMenuData={contextMenuData}
        onClose={() => setContextMenuData(null)}
      />
    </>
  );
}
