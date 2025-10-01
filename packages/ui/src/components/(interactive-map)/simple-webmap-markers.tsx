"use client";
import { useEffect, useRef } from "react";
import { useCoordinates } from "../(providers)";
import { useMap } from "./store";
import { IconMarkerLayer } from "@repo/lib/web-map";
import {
  getIconsUrl,
  useSettingsStore,
  useUserStore,
} from "@repo/lib";

/**
 * Simplified markers component using WebMap's IconMarkerLayer directly
 * This demonstrates the new WebMap integration working with actual data
 */
export function SimpleWebMapMarkers({
  appName,
  iconsPath,
}: {
  appName?: string;
  iconsPath?: string;
}): JSX.Element {
  const map = useMap();
  const { spawns, icons } = useCoordinates();
  const iconLayerRef = useRef<IconMarkerLayer | null>(null);

  const baseIconSize = useSettingsStore((state) => state.baseIconSize);
  const discoveredNodes = useSettingsStore((state) => state.discoveredNodes);
  const colorBlindMode = useSettingsStore((state) => state.colorBlindMode);
  const colorBlindSeverity = useSettingsStore((state) => state.colorBlindSeverity);

  useEffect(() => {
    if (!map || spawns.length === 0) return;

    // Create IconMarkerLayer if it doesn't exist
    if (!iconLayerRef.current) {
      iconLayerRef.current = new IconMarkerLayer();
      map.addLayer(iconLayerRef.current, { zIndex: 10 });
    }

    const iconLayer = iconLayerRef.current;

    // Load icon sprite sheet
    const loadIcons = async () => {
      try {
        const spriteUrl = appName
          ? getIconsUrl(appName, "icons.webp", iconsPath)
          : "/icons/icons.webp";

        // For now, we'll create simple colored circle markers
        // In a full implementation, you'd load the actual sprite sheet

        // Clear existing markers
        iconLayer.clear();

        // Add markers for first 100 spawns to test
        const testSpawns = spawns.slice(0, 100);

        testSpawns.forEach((spawn, index) => {
          const isDiscovered = discoveredNodes.includes(spawn.id || `${spawn.type}_${index}`);

          iconLayer.add({
            id: spawn.id || `${spawn.type}_${index}`,
            latLng: spawn.p,
            size: baseIconSize || 24,
            isDiscovered,
            isHighlighted: index < 5, // Highlight first 5 for testing
            // For now, use a simple colored square instead of sprite
            // In full implementation, you'd use the actual icon sprite data
            sheet: spriteUrl,
            rect: { x: 0, y: 0, width: 32, height: 32 },
          });
        });

        console.log(`Added ${testSpawns.length} test markers to WebMap`);
      } catch (error) {
        console.error("Failed to load icons:", error);
      }
    };

    loadIcons();

    return () => {
      // Cleanup will happen when component unmounts
    };
  }, [map, spawns, baseIconSize, appName, iconsPath]);

  // Apply color-blind settings when they change
  useEffect(() => {
    if (iconLayerRef.current) {
      iconLayerRef.current.setColorBlindMode(colorBlindMode);
      iconLayerRef.current.setColorBlindSeverity(colorBlindSeverity);
    }
  }, [colorBlindMode, colorBlindSeverity]);

  // Handle marker clicks
  useEffect(() => {
    if (iconLayerRef.current) {
      iconLayerRef.current.onClick = (marker) => {
        console.log("Clicked marker:", marker.id);
        // In full implementation, you'd handle marker selection, tooltips, etc.
        useUserStore.getState().setSelectedNodeId(marker.id);
      };
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (iconLayerRef.current && map) {
        map.removeLayer(iconLayerRef.current);
        iconLayerRef.current = null;
      }
    };
  }, [map]);

  return <></>; // This component only manages WebMap layers, no DOM output
}