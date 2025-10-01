import { createGL } from "./utils/gl";
import type {
  Layer,
  LatLng,
  LayerAddOptions,
  RenderState,
  Bounds,
  AffineTransform,
} from "./types";

// Event system for WebMap
export interface WebMapEventMap {
  click: { latlng: LatLng; layerPoint: { x: number; y: number }; originalEvent: MouseEvent };
  mousemove: { latlng: LatLng; layerPoint: { x: number; y: number }; originalEvent: MouseEvent };
  mousedown: { latlng: LatLng; layerPoint: { x: number; y: number }; originalEvent: MouseEvent };
  mouseup: { latlng: LatLng; layerPoint: { x: number; y: number }; originalEvent: MouseEvent };
}

type EventHandler<T = any> = (event: T) => void;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// WebMercator helpers
const TILE_SIZE = 256;
function projectWebMercator([lat, lng]: LatLng, zoom: number) {
  const siny = clamp(Math.sin((lat * Math.PI) / 180), -0.9999, 0.9999);
  const x = TILE_SIZE * (0.5 + lng / 360) * Math.pow(2, zoom);
  const y =
    TILE_SIZE *
    (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)) *
    Math.pow(2, zoom);
  return { x, y };
}

const defaultWebMercatorProjection = {
  project: projectWebMercator,
  unproject: (p: { x: number; y: number }, zoom: number): LatLng => {
    const z2 = Math.pow(2, zoom);
    const lng = (p.x / (TILE_SIZE * z2) - 0.5) * 360;
    const y = 0.5 - p.y / (TILE_SIZE * z2);
    const lat =
      (180 / Math.PI) *
      (2 * Math.atan(Math.exp(y * 2 * Math.PI)) - Math.PI / 2);
    return [lat, lng];
  },
} as const;

type ProjectionImpl = {
  project: (latlng: LatLng, zoom: number) => { x: number; y: number };
  unproject: (p: { x: number; y: number }, zoom: number) => LatLng;
};

export interface WebMapOptions {
  canvas: HTMLCanvasElement;
  center: LatLng;
  zoom: number; // supports fractional
  bearing?: number; // radians
  pitch?: number; // radians, 0 (top-down) .. ~0.9
  minZoom?: number;
  maxZoom?: number;
  projection?: ProjectionImpl;
}

export class WebMap {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private layers: { layer: Layer; z: number }[] = [];
  private center: LatLng;
  private zoom: number;
  private targetZoom: number;
  private bearing: number;
  private pitch: number = 0; // tilt
  private raf = 0;
  private dragging = false;
  private rotating = false; // RMB drag for rotate/tilt
  private lastPointer?: { x: number; y: number };
  private downPointer?: { x: number; y: number; t: number };
  private rotationPivot?: { screen: { x: number; y: number }; latLng: LatLng };
  private lastState?: RenderState;
  private minZoom = 0;
  private maxZoom = 24;
  private proj: ProjectionImpl;
  private dragStartScreen?: { x: number; y: number };
  private dragStartCenterPx?: { x: number; y: number };
  private zoomAnim?: {
    anchorLL: LatLng;
    anchorScreen: { x: number; y: number };
  };
  private lastFrameTs = performance.now();
  private zoomTimeMs = 60; // time constant for zoom smoothing - faster response
  private panAnim?: { vx: number; vy: number }; // center velocity in world px/s
  private panDecayMs = 250; // time constant for inertia - faster decay
  private lastPointerTs?: number;
  // Wheel shaping/accumulation
  private wheelAccum = 0;
  private wheelAnchor?: { x: number; y: number };
  private wheelTimer?: number;
  // Interaction control
  private interactionsDisabled = false;
  // Event system
  private eventHandlers: Map<keyof WebMapEventMap, EventHandler[]> = new Map();
  private projectionBound: (ll: LatLng) => { x: number; y: number };
  // Pre-allocated view matrix to avoid allocations per frame
  private viewMatrix: Float32Array = new Float32Array(9);
  // Cached trig values for rotation
  private cachedBearing: number = NaN;
  private cachedPitch: number = NaN;
  private cachedCos: number = 1;
  private cachedSin: number = 0;
  private cachedCosP: number = 1;

  constructor(opts: WebMapOptions) {
    this.canvas = opts.canvas;
    this.center = opts.center;
    this.zoom = opts.zoom;
    this.targetZoom = opts.zoom;
    this.bearing = opts.bearing ?? 0;
    if (opts.pitch !== undefined)
      this.pitch = Math.max(0, Math.min(1.4, opts.pitch));
    this.gl = createGL(this.canvas);
    if (opts.minZoom !== undefined) this.minZoom = opts.minZoom;
    if (opts.maxZoom !== undefined) this.maxZoom = opts.maxZoom;
    this.proj = opts.projection ?? defaultWebMercatorProjection;
    // Bind projection method once to avoid closure allocation per frame
    this.projectionBound = this.projection.bind(this);
    this.setupGL();
    // Default cursor when hovering the map
    this.canvas.style.cursor = "grab";
    this.addEventHandlers();
    this.start();
  }

  private setupGL() {
    const gl = this.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
  }

  private addEventHandlers() {
    // Basic pan/zoom/rotate stubs
    this.canvas.addEventListener(
      "wheel",
      (e) => {
        if (this.interactionsDisabled) return;

        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const dir = -Math.sign(e.deltaY) || 0; // wheel up -> zoom in
        const step = this.wheelStepFor(this.targetZoom);

        // Accumulate wheel deltas
        this.wheelAccum += dir * step;
        this.wheelAnchor = { x: sx, y: sy };

        // Clear existing timer
        if (this.wheelTimer) clearTimeout(this.wheelTimer);

        // Debounce and apply accumulated zoom - reduced delay for faster response
        this.wheelTimer = window.setTimeout(() => {
          if (this.wheelAccum !== 0 && this.wheelAnchor) {
            this.zoomAtScreen(this.wheelAnchor, this.wheelAccum);
          }
          this.wheelAccum = 0;
          this.wheelAnchor = undefined;
          this.wheelTimer = undefined;
        }, 20);
      },
      { passive: false },
    );

    // prevent context menu on RMB drag
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      // Forward to IconMarkerLayer for contextmenu detection
      const rect = this.canvas.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const state = this.getRenderState();
      if (!state) return;
      const dpr = state.devicePixelRatio;
      const screen = { x: localX * dpr, y: localY * dpr };
      for (const { layer } of this.layers) {
        if ((layer as any).handleContextMenu) {
          (layer as any).handleContextMenu(state, screen);
        }
      }
    });

    this.canvas.addEventListener("pointerdown", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      this.lastPointer = { x: e.clientX, y: e.clientY };

      // Fire map mousedown event
      const latlng = this.screenToLatLng(localX, localY);
      this.fire("mousedown", { latlng, layerPoint: { x: localX, y: localY }, originalEvent: e });

      const state = this.getRenderState();
      if (state) {
        const dpr = state.devicePixelRatio;
        const screen = { x: localX * dpr, y: localY * dpr };
        // Forward to IconMarkerLayer for mousedown detection
        for (const { layer } of this.layers) {
          if ((layer as any).handleMouseDown) {
            (layer as any).handleMouseDown(state, screen);
          }
        }
      }

      // Always set downPointer for click detection, even when interactions are disabled
      this.lastPointerTs = performance.now();
      this.downPointer = { x: e.clientX, y: e.clientY, t: performance.now() };
      this.canvas.setPointerCapture(e.pointerId);

      // Only start dragging/rotating if interactions are enabled
      if (!this.interactionsDisabled) {
        if (e.button === 2) {
          // right button: rotate/tilt
          this.rotating = true;

          // Use proper perspective-aware screen->world
          const worldPos = this.screenToWorld(localX, localY);
          const latLng = this.unprojectAt(worldPos, this.zoom);

          this.rotationPivot = {
            screen: { x: localX, y: localY },
            latLng,
          };
        } else {
          this.dragging = true;
        }
      }
      // Capture starting screen position and center (for stable pan while zoom animates)
      this.dragStartScreen = { x: e.clientX, y: e.clientY };
      this.dragStartCenterPx = this.projectAt(this.center, this.zoom);
      // If a zoom animation is active, cancel it when user starts dragging
      // This prevents the zoom animation from fighting with the drag position
      if (this.zoomAnim) {
        // Finalize zoom to current state before drag starts
        this.zoomAnim = undefined;
      }
      // Cancel any existing inertia when user starts dragging
      this.panAnim = undefined;
      // Update cursor to grabbing while dragging
      this.canvas.style.cursor = "grabbing";
    });
    this.canvas.addEventListener("pointermove", (e) => {
      if (
        this.rotating &&
        this.lastPointer &&
        this.rotationPivot &&
        !this.interactionsDisabled
      ) {
        const dx = e.clientX - this.lastPointer.x;
        const dy = e.clientY - this.lastPointer.y;
        this.lastPointer = { x: e.clientX, y: e.clientY };

        // Update orientation
        const newPitch = clamp(this.pitch - dy * 0.003, 0, 1.4);
        this.pitch = newPitch;
        this.bearing += dx * 0.005;

        // Update cached trig values immediately for recenterOnPivot
        this.cachedBearing = this.bearing;
        this.cachedPitch = this.pitch;
        this.cachedCos = Math.cos(this.bearing);
        this.cachedSin = Math.sin(this.bearing);
        this.cachedCosP = Math.max(1e-4, Math.cos(this.pitch));

        // Recompute center so that the saved pivot still projects to the same screen pixel
        this.recenterOnPivot();
        return;
      }

      if (!this.dragging || !this.lastPointer || this.interactionsDisabled)
        return;
      const dxCSS = e.clientX - this.lastPointer.x;
      const dyCSS = e.clientY - this.lastPointer.y;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      const now = performance.now();
      const dtMs = this.lastPointerTs
        ? Math.max(1, now - this.lastPointerTs)
        : 16;
      this.lastPointerTs = now;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const dx = dxCSS * dpr;
      const dy = dyCSS * dpr;
      const centerPx = this.projectAt(this.center, this.zoom);

      // Use cached trig values for better performance
      const cos = this.cachedCos;
      const sin = this.cachedSin;
      const cosP = this.cachedCosP;

      // Apply inverse transformation accounting for pitch
      // When pitch is applied, Y movements need to be adjusted by 1/cosP
      const wx = cos * dx - (sin / cosP) * dy;
      const wy = sin * dx + (cos / cosP) * dy;

      // Use total delta from drag start to avoid conflicts with zoom animation adjusting center
      const tdxCSS = e.clientX - (this.dragStartScreen?.x ?? e.clientX);
      const tdyCSS = e.clientY - (this.dragStartScreen?.y ?? e.clientY);
      const tdx = tdxCSS * dpr;
      const tdy = tdyCSS * dpr;
      const twx = cos * tdx - (sin / cosP) * tdy;
      const twy = sin * tdx + (cos / cosP) * tdy;
      const baseCenter = this.dragStartCenterPx ?? centerPx;
      const newCenterPx = { x: baseCenter.x - twx, y: baseCenter.y - twy };
      this.center = this.unprojectAt(newCenterPx, this.zoom);
      // update inertia velocity in world px/s for center
      const vx = -wx * (1000 / dtMs);
      const vy = -wy * (1000 / dtMs);
      this.panAnim = { vx, vy };
    });
    this.canvas.addEventListener("pointerup", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      // Fire map mouseup event
      const latlng = this.screenToLatLng(localX, localY);
      this.fire("mouseup", { latlng, layerPoint: { x: localX, y: localY }, originalEvent: e });

      this.dragging = false;
      this.rotating = false;
      this.lastPointer = undefined;
      this.rotationPivot = undefined; // Clear pivot point
      this.canvas.releasePointerCapture(e.pointerId);
      const up = { x: e.clientX, y: e.clientY, t: performance.now() };
      const dn = this.downPointer;
      this.downPointer = undefined;
      this.lastPointerTs = undefined;
      this.dragStartScreen = undefined;
      this.dragStartCenterPx = undefined;
      if (!dn) return;
      const dx = up.x - dn.x,
        dy = up.y - dn.y;
      const dist2 = dx * dx + dy * dy;
      const dt = up.t - dn.t;
      if (dist2 <= 25 && dt <= 300) {
        this.handleClick(up.x, up.y, e);
      }
      // After releasing, update cursor according to hover state
      this.updateCursor(up.x, up.y);
    });

    // Hover cursors: pointer over interactive layers, grab over map, grabbing while dragging
    this.canvas.addEventListener("pointermove", (e) => {
      if (this.dragging) return; // handled in pointerdown/up
      this.updateCursor(e.clientX, e.clientY);

      // Fire map mousemove event
      const rect = this.canvas.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const latlng = this.screenToLatLng(localX, localY);
      this.fire("mousemove", { latlng, layerPoint: { x: localX, y: localY }, originalEvent: e });

      const state = this.getRenderState();
      if (state) {
        const dpr = state.devicePixelRatio;
        const screen = { x: localX * dpr, y: localY * dpr };
        // Forward to IconMarkerLayer for hover detection
        for (const { layer } of this.layers) {
          if ((layer as any).handleMouseMove) {
            (layer as any).handleMouseMove(state, screen);
          }
        }
      }
    });
    this.canvas.addEventListener("pointerenter", () => {
      if (!this.dragging) this.canvas.style.cursor = "grab";
    });
    this.canvas.addEventListener("pointerleave", () => {
      this.canvas.style.cursor = "default";
    });
  }

  private start() {
    const loop = () => {
      this.frame();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.layers.forEach(({ layer }) => layer.onRemove());
    // Clear all event handlers
    this.eventHandlers.clear();
  }

  // Event system methods
  on<K extends keyof WebMapEventMap>(
    type: K,
    handler: EventHandler<WebMapEventMap[K]>,
  ): this {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }
    this.eventHandlers.get(type)!.push(handler);
    return this;
  }

  off<K extends keyof WebMapEventMap>(
    type: K,
    handler?: EventHandler<WebMapEventMap[K]>,
  ): this {
    const handlers = this.eventHandlers.get(type);
    if (!handlers) return this;

    if (handler) {
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    } else {
      // Remove all handlers for this event type
      this.eventHandlers.set(type, []);
    }
    return this;
  }

  private fire<K extends keyof WebMapEventMap>(
    type: K,
    event: WebMapEventMap[K],
  ): void {
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (e) {
          console.error(`Error in ${type} event handler:`, e);
        }
      }
    }
  }

  addLayer(layer: Layer, options: LayerAddOptions = {}) {
    const z = options.zIndex ?? 0;
    this.layers.push({ layer, z });
    this.layers.sort((a, b) => a.z - b.z);
    layer.onAdd(this.gl);
  }

  removeLayer(layer: Layer) {
    const i = this.layers.findIndex((l) => l.layer === layer);
    if (i >= 0) {
      this.layers[i].layer.onRemove();
      this.layers.splice(i, 1);
    }
  }

  setCenter(center: LatLng) {
    this.center = center;
  }
  setZoom(zoom: number) {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    this.targetZoom = this.zoom;
  }
  setBearing(rad: number) {
    this.bearing = rad;
  }
  getZoom() {
    return this.zoom;
  }
  getBearing() {
    return this.bearing;
  }
  getCenter() {
    return { lat: this.center[0], lng: this.center[1] };
  }

  // Leaflet-compatible getCenter for easier migration
  getCenterLatLng(): LatLng {
    return this.center;
  }
  getRenderState() {
    return this.lastState ?? null;
  }

  // Interaction control methods
  disableInteractions() {
    this.interactionsDisabled = true;
    this.canvas.style.cursor = "crosshair";
  }

  enableInteractions() {
    this.interactionsDisabled = false;
    this.canvas.style.cursor = "grab";
  }
  getRotationPivot() {
    if (!this.rotationPivot) return null;

    // ALWAYS return the original screen coordinates - never move the crosshair
    return {
      screen: {
        x: this.rotationPivot.screen.x,
        y: this.rotationPivot.screen.y,
      },
      latLng: this.rotationPivot.latLng,
    };
  }

  private projection = (latlng: LatLng) => this.proj.project(latlng, this.zoom);

  private projectAt(latlng: LatLng, zoom: number) {
    return this.proj.project(latlng, zoom);
  }
  private unprojectAt(p: { x: number; y: number }, zoom: number): LatLng {
    return this.proj.unproject(p, zoom);
  }

  private screenToWorld(
    clientX: number,
    clientY: number,
  ): { x: number; y: number } {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = this.canvas.clientWidth * dpr || this.canvas.width;
    const h = this.canvas.clientHeight * dpr || this.canvas.height;
    const view = this.computeView(w, h);
    const a = view[0],
      b = view[1],
      c = view[3],
      d = view[4],
      tx = view[6],
      ty = view[7];
    const det = a * d - c * b;

    // Lower threshold and better fallback for perspective transformations
    if (Math.abs(det) < 1e-10) {
      // Fallback: use simpler transformation without perspective
      const centerWorld = this.projection(this.center);
      const cos = this.cachedCos;
      const sin = this.cachedSin;
      const sx = clientX * dpr;
      const sy = clientY * dpr;
      const cx = (sx / w) * 2 - 1;
      const cy = 1 - (sy / h) * 2;
      // Simple inverse transform
      const scale = Math.max(w, h) / 2;
      const worldX = centerWorld.x + (cos * cx - sin * cy) * scale;
      const worldY = centerWorld.y + (sin * cx + cos * cy) * scale;
      return { x: worldX, y: worldY };
    }

    const invA = d / det;
    const invB = -b / det;
    const invC = -c / det;
    const invD = a / det;
    const invTx = -(invA * tx + invC * ty);
    const invTy = -(invB * tx + invD * ty);
    const sx = clientX * dpr;
    const sy = clientY * dpr;
    const cx = (sx / w) * 2 - 1;
    const cy = 1 - (sy / h) * 2;
    const wx = invA * cx + invC * cy + invTx;
    const wy = invB * cx + invD * cy + invTy;
    return { x: wx, y: wy };
  }

  private wheelStepFor(z: number) {
    // Scale zoom step by level; larger steps for faster zoom like Google Maps
    if (z < -2) return 0.25;
    if (z < 0) return 0.3;
    if (z < 2) return 0.35;
    if (z < 5) return 0.4;
    return 0.5;
  }

  // Public helpers for debug/overlays
  screenToWorldPx(clientX: number, clientY: number) {
    return this.screenToWorld(clientX, clientY);
  }
  projectLatLng(ll: LatLng) {
    return this.projectAt(ll, this.zoom);
  }
  unprojectWorldPx(p: { x: number; y: number }) {
    return this.unprojectAt(p, this.zoom);
  }
  getCenterWorldPx() {
    return this.projectAt(this.center, this.zoom);
  }

  // Convert screen coordinates to lat/lng
  screenToLatLng(clientX: number, clientY: number): LatLng {
    const worldPos = this.screenToWorld(clientX, clientY);
    return this.unprojectAt(worldPos, this.zoom);
  }

  private zoomAtScreen(screen: { x: number; y: number }, deltaZoom: number) {
    // Get the world position under the mouse cursor
    const worldPt = this.screenToWorld(screen.x, screen.y);
    const anchorLatLng = this.unprojectAt(worldPt, this.zoom);

    // Update target zoom
    this.targetZoom = Math.max(
      this.minZoom,
      Math.min(this.maxZoom, this.targetZoom + deltaZoom),
    );

    // Store anchor for zoom animation
    this.zoomAnim = { anchorLL: anchorLatLng, anchorScreen: screen };
  }

  private computeView(width: number, height: number) {
    const c = this.projection(this.center);

    // Cache trig computations if bearing or pitch changed
    if (this.cachedBearing !== this.bearing || this.cachedPitch !== this.pitch) {
      this.cachedBearing = this.bearing;
      this.cachedPitch = this.pitch;
      this.cachedCos = Math.cos(this.bearing);
      this.cachedSin = Math.sin(this.bearing);
      this.cachedCosP = Math.max(1e-4, Math.cos(this.pitch));
    }

    const cos = this.cachedCos;
    const sin = this.cachedSin;
    const cosP = this.cachedCosP;

    // Standard scaling to normalized device coordinates
    const sx = 2 / width;
    const sy = -2 / height;

    // Rotate the negative center to build the translation in *rotated* space
    const txr = -cos * c.x - sin * c.y; // rotated x
    const tyr = sin * c.x - cos * c.y; // rotated y

    // Apply pitch (compress Y) *before* moving to screen center
    const tx = txr + width / 2;
    const ty = tyr * cosP + height / 2;

    // Final 3x3 (affine) matrix: rotation, then pitch on Y, then translation
    // Reuse pre-allocated array instead of creating new one
    const m = this.viewMatrix;
    m[0] = sx * cos;
    m[1] = sy * (-sin * cosP);
    m[2] = 0;
    m[3] = sx * sin;
    m[4] = sy * (cos * cosP);
    m[5] = 0;
    m[6] = sx * tx - 1;
    m[7] = sy * ty + 1;
    m[8] = 1;
    return m;
  }

  private recenterOnPivot() {
    if (!this.rotationPivot) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = this.canvas.clientWidth * dpr || this.canvas.width;
    const h = this.canvas.clientHeight * dpr || this.canvas.height;

    const P = this.projectAt(this.rotationPivot.latLng, this.zoom); // world (tile) px

    // Use cached trig values (updated in computeView)
    const cos = this.cachedCos;
    const sin = this.cachedSin;
    const cosP = this.cachedCosP;

    // Desired screen offset of the pivot from center, in *pixels*
    const sx = this.rotationPivot.screen.x * dpr - w / 2;
    const sy = this.rotationPivot.screen.y * dpr - h / 2;

    // Solve for (dx,dy) with:
    // [ sx ] = [  cos    sin ] [dx]        (rotated X)
    // [ sy ]   [ -sin  cos ] [dy] * cosP   (pitched Y)
    //
    // Inverse has det = cosP, so:
    // dx =  cos*sx - (sin/cosP)*sy
    // dy =  sin*sx + (cos/cosP)*sy
    const dx = cos * sx - (sin / cosP) * sy;
    const dy = sin * sx + (cos / cosP) * sy;

    const centerPx = { x: P.x - dx, y: P.y - dy };
    this.center = this.unprojectAt(centerPx, this.zoom);
  }

  private panConstraint?: { bounds: Bounds; tf: AffineTransform };
  setPanConstraints(bounds: Bounds, tf: AffineTransform) {
    this.panConstraint = { bounds, tf };
  }
  private clampCenterPx(
    centerPx: { x: number; y: number },
    zoom: number,
    stopAnimations: boolean = false,
  ) {
    if (!this.panConstraint) return centerPx;
    const [[minX, minY], [maxX, maxY]] = this.panConstraint.bounds;
    const tf = this.panConstraint.tf;
    const s = Math.pow(2, zoom);
    const minPx = { x: s * (tf.a * minX + tf.b), y: s * (tf.c * minY + tf.d) };
    const maxPx = { x: s * (tf.a * maxX + tf.b), y: s * (tf.c * maxY + tf.d) };
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = (this.canvas.clientWidth || this.canvas.width) * dpr;
    const h = (this.canvas.clientHeight || this.canvas.height) * dpr;
    const halfW = w / 2,
      halfH = h / 2;

    let cx = centerPx.x;
    let cy = centerPx.y;
    let wasOutOfBounds = false;

    // Calculate map center for when it needs to snap back
    const mapCenterX = (minPx.x + maxPx.x) / 2;
    const mapCenterY = (minPx.y + maxPx.y) / 2;

    // Only clamp if the map would be completely off-screen
    // When snapping back, center the map instead of just bringing it to edge

    // For X axis: if map is completely outside viewport, center it
    if (cx - halfW > maxPx.x || cx + halfW < minPx.x) {
      // Viewport has no overlap with map horizontally - center the map
      cx = mapCenterX;
      wasOutOfBounds = true;
    }

    // For Y axis: if map is completely outside viewport, center it
    if (cy - halfH > maxPx.y || cy + halfH < minPx.y) {
      // Viewport has no overlap with map vertically - center the map
      cy = mapCenterY;
      wasOutOfBounds = true;
    }

    // If we snapped back and stopAnimations is true, cancel all animations
    if (wasOutOfBounds && stopAnimations) {
      this.panAnim = undefined;
      this.zoomAnim = undefined;
      this.targetZoom = this.zoom;
    }

    return { x: cx, y: cy };
  }

  // (removed) legacy unproject helper; use projection-specific unprojectAt instead

  private frame() {
    const gl = this.gl;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.floor(this.canvas.clientWidth * dpr) || this.canvas.width;
    const h = Math.floor(this.canvas.clientHeight * dpr) || this.canvas.height;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.clear(gl.COLOR_BUFFER_BIT);

    // animation step (zoom smoothing and anchor-preserving center)
    const now = performance.now();
    const dt = Math.min(1000, now - this.lastFrameTs);
    this.lastFrameTs = now;
    // exponential smoothing toward target zoom (controlled by zoomTimeMs)
    const alpha = 1 - Math.exp(-dt / this.zoomTimeMs);
    if (Math.abs(this.targetZoom - this.zoom) > 1e-3) {
      const prevZoom = this.zoom;
      this.zoom = this.zoom + (this.targetZoom - this.zoom) * alpha;

      // Update center to keep anchor point fixed if animation is active
      if (this.zoomAnim && !this.dragging) {
        const { anchorLL, anchorScreen } = this.zoomAnim;

        // Calculate where the anchor point is now in world space at new zoom
        const anchorWorld = this.projectAt(anchorLL, this.zoom);

        // Calculate offset from screen center to anchor in pixels
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const w = this.canvas.clientWidth * dpr || this.canvas.width;
        const h = this.canvas.clientHeight * dpr || this.canvas.height;

        // Use cached trig values
        const cos = this.cachedCos;
        const sin = this.cachedSin;
        const cosP = this.cachedCosP;

        const dx = anchorScreen.x * dpr - w / 2;
        const dy = anchorScreen.y * dpr - h / 2;

        // Apply rotation and pitch-aware inverse transformation
        // When pitch is applied, Y coordinates are compressed by cosP
        // So we need to account for this in the inverse transformation
        const worldDx = cos * dx - (sin / cosP) * dy;
        const worldDy = sin * dx + (cos / cosP) * dy;

        // New center should place anchor at the correct screen position
        let centerWorld = {
          x: anchorWorld.x - worldDx,
          y: anchorWorld.y - worldDy,
        };

        centerWorld = this.clampCenterPx(centerWorld, this.zoom, true);
        this.center = this.unprojectAt(centerWorld, this.zoom);
      }
    } else if (this.zoomAnim) {
      // finalize
      this.zoom = this.targetZoom;
      this.zoomAnim = undefined;
    }

    // Pan inertia
    if (this.panAnim && !this.dragging) {
      const decay = Math.exp(-dt / this.panDecayMs);
      const vx = this.panAnim.vx;
      const vy = this.panAnim.vy;
      const dx = vx * (dt / 1000);
      const dy = vy * (dt / 1000);
      const centerPx = this.projectAt(this.center, this.zoom);
      let newCenter = { x: centerPx.x + dx, y: centerPx.y + dy };
      newCenter = this.clampCenterPx(newCenter, this.zoom, true);
      this.center = this.unprojectAt(newCenter, this.zoom);
      // Check if panAnim still exists after clamping (it may have been cleared)
      if (this.panAnim) {
        this.panAnim.vx *= decay;
        this.panAnim.vy *= decay;
        if (Math.hypot(this.panAnim.vx, this.panAnim.vy) < 20)
          this.panAnim = undefined;
      }
    }

    const view = this.computeView(w, h);
    const state: RenderState = {
      devicePixelRatio: dpr,
      width: w,
      height: h,
      worldScale: 1, // pixels/world-pixel at current zoom
      zoom: this.zoom,
      bearing: this.bearing,
      pitch: this.pitch,
      center: this.center,
      projection: this.projectionBound,
      viewMatrix: view,
    };

    // Provide a view matrix to layers via a GL uniform convention
    // Layers fetch it from WebMap via helper (they maintain their own programs)
    (gl as any)._webmapView = view;
    this.lastState = state;

    for (const { layer } of this.layers) {
      layer.render?.(gl, state);
    }
  }

  private handleClick(
    clientX: number,
    clientY: number,
    originalEvent: MouseEvent,
  ) {
    console.log("WebMap handleClick called:", clientX, clientY);
    const rect = this.canvas.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const state = this.lastState;
    if (!state) return;
    const dpr = state.devicePixelRatio;
    const x = localX * dpr;
    const y = localY * dpr;

    // Convert to lat/lng for map events
    const latlng = this.screenToLatLng(localX, localY);
    console.log("WebMap click converted to latlng:", latlng);

    // Check for layer hits first
    let layerHit = false;
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const { layer } = this.layers[i];
      if (typeof layer.pick === "function") {
        const hit = layer.pick(state, { x, y });
        if (hit) {
          // Call the layer's handleClick method if it exists (preferred)
          if (typeof (layer as any).handleClick === "function") {
            (layer as any).handleClick(state, { x: localX, y: localY });
          }
          // Fallback to onClick for backward compatibility
          else if (typeof (layer as any).onClick === "function") {
            (layer as any).onClick(hit);
          }
          layerHit = true;
          break;
        }
      }
    }

    // Fire map click event (whether or not a layer was hit)
    console.log("WebMap firing click event:", latlng);
    this.fire("click", { latlng, layerPoint: { x: localX, y: localY }, originalEvent });
  }

  private updateCursor(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const state = this.lastState;
    if (!state) return;
    const dpr = state.devicePixelRatio;
    const x = (clientX - rect.left) * dpr;
    const y = (clientY - rect.top) * dpr;
    // Check from topmost layer down for a hover hit
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const { layer } = this.layers[i];
      if (typeof layer.pick === "function") {
        const hit = layer.pick(state, { x, y });
        if (hit) {
          this.canvas.style.cursor = "pointer";
          return;
        }
      }
    }
    // Fallback when not over an interactive feature
    this.canvas.style.cursor = "grab";
  }
}
