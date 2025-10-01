export type LatLng = [number, number];

export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export interface ColorBlindOptions {
  mode: ColorBlindMode;
  severity: number; // 0..1
}

export interface Layer {
  onAdd(gl: WebGL2RenderingContext): void;
  onRemove(): void;
  render(gl: WebGL2RenderingContext, state: RenderState): void;
  setZIndex?(z: number): void;
  pick?(state: RenderState, screen: { x: number; y: number }): unknown | null;
}

export interface RenderState {
  devicePixelRatio: number;
  width: number;
  height: number;
  worldScale: number; // pixels per world unit at current zoom
  zoom: number;
  bearing: number; // radians
  pitch: number; // radians
  center: LatLng;
  projection: (latlng: LatLng) => { x: number; y: number };
  viewMatrix?: Float32Array;
}

export interface AffineTransform {
  a: number; b: number; c: number; d: number;
}

export type Bounds = [[number, number],[number, number]]; // [[minX,minY],[maxX,maxY]]


export interface LayerAddOptions { zIndex?: number }
