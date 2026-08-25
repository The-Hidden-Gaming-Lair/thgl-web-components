"use client";

import { ArrowLeft } from "lucide-react";
import type { TilesConfig } from "@repo/lib";
import { useUserStore, useUserStoreApi } from "../(providers)";
import { cn, getTileLayerUrl, localizePath, useSettingsStore } from "@repo/lib";
import {
  WebMap,
  TileLayer,
  createAffineProjection,
  IconMarkerLayer,
  ImageOverlayLayer,
  InteriorShapesLayer,
  BackdropExitLayer,
  type InteriorArea,
} from "@repo/lib/web-map";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type JSX,
} from "react";
import { useMapStore, type GameMap } from "./store";
import { useTerraformStage } from "../(controls)/terraform-stage-select";
import { ContextMenu } from "./context-menu";
import { InteriorLabels } from "./interior-labels";
import { useLocale, useT } from "../(providers)";

// Extended ref to hold WebMap layers
interface MapRefs {
  webmap: WebMap | null;
  tileLayer: TileLayer | null;
  // Interior floor image(s) drawn over a dimmed backdrop — the Underground map
  // draws every interior's plan at once, so this is a list.
  overlayLayers: ImageOverlayLayer[];
  // Dimmed, clickable interior footprints drawn on the parent (surface) map.
  interiorShapes: InteriorShapesLayer | null;
  // On an interior map: click the backdrop (off the footprint) to exit.
  backdropExit: BackdropExitLayer | null;
  markerLayer: IconMarkerLayer | null;
  canvas: HTMLCanvasElement | null;
}

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
  const mapRefsRef = useRef<MapRefs>({
    webmap: null,
    tileLayer: null,
    overlayLayers: [],
    interiorShapes: null,
    backdropExit: null,
    markerLayer: null,
    canvas: null,
  });
  // Preserve the camera when switching between maps that share tiles (a surface
  // and its interior layers) so focusing/leaving an interior never moves the
  // view. Refs so the map-init effect reads the live view without re-subscribing.
  const prevUrlRef = useRef<string | undefined>(undefined);
  const currentViewRef = useRef<{
    center: [number, number];
    zoom: number;
  } | null>(null);
  const { map, setMap } = useMapStore();
  const isHydrated = useUserStore((state) => state._hasHydrated);
  const mapFilter = useSettingsStore((state) => state.mapFilter);
  const mapName = useUserStore((state) => state.mapName);
  const setMapName = useUserStore((state) => state.setMapName);
  const locale = useLocale();
  const userStoreApi = useUserStoreApi();
  const colorBlindMode = useSettingsStore((state) => state.colorBlindMode);
  const colorBlindSeverity = useSettingsStore(
    (state) => state.colorBlindSeverity,
  );
  const t = useT();

  const mapTileOptions = tileOptions[mapName];
  // Terraform-stage backdrop swap: if a stage is selected for this map, use that
  // stage's tile URL instead of the base map's (stages share bounds/transformation,
  // so only the backdrop image changes — markers stay put). See TerraformStageSelect.
  const selectedStage = useTerraformStage((s) => s.stageByMap[mapName]);
  const stageTileUrl = selectedStage
    ? (
        mapTileOptions as
          | { stages?: Record<string, { url: string }> }
          | undefined
      )?.stages?.[selectedStage]?.url
    : undefined;

  // Descend into an interior layer (shared by the on-map shapes + their labels).
  const enterLayer = useCallback(
    (target: string) => {
      setMapName(target);
      if (location.pathname.includes("/maps/")) {
        // The URL slug is the map's title, resolved back to the map by its dict
        // term (getMapNameFromVersion). A defaultTitle equal to the map id is not
        // a real title (e.g. the generated "Underground" layer map) — fall back
        // to the localized dict term so the route stays valid.
        const dt = tileOptions[target]?.defaultTitle;
        const title = (dt && dt !== target ? dt : t(target)) || target;
        window.history.pushState(
          {},
          "",
          localizePath(`/maps/${title}`, locale),
        );
      }
    },
    [setMapName, tileOptions, locale, t],
  );
  const getInteriorShapes = useCallback(
    () => mapRefsRef.current.interiorShapes,
    [],
  );
  const getMapCanvas = useCallback(() => mapRefsRef.current.canvas, []);

  const [contextMenuData, setContextMenuData] = useState<{
    x: number;
    y: number;
    p: [number, number];
  } | null>(null);

  // Initialize WebMap
  useLayoutEffect(() => {
    if (!isHydrated || !mapTileOptions) {
      return;
    }
    if (!containerRef.current) {
      throw new Error("Map ref is not defined");
    }

    const { viewByMap, setViewByMap } = userStoreApi.getState();
    const view = viewByMap[mapName] ?? {};

    // Only set map title if no marker is selected (marker pages have SSR titles)
    if (!userStoreApi.getState().selectedNodeId) {
      document.title = t("map.pageTitle", {
        vars: { title: appTitle, map: t(mapName) },
      });
    }

    // Create canvas element with correct initial resolution
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    containerRef.current.appendChild(canvas);
    // Set buffer size immediately to avoid blurry first frame
    // Use fallback dimensions if container isn't visible yet (e.g. window on secondary screen)
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(containerRef.current.clientWidth * dpr) || 300;
    canvas.height = Math.floor(containerRef.current.clientHeight * dpr) || 150;
    mapRefsRef.current.canvas = canvas;

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
    const minZoom = mapTileOptions.minZoom ?? 0;
    const maxZoom = mapTileOptions.maxZoom ?? 10;

    // Helper to calculate zoom that fits bounds
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

      const refZoom = 0;
      const p1 = proj.project([lat1, lng1], refZoom);
      const p2 = proj.project([lat2, lng2], refZoom);

      const boundsWidth = Math.abs(p2.x - p1.x);
      const boundsHeight = Math.abs(p2.y - p1.y);

      if (boundsWidth === 0 || boundsHeight === 0) {
        return minZoom;
      }

      const scaleX = containerWidth / boundsWidth;
      const scaleY = containerHeight / boundsHeight;
      const scale = Math.min(scaleX, scaleY);
      const calculatedZoom = refZoom + Math.log2(scale);

      return Math.max(minZoom, Math.min(maxZoom, calculatedZoom));
    };

    // Determine initial view. Switching between maps that SHARE the same tiles
    // (a surface ↔ its interior layers) keeps the exact current camera, so
    // focusing/leaving an interior never moves the view.
    const keepView =
      prevUrlRef.current !== undefined &&
      prevUrlRef.current === mapTileOptions.url &&
      currentViewRef.current;
    // A saved/URL view is only usable if fully finite — a NaN/Infinity camera
    // (which persists as null) renders a permanently black map otherwise.
    // It must also be roughly within the map's bounds: panning off the visual
    // map in-session is allowed (live spawns in tutorials/dungeons), but a
    // reload should not START out there staring at a black canvas. The 10%
    // margin keeps views just past the edge instead of resetting them.
    const boundsForCheck =
      mapTileOptions.fitBounds ?? mapTileOptions.options?.bounds;
    const isWithinBounds = (c: [number, number]) => {
      if (!boundsForCheck) {
        return true;
      }
      const [[a0, a1], [b0, b1]] = boundsForCheck;
      const minLat = Math.min(a0, b0);
      const maxLat = Math.max(a0, b0);
      const minLng = Math.min(a1, b1);
      const maxLng = Math.max(a1, b1);
      const padLat = (maxLat - minLat) * 0.1;
      const padLng = (maxLng - minLng) * 0.1;
      return (
        c[0] >= minLat - padLat &&
        c[0] <= maxLat + padLat &&
        c[1] >= minLng - padLng &&
        c[1] <= maxLng + padLng
      );
    };
    const savedViewValid =
      Array.isArray(view.center) &&
      Number.isFinite(view.center[0]) &&
      Number.isFinite(view.center[1]) &&
      isWithinBounds(view.center);
    // The map's default view (fitBounds center/zoom, or the configured view):
    // the fallback when no usable saved view exists, the resetView target, and
    // the fallback ZOOM for a saved center WITHOUT a saved zoom — a cross-world
    // map-follow switch seeds only the center; minZoom there would start the
    // map fully zoomed out.
    const containerWidth = containerRef.current.clientWidth || 300;
    const containerHeight = containerRef.current.clientHeight || 200;
    let hasDefaultView = false;
    let defaultCenter: [number, number] = [0, 0];
    let defaultZoom = minZoom;
    if (mapTileOptions.fitBounds) {
      const [[lat1, lng1], [lat2, lng2]] = mapTileOptions.fitBounds;
      defaultCenter = [(lat1 + lat2) / 2, (lng1 + lng2) / 2];
      defaultZoom = calculateFitZoom(
        mapTileOptions.fitBounds,
        containerWidth,
        containerHeight,
      );
      hasDefaultView = true;
    } else if (mapTileOptions.view?.center) {
      defaultCenter = mapTileOptions.view.center;
      defaultZoom = mapTileOptions.view.zoom ?? minZoom;
      hasDefaultView = true;
    }

    let center = defaultCenter;
    let zoom = defaultZoom;
    if (keepView && currentViewRef.current) {
      center = currentViewRef.current.center;
      zoom = currentViewRef.current.zoom;
    } else if (savedViewValid && view.center) {
      center = view.center;
      zoom = Number.isFinite(view.zoom) ? view.zoom! : defaultZoom;
    }

    // Create WebMap instance
    const webmap = new WebMap({
      canvas,
      center,
      zoom,
      minZoom,
      maxZoom,
      projection,
    });
    mapRefsRef.current.webmap = webmap;

    // Set default view from tile config so resetView always goes to a valid position
    if (hasDefaultView) {
      webmap.setDefaultView(defaultCenter, defaultZoom);
    }

    // Create and add marker layers
    const markerLayer = new IconMarkerLayer();
    markerLayer.setColorBlindMode(colorBlindMode);
    markerLayer.setColorBlindSeverity(colorBlindSeverity);
    webmap.addLayer(markerLayer, { zIndex: 100 });
    mapRefsRef.current.markerLayer = markerLayer;

    // Separate layer for live actors (frequent position updates)
    const liveMarkerLayer = new IconMarkerLayer();
    liveMarkerLayer.setColorBlindMode(colorBlindMode);
    liveMarkerLayer.setColorBlindSeverity(colorBlindSeverity);
    webmap.addLayer(liveMarkerLayer, { zIndex: 101 });

    // Create GameMap by extending WebMap with game-specific properties
    const gameMap = webmap as GameMap;
    gameMap.mapName = mapName;
    gameMap.bounds = mapTileOptions.options?.bounds ?? [
      [0, 0],
      [0, 0],
    ];
    gameMap.markerLayer = markerLayer;
    gameMap.liveMarkerLayer = liveMarkerLayer;

    // Apply rotation if specified (store on map instance for coordinate transforms)
    if (mapTileOptions.rotation) {
      gameMap.rotationDegrees = mapTileOptions.rotation.angle;
      gameMap.rotationRadians = (mapTileOptions.rotation.angle * Math.PI) / 180;
      gameMap.rotationCenter = mapTileOptions.rotation.center;
      // Legacy aliases for backward compatibility
      gameMap._rotationDegrees = mapTileOptions.rotation.angle;
      gameMap._rotationRadians =
        (mapTileOptions.rotation.angle * Math.PI) / 180;
      gameMap._rotationCenter = mapTileOptions.rotation.center;
    }
    // Legacy alias for canvas (used in markers.tsx)
    gameMap._mapPane = canvas;

    // Set map in store
    setMap(gameMap);

    // Save initial view + seed the live-view refs used for tile-sharing switches.
    const mapCenter = webmap.getCenter();
    setViewByMap(mapName, [mapCenter.lat, mapCenter.lng], webmap.getZoom());
    currentViewRef.current = {
      center: [mapCenter.lat, mapCenter.lng],
      zoom: webmap.getZoom(),
    };
    prevUrlRef.current = mapTileOptions.url;

    // Handle context menu
    webmap.on("contextmenu", (event) => {
      if (location.href.includes("embed")) {
        return;
      }
      // Skip while drawing/editing (cursor locked) or adding a private node
      if (
        webmap.isCursorLocked() ||
        useSettingsStore.getState().tempPrivateNode !== null
      ) {
        return;
      }
      setContextMenuData({
        x: event.layerPoint.x,
        y: event.layerPoint.y,
        p: [event.latlng[0], event.latlng[1]],
      });
    });

    // The saved view must be keyed on a map sharing THIS webmap's coordinate
    // space. On a map switch the store's mapName is already the switch TARGET
    // when cleanup runs (the change is what triggered the teardown) — keying
    // on it persisted the outgoing camera under the incoming map, which the
    // bounds check then rejects as out-of-bounds (zoom reset on every
    // switch). Current mapName is only trusted while it shares this webmap's
    // tiles (surface ↔ its interior layers); otherwise fall back to the map
    // this webmap was created for.
    const createdForMapName = mapName;
    const persistViewMapName = () => {
      const current = userStoreApi.getState().mapName;
      return tileOptions[current]?.url === mapTileOptions.url
        ? current
        : createdForMapName;
    };

    // Save view on move (debounced)
    let timeoutId: NodeJS.Timeout | null = null;
    webmap.on("moveend", () => {
      // Keep the live-view ref current immediately (used for tile-sharing
      // switches); persist to the store debounced.
      const cNow = webmap.getCenter();
      currentViewRef.current = {
        center: [cNow.lat, cNow.lng],
        zoom: webmap.getZoom(),
      };
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        const c = webmap.getCenter();
        setViewByMap(persistViewMapName(), [c.lat, c.lng], webmap.getZoom());
      }, 3000);
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Save current view immediately on cleanup (navigation, unmount)
      const c = webmap.getCenter();
      setViewByMap(persistViewMapName(), [c.lat, c.lng], webmap.getZoom());
      setMap(null);
      webmap.destroy();
      if (containerRef.current && canvas.parentNode === containerRef.current) {
        containerRef.current.removeChild(canvas);
      }
      mapRefsRef.current = {
        webmap: null,
        tileLayer: null,
        overlayLayers: [],
        interiorShapes: null,
        backdropExit: null,
        markerLayer: null,
        canvas: null,
      };
    };
    // NB: deliberately NOT keyed on `mapName` — switching between maps that
    // share tiles (a surface ↔ its interior layers) reuses this WebMap instead
    // of tearing it down, so those switches are instant. `map.mapName` is kept
    // in sync by the store subscription below; the tile/overlay/marker/shape
    // effects update the reused map in place.
  }, [isHydrated, mapTileOptions?.url]);

  // Keep the live map's mapName in sync when the WebMap is reused across a
  // tile-sharing switch (runs synchronously on store change, before consumers
  // that read `map.mapName` re-render).
  useEffect(
    () =>
      userStoreApi.subscribe((state, prev) => {
        if (state.mapName !== prev.mapName) {
          const wm = mapRefsRef.current.webmap as GameMap | null;
          if (wm) wm.mapName = state.mapName;
        }
      }),
    [userStoreApi],
  );

  // Update the document title on map change (handled by map-init on a rebuild,
  // but that no longer runs for tile-sharing switches).
  useEffect(() => {
    if (!userStoreApi.getState().selectedNodeId) {
      document.title = t("map.pageTitle", {
        vars: { title: appTitle, map: t(mapName) },
      });
    }
  }, [mapName, appTitle, t, userStoreApi]);

  // Add/update tile layer
  useEffect(() => {
    const webmap = mapRefsRef.current.webmap;
    if (!webmap || !mapTileOptions?.url) {
      return;
    }
    // Skip tile layer for overlay mode with full filter
    if (isOverlay && mapFilter === "full") {
      return;
    }

    const url = getTileLayerUrl(appName, stageTileUrl ?? mapTileOptions.url);
    const opacity = mapTileOptions.backdrop ? 0.4 : 1;

    // Reuse the tile layer when the TILES are the same (a surface ↔ its interior
    // layers share tiles) — just re-dim it in place, so switching a layer never
    // reloads/flickers the tiles. Only rebuild when the actual tile URL changes.
    const existing = mapRefsRef.current.tileLayer;
    if (existing && existing.url === url) {
      existing.setOpacity(opacity);
      existing.setColorBlindMode(colorBlindMode);
      existing.setColorBlindSeverity(colorBlindSeverity);
    } else {
      if (existing) webmap.removeLayer(existing);
      const tileLayer = new TileLayer({
        url,
        tileSize: mapTileOptions.options?.tileSize ?? 256,
        minNativeZoom: mapTileOptions.options?.minNativeZoom,
        maxNativeZoom: mapTileOptions.options?.maxNativeZoom,
        bounds: mapTileOptions.options?.bounds,
        transformation: mapTileOptions.transformation,
        // On a layered map, dim the (reused parent) tiles so the interior
        // overlay reads as the active floor — the Kuro-style backdrop.
        opacity,
        colorBlind:
          colorBlindMode !== "none"
            ? { mode: colorBlindMode, severity: colorBlindSeverity }
            : null,
      });
      webmap.addLayer(tileLayer, { zIndex: 0 });
      mapRefsRef.current.tileLayer = tileLayer;
    }

    // Swap the interior floor overlay(s) — the Underground map draws every
    // interior's plan at once; a legacy single `overlay` still works.
    for (const ol of mapRefsRef.current.overlayLayers) webmap.removeLayer(ol);
    mapRefsRef.current.overlayLayers = [];
    const overlayList =
      mapTileOptions.overlays ??
      (mapTileOptions.overlay ? [mapTileOptions.overlay] : []);
    for (const ol of overlayList) {
      const overlayLayer = new ImageOverlayLayer({
        url: getTileLayerUrl(appName, ol.url),
        bounds: ol.bounds,
        opacity: (ol as { opacity?: number }).opacity ?? 1,
      });
      webmap.addLayer(overlayLayer, { zIndex: 1 });
      mapRefsRef.current.overlayLayers.push(overlayLayer);
    }
    webmap.requestRedraw();
  }, [
    map,
    mapTileOptions,
    stageTileUrl,
    colorBlindMode,
    colorBlindSeverity,
    isOverlay,
    mapFilter,
  ]);

  // Interior "layered map" shapes: on a surface map, draw each interior's plan
  // dimmed at its true location so you can SEE the interiors and click one to
  // descend into it (the 分层地图 entrance model, drawn in place on the world).
  useEffect(() => {
    const webmap = mapRefsRef.current.webmap;
    if (!webmap) return;
    if (mapRefsRef.current.interiorShapes) {
      webmap.removeLayer(mapRefsRef.current.interiorShapes);
      mapRefsRef.current.interiorShapes = null;
    }
    // Only on a surface (non-layer) map; never in the transparent in-game overlay
    // (no tiles there — the game world IS the map, so a drawn plan makes no sense).
    if (mapTileOptions?.layer || (isOverlay && mapFilter === "full")) return;
    // Faint context: draw every interior plan from this surface's Underground map,
    // each with its name button — clicking any enters the single Underground.
    const ugEntry = Object.entries(tileOptions).find(
      ([, c]) => c.layer?.parent === mapName && !!c.overlays?.length,
    );
    const ugId = ugEntry?.[0];
    const areas: InteriorArea[] = (ugEntry?.[1].overlays ?? []).map((o) => ({
      mapName: ugId!,
      label: o.label ?? "",
      bounds: o.bounds,
      url: getTileLayerUrl(appName, o.url),
    }));
    if (!areas.length) return;
    const shapes = new InteriorShapesLayer(areas, { opacity: 0.28 });
    webmap.addLayer(shapes, { zIndex: 2 });
    mapRefsRef.current.interiorShapes = shapes;
    return () => {
      const refs = mapRefsRef.current;
      if (refs.webmap && refs.interiorShapes) {
        refs.webmap.removeLayer(refs.interiorShapes);
        refs.interiorShapes = null;
      }
    };
  }, [
    map,
    mapName,
    mapTileOptions,
    tileOptions,
    appName,
    t,
    enterLayer,
    isOverlay,
    mapFilter,
  ]);

  // On an interior map, a click on the dimmed backdrop (off the footprint)
  // returns to the surface — an invisible pick-only layer below the markers so
  // marker clicks are handled first and only genuine backdrop clicks exit.
  useEffect(() => {
    const webmap = mapRefsRef.current.webmap;
    if (!webmap) return;
    if (mapRefsRef.current.backdropExit) {
      webmap.removeLayer(mapRefsRef.current.backdropExit);
      mapRefsRef.current.backdropExit = null;
    }
    const layer = mapTileOptions?.layer;
    // The single "Underground" map stacks every interior overlay; fall back to a
    // lone `overlay` for legacy per-interior maps.
    const overlays =
      mapTileOptions?.overlays ??
      (mapTileOptions?.overlay ? [mapTileOptions.overlay] : []);
    // No backdrop to click in the transparent in-game overlay (no tiles drawn).
    if (!layer || overlays.length === 0 || (isOverlay && mapFilter === "full"))
      return;
    const parent = layer.parent;
    const be = new BackdropExitLayer({
      areas: overlays.map((o) => ({
        bounds: o.bounds,
        url: getTileLayerUrl(appName, o.url),
      })),
      onExit: () => enterLayer(parent),
    });
    webmap.addLayer(be, { zIndex: 0.5 });
    mapRefsRef.current.backdropExit = be;
    return () => {
      const refs = mapRefsRef.current;
      if (refs.webmap && refs.backdropExit) {
        refs.webmap.removeLayer(refs.backdropExit);
        refs.backdropExit = null;
      }
    };
  }, [map, mapName, mapTileOptions, appName, enterLayer, isOverlay, mapFilter]);

  // Update color blind mode on marker layers
  useEffect(() => {
    if (mapRefsRef.current.markerLayer) {
      mapRefsRef.current.markerLayer.setColorBlindMode(colorBlindMode);
      mapRefsRef.current.markerLayer.setColorBlindSeverity(colorBlindSeverity);
    }
    if (map?.liveMarkerLayer) {
      map.liveMarkerLayer.setColorBlindMode(colorBlindMode);
      map.liveMarkerLayer.setColorBlindSeverity(colorBlindSeverity);
    }
  }, [colorBlindMode, colorBlindSeverity, map]);

  return (
    <>
      <div className="h-full relative">
        <div
          className={cn(`h-full bg-inherit! outline-none select-none`)}
          ref={containerRef}
        />
        {/* Interior name buttons on the surface — click any to enter Underground. */}
        <InteriorLabels
          getLayer={getInteriorShapes}
          getCanvas={getMapCanvas}
          onEnter={enterLayer}
        />
        {/* On an interior layer, an explicit way back to the surface (the camera
            is preserved by the tile-sharing keep-view logic). */}
        {mapTileOptions?.layer?.parent ? (
          <button
            type="button"
            onClick={() => enterLayer(mapTileOptions.layer!.parent)}
            className="absolute left-1/2 top-2 z-500 flex -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background/90 px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur-sm transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            {t(mapTileOptions.layer.parent) || "World Map"}
          </button>
        ) : null}
      </div>
      <ContextMenu
        domain={domain}
        contextMenuData={contextMenuData}
        onClose={() => setContextMenuData(null)}
      />
    </>
  );
}
