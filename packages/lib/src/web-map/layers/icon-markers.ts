import type { Layer, LatLng, RenderState } from "../types";
import { createProgram } from "../utils/gl";
import { ColorBlindMode } from "../utils/color-blind";

// Simple icon marker layer that draws textured quads from one or more sprite sheets.
// Batches draw calls per sheet texture and uses instancing within each batch.

export interface IconSheet {
  name: string;
  url: string;
}

export interface IconRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IconMarkerInstance {
  id: string;
  latLng: LatLng;
  size: number; // pixel size of the square on screen (before highlight)
  sheet: string; // sheet name
  rect: IconRect; // sub-rect in pixels on the sheet image
  key?: string; // type/category key for grouping
  z?: number; // optional elevation for relative z-arrow logic
  isHighlighted?: boolean;
  isDiscovered?: boolean; // greyscale + alpha reduction
  zPos?: "top" | "bottom" | null;
  zMag?: number; // 0..1 magnitude of relative z (for halo)
  isSelected?: boolean;
  rotation?: number; // radians
  keepUpright?: boolean; // do not rotate with map bearing
}

type SheetTex = { name: string; tex: WebGLTexture; w: number; h: number };

const DEFAULT_Z_NORMALIZATION = 200;

const vs = `#version 300 es
in vec2 a_pos;      // unit quad [0..1] OR line position for height stems
in vec2 a_offset;   // world px top-left
in vec2 a_size;     // size in px
in vec4 a_uv;       // uv origin (xy) and size (zw)
in float a_disc;    // per-instance discovered flag (0/1)
in vec2 a_flags;    // x: normalized height, y: zpos(-1/0/1)
in float a_count;   // stacked count (>=1)
in float a_angle;   // rotation in radians
in float a_renderMode; // 0=icon, 1=height stem
in float a_keepUpright; // 1=billboard mode, 0=use own rotation
uniform mat3 u_view; // world->clip
uniform float u_pitch; // camera pitch for 3D effect
uniform float u_bearing; // camera bearing for perspective direction
uniform vec2 u_screen; // screen dimensions for billboard scaling
uniform float u_zoom; // zoom level
const float MIN_NEEDLE_WORLD = 0.0;
const float MAX_NEEDLE_WORLD = 20.0;

out vec2 v_uv;
out vec2 v_localUv;  // local UV for overlays (0..1 across the entire quad)
out float v_disc;
out vec2 v_flags;
out float v_count;
out float v_renderMode;
void main(){
  v_renderMode = a_renderMode;

  float heightIntensity = clamp(a_flags.x, 0.0, 1.0);
  float directionFlag = a_flags.y;
  float direction = directionFlag > 0.5 ? 1.0 : (directionFlag < -0.5 ? -1.0 : 0.0);

  // Calculate needle height scaled by zoom
  float zoomScale = pow(2.0, u_zoom);
  float heightWorld = mix(MIN_NEEDLE_WORLD, MAX_NEEDLE_WORLD, heightIntensity) * abs(sin(u_pitch)) * zoomScale * 500.0;
  float iconDirection = direction;
  if (abs(iconDirection) < 0.5 || heightIntensity < 0.01) {
    iconDirection = 0.0;
  }

  if (a_renderMode < 0.5) {
    // Icon rendering with conditional billboard behavior
    vec2 center = a_offset + 0.5 * a_size;
    vec2 local = (a_pos - 0.5) * a_size;

    if (a_keepUpright > 0.5) {
      // Billboard mode: icon always faces the camera
      // Transform center first, then apply height in SCREEN space (always upward)
      vec3 centerScreen = u_view * vec3(center, 1.0);

      // Apply height offset in screen Y (up direction in screen space)
      // Scale height by view matrix scale to make it zoom-responsive
      float viewScale = length(vec2(u_view[0][0], u_view[1][0]));
      float heightClip = heightWorld * viewScale * (2.0 / u_screen.y);
      centerScreen.y += heightClip * iconDirection;

      // Apply icon rotation in screen space
      float cs = cos(a_angle), sn = sin(a_angle);
      vec2 rot = vec2(cs*local.x - sn*local.y, sn*local.x + cs*local.y);

      // Apply screen-space offset directly (no perspective compression)
      vec2 screenOffset = rot * vec2(2.0 / u_screen.x, -2.0 / u_screen.y);

      gl_Position = vec4(centerScreen.xy + screenOffset, 0.0, 1.0);
    } else {
      // Player mode: use world-space rotation (affected by perspective)
      float cs = cos(a_angle), sn = sin(a_angle);
      vec2 rot = vec2(cs*local.x - sn*local.y, sn*local.x + cs*local.y);
      vec2 iconPos = center + rot;

      // Apply height effect in SCREEN space after view transform
      vec3 screenPos = u_view * vec3(iconPos, 1.0);
      float viewScale = length(vec2(u_view[0][0], u_view[1][0]));
      float heightClip = heightWorld * viewScale * (2.0 / u_screen.y);
      screenPos.y += heightClip * iconDirection;

      gl_Position = vec4(screenPos.xy, 0.0, 1.0);
    }
    v_uv = a_uv.xy + a_pos * a_uv.zw;
  } else {
    // Render needle/pin stem
    vec2 center = a_offset + 0.5 * a_size;
    float effectiveDirection = direction;
    if (abs(effectiveDirection) < 0.5 || heightIntensity < 0.01) {
      effectiveDirection = 0.0;
    }
    float effectiveHeight = heightWorld * effectiveDirection;

    // Transform to screen space first
    vec3 groundPos = u_view * vec3(center, 1.0);

    // Apply needle in screen Y direction, scaled appropriately
    float viewScale = length(vec2(u_view[0][0], u_view[1][0]));
    float heightClip = effectiveHeight * viewScale * (2.0 / u_screen.y);
    vec3 screenPos = groundPos;
    screenPos.y += heightClip * a_pos.x;

    gl_Position = vec4(screenPos.xy, 0.0, 1.0);

    v_uv = vec2(0.5); // Neutral UV for line
  }

  v_localUv = a_pos;
  v_disc = a_disc;
  v_flags = a_flags;
  v_count = a_count;
}
`;

const fs = `#version 300 es
precision highp float;
uniform sampler2D u_tex;
uniform int u_cb_mode; // 0 none, 1 prot, 2 deut, 3 trit
uniform float u_cb_sev; // 0..1
in vec2 v_uv;
in vec2 v_localUv;  // 0..1 across entire quad
in float v_disc;
in vec2 v_flags;
in float v_count;
in float v_renderMode;
out vec4 outColor;
// 7-segment helpers for tiny digit rendering
float hseg(vec2 uv, float y){
  float thickness = 0.18;
  return step(abs(uv.y - y), thickness*0.5) * step(0.1, uv.x) * step(uv.x, 0.9);
}
float vseg(vec2 uv, float x){
  float thickness = 0.18;
  return step(abs(uv.x - x), thickness*0.5) * step(0.15, uv.y) * step(uv.y, 0.85);
}
float segDigit(int d, vec2 uv){
  float a = hseg(uv, 0.15);
  float g = hseg(uv, 0.50);
  float dseg = hseg(uv, 0.85);
  float f = vseg(uv, 0.15);
  float b = vseg(uv, 0.85);
  float e = vseg(uv, 0.15);
  float c = vseg(uv, 0.85);
  float on = 0.0;
  if (d==0){ on = max(max(a,b),max(c,max(dseg,max(e,f)))); }
  else if (d==1){ on = max(b,c); }
  else if (d==2){ on = max(max(a,b),max(g,max(e,dseg))); }
  else if (d==3){ on = max(max(a,b),max(g,max(c,dseg))); }
  else if (d==4){ on = max(max(f,g),max(b,c)); }
  else if (d==5){ on = max(max(a,f),max(g,max(c,dseg))); }
  else if (d==6){ on = max(max(a,f),max(g,max(c,max(dseg,e)))); }
  else if (d==7){ on = max(a,max(b,c)); }
  else if (d==8){ on = max(max(a,b),max(c,max(dseg,max(e,max(f,g))))); }
  else if (d==9){ on = max(max(a,b),max(c,max(dseg,max(f,g)))); }
  return on;
}
// Signed distance to line segment (global function for chevrons)
float sdSegment(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);
  return length(pa - ba*h);
}

vec3 simulateCB(vec3 rgb, int mode){
  if(mode==1){ // protanopia
    mat3 M = mat3(0.56667, 0.43333, 0.0,
                  0.55833, 0.44167, 0.0,
                  0.0,     0.24167, 0.75833);
    return M * rgb;
  } else if(mode==2){ // deuteranopia
    mat3 M = mat3(0.625,  0.375,  0.0,
                  0.7,    0.3,    0.0,
                  0.0,    0.3,    0.7);
    return M * rgb;
  } else if(mode==3){ // tritanopia
    mat3 M = mat3(0.95,  0.05,   0.0,
                  0.0,   0.433,  0.567,
                  0.0,   0.475,  0.525);
    return M * rgb;
  }
  return rgb;
}
void main(){
  if (v_renderMode > 0.5) {
    // Render needle/pin stem
    float zHeight = clamp(abs(v_flags.x), 0.0, 1.0);
    if (zHeight < 0.05 || abs(v_flags.y) < 0.5) {
      discard; // Don't draw needles for very small heights
    }

    // Create a thick, visible needle line
    float alpha = 1.0; // Fully opaque needles

    // Color based on height: low = green, medium = yellow, high = red
    float heightNorm = zHeight;
    vec3 needleColor;
    if (heightNorm < 0.5) {
      needleColor = mix(vec3(0.2, 0.8, 0.2), vec3(1.0, 1.0, 0.2), heightNorm * 2.0);
    } else {
      needleColor = mix(vec3(1.0, 1.0, 0.2), vec3(1.0, 0.2, 0.2), (heightNorm - 0.5) * 2.0);
    }

    outColor = vec4(needleColor, alpha);
    return;
  }

  // Normal icon rendering
  vec4 c = texture(u_tex, v_uv);
  if (v_disc > 0.5) {
    float g = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
    c = vec4(vec3(g), c.a * 0.5);
  }
  // Use v_localUv for overlays (0..1 across the entire rendered quad)
  vec2 uv = v_localUv;
  float zTop = step(0.5, v_flags.y);
  float zBottom = step(0.5, -v_flags.y);
  vec3 draw = c.rgb;
  float alpha = c.a;
  // Track overlay coverage to ensure alpha shows overlays even if base is transparent
  float overlayAlpha = 0.0;

  // No cluster indicator anymore; show all candidates in hover UI instead

  // Relative-Z small triangle arrow with outline/shadow, placed just outside icon area (top/bottom)
  float zMag = clamp(v_flags.x, 0.0, 1.0); // 0..1 magnitude (scales size)
  float dir = (zTop > 0.5 ? 1.0 : (zBottom > 0.5 ? -1.0 : 0.0));
  if (abs(dir) > 0.5) {
    // Size and placement (kept subtle)
    float base = 0.07 + 0.02*zMag;   // base half-width
    float gap = 0.02;                // gap from edge
    vec2 vA, vB, vC;                 // triangle vertices
    if (dir > 0.0) {
      // Above: point up, located just above icon
      float yTip = 0.0 + gap;
      vA = vec2(0.5, yTip);                 // tip
      vB = vec2(0.5 - base, yTip + base);   // left base
      vC = vec2(0.5 + base, yTip + base);   // right base
    } else {
      // Below: point down, located just below icon
      float yTip = 1.0 - gap;
      vA = vec2(0.5, yTip);                 // tip
      vB = vec2(0.5 - base, yTip - base);   // left base
      vC = vec2(0.5 + base, yTip - base);   // right base
    }
    // Barycentric
    vec2 e0 = vB - vA, e1 = vC - vA, vp = uv - vA;
    float d00 = dot(e0,e0); float d01 = dot(e0,e1); float d11 = dot(e1,e1);
    float d20 = dot(vp,e0); float d21 = dot(vp,e1);
    float inv = 1.0 / max(d00*d11 - d01*d01, 1e-6);
    float vv = (d11 * d20 - d01 * d21) * inv;
    float ww = (d00 * d21 - d01 * d20) * inv;
    float uu = 1.0 - vv - ww;
    float inside = step(0.0, min(min(uu,vv),ww));
    // Edge distance for outline
    float edge = min(min(vv, ww), uu);
    // Shadow under arrow
    vec2 shOfs = vec2(0.007, 0.007);
    vec2 vps = uv - shOfs - vA;
    float vvs = (d11 * dot(vps,e0) - d01 * dot(vps,e1)) * inv;
    float wws = (d00 * dot(vps,e1) - d01 * dot(vps,e0)) * inv;
    float uus = 1.0 - vvs - wws;
    float shInside = step(0.0, min(min(uus,vvs),wws));
    draw = mix(draw, vec3(0.0), shInside * 0.35);
    overlayAlpha = max(overlayAlpha, shInside * 0.35);
    // Stroke + fill (limit stroke to triangle vicinity)
    float stroke = (inside) * (1.0 - smoothstep(0.012, 0.016, edge));
    float fill = inside;
    vec3 arrowCol = vec3(1.0);
    // Apply stroke then fill
    draw = mix(draw, vec3(0.0), stroke);
    draw = mix(draw, arrowCol, fill);
    overlayAlpha = max(overlayAlpha, max(stroke, fill));
  }

  // (disabled) count badge rendering

  // Apply color-blind simulation (only to non-discovered icons to avoid double-greyscale)
  if(u_cb_mode != 0 && v_disc < 0.5){
    vec3 sim = simulateCB(draw, u_cb_mode);
    draw = mix(draw, sim, clamp(u_cb_sev, 0.0, 1.0));
  }

  // Ensure overlays are visible even over transparent sprite padding
  alpha = max(alpha, overlayAlpha);
  outColor = vec4(draw, alpha);
}
`;

export class IconMarkerLayer implements Layer {
  private gl?: WebGL2RenderingContext;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private quad: WebGLBuffer | null = null;
  private sheets: Map<string, SheetTex> = new Map();
  private sheetImages: Map<string, HTMLImageElement> = new Map();
  private instances: IconMarkerInstance[] = [];
  private instancesById: Map<string, number> = new Map(); // Track index by ID to prevent duplicates
  private iconMap: Map<string, { sheet: string; rect: IconRect }> = new Map();
  onClick?: (m: IconMarkerInstance) => void;
  private instancesVersion = 0;
  private lastRenderedVersion = -1;
  private nullCount = 0; // Track number of null entries for compaction
  private hoveredMarkerId: string | null = null; // Track currently hovered marker

  // Event handler maps for per-marker callbacks
  private eventHandlers = {
    click: new Map<string, (m: IconMarkerInstance) => void>(),
    mouseover: new Map<string, (m: IconMarkerInstance) => void>(),
    mouseout: new Map<string, (m: IconMarkerInstance) => void>(),
    mousedown: new Map<string, (m: IconMarkerInstance) => void>(),
    contextmenu: new Map<string, (m: IconMarkerInstance) => void>(),
  };

  // Pre-allocated buffers for performance (reused across frames)
  private preallocatedBuffers: {
    offsets?: Float32Array;
    sizes?: Float32Array;
    uvs?: Float32Array;
    discs?: Float32Array;
    flags?: Float32Array;
    counts?: Float32Array;
    angles?: Float32Array;
    keepUprights?: Float32Array;
    stemModes?: Float32Array;
    iconModes?: Float32Array;
    capacity: number;
  } = { capacity: 0 };

  // per-draw buffers (rebuilt per frame per sheet)
  private offsets!: WebGLBuffer;
  private sizes!: WebGLBuffer;
  private uvs!: WebGLBuffer;
  private flags!: WebGLBuffer;
  private discs!: WebGLBuffer;
  private angles!: WebGLBuffer;
  private counts!: WebGLBuffer;
  private renderModes!: WebGLBuffer;
  private keepUprights!: WebGLBuffer;
  private u_view_loc: WebGLUniformLocation | null = null;
  private u_tex_loc: WebGLUniformLocation | null = null;
  private u_pitch_loc: WebGLUniformLocation | null = null;
  private u_bearing_loc: WebGLUniformLocation | null = null;
  private u_screen_loc: WebGLUniformLocation | null = null;
  private u_zoom_loc: WebGLUniformLocation | null = null;
  private u_cb_mode_loc: WebGLUniformLocation | null = null;
  private u_cb_sev_loc: WebGLUniformLocation | null = null;
  private hidden?: Set<string>;
  private colorBlindMode: ColorBlindMode = "none";
  private colorBlindSeverity: number = 1;

  addSheet(name: string, source: string | HTMLImageElement) {
    if (source instanceof HTMLImageElement) {
      this.sheetImages.set(name, source);
    } else {
      this.sheetImages.set(name, this.createImage(source));
    }
  }
  add(m: IconMarkerInstance) {
    // Check if marker already exists by ID
    const existingIndex = this.instancesById.get(m.id);
    if (existingIndex !== undefined) {
      // Update existing marker instead of adding duplicate
      this.instances[existingIndex] = m;
    } else {
      // Add new marker
      const newIndex = this.instances.length;
      this.instances.push(m);
      this.instancesById.set(m.id, newIndex);
    }
    this.instancesVersion++;
  }
  remove(id: string) {
    const index = this.instancesById.get(id);
    if (index !== undefined) {
      // Mark for removal by setting to null (cleanup later)
      // This avoids O(n) splice and index rebuild on every removal
      (this.instances as any)[index] = null;
      this.instancesById.delete(id);
      this.nullCount++;
      this.instancesVersion++;

      // Compact if more than 25% of array is null entries
      if (this.nullCount > this.instances.length * 0.25) {
        this.compact();
      }
    }
  }

  // Batch remove multiple markers efficiently
  removeMany(ids: string[]) {
    let removed = 0;
    for (const id of ids) {
      const index = this.instancesById.get(id);
      if (index !== undefined) {
        (this.instances as any)[index] = null;
        this.instancesById.delete(id);
        removed++;
      }
    }
    this.nullCount += removed;
    this.instancesVersion++;

    // Always compact after batch removal to keep array clean
    if (removed > 0) {
      this.compact();
    }
  }

  // Compact the array by removing nulls (call periodically or after batch operations)
  private compact() {
    if (this.nullCount === 0) return; // No work needed

    const compacted: IconMarkerInstance[] = [];
    this.instancesById.clear();
    for (let i = 0; i < this.instances.length; i++) {
      const instance = this.instances[i];
      if (instance !== null) {
        this.instancesById.set(instance.id, compacted.length);
        compacted.push(instance);
      }
    }
    this.instances = compacted;
    this.nullCount = 0; // Reset null count after compaction
  }
  clear() {
    this.instances = [];
    this.instancesById.clear();
    this.nullCount = 0;
    this.instancesVersion++;
  }
  setHiddenById(ids: Set<string> | undefined) {
    this.hidden = ids;
    this.instancesVersion++; // Mark as dirty when visibility changes
  }
  getInstances() {
    return this.instances;
  }

  setColorBlindMode(mode: ColorBlindMode) {
    this.colorBlindMode = mode;
  }

  setColorBlindSeverity(severity: number) {
    this.colorBlindSeverity = Math.max(0, Math.min(1, severity));
  }

  private cbModeToInt(mode: ColorBlindMode): number {
    switch (mode) {
      case "protanopia":
        return 1;
      case "deuteranopia":
        return 2;
      case "tritanopia":
        return 3;
      case "none":
      default:
        return 0;
    }
  }

  // Load a mapping from a JSON endpoint where entries carry an `icon` rect
  async loadFilterIconMap(url: string, sheetBase?: string) {
    const res = await fetch(url);
    const data = await res.json();
    const map = new Map<string, { sheet: string; rect: IconRect }>();
    console.log("Loading filter icon map from", url, sheetBase);
    const resolveSheet = (s?: string) => {
      if (!s || s.length === 0) return undefined;
      if (/^https?:\/\//i.test(s)) return s;
      if (sheetBase) {
        // join base + s
        const base = sheetBase.endsWith("/") ? sheetBase : sheetBase + "/";
        return base + s.replace(/^\//, "");
      }
      if (s.startsWith("/")) {
        try {
          return new URL(s, window.location.origin).toString();
        } catch {
          return s;
        }
      }
      return s;
    };

    const push = (key: string, icon: any, sheetUrl?: string) => {
      if (!icon) return;
      const { x, y, width, height } = icon;
      if (
        typeof x === "number" &&
        typeof y === "number" &&
        typeof width === "number" &&
        typeof height === "number"
      ) {
        const sheet = resolveSheet(sheetUrl || icon.url);
        if (typeof sheet === "string" && sheet.length > 0) {
          // Register sheet by its URL (use URL as sheet key)
          if (!this.sheetImages.has(sheet)) this.addSheet(sheet, sheet);
          map.set(key, { sheet, rect: { x, y, width, height } });
        }
      }
    };
    // Expecting Filter[] where each has values: [{ id, icon:{url,x,y,width,height}, ... }]
    if (Array.isArray(data)) {
      for (const group of data) {
        const values = group?.values;
        if (Array.isArray(values)) {
          for (const v of values) {
            const id = v?.id;
            const icon = v?.icon;
            if (id && icon) push(String(id), icon, icon.url);
          }
        }
      }
    }
    this.iconMap = map;
    return map.size;
  }

  addByKey(params: {
    id: string;
    latLng: LatLng;
    key: string;
    size: number;
    isHighlighted?: boolean;
    isDiscovered?: boolean;
    zPos?: "top" | "bottom" | null;
    z?: number;
  }) {
    const entry = this.iconMap.get(params.key);
    if (!entry) return;
    this.add({
      id: params.id,
      latLng: params.latLng,
      size: params.size,
      sheet: entry.sheet,
      rect: entry.rect,
      key: params.key,
      z: params.z,
      zMag:
        params.z !== undefined
          ? Math.min(1, Math.abs(params.z) / DEFAULT_Z_NORMALIZATION)
          : undefined,
      isHighlighted: params.isHighlighted,
      isDiscovered: params.isDiscovered,
      zPos: params.zPos ?? null,
    });
  }

  onAdd(gl: WebGL2RenderingContext): void {
    this.gl = gl;
    this.program = createProgram(gl, vs, fs);
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    // unit quad
    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const a_pos = gl.getAttribLocation(this.program!, "a_pos");
    gl.enableVertexAttribArray(a_pos);
    gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);

    // dynamic buffers
    this.offsets = gl.createBuffer()!;
    const a_offset = gl.getAttribLocation(this.program!, "a_offset");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.offsets);
    gl.enableVertexAttribArray(a_offset);
    gl.vertexAttribPointer(a_offset, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(a_offset, 1);

    this.sizes = gl.createBuffer()!;
    const a_size = gl.getAttribLocation(this.program!, "a_size");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sizes);
    gl.enableVertexAttribArray(a_size);
    gl.vertexAttribPointer(a_size, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(a_size, 1);

    this.uvs = gl.createBuffer()!;
    const a_uv = gl.getAttribLocation(this.program!, "a_uv");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvs);
    gl.enableVertexAttribArray(a_uv);
    gl.vertexAttribPointer(a_uv, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(a_uv, 1);

    this.discs = gl.createBuffer()!;
    const a_disc = gl.getAttribLocation(this.program!, "a_disc");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.discs);
    gl.enableVertexAttribArray(a_disc);
    gl.vertexAttribPointer(a_disc, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(a_disc, 1);

    this.flags = gl.createBuffer()!;
    const a_flags = gl.getAttribLocation(this.program!, "a_flags");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.flags);
    gl.enableVertexAttribArray(a_flags);
    gl.vertexAttribPointer(a_flags, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(a_flags, 1);

    this.angles = gl.createBuffer()!;
    const a_angle = gl.getAttribLocation(this.program!, "a_angle");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.angles);
    gl.enableVertexAttribArray(a_angle);
    gl.vertexAttribPointer(a_angle, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(a_angle, 1);

    // Count attribute (stack size)
    this.counts = gl.createBuffer()!;
    const a_count = gl.getAttribLocation(this.program!, "a_count");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.counts);
    gl.enableVertexAttribArray(a_count);
    gl.vertexAttribPointer(a_count, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(a_count, 1);

    // Render mode attribute (0=icon, 1=height stem)
    this.renderModes = gl.createBuffer()!;
    const a_renderMode = gl.getAttribLocation(this.program!, "a_renderMode");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.renderModes);
    gl.enableVertexAttribArray(a_renderMode);
    gl.vertexAttribPointer(a_renderMode, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(a_renderMode, 1);

    // KeepUpright attribute (1=billboard, 0=player rotation)
    this.keepUprights = gl.createBuffer()!;
    const a_keepUpright = gl.getAttribLocation(this.program!, "a_keepUpright");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.keepUprights);
    gl.enableVertexAttribArray(a_keepUpright);
    gl.vertexAttribPointer(a_keepUpright, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(a_keepUpright, 1);

    gl.bindVertexArray(null);
    // cache uniform locations
    this.u_view_loc = gl.getUniformLocation(this.program!, "u_view");
    this.u_tex_loc = gl.getUniformLocation(this.program!, "u_tex");
    this.u_pitch_loc = gl.getUniformLocation(this.program!, "u_pitch");
    this.u_bearing_loc = gl.getUniformLocation(this.program!, "u_bearing");
    this.u_screen_loc = gl.getUniformLocation(this.program!, "u_screen");
    this.u_zoom_loc = gl.getUniformLocation(this.program!, "u_zoom");
    this.u_cb_mode_loc = gl.getUniformLocation(this.program!, "u_cb_mode");
    this.u_cb_sev_loc = gl.getUniformLocation(this.program!, "u_cb_sev");
  }

  onRemove(): void {
    const gl = this.gl;
    if (gl) {
      // delete sheet textures
      for (const s of this.sheets.values()) {
        try {
          gl.deleteTexture(s.tex);
        } catch {}
      }
      this.sheets.clear();
      this.sheetImages.clear();
      if (this.quad) {
        try {
          gl.deleteBuffer(this.quad);
        } catch {}
        this.quad = null;
      }
      if (this.offsets) {
        try {
          gl.deleteBuffer(this.offsets);
        } catch {}
      }
      if (this.sizes) {
        try {
          gl.deleteBuffer(this.sizes);
        } catch {}
      }
      if (this.uvs) {
        try {
          gl.deleteBuffer(this.uvs);
        } catch {}
      }
      if (this.discs) {
        try {
          gl.deleteBuffer(this.discs);
        } catch {}
      }
      if (this.flags) {
        try {
          gl.deleteBuffer(this.flags);
        } catch {}
      }
      if (this.angles) {
        try {
          gl.deleteBuffer(this.angles);
        } catch {}
      }
      if (this.counts) {
        try {
          gl.deleteBuffer(this.counts);
        } catch {}
      }
      if (this.vao) {
        try {
          gl.deleteVertexArray(this.vao);
        } catch {}
        this.vao = null;
      }
      if (this.program) {
        try {
          gl.deleteProgram(this.program);
        } catch {}
        this.program = null;
      }
    }
    this.gl = undefined;
  }

  private ensureSheet(gl: WebGL2RenderingContext, name: string) {
    if (this.sheets.has(name)) return this.sheets.get(name)!;
    const img = this.sheetImages.get(name);
    if (!img || !img.complete || img.naturalWidth === 0) return null;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    const entry = { name, tex, w: img.naturalWidth, h: img.naturalHeight };
    this.sheets.set(name, entry);
    return entry;
  }

  render(gl: WebGL2RenderingContext, state: RenderState): void {
    if (!this.program || !this.vao) return;
    if (this.instances.length === 0) return;

    // Group by sheet
    const groups = new Map<string, IconMarkerInstance[]>();
    for (let i = 0; i < this.instances.length; i++) {
      const m = this.instances[i];
      if (m === null) continue; // Skip null entries (removed markers)
      if (this.hidden && this.hidden.has(m.id)) continue;
      let arr = groups.get(m.sheet);
      if (!arr) {
        arr = [];
        groups.set(m.sheet, arr);
      }
      arr.push(m);
    }

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    // Pass pitch and bearing for 3D height effect
    gl.uniform1f(this.u_pitch_loc, state.pitch);
    gl.uniform1f(this.u_bearing_loc, state.bearing);

    // Pass screen dimensions for billboard scaling
    gl.uniform2f(this.u_screen_loc, state.width, state.height);

    // Pass zoom level for world-space needle scaling
    gl.uniform1f(this.u_zoom_loc, state.zoom);

    // Set color-blind simulation uniforms
    gl.uniform1i(this.u_cb_mode_loc, this.cbModeToInt(this.colorBlindMode));
    gl.uniform1f(this.u_cb_sev_loc, this.colorBlindSeverity);

    // Use the EXACT same view matrix as the webmap to prevent positioning drift
    // This ensures icons are perfectly anchored during rotation and perspective changes
    gl.uniformMatrix3fv(this.u_view_loc, false, state.viewMatrix!);

    const drawList = (
      s: { w: number; h: number; tex: WebGLTexture },
      list: IconMarkerInstance[],
    ) => {
      if (list.length === 0) return;

      // Reuse pre-allocated buffers if large enough, otherwise allocate larger ones
      const needed = list.length;
      if (this.preallocatedBuffers.capacity < needed) {
        const newCap = Math.max(needed, Math.ceil(needed * 1.5)); // 50% headroom
        this.preallocatedBuffers = {
          offsets: new Float32Array(newCap * 2),
          sizes: new Float32Array(newCap * 2),
          uvs: new Float32Array(newCap * 4),
          discs: new Float32Array(newCap),
          flags: new Float32Array(newCap * 2),
          counts: new Float32Array(newCap),
          angles: new Float32Array(newCap),
          keepUprights: new Float32Array(newCap),
          stemModes: new Float32Array(newCap),
          iconModes: new Float32Array(newCap),
          capacity: newCap,
        };
      }

      const offsets = this.preallocatedBuffers.offsets!;
      const sizes = this.preallocatedBuffers.sizes!;
      const uvs = this.preallocatedBuffers.uvs!;
      const discs = this.preallocatedBuffers.discs!;
      const flags = this.preallocatedBuffers.flags!;
      const counts = this.preallocatedBuffers.counts!;
      const angles = this.preallocatedBuffers.angles!;
      const keepUprights = this.preallocatedBuffers.keepUprights!;
      for (let i = 0; i < list.length; i++) {
        const m = list[i];
        const p = state.projection(m.latLng);
        let size = m.size;
        if (m.isHighlighted) size *= 1.15;
        if (m.isSelected) size *= 1.3;
        offsets[i * 2 + 0] = p.x - size / 2;
        offsets[i * 2 + 1] = p.y - size / 2;
        sizes[i * 2 + 0] = size;
        sizes[i * 2 + 1] = size;
        const u0 = m.rect.x / s.w;
        const v0 = m.rect.y / s.h;
        const uw = m.rect.width / s.w;
        const vh = m.rect.height / s.h;
        uvs[i * 4 + 0] = u0;
        uvs[i * 4 + 1] = v0;
        uvs[i * 4 + 2] = uw;
        uvs[i * 4 + 3] = vh;
        discs[i] = m.isDiscovered ? 1 : 0;
        const rawZ = typeof m.z === "number" ? m.z : 0;
        let normalizedHeight =
          m.zMag !== undefined ? Math.min(1, Math.max(0, m.zMag)) : undefined;
        if (normalizedHeight === undefined) {
          normalizedHeight =
            rawZ === 0
              ? 0
              : Math.min(1, Math.abs(rawZ) / DEFAULT_Z_NORMALIZATION);
        }
        let direction = 0;
        if (m.zPos === "top") direction = 1;
        else if (m.zPos === "bottom") direction = -1;
        else if (rawZ > 0) direction = 1;
        else if (rawZ < 0) direction = -1;
        flags[i * 2 + 0] = normalizedHeight;
        flags[i * 2 + 1] = direction;
        counts[i] = 1; // Not used, but kept for shader compatibility
        // For upright icons, we need to counter-rotate in world space
        // The view matrix will apply the map rotation, so we pre-rotate the opposite way
        const angle = m.rotation ?? 0;
        angles[i] = angle;
        // Set keepUpright flag: 1 for billboard mode, 0 for player rotation
        keepUprights[i] = m.keepUpright !== false ? 1.0 : 0.0;
      }
      // Upload all attribute data using subarray views to avoid copies
      const count = list.length;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.offsets);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        offsets.subarray(0, count * 2),
        gl.DYNAMIC_DRAW,
      );
      gl.bindBuffer(gl.ARRAY_BUFFER, this.sizes);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        sizes.subarray(0, count * 2),
        gl.DYNAMIC_DRAW,
      );
      gl.bindBuffer(gl.ARRAY_BUFFER, this.uvs);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        uvs.subarray(0, count * 4),
        gl.DYNAMIC_DRAW,
      );
      gl.bindBuffer(gl.ARRAY_BUFFER, this.discs);
      gl.bufferData(gl.ARRAY_BUFFER, discs.subarray(0, count), gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.flags);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        flags.subarray(0, count * 2),
        gl.DYNAMIC_DRAW,
      );
      gl.bindBuffer(gl.ARRAY_BUFFER, this.counts);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        counts.subarray(0, count),
        gl.DYNAMIC_DRAW,
      );
      gl.bindBuffer(gl.ARRAY_BUFFER, this.angles);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        angles.subarray(0, count),
        gl.DYNAMIC_DRAW,
      );
      gl.bindBuffer(gl.ARRAY_BUFFER, this.keepUprights);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        keepUprights.subarray(0, count),
        gl.DYNAMIC_DRAW,
      );

      // First pass: Draw height stems (render mode = 1)
      // Reuse preallocated buffer and fill it
      const stemModes = this.preallocatedBuffers.stemModes!;
      stemModes.fill(1.0, 0, count);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.renderModes);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        stemModes.subarray(0, count),
        gl.DYNAMIC_DRAW,
      );
      gl.drawArraysInstanced(gl.LINES, 0, 2, count);

      // Second pass: Draw icons (render mode = 0)
      const iconModes = this.preallocatedBuffers.iconModes!;
      iconModes.fill(0.0, 0, count);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.renderModes);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        iconModes.subarray(0, count),
        gl.DYNAMIC_DRAW,
      );
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, s.tex);
      gl.uniform1i(this.u_tex_loc, 0);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
    };

    for (const [sheet, items] of groups) {
      const s = this.ensureSheet(gl, sheet);
      if (!s) continue;
      const normal: IconMarkerInstance[] = [];
      const selected: IconMarkerInstance[] = [];
      for (const m of items) {
        (m.isSelected ? selected : normal).push(m);
      }
      // Draw non-selected first, then selected to ensure selected are on top
      drawList(s, normal);
      drawList(s, selected);
    }

    gl.bindVertexArray(null);
  }

  private createImage(url: string) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    return img;
  }

  // Hit test: approximate icon as a circle using half of effective size
  pick(state: RenderState, screen: { x: number; y: number }): unknown | null {
    const view = state.viewMatrix!;
    const a = view[0],
      b = view[1],
      c = view[3],
      d = view[4],
      tx = view[6],
      ty = view[7];
    const toScreen = (wx: number, wy: number) => {
      const cx = a * wx + c * wy + tx; // clip space
      const cy = b * wx + d * wy + ty;
      const sx = (cx * 0.5 + 0.5) * state.width;
      const sy = (1 - (cy * 0.5 + 0.5)) * state.height; // Invert Y for screen coords
      return { x: sx, y: sy };
    };
    for (let i = this.instances.length - 1; i >= 0; i--) {
      const m = this.instances[i];
      if (m === null) continue; // Skip null entries
      if (this.hidden && this.hidden.has(m.id)) continue;
      const p = state.projection(m.latLng);
      const s = toScreen(p.x, p.y);
      let eff = m.size;
      if (m.isHighlighted) eff *= 1.15;
      if (m.isSelected) eff *= 1.3;
      const r = eff / 2;
      const dx = screen.x - s.x;
      const dy = screen.y - s.y;
      if (dx * dx + dy * dy <= r * r) {
        return m;
      }
    }
    return null;
  }

  // Return all markers clustered near the hovered point, grouped around the nearest hit
  pickAll(
    state: RenderState,
    screen: { x: number; y: number },
    maxRadiusPx: number = 20,
  ): IconMarkerInstance[] {
    const view = state.viewMatrix!;
    const a = view[0],
      b = view[1],
      c = view[3],
      d = view[4],
      tx = view[6],
      ty = view[7];
    const toScreen = (wx: number, wy: number) => {
      const cx = a * wx + c * wy + tx; // clip space
      const cy = b * wx + d * wy + ty;
      const sx = (cx * 0.5 + 0.5) * state.width;
      const sy = (1 - (cy * 0.5 + 0.5)) * state.height; // Invert Y for screen coords
      return { x: sx, y: sy };
    };
    let bestIdx = -1,
      bestDist2 = Infinity,
      bestR = 0,
      bestScreen = { x: 0, y: 0 };
    for (let i = this.instances.length - 1; i >= 0; i--) {
      const m = this.instances[i];
      if (m === null) continue; // Skip null entries
      if (this.hidden && this.hidden.has(m.id)) continue;
      const p = state.projection(m.latLng);
      const s = toScreen(p.x, p.y);
      let eff = m.size;
      if (m.isHighlighted) eff *= 1.15;
      if (m.isSelected) eff *= 1.3;
      const r = eff / 2;
      const dx = screen.x - s.x;
      const dy = screen.y - s.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= r * r && d2 < bestDist2) {
        bestDist2 = d2;
        bestIdx = i;
        bestR = r;
        bestScreen = s;
      }
    }
    if (bestIdx < 0) return [];
    // Join radius: include same/nearby markers within a small pixel radius around the nearest hit
    const joinR = Math.max(maxRadiusPx, bestR + 6);
    const joinR2 = joinR * joinR;
    const result: IconMarkerInstance[] = [];
    for (let i = 0; i < this.instances.length; i++) {
      const m = this.instances[i];
      if (m === null) continue; // Skip null entries
      const p = state.projection(m.latLng);
      const s = toScreen(p.x, p.y);
      const dx = s.x - bestScreen.x;
      const dy = s.y - bestScreen.y;
      if (dx * dx + dy * dy <= joinR2) result.push(m);
    }
    return result;
  }

  // Selection helpers
  setSelected(id: string | null) {
    if (id == null) {
      for (const m of this.instances) {
        if (m === null) continue;
        m.isSelected = false;
      }
    } else {
      for (const m of this.instances) {
        if (m === null) continue;
        m.isSelected = m.id === id;
      }
    }
  }

  // Register event handler for a specific marker
  registerEventHandler(
    markerId: string,
    eventType: "click" | "mouseover" | "mouseout" | "mousedown" | "contextmenu",
    handler: (m: IconMarkerInstance) => void,
  ): void {
    this.eventHandlers[eventType].set(markerId, handler);
  }

  // Unregister event handler for a specific marker
  unregisterEventHandler(
    markerId: string,
    eventType: "click" | "mouseover" | "mouseout" | "mousedown" | "contextmenu",
  ): void {
    this.eventHandlers[eventType].delete(markerId);
  }

  // Unregister all event handlers for a marker
  unregisterAllEventHandlers(markerId: string): void {
    this.eventHandlers.click.delete(markerId);
    this.eventHandlers.mouseover.delete(markerId);
    this.eventHandlers.mouseout.delete(markerId);
    this.eventHandlers.mousedown.delete(markerId);
    this.eventHandlers.contextmenu.delete(markerId);
  }

  // Handle mouse movement for hover events
  handleMouseMove(state: RenderState, screen: { x: number; y: number }): void {
    const hitMarker = this.pick(state, screen) as IconMarkerInstance | null;
    const newHoveredId = hitMarker?.id ?? null;

    // Check if hover state changed
    if (newHoveredId !== this.hoveredMarkerId) {
      // Fire mouseout for previously hovered marker
      if (this.hoveredMarkerId !== null) {
        const prevMarker =
          this.instances[this.instancesById.get(this.hoveredMarkerId) ?? -1];
        if (prevMarker && prevMarker !== null) {
          const handler = this.eventHandlers.mouseout.get(this.hoveredMarkerId);
          if (handler) {
            handler(prevMarker);
          }
        }
      }

      // Fire mouseover for newly hovered marker
      if (newHoveredId !== null && hitMarker) {
        const handler = this.eventHandlers.mouseover.get(newHoveredId);
        if (handler) {
          handler(hitMarker);
        } else {
          console.log(
            "IconMarkerLayer: no mouseover handler for",
            newHoveredId,
            "registered handlers:",
            this.eventHandlers.mouseover.size,
          );
        }
      }

      this.hoveredMarkerId = newHoveredId;
    }
  }

  // Handle mouse down events
  handleMouseDown(state: RenderState, screen: { x: number; y: number }): void {
    const hitMarker = this.pick(state, screen) as IconMarkerInstance | null;
    if (hitMarker) {
      const handler = this.eventHandlers.mousedown.get(hitMarker.id);
      if (handler) {
        handler(hitMarker);
      }
    }
  }

  // Handle context menu events
  handleContextMenu(
    state: RenderState,
    screen: { x: number; y: number },
  ): void {
    const hitMarker = this.pick(state, screen) as IconMarkerInstance | null;
    if (hitMarker) {
      const handler = this.eventHandlers.contextmenu.get(hitMarker.id);
      if (handler) {
        handler(hitMarker);
      }
    }
  }

  // Handle click events
  handleClick(state: RenderState, screen: { x: number; y: number }): void {
    const hitMarker = this.pick(state, screen) as IconMarkerInstance | null;
    if (hitMarker) {
      const handler = this.eventHandlers.click.get(hitMarker.id);
      if (handler) {
        handler(hitMarker);
      }
      // Also call legacy onClick handler for backward compatibility
      if (this.onClick) {
        this.onClick(hitMarker);
      }
    }
  }
}
