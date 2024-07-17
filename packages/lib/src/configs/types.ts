import type {
  LatLngBoundsExpression,
  LatLngExpression,
  TileLayerOptions,
} from "leaflet";

export type TileLayer = {
  url?: string;
  options?: TileLayerOptions;
  minZoom?: number;
  maxZoom?: number;
  fitBounds?: LatLngBoundsExpression;
  view?: { center: LatLngExpression; zoom?: number };
  transformation?: [number, number, number, number];
  threshold?: number;
};

export type TileOptions = Record<string, TileLayer>;

export interface MarkerOptions {
  radius: number;
  playerIcon?: string;
}
