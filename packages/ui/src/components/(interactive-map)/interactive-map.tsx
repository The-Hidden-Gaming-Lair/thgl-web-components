"use client";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

import type { TilesConfig } from "@repo/lib";
import { cn, getAppUrl, useSettingsStore, useUserStore } from "@repo/lib";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createCanvasLayer } from "./canvas-layer";
import { createWorld } from "./world";
import { useMapStore } from "./store";
import { ContextMenu } from "./context-menu";
// import { createCoordinatesControl } from "./coordinates-control";
import leaflet from "leaflet";
import { useT } from "../(providers)";

export function InteractiveMap({
  appTitle,
  appName,
  tileOptions,
  isOverlay = false,
  domain,
}: {
  appTitle: string;
  appName: string;
  tileOptions: TilesConfig;
  isOverlay?: boolean;
  domain: string;
}): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const { map, setMap, setLeaflet } = useMapStore();
  const isHydrated = useUserStore((state) => state._hasHydrated);
  const mapFilter = useSettingsStore((state) => state.mapFilter);
  const mapName = useUserStore((state) => state.mapName);
  const colorBlindMode = useSettingsStore((state) => state.colorBlindMode);
  const colorBlindSeverity = useSettingsStore(
    (state) => state.colorBlindSeverity,
  );
  const t = useT();

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
    const { viewByMap, setViewByMap } = useUserStore.getState();
    const view = viewByMap[mapName] ?? {};

    document.title = t("map.pageTitle", {
      vars: { title: appTitle, map: t(mapName) },
    });
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
      const url = getAppUrl(appName, mapTileOptions.url);
      const canvasLayer = createCanvasLayer(url, {
        minZoom: map.getMinZoom(),
        maxZoom: map.getMaxZoom(),
        filter: isOverlay ? mapFilter : "none",
        colorBlindMode,
        colorBlindSeverity,
        ...mapTileOptions.options,
      });
      canvasLayer.addTo(map);

      return () => {
        canvasLayer.removeFrom(map);
      };
    } catch (e) {
      //
    }
  }, [
    mapFilter,
    colorBlindMode,
    colorBlindSeverity,
    map,
    isOverlay,
    mapTileOptions,
  ]);

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
