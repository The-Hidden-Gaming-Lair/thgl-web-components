import { getAppUrl, useGameState, type TileLayer } from "@repo/lib";
import {
  WebMap,
  TileLayer as WebMapTileLayer,
  createAffineProjection,
} from "@repo/lib/web-map";
import { InteractiveMap } from "./store";
import { initializeDrawingAdapter } from "./webmap-drawing-adapter";

export function createWorld(
  element: string | HTMLElement,
  view: { center?: [number, number]; zoom?: number },
  options: TileLayer,
  mapName: string,
  appName?: string,
): InteractiveMap {
  // Get the canvas element or create one
  let canvas: HTMLCanvasElement;
  if (typeof element === "string") {
    const container = document.getElementById(element);
    if (!container) throw new Error(`Element with id "${element}" not found`);
    canvas =
      container.querySelector("canvas") || document.createElement("canvas");
    if (!canvas.parentNode) {
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      container.appendChild(canvas);
    }
  } else {
    canvas =
      element.querySelector("canvas") || document.createElement("canvas");
    if (!canvas.parentNode) {
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      element.appendChild(canvas);
    }
  }

  // Determine initial view
  let center: [number, number] = [0, 0];
  let zoom = 0;

  if (view.center && Array.isArray(view.center)) {
    center = view.center;
    zoom = view.zoom ?? 0;
  } else if (options.fitBounds) {
    // Calculate center from bounds
    const bounds = options.fitBounds;
    center = [
      (bounds[0][0] + bounds[1][0]) / 2,
      (bounds[0][1] + bounds[1][1]) / 2,
    ];
    zoom = 0; // WebMap will auto-fit
  } else if (options.view) {
    center = options.view.center as [number, number];
    zoom = options.view.zoom ?? 0;
  }

  // Create projection from transformation
  const projection = options.transformation
    ? createAffineProjection({
        a: options.transformation[0],
        b: options.transformation[1],
        c: options.transformation[2],
        d: options.transformation[3],
      })
    : undefined;

  // Create WebMap instance
  const world = new WebMap({
    canvas,
    center,
    zoom,
    bearing: 0,
    minZoom: options.minZoom || -5,
    maxZoom: options.maxZoom || 12,
    projection,
  });

  // Set bounds constraints if available
  if (options.options?.bounds && projection && options.transformation) {
    const bounds: [[number, number], [number, number]] = options.options.bounds;
    world.setPanConstraints(bounds, {
      a: options.transformation[0],
      b: options.transformation[1],
      c: options.transformation[2],
      d: options.transformation[3],
    });
  }

  const url =
    appName && options.url ? getAppUrl(appName, options.url) : options.url;

  const tileOptions = options.options;

  // Create and add tile layer
  const tiles = new WebMapTileLayer({
    url: url || "",
    tileSize: tileOptions?.tileSize ?? (options as any).tileSize ?? 256,
    minNativeZoom: tileOptions?.minNativeZoom ?? (options as any).minNativeZoom ?? 0,
    maxNativeZoom:
      tileOptions?.maxNativeZoom ?? (options as any).maxNativeZoom ?? options.maxZoom ?? 12,
    bounds: tileOptions?.bounds,
    transformation: options.transformation,
  });
  world.addLayer(tiles, { zIndex: 0 });

  // Set up bounds checking (equivalent to Leaflet bounds constraint)
  if (options.options?.bounds) {
    const mapBounds: [[number, number], [number, number]] =
      options.options.bounds;
    let isMoving = false;

    const checkBounds = () => {
      if (isMoving) return;

      const centerData = world.getCenter();
      const center: [number, number] = Array.isArray(centerData)
        ? [centerData[0], centerData[1]]
        : [(centerData as any).lat ?? (centerData as any)[0], (centerData as any).lng ?? (centerData as any)[1]];
      const player = useGameState.getState().player;
      const playerIsOnMap = player && player.mapName === mapName;

      // Check if current center is within bounds
      const [minLat, minLng] = mapBounds[0];
      const [maxLat, maxLng] = mapBounds[1];
      const withinBounds =
        center[0] >= minLat &&
        center[0] <= maxLat &&
        center[1] >= minLng &&
        center[1] <= maxLng;

      if (playerIsOnMap && !withinBounds) {
        // If player is on map but view is out of bounds, center on player
        isMoving = true;
        world.setCenter([player.x, player.y]);
        setTimeout(() => {
          isMoving = false;
        }, 1000);
      } else if (!playerIsOnMap && !withinBounds) {
        // Pan back to bounds center
        isMoving = true;
        const boundsCenter: [number, number] = [
          (minLat + maxLat) / 2,
          (minLng + maxLng) / 2,
        ];
        world.setCenter(boundsCenter);
        setTimeout(() => {
          isMoving = false;
        }, 1000);
      }
    };

    // Listen to moveend events
    world.on("moveend" as any, checkBounds);
  }

  // Create InteractiveMap with additional properties
  const interactiveMap = world as InteractiveMap;
  interactiveMap.mapName = mapName;
  if (options.options?.bounds) {
    interactiveMap.bounds = options.options.bounds;
  }

  // Initialize drawing adapter for Geoman compatibility
  initializeDrawingAdapter(interactiveMap);

  return interactiveMap;
}
