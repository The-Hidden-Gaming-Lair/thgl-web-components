import { useGameState, type TileLayer } from "@repo/lib";
import {
  CRS,
  Transformation,
  canvas,
  extend,
  map,
  PM,
  latLngBounds,
  LatLngExpression,
} from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import { LeafletMap } from "./store";

PM.setOptIn(true);

export function createWorld(
  element: string | HTMLElement,
  view: { center?: [number, number]; zoom?: number },
  options: TileLayer,
  mapName: string,
): LeafletMap {
  const worldCRS = options.transformation
    ? extend({}, CRS.Simple, {
        transformation: new Transformation(
          options.transformation[0],
          options.transformation[1],
          options.transformation[2],
          options.transformation[3],
        ),
      })
    : CRS.Simple;

  const world = map(element, {
    zoomControl: false,
    markerZoomAnimation: true,
    attributionControl: false,
    minZoom: options.minZoom,
    maxZoom: options.maxZoom,
    zoomSnap: 0,
    zoomDelta: 0.4,
    wheelPxPerZoomLevel: 120,
    crs: worldCRS,
    preferCanvas: true,
    renderer: canvas({ pane: "markerPane" }),
    pmIgnore: false,
  });

  const player = useGameState.getState().player;
  if (player && player.mapName === mapName) {
    world.setView([player.x, player.y], view.zoom, { animate: false });
  } else if (view.center) {
    world.setView(view.center, view.zoom, { animate: false });
  } else if (options.fitBounds) {
    world.fitBounds(options.fitBounds, { animate: false });
  } else if (options.view) {
    world.setView(options.view.center, options.view.zoom, { animate: false });
  } else {
    world.setView([0, 0], 0, { animate: false });
  }
  const customTranslation = {
    tooltips: {
      finishLine: "Click any existing marker or ENTER to finish",
    },
  };

  world.pm.setLang("thgl" as PM.SupportLocales, customTranslation, "en");
  const bounds =
    options.options?.bounds &&
    latLngBounds(options.options.bounds as LatLngExpression[]);
  if (bounds) {
    let isMoving = false;
    let isReady = false;
    world.on("whenReady", () => {
      isReady = true;
    });
    world.on("moveend", () => {
      if (isMoving || !isReady) {
        return;
      }
      const currentBounds = world.getBounds();

      if (!currentBounds.intersects(bounds)) {
        isMoving = true;
        world.panInsideBounds(bounds, { animate: false, duration: 0 });
        setTimeout(() => {
          isMoving = false;
        }, 1000);
      }
    });
  }

  return world as LeafletMap;
}
