import type { AffineTransform, Layer, LatLng, RenderState } from '../types';
import { createProgram } from '../utils/gl';
import { tileVS, tileFS } from '../utils/shaders';
import { ColorBlindMode } from '../utils/color-blind';

export interface TileLayerOptions {
  url: string; // template: {z}/{x}/{y}.png with optional {s}
  subdomains?: string[];
  filter?: 'greyscale' | 'colorful' | null;
  colorBlind?: { mode: ColorBlindMode, severity: number } | null;
  tileSize?: number; // default 256
  minNativeZoom?: number;
  maxNativeZoom?: number;
  bounds?: [[number, number], [number, number]]; // [[minX,minY],[maxX,maxY]] in map units
  transformation?: [number, number, number, number]; // [a,b,c,d]
}

interface TileKey { z: number; x: number; y: number }
interface TileTex { key: TileKey; tex: WebGLTexture; localX: number; localY: number }

export class TileLayer implements Layer {
  private gl?: WebGL2RenderingContext;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private quad: WebGLBuffer | null = null;
  private textures: TileTex[] = [];
  private failedTiles = new Set<string>(); // Track failed tiles to prevent retries (server errors)
  private loadingTiles = new Set<string>(); // Track loading tiles
  private networkErrorTiles = new Map<string, number>(); // Track network error tiles with retry timestamp
  private opts: TileLayerOptions;
  private u_view_loc: WebGLUniformLocation | null = null;
  private u_tex_loc: WebGLUniformLocation | null = null;
  private u_px_loc: WebGLUniformLocation | null = null;
  private u_size_loc: WebGLUniformLocation | null = null;
  private u_alpha_loc: WebGLUniformLocation | null = null;
  private u_cb_mode_loc: WebGLUniformLocation | null = null;
  private u_cb_sev_loc: WebGLUniformLocation | null = null;
  private u_filter_loc: WebGLUniformLocation | null = null;
  private tileSize = 256;
  private minNativeZoom = 0;
  private maxNativeZoom = 24;
  private bounds?: { minX: number; minY: number; maxX: number; maxY: number };
  private tf?: AffineTransform;
  private activeZ?: number;
  private prevZ?: number;
  private zoomChangeAt = 0;
  private fadeMs = 220;

  constructor(opts: TileLayerOptions){ this.opts = opts; }

  setColorBlindMode(mode: ColorBlindMode) {
    if (!this.opts.colorBlind) {
      this.opts.colorBlind = { mode, severity: 1 };
    } else {
      this.opts.colorBlind.mode = mode;
    }
  }

  setColorBlindSeverity(severity: number) {
    if (!this.opts.colorBlind) {
      this.opts.colorBlind = { mode: 'none', severity };
    } else {
      this.opts.colorBlind.severity = Math.max(0, Math.min(1, severity));
    }
  }
  private initOnce(){
    if (this.opts.tileSize) this.tileSize = this.opts.tileSize;
    if (this.opts.minNativeZoom !== undefined) this.minNativeZoom = this.opts.minNativeZoom;
    if (this.opts.maxNativeZoom !== undefined) this.maxNativeZoom = this.opts.maxNativeZoom;
    if (this.opts.bounds){
      const [[minX, minY],[maxX,maxY]] = this.opts.bounds;
      this.bounds = { minX, minY, maxX, maxY };
    }
    if (this.opts.transformation){
      const [a,b,c,d] = this.opts.transformation;
      this.tf = { a,b,c,d };
    }
  }

  onAdd(gl: WebGL2RenderingContext): void {
    this.gl = gl;
    this.initOnce();
    this.program = createProgram(gl, tileVS, tileFS);
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    // unit quad
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 1,0, 0,1, 1,1]), gl.STATIC_DRAW);
    const a_pos = gl.getAttribLocation(this.program!, 'a_pos');
    gl.enableVertexAttribArray(a_pos);
    gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    // Cache uniform locations
    this.u_view_loc = gl.getUniformLocation(this.program!, 'u_view');
    this.u_tex_loc = gl.getUniformLocation(this.program!, 'u_tex');
    this.u_px_loc = gl.getUniformLocation(this.program!, 'u_px');
    this.u_size_loc = gl.getUniformLocation(this.program!, 'u_size');
    this.u_alpha_loc = gl.getUniformLocation(this.program!, 'u_alpha');
    this.u_cb_mode_loc = gl.getUniformLocation(this.program!, 'u_cb_mode');
    this.u_cb_sev_loc = gl.getUniformLocation(this.program!, 'u_cb_sev');
    this.u_filter_loc = gl.getUniformLocation(this.program!, 'u_filterMode');
  }

  onRemove(): void {
    // Cleanup GL resources
    // Note: Context might already be lost; guard deletes
    // Delete tile textures
    const gl = this.gl;
    if (gl) {
      for (const t of this.textures) { try { gl.deleteTexture(t.tex); } catch {} }
      this.textures = [];
      this.failedTiles.clear();
      this.loadingTiles.clear();
      this.networkErrorTiles.clear();
      if (this.quad) { try { gl.deleteBuffer(this.quad); } catch {} this.quad = null; }
      if (this.vao) { try { gl.deleteVertexArray(this.vao); } catch {} this.vao = null; }
      if (this.program) { try { gl.deleteProgram(this.program); } catch {} this.program = null; }
    }
    this.gl = undefined;
  }

  render(gl: WebGL2RenderingContext, state: RenderState): void {
    if (!this.program || !this.vao) return;

    // Determine visible tile range with fractional zoom support and optional affine bounds
    const zf = state.zoom;
    const nativeZ = Math.max(this.minNativeZoom, Math.min(this.maxNativeZoom, Math.floor(zf)));
    const scale = Math.pow(2, zf - nativeZ);

    // Track zoom changes for cross-fade
    if (this.activeZ === undefined) {
      this.activeZ = nativeZ;
      this.prevZ = undefined;
      this.zoomChangeAt = performance.now();
    } else if (this.activeZ !== nativeZ) {
      this.prevZ = this.activeZ;
      this.activeZ = nativeZ;
      this.zoomChangeAt = performance.now();
      // Clear failed tiles cache on zoom change to allow retries at different zoom levels
      this.failedTiles.clear();
      // Also clear network error cache to retry immediately at new zoom
      this.networkErrorTiles.clear();
    }

    // Compute viewport in world pixels at current zf using inverse view matrix
    const view = state.viewMatrix!;
    const a = view[0], b = view[1], c = view[3], d = view[4], tx = view[6], ty = view[7];
    const det = a*d - c*b;
    if (Math.abs(det) < 1e-12) return; // Much lower threshold to prevent perspective issues
    const invA =  d / det;
    const invB = -b / det;
    const invC = -c / det;
    const invD =  a / det;
    const invTx = -(invA*tx + invC*ty);
    const invTy = -(invB*tx + invD*ty);
    const toWorld = (cx: number, cy: number) => {
      return { x: invA*cx + invC*cy + invTx, y: invB*cx + invD*cy + invTy };
    };
    const tl = toWorld(-1,  1);
    const tr = toWorld( 1,  1);
    const bl = toWorld(-1, -1);
    const br = toWorld( 1, -1);
    const minPxWorld = { x: Math.min(tl.x,tr.x,bl.x,br.x), y: Math.min(tl.y,tr.y,bl.y,br.y) };
    const maxPxWorld = { x: Math.max(tl.x,tr.x,bl.x,br.x), y: Math.max(tl.y,tr.y,bl.y,br.y) };

    let minTile = { x: 0, y: 0 };
    let maxTile = { x: -1, y: -1 };
    let originX = 0; let originY = 0; // native pixel origin corresponding to tile (0,0)

    if (this.bounds && this.tf){
      // Compute bounds in native zoom pixel space and align tile indices to start from 0 at min bounds
      const Bn = pixelBoundsAt(nativeZ, this.bounds, this.tf);
      originX = Bn.minX; originY = Bn.minY;
      const minPxN = { x: minPxWorld.x / scale, y: minPxWorld.y / scale };
      const maxPxN = { x: maxPxWorld.x / scale, y: maxPxWorld.y / scale };

      // Compute tile index range within bounds (inclusive upper edges)
      const minIndex = {
        x: Math.floor((minPxN.x - originX) / this.tileSize),
        y: Math.floor((minPxN.y - originY) / this.tileSize),
      };
      const maxIndex = {
        x: Math.floor((maxPxN.x - originX - 1) / this.tileSize),
        y: Math.floor((maxPxN.y - originY - 1) / this.tileSize),
      };
      const maxAllowed = {
        x: Math.floor((Bn.maxX - originX - 1) / this.tileSize),
        y: Math.floor((Bn.maxY - originY - 1) / this.tileSize),
      };

      const clampMinX = Math.max(0, Math.min(minIndex.x, maxAllowed.x));
      const clampMinY = Math.max(0, Math.min(minIndex.y, maxAllowed.y));
      const clampMaxX = Math.max(clampMinX, Math.min(maxIndex.x, maxAllowed.x));
      const clampMaxY = Math.max(clampMinY, Math.min(maxIndex.y, maxAllowed.y));

      minTile = { x: clampMinX, y: clampMinY };
      maxTile = { x: clampMaxX, y: clampMaxY };
    } else {
      // Fallback: no bounds, use origin at 0 and allow negative indices (no clamp)
      const tileSizeScaled = (this.tileSize) * scale;
      minTile = { x: Math.floor(minPxWorld.x/tileSizeScaled), y: Math.floor(minPxWorld.y/tileSizeScaled) };
      maxTile = { x: Math.floor(maxPxWorld.x/tileSizeScaled), y: Math.floor(maxPxWorld.y/tileSizeScaled) };
    }

    if (maxTile.x >= minTile.x && maxTile.y >= minTile.y) {
      for (let ty = minTile.y; ty <= maxTile.y; ty++) {
        for (let tx = minTile.x; tx <= maxTile.x; tx++) {
          // Skip negative indices if we have bounds
          if (tx < 0 || ty < 0) continue;

          // Server addressing: z/{y}/{x} with top-left origin (no Y flip)
          const serverY = ty;
          const serverX = tx;

          // Skip negative server coordinates
          if (serverX < 0 || serverY < 0) continue;

          const k: TileKey = { z: nativeZ, x: serverX, y: serverY };
          const keyStr = `${k.z}/${k.x}/${k.y}`;

          // Skip if already failed or currently loading
          if (this.failedTiles.has(keyStr) || this.loadingTiles.has(keyStr)) continue;

          // Skip network error tiles until retry time (5 seconds backoff)
          const networkErrorTime = this.networkErrorTiles.get(keyStr);
          if (networkErrorTime && performance.now() < networkErrorTime) continue;

          const existing = this.textures.find((t) => sameKey(t.key, k));
          // Store local coordinates for rendering
          if (existing) {
            existing.localX = tx;
            existing.localY = ty;
          } else {
            this.loadingTiles.add(keyStr);
            this.loadTile(gl, k, tx, ty).then(({ tex, isNetworkError }) => {
              this.loadingTiles.delete(keyStr);
              if (tex) {
                this.textures.push(tex);
                // Clear from network error cache on success
                this.networkErrorTiles.delete(keyStr);
              } else {
                if (isNetworkError) {
                  // Network error: retry after 5 seconds
                  this.networkErrorTiles.set(keyStr, performance.now() + 5000);
                } else {
                  // Server error: mark as permanently failed
                  this.failedTiles.add(keyStr);
                }
              }
            });
          }
        }
      }
    }
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.uniformMatrix3fv(this.u_view_loc, false, (gl as any)._webmapView as Float32Array);
    gl.uniform1i(this.u_tex_loc, 0);

    // Draw tiles with cross-fade: previous zoom level fades out, active zoom is solid
    const mode = cbModeToInt(this.opts.colorBlind?.mode || 'none');
    const sev = this.opts.colorBlind?.severity ?? 0;
    gl.uniform1i(this.u_cb_mode_loc, mode);
    gl.uniform1f(this.u_cb_sev_loc, sev);
    gl.uniform1i(this.u_filter_loc, this.opts.filter === 'greyscale' ? 1 : 0);
    const u_alpha = this.u_alpha_loc!;
    const now = performance.now();
    const fade = this.prevZ !== undefined ? Math.max(0, 1 - (now - this.zoomChangeAt) / this.fadeMs) : 0;

    // Build set of loaded active tiles for coverage check
    const loadedActiveTiles = new Set<string>();
    for (const tt of this.textures) {
      if (tt.key.z === nativeZ) {
        loadedActiveTiles.add(`${tt.key.x},${tt.key.y}`);
      }
    }

    // First draw fallback tiles from other zoom levels (always draw these as base layer)
    // Sort by zoom level (closest to target first for best quality)
    const fallbackTiles = this.textures
      .filter(tt => tt.key.z !== nativeZ)
      .sort((a, b) => Math.abs(a.key.z - nativeZ) - Math.abs(b.key.z - nativeZ));

    for (const tt of fallbackTiles) {
      const z = tt.key.z;
      const scaleZ = Math.pow(2, zf - z);
      const size = this.tileSize * scaleZ;
      let originXz = 0, originYz = 0;
      if (this.bounds && this.tf){
        const Bz = pixelBoundsAt(z, this.bounds, this.tf);
        originXz = Bz.minX; originYz = Bz.minY;
      }
      const pxNative = originXz + tt.localX * this.tileSize;
      const pyNative = originYz + tt.localY * this.tileSize;
      const px = pxNative * scaleZ;
      const py = pyNative * scaleZ;
      if (px > maxPxWorld.x + size || px + size < minPxWorld.x || py > maxPxWorld.y + size || py + size < minPxWorld.y) continue;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tt.tex);
      gl.uniform2f(this.u_px_loc, px, py);
      gl.uniform2f(this.u_size_loc, size, size);
      gl.uniform1f(u_alpha, 1.0); // Full opacity for fallback tiles
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // No separate prevZ rendering needed - fallback tiles already rendered above
    const keepPrevTiles = this.prevZ !== undefined && fade > 0;

    // Then draw active zoom tiles solid
    for(const tt of this.textures){
      if (tt.key.z !== nativeZ) continue;
      const z = tt.key.z;
      const scaleZ = Math.pow(2, zf - z);
      const size = this.tileSize * scaleZ;
      let originXz = 0, originYz = 0, maxX = Infinity, maxY = Infinity;
      if (this.bounds && this.tf){
        const Bz = pixelBoundsAt(z, this.bounds, this.tf);
        originXz = Bz.minX; originYz = Bz.minY;
        maxX = Math.floor((Bz.maxX - originXz - 1)/this.tileSize);
        maxY = Math.floor((Bz.maxY - originYz - 1)/this.tileSize);
      }
      const pxNative = originXz + tt.localX * this.tileSize;
      const pyNative = originYz + tt.localY * this.tileSize;
      const px = pxNative * scaleZ;
      const py = pyNative * scaleZ;
      if (px > maxPxWorld.x + size || px + size < minPxWorld.x || py > maxPxWorld.y + size || py + size < minPxWorld.y) continue;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tt.tex);
      gl.uniform2f(this.u_px_loc, px, py);
      gl.uniform2f(this.u_size_loc, size, size);
      gl.uniform1f(u_alpha, 1.0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    this.evictUnusedTiles(gl, {
      minPxWorld,
      maxPxWorld,
      zoomFractional: zf,
      nativeZ,
      keepPrev: keepPrevTiles,
    });
    gl.bindVertexArray(null);
  }

  private async loadTile(gl: WebGL2RenderingContext, key: TileKey, localX: number, localY: number): Promise<{ tex: TileTex | null, isNetworkError: boolean }> {
    const url = templateURL(this.opts.url, key, this.opts.subdomains);
    try {
      const img = await loadImage(url, 'anonymous');
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      return { tex: { key, tex, localX, localY }, isNetworkError: false };
    } catch (error: any) {
      // Check if this is a network error (should retry) or server error (permanent)
      const isNetworkError = error?.isNetworkError ?? false;
      return { tex: null, isNetworkError };
    }
  }
  private evictUnusedTiles(
    gl: WebGL2RenderingContext,
    params: {
      minPxWorld: { x: number; y: number };
      maxPxWorld: { x: number; y: number };
      zoomFractional: number;
      nativeZ: number;
      keepPrev: boolean;
    },
  ) {
    if (this.textures.length === 0) return;

    const { minPxWorld, maxPxWorld, zoomFractional, nativeZ, keepPrev } = params;
    const padding = this.tileSize * Math.pow(2, zoomFractional - nativeZ);
    const paddedMinX = minPxWorld.x - padding;
    const paddedMinY = minPxWorld.y - padding;
    const paddedMaxX = maxPxWorld.x + padding;
    const paddedMaxY = maxPxWorld.y + padding;
    const retained: TileTex[] = [];

    for (const tex of this.textures) {
      const z = tex.key.z;
      const isActiveZoom = z === nativeZ;
      const isPrevZoom = keepPrev && this.prevZ !== undefined && z === this.prevZ;

      // Keep tiles that are within reasonable zoom range (±3 levels) for fallback
      const zoomDelta = Math.abs(z - nativeZ);
      const isReasonableZoom = zoomDelta <= 3;

      // Delete tiles that are too far from current zoom and not in viewport
      if (!isActiveZoom && !isPrevZoom && !isReasonableZoom) {
        try {
          gl.deleteTexture(tex.tex);
        } catch {}
        continue;
      }

      const scaleZ = Math.pow(2, zoomFractional - z);
      const size = this.tileSize * scaleZ;
      let originXz = 0;
      let originYz = 0;
      if (this.bounds && this.tf) {
        const boundsPx = pixelBoundsAt(z, this.bounds, this.tf);
        originXz = boundsPx.minX;
        originYz = boundsPx.minY;
      }
      const pxNative = originXz + tex.localX * this.tileSize;
      const pyNative = originYz + tex.localY * this.tileSize;
      const px = pxNative * scaleZ;
      const py = pyNative * scaleZ;

      const intersects =
        px <= paddedMaxX &&
        px + size >= paddedMinX &&
        py <= paddedMaxY &&
        py + size >= paddedMinY;

      if (intersects) {
        retained.push(tex);
      } else {
        try {
          gl.deleteTexture(tex.tex);
        } catch {}
      }
    }

    this.textures = retained;
  }

}

function sameKey(a: TileKey, b: TileKey){ return a.z===b.z && a.x===b.x && a.y===b.y }
// removed unused helpers (clamp, wrap, project)

function templateURL(tpl: string, key: TileKey, subs?: string[]){
  const s = subs && subs.length>0 ? subs[Math.floor(Math.random()*subs.length)] : '';
  // Support any order of {x}/{y}
  return tpl
    .replace('{s}', s)
    .replace('{z}', String(key.z))
    .replace('{x}', String(key.x))
    .replace('{y}', String(key.y));
}

function loadImage(src: string, crossOrigin?: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => res(img);
    img.onerror = (event) => {
      // Check if this is a network error (offline) or server error (404, etc)
      // Network errors don't provide HTTP status, server errors do via naturalWidth === 0
      const error: any = new Error('Image load failed');
      // If we're offline or have network issues, the error event won't have loaded any data
      // Server errors (404, 403, etc) will complete the request but fail to decode
      error.isNetworkError = !navigator.onLine;
      rej(error);
    };
    img.src = src;
  });
}

function cbModeToInt(mode: ColorBlindMode): number {
  switch(mode){
    case 'protanopia': return 1;
    case 'deuteranopia': return 2;
    case 'tritanopia': return 3;
    case 'none':
    default: return 0;
  }
}

function pixelAt([x,y]: [number,number], z: number, tf: AffineTransform){
  const scale = Math.pow(2, z);
  return { x: scale * (tf.a * x + tf.b), y: scale * (tf.c * y + tf.d) };
}
function pixelBoundsAt(z: number, bounds: {minX:number;minY:number;maxX:number;maxY:number}, tf: AffineTransform){
  const p1 = pixelAt([bounds.minX, bounds.minY], z, tf);
  const p2 = pixelAt([bounds.minX, bounds.maxY], z, tf);
  const p3 = pixelAt([bounds.maxX, bounds.minY], z, tf);
  const p4 = pixelAt([bounds.maxX, bounds.maxY], z, tf);
  return {
    minX: Math.min(p1.x,p2.x,p3.x,p4.x),
    minY: Math.min(p1.y,p2.y,p3.y,p4.y),
    maxX: Math.max(p1.x,p2.x,p3.x,p4.x),
    maxY: Math.max(p1.y,p2.y,p3.y,p4.y),
  };
}
