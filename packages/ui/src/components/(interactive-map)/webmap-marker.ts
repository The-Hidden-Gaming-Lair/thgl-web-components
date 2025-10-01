/**
 * WebMapMarker - Compatibility wrapper that provides CanvasMarker-like API
 * but uses WebMap's IconMarkerLayer internally for rendering.
 *
 * This allows existing marker components to work with minimal changes
 * while we migrate from Leaflet CanvasMarker to WebMap.
 */

import type { InteractiveMap } from "./store";
import type { ColorBlindMode } from "@repo/lib";
import { DATA_FORGE_URL } from "@repo/lib";
import { IconMarkerLayer, type IconMarkerInstance } from "@repo/lib/web-map";

export type WebMapMarkerIcon =
  | {
      url: string;
    }
  | {
      name: string;
      url: string;
      x: number;
      y: number;
      width: number;
      height: number;
    };

export const DEFAULT_Z_NORMALIZATION = 200;

export type WebMapMarkerOptions = {
  id: string;
  baseRadius: number;
  typeId?: string;
  address?: number;
  isHighlighted?: boolean;
  isDiscovered?: boolean;
  isCluster?: boolean;
  cluster?: any[];
  noCache?: boolean;
  icon?: WebMapMarkerIcon | null;
  text?: string;
  zPos?: "top" | "bottom" | null;
  colorBlindMode?: ColorBlindMode;
  colorBlindSeverity?: number;
  fillColor?: string;
  z?: number;
  zMag?: number;
  keepUpright?: boolean;
  rotation?: number;
  zRange?: { min: number; max: number };
  zNormalization?: number;
};

// Global image cache similar to CanvasMarker
export const webMapMarkerImgs: Record<string, HTMLImageElement> = {};

// Marker registry to track all markers by IconMarkerLayer
const markerRegistry = new WeakMap<IconMarkerLayer, Set<WebMapMarker>>();

function getImageURL(url: string) {
  if (url.startsWith("/global_icons/game-icons")) {
    return `${DATA_FORGE_URL}${url.replace("/global_icons", "")}`;
  }
  return url;
}

export class WebMapMarker {
  private _latLng: [number, number];
  private _map: InteractiveMap | null = null;
  private _iconLayer: IconMarkerLayer | null = null;
  private _markerId: string;
  private _options: WebMapMarkerOptions;
  private _radius: number;

  // Compatibility property for CanvasMarker API
  public _point: { x: number; y: number } = { x: 0, y: 0 };

  // Pending event handlers to be registered when marker is added to map
  private _pendingHandlers: Map<string, (event: any) => void> = new Map();

  constructor(latLng: [number, number], options: WebMapMarkerOptions) {
    this._latLng = latLng;
    this._options = { ...options };
    this._markerId = options.id;
    this._radius = options.baseRadius || 12;

    const sanitizedRange = this.normalizeRange(this._options.zRange);
    if (sanitizedRange) {
      this._options.zRange = sanitizedRange;
    } else {
      delete this._options.zRange;
    }

    if (
      typeof this._options.zNormalization !== "number" ||
      this._options.zNormalization <= 0
    ) {
      delete this._options.zNormalization;
    }

    if (
      typeof this._options.z === "number" &&
      this._options.zMag === undefined
    ) {
      this._options.zMag = this.computeZMag(this._options.z);
    } else if (this._options.zMag !== undefined) {
      this._options.zMag = Math.min(1, Math.max(0, this._options.zMag));
    }

    this.updateLatLngTuple(this._options.z);

    // Load icon if specified
    if (options.icon) {
      this.loadIcon(options.icon);
    }
  }

  private normalizeRange(range?: {
    min: number;
    max: number;
  }): { min: number; max: number } | undefined {
    if (!range) return undefined;
    const min = Number(range.min);
    const max = Number(range.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return undefined;
    }
    if (max - min <= 0) {
      return undefined;
    }
    return { min, max };
  }

  private computeZMag(value?: number | null): number | undefined {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return undefined;
    }
    const range = this._options.zRange;
    if (range) {
      const span = range.max - range.min;
      if (span > 0) {
        return Math.min(1, Math.max(0, (value - range.min) / span));
      }
      return undefined;
    }
    const normalization =
      this._options.zNormalization ?? DEFAULT_Z_NORMALIZATION;
    return Math.min(1, Math.abs(value) / normalization);
  }

  private updateLatLngTuple(z?: number | null): void {
    if (typeof z === "number" && Number.isFinite(z)) {
      (this as any)._latLngTuple = [this._latLng[0], this._latLng[1], z];
    } else {
      (this as any)._latLngTuple = [this._latLng[0], this._latLng[1]];
    }
  }

  private loadIcon(iconData: WebMapMarkerIcon): void {
    const originalUrl = iconData.url;
    const normalizedUrl = this.normalizeIconUrl(originalUrl);
    const cachedImage = this.getCachedIconImage(originalUrl);

    if (cachedImage) {
      this.ensureIconCacheEntries(originalUrl, cachedImage);
      return;
    }

    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    console.log("Loading marker icon", normalizedUrl);
    img.src = normalizedUrl;

    this.ensureIconCacheEntries(originalUrl, img);
  }

  private normalizeIconUrl(url: string): string {
    if (!url.startsWith("/") && !url.startsWith("http")) {
      return `/icons/${url}`;
    }
    return getImageURL(url);
  }

  private getCachedIconImage(url: string): HTMLImageElement | undefined {
    const normalizedUrl = this.normalizeIconUrl(url);
    return webMapMarkerImgs[normalizedUrl] ?? webMapMarkerImgs[url];
  }

  private ensureIconCacheEntries(url: string, img: HTMLImageElement): void {
    const normalizedUrl = this.normalizeIconUrl(url);
    webMapMarkerImgs[url] = img;
    if (!webMapMarkerImgs[normalizedUrl]) {
      webMapMarkerImgs[normalizedUrl] = img;
    }
  }

  private getSheetKey(icon: WebMapMarkerIcon): string {
    return this.normalizeIconUrl(icon.url);
  }

  // CanvasMarker-compatible API
  addTo(map: InteractiveMap): this {
    this._map = map;

    // Find or create IconMarkerLayer
    const layers = (map as any).layers || [];
    let iconLayer = layers.find(
      (layerEntry: any) => layerEntry.layer instanceof IconMarkerLayer,
    )?.layer as IconMarkerLayer;

    if (!iconLayer) {
      // Create a new IconMarkerLayer if none exists
      iconLayer = new IconMarkerLayer();
      map.addLayer(iconLayer, { zIndex: 12 }); // Use z-index 12 like demo
    }

    this._iconLayer = iconLayer;

    // Register this marker
    if (!markerRegistry.has(iconLayer)) {
      markerRegistry.set(iconLayer, new Set());
    }
    markerRegistry.get(iconLayer)!.add(this);

    // Add marker to layer
    this.updateMarkerInLayer();

    // Register any pending event handlers that were added before addTo() was called
    if (this._pendingHandlers.size > 0) {
      this._pendingHandlers.forEach((handler, type) => {
        this.addEventListener(type, handler);
      });
      this._pendingHandlers.clear();
    }

    return this;
  }

  private updateMarkerInLayer(): void {
    if (!this._iconLayer) return;

    const markerData: IconMarkerInstance = {
      id: this._markerId,
      latLng: this._latLng,
      size: this.getRadius() * 2,
      isDiscovered: this._options.isDiscovered || false,
      isHighlighted: this._options.isHighlighted || false,
      zPos: this._options.zPos || null,
      sheet: "default", // Default sheet name
      rect: { x: 0, y: 0, width: 32, height: 32 }, // Default size
    };
    if (typeof this._options.z === "number") {
      markerData.z = this._options.z;
    }
    markerData.zMag =
      typeof this._options.zMag === "number" ? this._options.zMag : 0;
    if (this._options.keepUpright !== undefined) {
      markerData.keepUpright = this._options.keepUpright;
    }
    if (this._options.rotation !== undefined) {
      markerData.rotation = this._options.rotation;
    }

    // Handle icon data and register sheet if needed
    if (this._options.icon) {
      const icon = this._options.icon;
      const sheetKey = this.getSheetKey(icon);

      markerData.sheet = sheetKey;
      if ("width" in icon) {
        markerData.rect = {
          x: icon.x,
          y: icon.y,
          width: icon.width,
          height: icon.height,
        };
      } else {
        markerData.rect = { x: 0, y: 0, width: 32, height: 32 };
      }

      const cachedImage = this.getCachedIconImage(icon.url);
      if (cachedImage) {
        this._iconLayer.addSheet(sheetKey, cachedImage);
      } else {
        this._iconLayer.addSheet(sheetKey, sheetKey);
      }
    }

    // Register default sheet for markers without icons
    if (markerData.sheet === "default") {
      // Create a simple colored circle for default markers
      this.ensureDefaultSheet();
    }

    // Add or update in IconMarkerLayer
    try {
      this._iconLayer.add(markerData);
    } catch (error) {
      console.warn("Failed to add marker to IconMarkerLayer:", error);
    }
  }

  removeFrom(map: InteractiveMap): this {
    if (this._iconLayer) {
      // Remove from registry
      const markers = markerRegistry.get(this._iconLayer);
      if (markers) {
        markers.delete(this);
      }

      // Remove from IconMarkerLayer using proper remove method
      try {
        this._iconLayer.remove(this._markerId);
      } catch (error) {
        console.warn("Failed to remove marker from IconMarkerLayer:", error);
      }
    }

    this._map = null;
    this._iconLayer = null;
    return this;
  }

  // CanvasMarker API compatibility methods
  getLatLng(): [number, number] {
    return this._latLng;
  }

  setLatLng(latLng: [number, number]): this {
    this._latLng = latLng;
    this.updateLatLngTuple(this._options.z);
    this.updateMarkerInLayer();
    return this;
  }

  getRadius(): number {
    let radius = this._radius;
    if (this._options.isHighlighted) {
      radius *= 1.5;
    }
    return radius;
  }

  setRadius(radius: number): this {
    this._radius = radius;
    this.updateMarkerInLayer();
    return this;
  }

  update(): void {
    this.updateMarkerInLayer();
  }

  redraw(): void {
    this.update();
  }

  bringToFront(): this {
    // WebMap handles z-ordering automatically
    return this;
  }

  setZPos(zPos: "top" | "bottom" | null): this {
    this._options.zPos = zPos;
    this.updateMarkerInLayer();
    return this;
  }

  setZ(
    z?: number | null,
    range?: { min: number; max: number } | null,
    normalization?: number,
  ): this {
    const sanitizedRange = this.normalizeRange(range ?? undefined);
    if (sanitizedRange) {
      this._options.zRange = sanitizedRange;
    } else if (range !== undefined) {
      delete this._options.zRange;
    }
    if (typeof normalization === "number" && normalization > 0) {
      this._options.zNormalization = normalization;
    } else if (normalization !== undefined) {
      delete this._options.zNormalization;
    }
    if (typeof z === "number" && Number.isFinite(z)) {
      this._options.z = z;
    } else {
      delete this._options.z;
    }
    this._options.zMag = this.computeZMag(this._options.z);
    this.updateLatLngTuple(this._options.z);
    this.updateMarkerInLayer();
    return this;
  }

  setIcon(icon: WebMapMarkerIcon | null): this {
    this._options.icon = icon;
    if (icon) {
      this.loadIcon(icon);
    }
    this.updateMarkerInLayer();
    return this;
  }

  setHighlight(isHighlighted: boolean): this {
    this._options.isHighlighted = isHighlighted;
    this.updateMarkerInLayer();
    return this;
  }

  setColorBlindMode(mode: ColorBlindMode): this {
    this._options.colorBlindMode = mode;
    // Apply to IconMarkerLayer if it supports color-blind modes
    if (this._iconLayer && (this._iconLayer as any).setColorBlindMode) {
      (this._iconLayer as any).setColorBlindMode(mode);
    }
    return this;
  }

  setColorBlindSeverity(severity: number): this {
    this._options.colorBlindSeverity = Math.max(0, Math.min(1, severity));
    // Apply to IconMarkerLayer if it supports color-blind severity
    if (this._iconLayer && (this._iconLayer as any).setColorBlindSeverity) {
      (this._iconLayer as any).setColorBlindSeverity(
        this._options.colorBlindSeverity,
      );
    }
    return this;
  }

  toggleDiscovered(): this {
    this._options.isDiscovered = !this._options.isDiscovered;
    this.updateMarkerInLayer();
    return this;
  }

  // Event handling - support both single handler and object with multiple handlers
  on(
    typeOrHandlers: string | Record<string, (event: any) => void>,
    handler?: (event: any) => void,
  ): this {
    if (typeof typeOrHandlers === "string" && handler) {
      // Single event handler: marker.on('click', handler)
      this.addEventListener(typeOrHandlers, handler);
    } else if (typeof typeOrHandlers === "object") {
      // Multiple event handlers: marker.on({ click: handler1, mouseover: handler2 })
      Object.entries(typeOrHandlers).forEach(([type, handler]) => {
        this.addEventListener(type, handler);
      });
    }
    return this;
  }

  private addEventListener(type: string, handler: (event: any) => void): void {
    // Store handler for later registration if layer not ready yet
    if (!this._iconLayer) {
      this._pendingHandlers.set(type, handler);
      return;
    }

    // Create mock event object for compatibility
    const createEvent = (eventType: string) => {
      // Calculate screen position for tooltip positioning
      const map = this._map as any;
      const state = map.getRenderState?.();
      let screenPos = { x: 0, y: 0 };

      if (state && state.projection) {
        const worldPos = state.projection(this._latLng);
        const view = state.viewMatrix;
        if (view) {
          // Transform world to clip space
          const cx = view[0] * worldPos.x + view[3] * worldPos.y + view[6];
          const cy = view[1] * worldPos.x + view[4] * worldPos.y + view[7];
          // Clip to screen (device pixels)
          const deviceX = (cx * 0.5 + 0.5) * state.width;
          const deviceY = (1 - (cy * 0.5 + 0.5)) * state.height;
          // Convert to CSS pixels for tooltip positioning
          const dpr = state.devicePixelRatio || 1;
          screenPos.x = deviceX / dpr;
          screenPos.y = deviceY / dpr;
        }
      }

      this._point = screenPos; // Update cached point

      return {
        type: eventType,
        layerPoint: screenPos,
        latlng: this._latLng,
        originalEvent: null as any,
        sourceTarget: { _point: screenPos },
      };
    };

    // Register the handler using the new per-marker event system
    const wrappedHandler = (marker: any) => {
      handler(createEvent(type));
    };

    switch (type) {
      case "click":
      case "mouseover":
      case "mouseout":
      case "mousedown":
      case "contextmenu":
        if ((this._iconLayer as any).registerEventHandler) {
          (this._iconLayer as any).registerEventHandler(
            this._markerId,
            type,
            wrappedHandler
          );
        }
        break;
    }
  }

  off(type?: string, handler?: (event: any) => void): this {
    if (!this._iconLayer) return this;

    if (!type) {
      // Remove all handlers for this marker
      if ((this._iconLayer as any).unregisterAllEventHandlers) {
        (this._iconLayer as any).unregisterAllEventHandlers(this._markerId);
      }
    } else if (
      type === "click" ||
      type === "mouseover" ||
      type === "mouseout" ||
      type === "mousedown" ||
      type === "contextmenu"
    ) {
      // Remove specific handler
      if ((this._iconLayer as any).unregisterEventHandler) {
        (this._iconLayer as any).unregisterEventHandler(this._markerId, type);
      }
    }
    return this;
  }

  // Property access for compatibility
  get options(): WebMapMarkerOptions {
    return this._options;
  }

  get imageElement(): HTMLImageElement | undefined {
    if (this._options.icon) {
      return this.getCachedIconImage(this._options.icon.url);
    }
    return undefined;
  }

  private ensureDefaultSheet(): void {
    if (!this._iconLayer || (this._iconLayer as any)._hasDefaultSheet) return;

    // Create a simple default texture - a white circle
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d")!;

    // Draw a white circle
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, 2 * Math.PI);
    ctx.fill();

    // Convert to data URL and register
    const dataUrl = canvas.toDataURL();
    this._iconLayer.addSheet("default", dataUrl);
    (this._iconLayer as any)._hasDefaultSheet = true;
  }
}

// Export as default for drop-in replacement
export default WebMapMarker;
