import type { TileLayer } from "@repo/lib";
import type { Map } from "leaflet";
import { CRS, Transformation, canvas, extend, map, PM } from "leaflet";
import "@geoman-io/leaflet-geoman-free";

PM.setOptIn(true);

export function createWorld(
  element: string | HTMLElement,
  view: { center?: [number, number]; zoom?: number },
  options?: TileLayer,
): Map {
  const worldCRS = options?.transformation
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
    minZoom: options?.minZoom,
    maxZoom: options?.maxZoom,
    zoomSnap: 0,
    zoomDelta: 0.4,
    wheelPxPerZoomLevel: 120,
    crs: worldCRS,
    preferCanvas: true,
    renderer: canvas({ pane: "markerPane" }),
    pmIgnore: false,
  });
  if (view.center) {
    world.setView(view.center, view.zoom);
  } else if (options?.fitBounds) {
    world.fitBounds(options.fitBounds);
  } else if (options?.view) {
    world.setView(options.view.center, options.view.zoom);
  } else {
    world.setView([0, 0], 0);
  }
  const customTranslation = {
    tooltips: {
      finishLine: "Click any existing marker or ENTER to finish",
    },
  };

  world.pm.setLang("thgl" as PM.SupportLocales, customTranslation, "en");

  return world;
}
