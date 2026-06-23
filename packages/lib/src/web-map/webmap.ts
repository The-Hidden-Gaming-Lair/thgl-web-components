import { createGL, isContextSoftware } from "./utils/gl";
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
  click: {
    latlng: LatLng;
    layerPoint: { x: number; y: number };
    originalEvent: MouseEvent;
  };
  dblclick: {
    latlng: LatLng;
    layerPoint: { x: number; y: number };
    originalEvent: MouseEvent;
  };
  contextmenu: {
    latlng: LatLng;
    layerPoint: { x: number; y: number };
    originalEvent: MouseEvent;
  };
  mousemove: {
    latlng: LatLng;
    layerPoint: { x: number; y: number };
    originalEvent: MouseEvent;
  };
  mousedown: {
    latlng: LatLng;
    layerPoint: { x: number; y: number };
    originalEvent: MouseEvent;
  };
  mouseup: {
    latlng: LatLng;
    layerPoint: { x: number; y: number };
    originalEvent: MouseEvent;
  };
  moveend: void;
  zoomend: void;
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
  private targetCenter: LatLng | null = null;
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
  private contextLost = false;
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
  // When WebGL is software-rasterized (HW accel off), every rendered frame is
  // CPU work, so view-change easing (zoom/pan smoothing, inertia) just multiplies
  // full-map redraws. Snap straight to the target instead. GPU users are unaffected.
  // Set from the real GL context in the constructor (false = hardware, the default).
  private softwareRender = false;
  private lastPointerTs?: number;
  // Wheel shaping/accumulation
  private wheelAccum = 0;
  private wheelAnchor?: { x: number; y: number };
  private wheelTimer?: number;
  // Interaction control
  private interactionsDisabled = false;
  // When true, the map will not change the cursor (drawing manager handles it)
  private _cursorLocked = false;
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
  // Multi-touch pinch-to-zoom state
  private activePointers: Map<number, { x: number; y: number }> = new Map();
  private pinchStartDist?: number;
  private pinchStartZoom?: number;
  private pinchMidpoint?: { x: number; y: number };
  private pinchStartAngle?: number;
  private pinchStartBearing?: number;
  // Double-tap to zoom state
  private lastTap?: { x: number; y: number; t: number };
  // Movement tracking for moveend/zoomend events
  private wasMoving = false;
  private lastZoom: number = 0;
  // Initial view state for resetView()
  private initialCenter: LatLng;
  private initialZoom: number;
  private initialBearing: number;
  private initialPitch: number;
  // Default view from tile config (always valid, used by resetView)
  private defaultCenter?: LatLng;
  private defaultZoom?: number;

  constructor(opts: WebMapOptions) {
    this.canvas = opts.canvas;
    this.center = opts.center;
    this.zoom = opts.zoom;
    this.targetZoom = opts.zoom;
    this.lastZoom = opts.zoom;
    this.bearing = opts.bearing ?? 0;
    if (opts.pitch !== undefined)
      this.pitch = Math.max(0, Math.min(1.4, opts.pitch));
    this.gl = createGL(this.canvas);
    // Detect software rasterization from the REAL on-screen context (logs once).
    this.softwareRender = isContextSoftware(this.gl);
    if (opts.minZoom !== undefined) this.minZoom = opts.minZoom;
    if (opts.maxZoom !== undefined) this.maxZoom = opts.maxZoom;
    this.proj = opts.projection ?? defaultWebMercatorProjection;
    // Bind projection method once to avoid closure allocation per frame
    this.projectionBound = this.projection.bind(this);
    this.setupGL();
    // Handle WebGL context loss and recovery
    this.canvas.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault();
        this.contextLost = true;
      },
      { signal: this.eventAbort.signal },
    );
    this.canvas.addEventListener(
      "webglcontextrestored",
      () => {
        this.contextLost = false;
        this.setupGL();
        // Re-add all layers to reinitialize GL resources (shaders, textures lost on context loss)
        for (const { layer } of this.layers) {
          layer.onRemove();
          layer.onAdd(this.gl);
        }
      },
      { signal: this.eventAbort.signal },
    );
    // Default cursor when hovering the map
    this.canvas.style.cursor = "grab";
    // Prevent browser from intercepting touch events for scrolling/zooming
    this.canvas.style.touchAction = "none";
    this.addEventHandlers();
    // Store initial view for resetView()
    this.initialCenter = [...this.center] as LatLng;
    this.initialZoom = this.zoom;
    this.initialBearing = this.bearing;
    this.initialPitch = this.pitch;
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

  // AbortController for cleaning up all canvas event listeners on destroy
  private eventAbort = new AbortController();

  private addEventHandlers() {
    const signal = this.eventAbort.signal;

    // Basic pan/zoom/rotate stubs
    this.canvas.addEventListener(
      "wheel",
      (e) => {
        if (this.interactionsDisabled) return;
        // Ignore wheel zoom while a drag is in progress: zooming would change
        // this.zoom underneath the drag, which unprojects against
        // dragStartCenterPx (captured at the drag's start zoom), causing the
        // map to flicker/jump.
        if (this.dragging || this.rotationPivot) return;

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
      { passive: false, signal },
    );

    // prevent context menu on RMB drag
    this.canvas.addEventListener(
      "contextmenu",
      (e: MouseEvent) => {
        e.preventDefault();

        // Forward to IconMarkerLayer for contextmenu detection
        const rect = this.canvas.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        const state = this.getRenderState();
        if (!state) return;
        const dpr = state.devicePixelRatio;
        const screen = { x: localX * dpr, y: localY * dpr };
        let handledByMarker = false;
        for (const { layer } of this.layers) {
          if ((layer as any).handleContextMenu) {
            if ((layer as any).handleContextMenu(state, screen)) {
              handledByMarker = true;
            }
          }
        }

        // Only fire map-level contextmenu if no marker handled it
        if (!handledByMarker) {
          const latlng = this.screenToLatLng(localX, localY);
          this.fire("contextmenu", {
            latlng,
            layerPoint: { x: localX, y: localY },
            originalEvent: e,
          });
        }
      },
      { signal },
    );

    // Handle double-click
    this.canvas.addEventListener(
      "dblclick",
      (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        const latlng = this.screenToLatLng(localX, localY);
        this.fire("dblclick", {
          latlng,
          layerPoint: { x: localX, y: localY },
          originalEvent: e,
        });
      },
      { signal },
    );

    this.canvas.addEventListener(
      "pointerdown",
      (e) => {
        // Prevent middle-click auto-scroll
        if (e.button === 1) e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;

        // Track this pointer for multi-touch
        this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        // Check for pinch gesture start (2 fingers)
        if (this.activePointers.size === 2) {
          const pointers = Array.from(this.activePointers.values());
          const dx = pointers[1].x - pointers[0].x;
          const dy = pointers[1].y - pointers[0].y;
          this.pinchStartDist = Math.sqrt(dx * dx + dy * dy);
          this.pinchStartZoom = this.zoom;
          this.pinchStartAngle = Math.atan2(dy, dx);
          this.pinchStartBearing = this.bearing;
          this.pinchMidpoint = {
            x: (pointers[0].x + pointers[1].x) / 2 - rect.left,
            y: (pointers[0].y + pointers[1].y) / 2 - rect.top,
          };
          // Cancel single-finger drag and click detection when pinch starts
          this.dragging = false;
          this.downPointer = undefined;
          return; // Don't process further for second finger
        }

        this.lastPointer = { x: e.clientX, y: e.clientY };

        // Fire map mousedown event
        const latlng = this.screenToLatLng(localX, localY);
        this.fire("mousedown", {
          latlng,
          layerPoint: { x: localX, y: localY },
          originalEvent: e,
        });

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
          if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
            // middle button or ctrl+left: rotate/tilt
            this.rotating = true;

            // Use proper perspective-aware screen->world
            const worldPos = this.screenToWorld(localX, localY);
            const latLng = this.unprojectAt(worldPos, this.zoom);

            this.rotationPivot = {
              screen: { x: localX, y: localY },
              latLng,
            };
          } else if (e.button === 0) {
            // left button only: pan
            this.dragging = true;
          }
        }
        // Capture starting screen position and center (for stable pan while zoom animates)
        this.dragStartScreen = { x: e.clientX, y: e.clientY };
        this.dragStartCenterPx = this.projectAt(this.center, this.zoom);
        // If a zoom animation is active, cancel it when user starts dragging.
        // Freeze targetZoom at the current zoom so the per-frame zoom
        // interpolation (which runs independently of zoomAnim) stops too —
        // otherwise this.zoom keeps changing while the drag unprojects
        // against dragStartCenterPx (captured at the current zoom), causing
        // the map to flicker/jump back.
        if (this.zoomAnim) {
          this.zoomAnim = undefined;
        }
        // Cancel any pending wheel-zoom: the debounce timer (or accumulated
        // delta) would otherwise fire after the drag has started and restart
        // the zoom animation mid-drag.
        if (this.wheelTimer) {
          clearTimeout(this.wheelTimer);
          this.wheelTimer = undefined;
        }
        this.wheelAccum = 0;
        this.wheelAnchor = undefined;
        this.targetZoom = this.zoom;
        // Cancel any existing inertia and pan animation when user starts dragging
        this.panAnim = undefined;
        this.targetCenter = null;
        // Update cursor to grabbing while dragging
        if (!this._cursorLocked) this.canvas.style.cursor = "grabbing";
      },
      { signal },
    );
    this.canvas.addEventListener(
      "pointermove",
      (e) => {
        // Update tracked pointer position
        if (this.activePointers.has(e.pointerId)) {
          this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }

        // Handle pinch-to-zoom with 2 fingers
        if (
          this.activePointers.size === 2 &&
          this.pinchStartDist !== undefined &&
          this.pinchStartZoom !== undefined &&
          this.pinchMidpoint !== undefined &&
          !this.interactionsDisabled
        ) {
          const pointers = Array.from(this.activePointers.values());
          const dx = pointers[1].x - pointers[0].x;
          const dy = pointers[1].y - pointers[0].y;
          const currentDist = Math.sqrt(dx * dx + dy * dy);

          // Calculate zoom delta based on pinch scale
          const scale = currentDist / this.pinchStartDist;
          const zoomDelta = Math.log2(scale);
          const newZoom = clamp(
            this.pinchStartZoom + zoomDelta,
            this.minZoom,
            this.maxZoom,
          );

          // Update midpoint for panning while zooming
          const rect = this.canvas.getBoundingClientRect();
          const newMidpoint = {
            x: (pointers[0].x + pointers[1].x) / 2 - rect.left,
            y: (pointers[0].y + pointers[1].y) / 2 - rect.top,
          };

          // Apply zoom centered on the midpoint
          this.zoom = newZoom;
          this.targetZoom = newZoom;

          // Two-finger rotation: change bearing based on angle between fingers
          if (
            this.pinchStartAngle !== undefined &&
            this.pinchStartBearing !== undefined
          ) {
            const currentAngle = Math.atan2(dy, dx);
            const angleDelta = currentAngle - this.pinchStartAngle;
            this.bearing = this.pinchStartBearing - angleDelta;
            this.cachedBearing = this.bearing;
            this.cachedCos = Math.cos(this.bearing);
            this.cachedSin = Math.sin(this.bearing);
          }

          // Compute deltas from previous midpoint before updating
          const midpointDx = newMidpoint.x - this.pinchMidpoint.x;
          const midpointDy = newMidpoint.y - this.pinchMidpoint.y;

          // Pan to keep the midpoint stationary
          if (Math.abs(midpointDx) > 1 || Math.abs(midpointDy) > 1) {
            const dpr = Math.max(1, window.devicePixelRatio || 1);
            const centerPx = this.projectAt(this.center, this.zoom);
            const cos = this.cachedCos;
            const sin = this.cachedSin;
            const cosP = this.cachedCosP;
            const wx = cos * midpointDx * dpr - (sin / cosP) * midpointDy * dpr;
            const wy = sin * midpointDx * dpr + (cos / cosP) * midpointDy * dpr;
            const newCenterPx = { x: centerPx.x - wx, y: centerPx.y - wy };
            this.center = this.unprojectAt(newCenterPx, this.zoom);
          }

          // Two-finger tilt: vertical midpoint movement changes pitch
          if (Math.abs(midpointDy) > 2) {
            const newPitch = clamp(this.pitch - midpointDy * 0.004, 0, 1.4);
            this.pitch = newPitch;
            this.cachedPitch = newPitch;
            this.cachedCosP = Math.cos(newPitch);
          }

          this.pinchMidpoint = newMidpoint;

          return;
        }

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
      },
      { signal },
    );
    this.canvas.addEventListener(
      "pointerup",
      (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;

        // Remove this pointer from tracking
        this.activePointers.delete(e.pointerId);

        // Clear pinch state when fingers are lifted
        if (this.activePointers.size < 2) {
          this.pinchStartDist = undefined;
          this.pinchStartZoom = undefined;
          this.pinchMidpoint = undefined;
          this.pinchStartAngle = undefined;
          this.pinchStartBearing = undefined;
        }

        // Fire map mouseup event
        const latlng = this.screenToLatLng(localX, localY);
        this.fire("mouseup", {
          latlng,
          layerPoint: { x: localX, y: localY },
          originalEvent: e,
        });

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
        // Use larger thresholds for touch (less precise than mouse)
        const isTouch = e.pointerType === "touch";
        const maxDist2 = isTouch ? 100 : 25; // 10px for touch, 5px for mouse
        const maxDt = isTouch ? 500 : 300; // 500ms for touch, 300ms for mouse
        if (dist2 <= maxDist2 && dt <= maxDt && e.button === 0) {
          // Check for double-tap on touch devices
          if (isTouch && this.lastTap) {
            const tapDx = up.x - this.lastTap.x;
            const tapDy = up.y - this.lastTap.y;
            const tapDist2 = tapDx * tapDx + tapDy * tapDy;
            const tapDt = up.t - this.lastTap.t;
            // Double-tap: within 30px and 300ms of last tap
            if (tapDist2 <= 900 && tapDt <= 300) {
              // Double-tap detected - zoom in centered on tap location
              this.lastTap = undefined;
              const rect = this.canvas.getBoundingClientRect();
              const localX = up.x - rect.left;
              const localY = up.y - rect.top;
              const tapLatLng = this.screenToLatLng(localX, localY);
              // Zoom in by 1 level, centered on tap location
              const newZoom = Math.min(this.maxZoom, this.targetZoom + 1);
              this.setView(tapLatLng, newZoom);
              return;
            }
          }
          // Store this tap for potential double-tap
          if (isTouch) {
            this.lastTap = { x: up.x, y: up.y, t: up.t };
          }
          this.handleClick(up.x, up.y, e);
        }
        // After releasing, update cursor according to hover state
        this.updateCursor(up.x, up.y);
      },
      { signal },
    );

    // Hover cursors: pointer over interactive layers, grab over map, grabbing while dragging
    this.canvas.addEventListener(
      "pointermove",
      (e) => {
        if (this.dragging || this.rotating) return; // handled in pointerdown/up
        this.updateCursor(e.clientX, e.clientY);

        // Fire map mousemove event
        const rect = this.canvas.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        const latlng = this.screenToLatLng(localX, localY);
        this.fire("mousemove", {
          latlng,
          layerPoint: { x: localX, y: localY },
          originalEvent: e,
        });

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
      },
      { signal },
    );
    this.canvas.addEventListener(
      "pointerenter",
      () => {
        if (!this.dragging && !this._cursorLocked)
          this.canvas.style.cursor = "grab";
      },
      { signal },
    );
    this.canvas.addEventListener(
      "pointerleave",
      () => {
        this.canvas.style.cursor = "default";
      },
      { signal },
    );
    // Handle pointer cancel (e.g., incoming call, system gesture)
    this.canvas.addEventListener(
      "pointercancel",
      (e) => {
        this.activePointers.delete(e.pointerId);
        if (this.activePointers.size < 2) {
          this.pinchStartDist = undefined;
          this.pinchStartZoom = undefined;
          this.pinchMidpoint = undefined;
          this.pinchStartAngle = undefined;
          this.pinchStartBearing = undefined;
        }
        this.dragging = false;
        this.rotating = false;
        this.lastPointer = undefined;
        this.rotationPivot = undefined;
      },
      { signal },
    );
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
    this.raf = 0;
    // Remove all canvas event listeners
    this.eventAbort.abort();
    // Clear pending wheel timer
    if (this.wheelTimer) {
      clearTimeout(this.wheelTimer);
      this.wheelTimer = undefined;
    }
    this.layers.forEach(({ layer }) => layer.onRemove());
    // Clear all event handlers
    this.eventHandlers.clear();
  }

  getContainer(): HTMLCanvasElement {
    return this.canvas;
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
    // Wire up redraw callbacks for layers with async loads (tiles, icon sheets)
    (layer as any).onTileLoad = () => this.requestRedraw();
    (layer as any).onSheetLoad = () => this.requestRedraw();
    // Force a redraw so the new layer renders immediately
    this._needsRedraw = true;
  }

  removeLayer(layer: Layer) {
    const i = this.layers.findIndex((l) => l.layer === layer);
    if (i >= 0) {
      this.layers[i].layer.onRemove();
      this.layers.splice(i, 1);
      this._needsRedraw = true;
    }
  }

  /** Get the lat/lng bounds of the current viewport */
  getViewBounds(): { min: LatLng; max: LatLng } {
    const w = this.canvas.clientWidth || this.canvas.width;
    const h = this.canvas.clientHeight || this.canvas.height;
    const tl = this.screenToLatLng(0, 0);
    const br = this.screenToLatLng(w, h);
    return {
      min: [Math.min(tl[0], br[0]), Math.min(tl[1], br[1])],
      max: [Math.max(tl[0], br[0]), Math.max(tl[1], br[1])],
    };
  }

  /** Check if two lat/lng rectangles intersect */
  private boundsIntersect(
    a: { min: LatLng; max: LatLng },
    b: { min: LatLng; max: LatLng },
  ): boolean {
    return !(
      a.min[0] > b.max[0] ||
      a.max[0] < b.min[0] ||
      a.min[1] > b.max[1] ||
      a.max[1] < b.min[1]
    );
  }

  /** Pan the minimum amount so the viewport intersects the given bounds */
  panInsideBounds(bounds: Bounds) {
    const view = this.getViewBounds();
    const mapBounds = {
      min: [
        Math.min(bounds[0][0], bounds[1][0]),
        Math.min(bounds[0][1], bounds[1][1]),
      ] as LatLng,
      max: [
        Math.max(bounds[0][0], bounds[1][0]),
        Math.max(bounds[0][1], bounds[1][1]),
      ] as LatLng,
    };
    if (this.boundsIntersect(view, mapBounds)) return;

    // Pan so the nearest map edge is at the viewport center.
    // This ensures the map is clearly visible, not just 1px overlap.
    let lat = this.center[0];
    let lng = this.center[1];
    if (view.max[0] < mapBounds.min[0]) {
      lat = mapBounds.min[0]; // viewport is above map → center on map's top edge
    } else if (view.min[0] > mapBounds.max[0]) {
      lat = mapBounds.max[0]; // viewport is below map → center on map's bottom edge
    }
    if (view.max[1] < mapBounds.min[1]) {
      lng = mapBounds.min[1];
    } else if (view.min[1] > mapBounds.max[1]) {
      lng = mapBounds.max[1];
    }
    this.center = [lat, lng] as LatLng;
    this.targetCenter = null;
    this.panAnim = undefined;
  }

  setCenter(center: LatLng) {
    this.center = center;
    this.targetCenter = null;
    // Mark as having moved so moveend fires on next frame
    this.wasMoving = true;
  }
  /** Smoothly animate to a new center position */
  panTo(center: LatLng) {
    this.targetCenter = center;
  }
  setZoom(zoom: number) {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    this.targetZoom = this.zoom;
  }
  setView(center: LatLng, zoom: number, animate = true) {
    this.center = center;
    const clampedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    if (animate) {
      // Animate to the new zoom level
      this.targetZoom = clampedZoom;
    } else {
      this.zoom = clampedZoom;
      this.targetZoom = clampedZoom;
    }
  }
  setBearing(rad: number) {
    this.bearing = rad;
  }
  getZoom() {
    return this.zoom;
  }
  /**
   * Zoom in by one level
   */
  zoomIn() {
    this.targetZoom = Math.min(this.maxZoom, this.zoom + 0.5);
  }
  /**
   * Zoom out by half a level
   */
  zoomOut() {
    this.targetZoom = Math.max(this.minZoom, this.zoom - 0.5);
  }
  getMinZoom() {
    return this.minZoom;
  }
  getMaxZoom() {
    return this.maxZoom;
  }

  /**
   * Fit the map to a bounding box of coordinates
   * @param bounds Array of [lat, lng] points to fit
   * @param options Optional settings for padding and max zoom
   */
  fitBounds(
    bounds: (
      | readonly [number, number]
      | [number, number]
      | [number, number, number]
    )[],
    options?: {
      maxZoom?: number;
      padding?: [number, number];
      duration?: number;
    },
  ) {
    if (bounds.length === 0) return;

    // Find bounding box
    let minLat = Infinity,
      maxLat = -Infinity;
    let minLng = Infinity,
      maxLng = -Infinity;
    for (const [lat, lng] of bounds) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }

    // Calculate center
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    this.center = [centerLat, centerLng];

    // Calculate zoom to fit bounds
    const canvasWidth = this.canvas.clientWidth;
    const canvasHeight = this.canvas.clientHeight;
    const padding = options?.padding ?? [50, 50];
    const effectiveWidth = canvasWidth - padding[0] * 2;
    const effectiveHeight = canvasHeight - padding[1] * 2;

    if (effectiveWidth <= 0 || effectiveHeight <= 0) return;

    // Project corners at reference zoom to get world coordinates
    const refZoom = 0;
    const p1 = this.proj.project([minLat, minLng], refZoom);
    const p2 = this.proj.project([maxLat, maxLng], refZoom);

    const boundsWidth = Math.abs(p2.x - p1.x);
    const boundsHeight = Math.abs(p2.y - p1.y);

    if (boundsWidth === 0 && boundsHeight === 0) {
      // Single point - just center on it
      const maxZoom = options?.maxZoom ?? this.maxZoom;
      this.zoom = Math.min(maxZoom, this.maxZoom);
      this.targetZoom = this.zoom;
      return;
    }

    // Calculate zoom that fits the bounds
    const scaleX = boundsWidth > 0 ? effectiveWidth / boundsWidth : Infinity;
    const scaleY = boundsHeight > 0 ? effectiveHeight / boundsHeight : Infinity;
    const scale = Math.min(scaleX, scaleY);
    let calculatedZoom = refZoom + Math.log2(scale);

    // Apply constraints
    const maxZoom = options?.maxZoom ?? this.maxZoom;
    calculatedZoom = Math.max(this.minZoom, Math.min(maxZoom, calculatedZoom));
    this.zoom = calculatedZoom;
    this.targetZoom = calculatedZoom;
  }

  getBearing() {
    return this.bearing;
  }
  getPitch() {
    return this.pitch;
  }
  setPitch(rad: number) {
    this.pitch = Math.max(0, Math.min(1.4, rad));
    this.cachedPitch = this.pitch;
    this.cachedCosP = Math.max(1e-4, Math.cos(this.pitch));
  }
  /** Set the default view from tile config (fitBounds center). Used by resetView. */
  setDefaultView(center: LatLng, zoom: number) {
    this.defaultCenter = center;
    this.defaultZoom = zoom;
  }
  resetView() {
    this.center = [...(this.defaultCenter ?? this.initialCenter)] as LatLng;
    this.setZoom(this.defaultZoom ?? this.initialZoom);
    this.setBearing(this.initialBearing);
    this.setPitch(this.initialPitch);
  }
  getCenter() {
    return { lat: this.center[0], lng: this.center[1] };
  }

  // Get center as LatLng tuple
  getCenterLatLng(): LatLng {
    return this.center;
  }
  getRenderState() {
    return this.lastState ?? null;
  }

  // Interaction control methods
  disableInteractions() {
    this.interactionsDisabled = true;
    if (!this._cursorLocked) {
      this.canvas.style.cursor = "crosshair";
    }
  }

  enableInteractions() {
    this.interactionsDisabled = false;
    if (!this._cursorLocked) {
      this.canvas.style.cursor = "grab";
    }
  }

  lockCursor() {
    this._cursorLocked = true;
  }

  unlockCursor() {
    this._cursorLocked = false;
  }

  /** Returns true when a drawing/editing tool has locked the cursor */
  isCursorLocked() {
    return this._cursorLocked;
  }

  /**
   * Force the map to re-check its container size.
   * Triggers a re-render on the next animation frame.
   */
  invalidateSize() {
    // Force canvas size update and re-render on next frame
    this._needsRedraw = true;
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
    // Use CSS pixels for view matrix to ensure consistent zoom behavior
    const w = this.canvas.clientWidth || this.canvas.width;
    const h = this.canvas.clientHeight || this.canvas.height;
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
      // Use CSS pixels directly (no DPR scaling needed)
      const cx = (clientX / w) * 2 - 1;
      const cy = 1 - (clientY / h) * 2;
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
    // Use CSS pixels directly (no DPR scaling needed)
    const cx = (clientX / w) * 2 - 1;
    const cy = 1 - (clientY / h) * 2;
    const wx = invA * cx + invC * cy + invTx;
    const wy = invB * cx + invD * cy + invTy;
    return { x: wx, y: wy };
  }

  private wheelStepFor(_z: number) {
    return 0.25;
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
    if (
      this.cachedBearing !== this.bearing ||
      this.cachedPitch !== this.pitch
    ) {
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

    // Use CSS pixels for view calculations
    const w = this.canvas.clientWidth || this.canvas.width;
    const h = this.canvas.clientHeight || this.canvas.height;

    const P = this.projectAt(this.rotationPivot.latLng, this.zoom); // world (tile) px

    // Use cached trig values (updated in computeView)
    const cos = this.cachedCos;
    const sin = this.cachedSin;
    const cosP = this.cachedCosP;

    // Desired screen offset of the pivot from center, in CSS pixels
    const sx = this.rotationPivot.screen.x - w / 2;
    const sy = this.rotationPivot.screen.y - h / 2;

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
    const px1 = { x: s * (tf.a * minX + tf.b), y: s * (tf.c * minY + tf.d) };
    const px2 = { x: s * (tf.a * maxX + tf.b), y: s * (tf.c * maxY + tf.d) };
    // Normalize — transformation may flip axes
    const minPx = { x: Math.min(px1.x, px2.x), y: Math.min(px1.y, px2.y) };
    const maxPx = { x: Math.max(px1.x, px2.x), y: Math.max(px1.y, px2.y) };
    // Use CSS pixels for view calculations
    const w = this.canvas.clientWidth || this.canvas.width;
    const h = this.canvas.clientHeight || this.canvas.height;
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

  /** Signal that a redraw is needed (e.g. layer data changed) */
  requestRedraw() {
    this._needsRedraw = true;
  }
  private _needsRedraw = true;
  private _lastViewHash = "";

  private frame() {
    if (this.contextLost) return;
    const gl = this.gl;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w =
      Math.floor(this.canvas.clientWidth * dpr) || this.canvas.width || 300;
    const h =
      Math.floor(this.canvas.clientHeight * dpr) || this.canvas.height || 150;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      gl.viewport(0, 0, w, h);
      this._needsRedraw = true;
    }

    // animation step (zoom smoothing, pan smoothing, and anchor-preserving center)
    const now = performance.now();
    const dt = Math.min(1000, now - this.lastFrameTs);
    this.lastFrameTs = now;
    // exponential smoothing toward target zoom (controlled by zoomTimeMs)
    const alpha = this.softwareRender ? 1 : 1 - Math.exp(-dt / this.zoomTimeMs);

    // Smooth pan to target center
    if (this.targetCenter && !this.dragging) {
      const panAlpha = this.softwareRender ? 1 : 1 - Math.exp(-dt / 150); // ~150ms smoothing (instant in software mode)
      const dlat = this.targetCenter[0] - this.center[0];
      const dlng = this.targetCenter[1] - this.center[1];
      // Settle when the remaining movement is sub-pixel on screen. The ease is
      // asymptotic, so an absolute lat/lng threshold (1e-8) is effectively never
      // reached while the follow target keeps micro-updating with the player —
      // the view then changes by an imperceptible amount every frame, which
      // keeps viewHash changing and forces a full marker re-render every frame
      // forever (idle CPU stays high even when nothing visibly moves). A pixel
      // threshold stops the animation as soon as it's visually at the target and
      // lets tiny player jitters settle within a frame.
      const tp = this.projectAt(this.targetCenter, this.zoom);
      const cp = this.projectAt(this.center, this.zoom);
      const remainingPx = Math.hypot(tp.x - cp.x, tp.y - cp.y);
      if (remainingPx < 0.5) {
        this.center = this.targetCenter;
        this.targetCenter = null;
      } else {
        this.center = [
          this.center[0] + dlat * panAlpha,
          this.center[1] + dlng * panAlpha,
        ];
      }
    }
    if (Math.abs(this.targetZoom - this.zoom) > 1e-3) {
      const prevZoom = this.zoom;
      this.zoom = this.zoom + (this.targetZoom - this.zoom) * alpha;

      // Update center to keep anchor point fixed if animation is active
      if (this.zoomAnim && !this.dragging) {
        const { anchorLL, anchorScreen } = this.zoomAnim;

        // Calculate where the anchor point is now in world space at new zoom
        const anchorWorld = this.projectAt(anchorLL, this.zoom);

        // Calculate offset from screen center to anchor in CSS pixels
        const w = this.canvas.clientWidth || this.canvas.width;
        const h = this.canvas.clientHeight || this.canvas.height;

        // Use cached trig values
        const cos = this.cachedCos;
        const sin = this.cachedSin;
        const cosP = this.cachedCosP;

        const dx = anchorScreen.x - w / 2;
        const dy = anchorScreen.y - h / 2;

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

    // Pan inertia (skipped in software mode — coasting would just burn CPU
    // re-rasterizing every frame; the drag's end position is kept)
    if (this.softwareRender) this.panAnim = undefined;
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

    // Use CSS pixels for view matrix to ensure consistent zoom behavior across DPR
    const cssW = this.canvas.clientWidth || w;
    const cssH = this.canvas.clientHeight || h;
    const view = this.computeView(cssW, cssH);
    const state: RenderState = {
      devicePixelRatio: dpr,
      width: w,
      height: h,
      worldScale: 1, // pixels/world-pixel at current zoom
      zoom: this.zoom,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom,
      bearing: this.bearing,
      pitch: this.pitch,
      center: this.center,
      projection: this.projectionBound,
      viewMatrix: view,
    };

    // Skip rendering if nothing changed: same view matrix, no layer updates,
    // no active animations. Compare view matrix values directly (cheap).
    const viewHash = `${view[0]},${view[1]},${view[3]},${view[4]},${view[6]},${view[7]},${w},${h}`;
    // Check if any layer needs a rebuild (e.g. markers added/removed)
    const layersDirty = this.layers.some(
      ({ layer }) => "isDirty" in layer && (layer as any).isDirty(),
    );
    if (viewHash === this._lastViewHash && !this._needsRedraw && !layersDirty) {
      return;
    }
    this._lastViewHash = viewHash;
    this._needsRedraw = false;

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Provide a view matrix to layers via a GL uniform convention
    // Layers fetch it from WebMap via helper (they maintain their own programs)
    (gl as any)._webmapView = view;
    this.lastState = state;

    for (const { layer } of this.layers) {
      layer.render?.(gl, state);
    }

    // Track movement for moveend/zoomend events
    const isMoving =
      this.dragging ||
      this.rotating ||
      this.panAnim !== undefined ||
      this.targetCenter !== null ||
      this.zoomAnim !== undefined ||
      Math.abs(this.targetZoom - this.zoom) > 1e-3;

    if (this.wasMoving && !isMoving) {
      // Movement just stopped
      this.fire("moveend", undefined as any);
      if (Math.abs(this.zoom - this.lastZoom) > 0.01) {
        this.fire("zoomend", undefined as any);
      }
    }
    this.wasMoving = isMoving;
    if (!isMoving) {
      this.lastZoom = this.zoom;
    }
  }

  private handleClick(
    clientX: number,
    clientY: number,
    originalEvent: MouseEvent,
  ) {
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

    // Check for layer hits first (use DPR-scaled coordinates for hit testing)
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const { layer } = this.layers[i];
      if (typeof layer.pick === "function") {
        const hit = layer.pick(state, { x, y });
        if (hit) {
          // Call the layer's handleClick method if it exists (preferred)
          // Pass DPR-scaled coordinates to match what pick() expects
          if (typeof (layer as any).handleClick === "function") {
            (layer as any).handleClick(state, { x, y });
          }
          // Fallback to onClick for backward compatibility
          else if (typeof (layer as any).onClick === "function") {
            (layer as any).onClick(hit);
          }
          break;
        }
      }
    }

    // Fire map click event (whether or not a layer was hit)
    this.fire("click", {
      latlng,
      layerPoint: { x: localX, y: localY },
      originalEvent,
    });
  }

  private updateCursor(clientX: number, clientY: number) {
    if (this._cursorLocked) return;
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
