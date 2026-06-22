"use client";
import { cn, getTileLayerUrl, TilesConfig, useSettingsStore } from "@repo/lib";
import {
  WebMap,
  TileLayer,
  createAffineProjection,
  IconMarkerLayer,
} from "@repo/lib/web-map";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MapControls } from "../(controls)/map-controls";

export interface SimpleWebMapRef {
  webmap: WebMap | null;
  markerLayer: IconMarkerLayer | null;
}

export function SimpleWebMap({
  appName,
  mapName,
  tileOptions,
  className,
  view = {},
  fitBounds,
  mapRef,
}: {
  appName: string;
  mapName: string;
  tileOptions: TilesConfig;
  className?: string;
  view?: { center?: [number, number]; zoom?: number };
  fitBounds?: [[number, number], [number, number]];
  mapRef?: React.MutableRefObject<SimpleWebMapRef | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const webmapRef = useRef<WebMap | null>(null);
  const [webmapState, setWebmapState] = useState<WebMap | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const markerLayerRef = useRef<IconMarkerLayer | null>(null);
  const mapTileOptions = tileOptions?.[mapName];
  const colorBlindMode = useSettingsStore((state) => state.colorBlindMode);
  const colorBlindSeverity = useSettingsStore(
    (state) => state.colorBlindSeverity,
  );

  // Initialize WebMap
  useLayoutEffect(() => {
    if (!containerRef.current || !mapTileOptions) {
      return;
    }

    // Create canvas element
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    containerRef.current.appendChild(canvas);

    // Create projection if transformation is specified
    const projection = mapTileOptions.transformation
      ? createAffineProjection({
          a: mapTileOptions.transformation[0],
          b: mapTileOptions.transformation[1],
          c: mapTileOptions.transformation[2],
          d: mapTileOptions.transformation[3],
        })
      : undefined;

    // Calculate initial view
    let center: [number, number] = [0, 0];
    let zoom = mapTileOptions.minZoom ?? 0;
    const minZoom = mapTileOptions.minZoom ?? 0;
    const maxZoom = mapTileOptions.maxZoom ?? 10;

    // Helper to calculate zoom that fits bounds in container
    const calculateFitZoom = (
      bounds: [[number, number], [number, number]],
      containerWidth: number,
      containerHeight: number,
    ): number => {
      const [[lat1, lng1], [lat2, lng2]] = bounds;
      const proj = projection ?? {
        project: (ll: [number, number], z: number) => ({
          x: ll[1] * Math.pow(2, z),
          y: ll[0] * Math.pow(2, z),
        }),
      };

      // Use a reference zoom to project bounds
      const refZoom = 0;

      // Project bounds corners at reference zoom
      const p1 = proj.project([lat1, lng1], refZoom);
      const p2 = proj.project([lat2, lng2], refZoom);

      // Calculate bounds size in pixels at reference zoom
      const boundsWidth = Math.abs(p2.x - p1.x);
      const boundsHeight = Math.abs(p2.y - p1.y);

      if (boundsWidth === 0 || boundsHeight === 0) {
        return minZoom;
      }

      // Calculate scale ratios (container size / bounds size)
      // Use CSS pixels - WebMap handles DPR internally
      const scaleX = containerWidth / boundsWidth;
      const scaleY = containerHeight / boundsHeight;

      // Use the smaller scale to ensure both dimensions fit
      const scale = Math.min(scaleX, scaleY);

      // Convert scale to zoom delta: zoom = refZoom + log2(scale)
      const calculatedZoom = refZoom + Math.log2(scale);

      // Clamp to min/max zoom
      return Math.max(minZoom, Math.min(maxZoom, calculatedZoom));
    };

    // Determine center and zoom from various sources
    const boundsToFit = fitBounds ?? mapTileOptions.fitBounds;

    if (boundsToFit) {
      // Calculate center from bounds
      const [[lat1, lng1], [lat2, lng2]] = boundsToFit;
      center = [(lat1 + lat2) / 2, (lng1 + lng2) / 2];

      // Calculate zoom to fit bounds with padding (zoom out slightly for breathing room)
      const containerWidth = containerRef.current.clientWidth || 300;
      const containerHeight = containerRef.current.clientHeight || 200;
      zoom =
        calculateFitZoom(boundsToFit, containerWidth, containerHeight) - 0.5;
    }

    // view prop overrides fitBounds
    if (view.center) {
      center = view.center;
      // If view has center but fitBounds is set, use calculated zoom unless view.zoom is specified
      if (view.zoom !== undefined) {
        zoom = view.zoom;
      }
    } else if (!boundsToFit && mapTileOptions.view?.center) {
      center = mapTileOptions.view.center;
      zoom = mapTileOptions.view.zoom ?? zoom;
    }

    // Create WebMap instance
    const webmap = new WebMap({
      canvas,
      center,
      zoom,
      minZoom: mapTileOptions.minZoom,
      maxZoom: mapTileOptions.maxZoom,
      projection,
    });

    webmapRef.current = webmap;

    // Create and add marker layer (for SimpleWebMarkers to use)
    const markerLayer = new IconMarkerLayer();
    markerLayer.setColorBlindMode(colorBlindMode);
    markerLayer.setColorBlindSeverity(colorBlindSeverity);
    // Disable dynamic sizing on simple maps — fixed icon size works better
    // in small embedded views where zoom is auto-calculated from fitBounds
    markerLayer.setDynamicSizeFactor(0);
    webmap.addLayer(markerLayer, { zIndex: 100 });
    markerLayerRef.current = markerLayer;

    // Expose ref for parent components
    if (mapRef) {
      mapRef.current = {
        webmap,
        markerLayer,
      };
    }

    setWebmapState(webmap);

    return () => {
      setWebmapState(null);
      webmap.destroy();
      if (containerRef.current && canvas.parentNode === containerRef.current) {
        containerRef.current.removeChild(canvas);
      }
      webmapRef.current = null;
      tileLayerRef.current = null;
      markerLayerRef.current = null;
      if (mapRef) {
        mapRef.current = null;
      }
    };
  }, [mapTileOptions?.url]); // Only recreate on URL change

  // Add/update tile layer
  useEffect(() => {
    const webmap = webmapRef.current;
    if (!webmap || !mapTileOptions?.url) {
      return;
    }

    // Remove existing tile layer if any
    if (tileLayerRef.current) {
      webmap.removeLayer(tileLayerRef.current);
    }

    const url = getTileLayerUrl(appName, mapTileOptions.url);

    const tileLayer = new TileLayer({
      url,
      tileSize: mapTileOptions.options?.tileSize ?? 256,
      minNativeZoom: mapTileOptions.options?.minNativeZoom,
      maxNativeZoom: mapTileOptions.options?.maxNativeZoom,
      bounds: mapTileOptions.options?.bounds,
      transformation: mapTileOptions.transformation,
      colorBlind:
        colorBlindMode !== "none"
          ? { mode: colorBlindMode, severity: colorBlindSeverity }
          : null,
    });

    webmap.addLayer(tileLayer, { zIndex: 0 });
    tileLayerRef.current = tileLayer;

    return () => {
      if (webmapRef.current && tileLayerRef.current) {
        webmapRef.current.removeLayer(tileLayerRef.current);
        tileLayerRef.current = null;
      }
    };
  }, [webmapRef.current, mapTileOptions, colorBlindMode, colorBlindSeverity]);

  // Update color blind mode on marker layer
  useEffect(() => {
    if (markerLayerRef.current) {
      markerLayerRef.current.setColorBlindMode(colorBlindMode);
      markerLayerRef.current.setColorBlindSeverity(colorBlindSeverity);
    }
  }, [colorBlindMode, colorBlindSeverity]);

  return (
    <div
      className={cn(`h-full bg-inherit! outline-none relative`, className)}
      ref={containerRef}
    >
      {webmapState && (
        <div className="absolute top-2 right-2 z-10">
          <MapControls webmap={webmapState} />
        </div>
      )}
    </div>
  );
}
