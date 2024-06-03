"use client";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

import type { TileOptions } from "@repo/lib";
import { cn, useSettingsStore } from "@repo/lib";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createCanvasLayer } from "./canvas-layer";
import { createWorld } from "./world";
import { useMapStore } from "./store";
import { useIsHydrated, useUserStore } from "../(providers)";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
// import { createCoordinatesControl } from "./coordinates-control";

export function InteractiveMap({
  tileOptions,
  isOverlay = false,
  domain,
}: {
  tileOptions?: TileOptions;
  isOverlay?: boolean;
  domain: string;
}): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const { map, setMap } = useMapStore();
  const isHydrated = useIsHydrated();
  const mapFilter = useSettingsStore((state) => state.mapFilter);
  const mapName = useUserStore((state) => state.mapName);
  const center = useUserStore((state) => state.center);
  const zoom = useUserStore((state) => state.zoom);
  const setCenter = useUserStore((state) => state.setCenter);
  const setZoom = useUserStore((state) => state.setZoom);

  const mapTileOptions = tileOptions?.[mapName];
  const [contextMenuData, setContextMenuData] = useState<{
    x: number;
    y: number;
    p: [number, number];
  } | null>(null);
  const setTempPrivateNode = useSettingsStore(
    (state) => state.setTempPrivateNode
  );

  useLayoutEffect(() => {
    if (!isHydrated) {
      return;
    }
    if (!containerRef.current) {
      throw new Error("Map ref is not defined");
    }
    const world = createWorld(
      containerRef.current,
      { center, zoom },
      mapTileOptions
    );
    setMap(world);

    world.on("mousedown", () => {
      document
        .querySelector(".leaflet-map-pane")
        ?.classList.remove(
          "transition-transform",
          "ease-linear",
          "duration-1000"
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

    setCenter([world.getCenter().lat, world.getCenter().lng]);
    setZoom(world.getZoom());

    world.on("moveend", () => {
      setCenter([world.getCenter().lat, world.getCenter().lng]);
      setZoom(world.getZoom());
    });

    // createCoordinatesControl().addTo(world);
    return () => {
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

  const mapContainer = map?.getPane("mapPane");

  return (
    <>
      <div
        className={cn(`h-full !bg-inherit outline-none`)}
        ref={containerRef}
      />
      {contextMenuData && (
        <DropdownMenu
          onOpenChange={(open) => {
            if (!open) {
              setContextMenuData(null);
            }
          }}
          open
        >
          <DropdownMenuContent
            container={mapContainer}
            style={{
              transform: `translate3d(calc(${contextMenuData.x}px), calc(${contextMenuData.y}px + 200%), 0px)`,
            }}
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setTempPrivateNode({
                  p: contextMenuData.p,
                });
              }}
            >
              Add Node
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(
                  `https://${domain}.th.gl/?map=${mapName}&center=${contextMenuData.p.join(",")}&zoom=${map?.getZoom()}`
                );
              }}
            >
              Copy Map View URL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}
