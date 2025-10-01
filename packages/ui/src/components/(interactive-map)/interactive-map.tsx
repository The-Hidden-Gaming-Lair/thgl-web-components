"use client";

import type { TilesConfig } from "@repo/lib";
import { cn, getAppUrl, useSettingsStore, useUserStore } from "@repo/lib";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createWorld } from "./world";
import { useMapStore } from "./store";
import { ContextMenu } from "./context-menu";
// import { createCoordinatesControl } from "./coordinates-control";
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
  const { map, setMap } = useMapStore();
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
      appName,
    );
    world.mapName = mapName;

    // WebMap is ready immediately, no need for whenReady
    setMap(world);

    // Set up context menu handler
    world.on(
      "contextmenu" as any,
      (event: { latlng: [number, number]; originalEvent: MouseEvent }) => {
        if (location.href.includes("embed")) {
          return;
        }
        // Get screen coordinates from mouse event
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setContextMenuData({
            x: event.originalEvent.clientX - rect.left,
            y: event.originalEvent.clientY - rect.top,
            p: event.latlng,
          });
        }
      },
    );

    // Set initial view in store
    const centerData = world.getCenter();
    const center: [number, number] = Array.isArray(centerData)
      ? [centerData[0], centerData[1]]
      : [
          (centerData as any).lat ?? (centerData as any)[0],
          (centerData as any).lng ?? (centerData as any)[1],
        ];
    setViewByMap(mapName, center, world.getZoom());

    let timeoutId: NodeJS.Timeout | null = null;
    world.on("moveend" as any, () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        const centerData = world.getCenter();
        const center: [number, number] = Array.isArray(centerData)
          ? [centerData[0], centerData[1]]
          : [
              (centerData as any).lat ?? (centerData as any)[0],
              (centerData as any).lng ?? (centerData as any)[1],
            ];
        setViewByMap(mapName, center, world.getZoom());
      }, 3000);
    });

    // createCoordinatesControl().addTo(world);
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setMap(null);
      try {
        world.destroy();
      } catch (e) {}
    };
  }, [isHydrated, mapTileOptions]);

  // WebMap handles tiles internally with color-blind support
  useEffect(() => {
    if (!map) return;

    // Apply color-blind settings to existing tile layers
    const layers = (map as any).getLayers?.() || [];
    layers.forEach((layer: any) => {
      if (layer.setColorBlindMode && layer.setColorBlindSeverity) {
        layer.setColorBlindMode(colorBlindMode);
        layer.setColorBlindSeverity(colorBlindSeverity);
      }
    });
  }, [map, colorBlindMode, colorBlindSeverity]);

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
