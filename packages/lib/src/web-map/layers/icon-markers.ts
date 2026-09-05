import type { Layer, LatLng, RenderState } from "../types";
import { createProgram } from "../utils/gl";
import { ColorBlindMode } from "../utils/color-blind";

// Simple icon marker layer that draws textured quads from one or more sprite sheets.
// Batches draw calls per sheet texture and uses instancing within each batch.

// ---------------------------------------------------------------------------
// Dynamic Texture Atlas — packs many small icon textures into shared atlas
// pages so all markers can be drawn with a handful of draw calls instead of
// one per unique icon.
// ---------------------------------------------------------------------------

/** Maximum icon dimension (width or height) that qualifies for atlas packing */
const ATLAS_MAX_ICON = 512;
/** Atlas page size (2048 is safe on all WebGL2 GPUs) */
const ATLAS_PAGE_SIZE = 2048;
/** Padding between icons to prevent filtering bleed */
const ATLAS_PAD = 2;

interface AtlasEntry {
  page: string; // Atlas page name (e.g. "__atlas_0__")
  rect: IconRect; // Rect within the atlas canvas (pixel coords)
}

class TextureAtlas {
  private pages: {
    name: string;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
  }[] = [];
  /** Current shelf Y position on the active page */
  private shelfY = 0;
  /** Current X position on the current shelf */
  private shelfX = 0;
  /** Height of the current shelf (tallest icon in the row) */
  private shelfH = 0;
  /** Maps original sheet name → atlas entry */
  readonly entries = new Map<string, AtlasEntry>();
  /** Set of atlas page names that have been modified since last WebGL upload */
  readonly dirtyPages = new Set<string>();

  /** Try to pack a sheet image into the atlas. Returns the entry, or null if too large. */
  add(
    name: string,
    img: HTMLImageElement | HTMLCanvasElement,
  ): AtlasEntry | null {
    const w = img instanceof HTMLCanvasElement ? img.width : img.naturalWidth;
    const h = img instanceof HTMLCanvasElement ? img.height : img.naturalHeight;

    // Don't atlas images that are too large or not ready
    if (w === 0 || h === 0 || w > ATLAS_MAX_ICON || h > ATLAS_MAX_ICON) {
      return null;
    }

    // If already packed, update in place
    const existing = this.entries.get(name);
    if (existing) {
      const page = this.pages.find((p) => p.name === existing.page);
      if (page) {
        page.ctx.clearRect(
          existing.rect.x,
          existing.rect.y,
          existing.rect.width,
          existing.rect.height,
        );
        page.ctx.drawImage(img, existing.rect.x, existing.rect.y, w, h);
        this.dirtyPages.add(existing.page);
        // Update rect dimensions in case size changed
        existing.rect.width = w;
        existing.rect.height = h;
      }
      return existing;
    }

    // Try to fit on current shelf of last page
    const pw = w + ATLAS_PAD;
    const ph = h + ATLAS_PAD;

    if (this.pages.length > 0) {
      const lastPage = this.pages[this.pages.length - 1];

      // Does it fit on the current shelf?
      if (
        this.shelfX + pw <= ATLAS_PAGE_SIZE &&
        this.shelfY + Math.max(this.shelfH, ph) <= ATLAS_PAGE_SIZE
      ) {
        const entry = this.placeOnShelf(name, img, w, h, pw, ph, lastPage);
        return entry;
      }

      // Start a new shelf on the same page
      if (
        pw <= ATLAS_PAGE_SIZE &&
        this.shelfY + this.shelfH + ph <= ATLAS_PAGE_SIZE
      ) {
        this.shelfY += this.shelfH;
        this.shelfX = 0;
        this.shelfH = 0;
        const entry = this.placeOnShelf(name, img, w, h, pw, ph, lastPage);
        return entry;
      }
    }

    // Need a new page
    this.createPage();
    const newPage = this.pages[this.pages.length - 1];
    return this.placeOnShelf(name, img, w, h, pw, ph, newPage);
  }

  private placeOnShelf(
    name: string,
    img: HTMLImageElement | HTMLCanvasElement,
    w: number,
    h: number,
    pw: number,
    ph: number,
    page: {
      name: string;
      canvas: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;
    },
  ): AtlasEntry {
    const rect: IconRect = {
      x: this.shelfX,
      y: this.shelfY,
      width: w,
      height: h,
    };
    page.ctx.drawImage(img, rect.x, rect.y, w, h);
    this.shelfX += pw;
    if (ph > this.shelfH) this.shelfH = ph;
    const entry: AtlasEntry = { page: page.name, rect };
    this.entries.set(name, entry);
    this.dirtyPages.add(page.name);
    return entry;
  }

  private createPage() {
    const name = `__atlas_${this.pages.length}__`;
    const canvas = document.createElement("canvas");
    canvas.width = ATLAS_PAGE_SIZE;
    canvas.height = ATLAS_PAGE_SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: false })!;
    this.pages.push({ name, canvas, ctx });
    this.shelfX = 0;
    this.shelfY = 0;
    this.shelfH = 0;
    this.dirtyPages.add(name);
  }

  /** Get the canvas for a given atlas page name */
  getPageCanvas(name: string): HTMLCanvasElement | undefined {
    return this.pages.find((p) => p.name === name)?.canvas;
  }

  /** Get all page names */
  getPageNames(): string[] {
    return this.pages.map((p) => p.name);
  }
}

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
  size: number; // pixel height on screen (before highlight)
  sizeW?: number; // optional pixel width (defaults to size for square icons)
  sheet: string; // sheet name
  rect: IconRect; // sub-rect in pixels on the sheet image
  key?: string; // type/category key for grouping
  z?: number; // optional elevation for relative z-arrow logic
  isHighlighted?: boolean;
  isDiscovered?: boolean; // greyscale + alpha reduction
  isMuted?: boolean; // alpha reduction only (e.g. predicted-only spawns in combined live mode)
  zPos?: "top" | "bottom" | "needle" | "needle-down" | null;
  zMag?: number; // 0..1 magnitude of relative z (for halo)
  isSelected?: boolean;
  alwaysOnTop?: boolean; // render above all other markers (e.g. player)
  noHitTest?: boolean; // skip in pick/pickAll (e.g. labels)
  screenOffsetY?: number; // screen-space Y offset in world pixels (negative = up)
  rotation?: number; // radians
  keepUpright?: boolean; // do not rotate with map bearing
  tint?: string; // optional color tint (hex string like "#FF0000" or "#FF0000CC")
  isStacked?: boolean; // show indicator for multiple spawns at same location
  layered?: boolean; // spawn belongs to a layered interior — show a layer badge
  spiderOffsetX?: number; // screen-space X offset in device px for spiderfied clusters
  spiderOffsetY?: number; // screen-space Y offset in device px for spiderfied clusters
}

type SheetTex = { name: string; tex: WebGLTexture; w: number; h: number };

const DEFAULT_Z_NORMALIZATION = 200;
export const DEFAULT_CIRCLE_SHEET = "__default_circle__";

const vs = `#version 300 es
in vec2 a_pos;      // unit quad [0..1] OR line position for height stems
in vec2 a_offset;   // world px top-left
in vec2 a_size;     // size in px
in vec4 a_uv;       // uv origin (xy) and size (zw)
in float a_disc;    // per-instance state: 0 normal, 0.5 muted, 1.0 discovered
in vec2 a_flags;    // x: normalized height, y: zpos(-1/0/1)
in float a_count;   // 1=single, 2=stacked (multiple spawns at same location)
in float a_layered; // 1=spawn is inside a layered interior (show layer badge)
in float a_angle;   // rotation in radians
in float a_renderMode; // 0=icon, 1=height stem
in float a_keepUpright; // 1=billboard mode, 0=use own rotation
in vec4 a_tint;     // RGBA tint color (1,1,1,1 = no tint)
in vec2 a_spiderOffset; // screen-space offset in device px for spiderfied markers
uniform mat3 u_view; // world->clip
uniform float u_pitch; // camera pitch for 3D effect
uniform float u_bearing; // camera bearing for perspective direction
uniform vec2 u_screen; // screen dimensions for billboard scaling
uniform float u_zoom; // zoom level
uniform float u_minZoom;
uniform float u_maxZoom;
uniform float u_dynamicSizeFactor; // 0=fixed size, 0.67=default, 1.0=full linear
const float MIN_NEEDLE_WORLD = 0.0;
const float MAX_NEEDLE_WORLD = 20.0;

out vec2 v_uv;
out vec2 v_localUv;  // local UV for overlays (0..1 across the entire quad)
out vec2 v_uvMin;    // UV min bounds for atlas sub-rect
out vec2 v_uvMax;    // UV max bounds for atlas sub-rect
out float v_disc;
out vec2 v_flags;
out float v_count;
out float v_layered;
out float v_renderMode;
out vec4 v_tint;
void main(){
  v_renderMode = a_renderMode;

  float heightIntensity = clamp(a_flags.x, 0.0, 1.0);
  float directionFlag = a_flags.y;
  // direction: 1=up+arrow, -1=down+arrow, 2=up needle only (no arrow), 0=none
  float direction = abs(directionFlag) > 1.5 ? sign(directionFlag) : (directionFlag > 0.5 ? 1.0 : (directionFlag < -0.5 ? -1.0 : 0.0));

  // Calculate needle height scaled by zoom
  float zoomScale = pow(2.0, u_zoom);
  float heightWorld = mix(MIN_NEEDLE_WORLD, MAX_NEEDLE_WORLD, heightIntensity) * abs(sin(u_pitch)) * zoomScale * 500.0;
  float iconDirection = direction;
  if (abs(iconDirection) < 0.5 || heightIntensity < 0.01) {
    iconDirection = 0.0;
  }

  if (a_renderMode < 0.5) {
    // Icon rendering with conditional billboard behavior
    // Compute view scale once — used for zoom sizing, height offset, and screen projection
    float viewScale = length(vec2(u_view[0][0], u_view[1][0]));
    // Adaptive zoom sizing based on actual view scale, not linear zoom fraction.
    float refScale = viewScale * pow(2.0, (u_minZoom + u_maxZoom) * 0.5 - u_zoom);
    float ratio = viewScale / refScale;
    float zoomSizeScale = u_dynamicSizeFactor > 0.001
      ? clamp(pow(ratio, u_dynamicSizeFactor), 0.25, 2.5)
      : 1.0;
    vec2 center = a_offset + 0.5 * a_size;
    vec2 local = (a_pos - 0.5) * a_size * zoomSizeScale;
    float heightClip = heightWorld * viewScale * (2.0 / u_screen.y);

    if (a_keepUpright > 0.5) {
      // Billboard mode: icon always faces the camera
      // Transform center first, then apply height in SCREEN space (always upward)
      vec3 centerScreen = u_view * vec3(center, 1.0);
      // Depth from ground position: lower clip Y = closer to viewer = smaller depth
      float depth = (1.0 + centerScreen.y) * 0.5;
      centerScreen.y += heightClip * iconDirection;

      // Apply icon rotation in screen space
      float cs = cos(a_angle), sn = sin(a_angle);
      vec2 rot = vec2(cs*local.x - sn*local.y, sn*local.x + cs*local.y);

      // Apply screen-space offset directly (no perspective compression)
      vec2 screenOffset = rot * vec2(2.0 / u_screen.x, -2.0 / u_screen.y);
      // Spiderfy offset scaled by dynamic size (matches icon size scaling)
      vec2 spiderClip = a_spiderOffset * zoomSizeScale * vec2(2.0 / u_screen.x, -2.0 / u_screen.y);

      gl_Position = vec4(centerScreen.xy + screenOffset + spiderClip, depth, 1.0);
    } else {
      // Player mode: use world-space rotation (affected by perspective)
      float cs = cos(a_angle), sn = sin(a_angle);
      vec2 rot = vec2(cs*local.x - sn*local.y, sn*local.x + cs*local.y);
      vec2 iconPos = center + rot;

      // Apply height effect in SCREEN space after view transform
      vec3 screenPos = u_view * vec3(iconPos, 1.0);
      // Depth from ground position: lower clip Y = closer to viewer = smaller depth
      float depth = (1.0 + screenPos.y) * 0.5;
      screenPos.y += heightClip * iconDirection;

      gl_Position = vec4(screenPos.xy, depth, 1.0);
    }
    v_uv = a_uv.xy + a_pos * a_uv.zw;
    v_uvMin = a_uv.xy;
    v_uvMax = a_uv.xy + a_uv.zw;
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
    float depth = (1.0 + groundPos.y) * 0.5;

    // Apply needle in screen Y direction, scaled appropriately
    float viewScale = length(vec2(u_view[0][0], u_view[1][0]));
    float heightClip = effectiveHeight * viewScale * (2.0 / u_screen.y);
    vec3 screenPos = groundPos;
    screenPos.y += heightClip * a_pos.x;

    gl_Position = vec4(screenPos.xy, depth, 1.0);

    v_uv = vec2(0.5); // Neutral UV for line
  }

  v_localUv = a_pos;
  v_disc = a_disc;
  v_flags = a_flags;
  v_count = a_count;
  v_layered = a_layered;
  v_tint = a_tint;
}
`;

const fs = `#version 300 es
precision highp float;
uniform sampler2D u_tex;
uniform int u_cb_mode; // 0 none, 1 prot, 2 deut, 3 trit
uniform float u_cb_sev; // 0..1
uniform int u_hc_mode; // 0=off, 1=on
uniform vec4 u_hc_color; // outline RGBA
uniform float u_hc_thickness; // outline thickness in texels (1-6)
in vec2 v_uv;
in vec2 v_localUv;  // 0..1 across entire quad
in vec2 v_uvMin;    // UV min bounds for atlas sub-rect
in vec2 v_uvMax;    // UV max bounds for atlas sub-rect
in float v_disc;
in vec2 v_flags;
in float v_count;
in float v_layered;
in float v_renderMode;
in vec4 v_tint;
out vec4 outColor;
// 7-segment helpers for tiny digit rendering — anti-aliased
float hseg(vec2 uv, float y){
  float thickness = 0.18;
  float aa = fwidth(uv.x) * 1.5;
  return (1.0 - smoothstep(thickness*0.5 - aa, thickness*0.5 + aa, abs(uv.y - y)))
       * smoothstep(0.1 - aa, 0.1 + aa, uv.x)
       * (1.0 - smoothstep(0.9 - aa, 0.9 + aa, uv.x));
}
float vseg(vec2 uv, float x){
  float thickness = 0.18;
  float aa = fwidth(uv.x) * 1.5;
  return (1.0 - smoothstep(thickness*0.5 - aa, thickness*0.5 + aa, abs(uv.x - x)))
       * smoothstep(0.15 - aa, 0.15 + aa, uv.y)
       * (1.0 - smoothstep(0.85 - aa, 0.85 + aa, uv.y));
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
// Lucide "Layers" glyph (filled diamond over a chevron), used for the per-marker
// layer badge so it matches the "Layered Map" selector icon. c = center in quad
// UV (0..1, +y down), s = half-extent. Returns coverage alpha in [0,1].
float layersBadge(vec2 uv, vec2 c, float s){
  vec2 p = (uv - c) / s;               // local coords, +y down
  float aa = (fwidth(p.x) + fwidth(p.y)) * 0.9 + 0.03;
  // Top: filled diamond.
  float dTop = abs(p.x) + abs(p.y + 0.34) - 0.55;
  float top = 1.0 - smoothstep(-aa, aa, dTop);
  // Bottom: a chevron (V) echoing the diamond's lower edges = the "stack".
  float w = 0.14;
  float dL = sdSegment(p, vec2(-0.55, 0.30), vec2(0.0, 0.85));
  float dR = sdSegment(p, vec2( 0.55, 0.30), vec2(0.0, 0.85));
  float chev = 1.0 - smoothstep(w - aa, w + aa, min(dL, dR));
  return clamp(max(top, chev), 0.0, 1.0);
}

vec3 simulateCB(vec3 rgb, int mode){
  // Note: mat3() fills by columns, so we use rgb * M (row vector * matrix)
  // to get the same result as the CPU version which does M * rgb (matrix * column vector)
  if(mode==1){ // protanopia
    mat3 M = mat3(0.56667, 0.43333, 0.0,
                  0.55833, 0.44167, 0.0,
                  0.0,     0.24167, 0.75833);
    return rgb * M;
  } else if(mode==2){ // deuteranopia
    mat3 M = mat3(0.625,  0.375,  0.0,
                  0.7,    0.3,    0.0,
                  0.0,    0.3,    0.7);
    return rgb * M;
  } else if(mode==3){ // tritanopia
    mat3 M = mat3(0.95,  0.05,   0.0,
                  0.0,   0.433,  0.567,
                  0.0,   0.475,  0.525);
    return rgb * M;
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
  // Apply tint color (multiply RGB, use tint alpha to blend)
  c.rgb = mix(c.rgb, c.rgb * v_tint.rgb, v_tint.a);
  // High contrast outline: silhouette-following stroke around the icon.
  // Counts how many of 16 radial samples hit opaque pixels — edge pixels have
  // opaque on one side only, interior gaps are surrounded on most sides.
  if (u_hc_mode == 1) {
    vec2 texSize = vec2(textureSize(u_tex, 0));
    // Step size in UV space for thickness texels in the actual texture
    float px = u_hc_thickness / texSize.x;
    float py = u_hc_thickness / texSize.y;
    float neighborAlpha = 0.0;
    float opaqueCount = 0.0;
    for (int i = 0; i < 16; i++) {
      float angle = float(i) * 6.2831853 / 16.0;
      vec2 s = v_uv + vec2(cos(angle) * px, sin(angle) * py);
      float ib = step(v_uvMin.x, s.x) * step(s.x, v_uvMax.x) * step(v_uvMin.y, s.y) * step(s.y, v_uvMax.y);
      float a = textureLod(u_tex, s, 0.0).a * ib;
      neighborAlpha = max(neighborAlpha, a);
      opaqueCount += step(0.1, a);
    }
    // Use mip 0 alpha to avoid sprite sheet bleed at lower mip levels
    float baseAlpha = textureLod(u_tex, v_uv, 0.0).a;
    // Draw outline only at silhouette edges: transparent pixel with some (not all)
    // directions finding opaque content. Pixels surrounded on most sides are
    // interior gaps (between wings etc.) and should stay transparent.
    if (baseAlpha < 0.1 && neighborAlpha > 0.1 && opaqueCount < 12.0) {
      c = u_hc_color;
    }
  }
  if (v_disc > 0.75) {
    // discovered: greyscale + 50% alpha
    float g = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
    c = vec4(vec3(g), c.a * 0.5);
  } else if (v_disc > 0.25) {
    // muted (e.g. predicted-only in combined live mode): keep color, fade alpha
    c = vec4(c.rgb, c.a * 0.35);
  }
  // Use v_localUv for overlays (0..1 across the entire rendered quad)
  vec2 uv = v_localUv;
  // Suppress arrows in needle-only mode (direction = 2, absolute height vis)
  float needleOnly = step(1.5, abs(v_flags.y));
  float zTop = step(0.5, v_flags.y) * (1.0 - needleOnly);
  float zBottom = step(0.5, -v_flags.y) * (1.0 - needleOnly);
  vec3 draw = c.rgb;
  float alpha = c.a;
  // Track overlay coverage to ensure alpha shows overlays even if base is transparent
  float overlayAlpha = 0.0;

  // Stacked spawn indicator is rendered via v_count below

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
    // Anti-aliased triangle fill using barycentric signed distance
    float triDist = min(min(uu,vv),ww);
    float aa = fwidth(uv.x) * 1.5;
    float inside = smoothstep(-aa, aa, triDist);
    // Edge distance for outline
    float edge = min(min(vv, ww), uu);
    // Shadow under arrow
    vec2 shOfs = vec2(0.007, 0.007);
    vec2 vps = uv - shOfs - vA;
    float vvs = (d11 * dot(vps,e0) - d01 * dot(vps,e1)) * inv;
    float wws = (d00 * dot(vps,e1) - d01 * dot(vps,e0)) * inv;
    float uus = 1.0 - vvs - wws;
    float shTriDist = min(min(uus,vvs),wws);
    float shInside = smoothstep(-aa, aa, shTriDist);
    draw = mix(draw, vec3(0.0), shInside * 0.35);
    overlayAlpha = max(overlayAlpha, shInside * 0.35);
    // Stroke + fill (limit stroke to triangle vicinity)
    float stroke = inside * (1.0 - smoothstep(0.012, 0.016, edge));
    float fill = inside;
    vec3 arrowCol = vec3(1.0);
    // Apply stroke then fill
    draw = mix(draw, vec3(0.0), stroke);
    draw = mix(draw, arrowCol, fill);
    overlayAlpha = max(overlayAlpha, max(stroke, fill));
  }

  // Stacked spawns indicator (top-left corner) — anti-aliased with smoothstep
  // to prevent subpixel flickering when icon size changes during zoom
  if (v_count > 1.5) {
    vec2 ctr = vec2(0.22, 0.22);
    float arm = 0.14;
    float hw = 0.04;
    // Use fwidth for screen-space anti-aliasing (1 pixel soft edge)
    float aa = fwidth(uv.x) * 1.5;
    float dx = abs(uv.x - ctr.x);
    float dy = abs(uv.y - ctr.y);
    float hBar = (1.0 - smoothstep(arm - aa, arm + aa, dx)) * (1.0 - smoothstep(hw - aa, hw + aa, dy));
    float vBar = (1.0 - smoothstep(hw - aa, hw + aa, dx)) * (1.0 - smoothstep(arm - aa, arm + aa, dy));
    float cross = max(hBar, vBar);
    // Shadow (larger spread for visibility)
    vec2 sOfs = vec2(0.018, 0.018);
    float sArm = arm + 0.02;
    float sHw = hw + 0.02;
    float sdx = abs(uv.x - sOfs.x - ctr.x);
    float sdy = abs(uv.y - sOfs.y - ctr.y);
    float sH = (1.0 - smoothstep(sArm - aa, sArm + aa, sdx)) * (1.0 - smoothstep(sHw - aa, sHw + aa, sdy));
    float sV = (1.0 - smoothstep(sHw - aa, sHw + aa, sdx)) * (1.0 - smoothstep(sArm - aa, sArm + aa, sdy));
    float shadow = max(sH, sV);
    draw = mix(draw, vec3(0.0), shadow * 0.7);
    overlayAlpha = max(overlayAlpha, shadow * 0.7);
    draw = mix(draw, vec3(1.0), cross);
    overlayAlpha = max(overlayAlpha, cross);
  }

  // Layer badge (bottom-right corner) — marks spawns that live inside a layered
  // interior. Uses the lucide "Layers" glyph so it matches the "Layered Map"
  // selector icon, tinted cyan to stay distinct from the top-left count cross.
  if (v_layered > 0.5) {
    vec2 bc = vec2(0.77, 0.76);
    float bs = 0.20;
    float sh = layersBadge(uv - vec2(0.024, 0.024), bc, bs); // drop shadow
    draw = mix(draw, vec3(0.0), sh * 0.75);
    overlayAlpha = max(overlayAlpha, sh * 0.75);
    float g = layersBadge(uv, bc, bs);
    draw = mix(draw, vec3(0.62, 0.85, 1.0), g);
    overlayAlpha = max(overlayAlpha, g);
  }

  // Apply color-blind simulation (skip discovered icons to avoid double-greyscale; muted is fine)
  if(u_cb_mode != 0 && v_disc < 0.75){
    vec3 sim = simulateCB(draw, u_cb_mode);
    draw = mix(draw, sim, clamp(u_cb_sev, 0.0, 1.0));
  }

  // Ensure overlays are visible even over transparent sprite padding
  alpha = max(alpha, overlayAlpha);
  // Discard nearly transparent fragments so they don't write to the depth buffer
  if (alpha < 0.05) discard;
  outColor = vec4(draw, alpha);
}
`;

export class IconMarkerLayer implements Layer {
  private gl?: WebGL2RenderingContext;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private quad: WebGLBuffer | null = null;
  private sheets: Map<string, SheetTex> = new Map();
  private sheetImages: Map<string, HTMLImageElement | HTMLCanvasElement> =
    new Map();
  private atlas = new TextureAtlas();
  private instances: IconMarkerInstance[] = [];
  private instancesById: Map<string, number> = new Map(); // Track index by ID to prevent duplicates
  private iconMap: Map<string, { sheet: string; rect: IconRect }> = new Map();
  onClick?: (m: IconMarkerInstance) => void;
  private instancesVersion = 0;
  private lastRenderedVersion = -1;
  private nullCount = 0; // Track number of null entries for compaction
  private hoveredMarkerId: string | null = null; // Track currently hovered marker

  /** Debug stats updated each frame (read-only) */
  readonly stats = {
    totalInstances: 0,
    visibleInstances: 0,
    culledInstances: 0,
    drawCalls: 0,
    sheetGroups: 0,
    cullSkipped: false,
  };

  // Projected bounding box of all markers (updated on zoom change / instance change)
  private markerBoundsMinX = Infinity;
  private markerBoundsMaxX = -Infinity;
  private markerBoundsMinY = Infinity;
  private markerBoundsMaxY = -Infinity;

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
    layered?: Float32Array;
    angles?: Float32Array;
    keepUprights?: Float32Array;
    stemModes?: Float32Array;
    iconModes?: Float32Array;
    tints?: Float32Array;
    spiderOffsets?: Float32Array;
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
  private layeredBuf!: WebGLBuffer;
  private renderModes!: WebGLBuffer;
  private keepUprights!: WebGLBuffer;
  private tints!: WebGLBuffer;
  private spiderOffsets!: WebGLBuffer;
  private u_view_loc: WebGLUniformLocation | null = null;
  private u_tex_loc: WebGLUniformLocation | null = null;
  private u_pitch_loc: WebGLUniformLocation | null = null;
  private u_bearing_loc: WebGLUniformLocation | null = null;
  private u_screen_loc: WebGLUniformLocation | null = null;
  private u_zoom_loc: WebGLUniformLocation | null = null;
  private u_minZoom_loc: WebGLUniformLocation | null = null;
  private u_maxZoom_loc: WebGLUniformLocation | null = null;
  private u_dynamicSizeFactor_loc: WebGLUniformLocation | null = null;
  private dynamicSizeFactor: number = 2 / 3;
  private u_cb_mode_loc: WebGLUniformLocation | null = null;
  private u_cb_sev_loc: WebGLUniformLocation | null = null;
  private hidden?: Set<string>;
  private colorBlindMode: ColorBlindMode = "none";
  private colorBlindSeverity: number = 1;
  private highContrastMode: boolean = false;
  private highContrastColor: [number, number, number, number] = [0, 0, 0, 1];
  private highContrastThickness: number = 2;
  private u_hc_mode_loc: WebGLUniformLocation | null = null;
  private u_hc_color_loc: WebGLUniformLocation | null = null;
  private u_hc_thickness_loc: WebGLUniformLocation | null = null;

  addSheet(
    name: string,
    source: string | HTMLImageElement | HTMLCanvasElement,
  ) {
    if (
      source instanceof HTMLImageElement ||
      source instanceof HTMLCanvasElement
    ) {
      this.sheetImages.set(name, source);
      this.tryAtlasPack(name, source);
    } else {
      this.sheetImages.set(name, this.createImage(source));
    }
  }
  /** Copy all sheet images to another layer (for sharing sprites between static/live layers) */
  copySheets(target: IconMarkerLayer) {
    for (const [name, img] of this.sheetImages) {
      if (!target.sheetImages.has(name)) {
        target.addSheet(name, img);
      }
    }
  }

  // Alias for addSheet (for consistency with simple-webmap-markers)
  // Also invalidates the cached WebGL texture so it gets recreated
  setSheet(name: string, source: HTMLImageElement | HTMLCanvasElement) {
    this.sheetImages.set(name, source);
    // Delete cached WebGL texture so ensureSheet recreates it with new image
    this.sheets.delete(name);
    this.tryAtlasPack(name, source);
  }

  /** Attempt to pack a sheet image into the dynamic texture atlas */
  private tryAtlasPack(
    name: string,
    source: HTMLImageElement | HTMLCanvasElement,
  ) {
    // Don't atlas the default circle sheet — it's handled specially
    if (name === DEFAULT_CIRCLE_SHEET) return;
    // Canvas elements are always ready
    if (source instanceof HTMLCanvasElement) {
      this.atlas.add(name, source);
      return;
    }
    // HTMLImageElement: pack if already loaded, otherwise wait for onload
    if (source.complete && source.naturalWidth > 0) {
      this.atlas.add(name, source);
    }
  }
  // Get a marker by ID
  getMarker(id: string): IconMarkerInstance | undefined {
    const index = this.instancesById.get(id);
    if (index === undefined) return undefined;
    return this.instances[index] ?? undefined;
  }
  // Update a marker's properties
  updateMarker(id: string, updates: Partial<IconMarkerInstance>) {
    const index = this.instancesById.get(id);
    if (index === undefined) return;
    const existing = this.instances[index];
    if (!existing) return;
    this.instances[index] = { ...existing, ...updates, id: existing.id };
    this.instancesVersion++;
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

      // Clean up per-marker event handlers
      for (const handlers of Object.values(this.eventHandlers)) {
        handlers.delete(id);
      }

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
        // Clean up per-marker event handlers
        for (const handlers of Object.values(this.eventHandlers)) {
          handlers.delete(id);
        }
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

  setDynamicSizeFactor(factor: number) {
    this.dynamicSizeFactor = factor;
  }

  setHighContrastMode(enabled: boolean) {
    this.highContrastMode = enabled;
  }

  setHighContrastColor(color: string) {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const a = hex.length >= 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;
    this.highContrastColor = [r, g, b, a];
  }

  setHighContrastThickness(thickness: number) {
    this.highContrastThickness = Math.max(1, Math.min(6, thickness));
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
    zPos?: "top" | "bottom" | "needle" | "needle-down" | null;
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

    this.layeredBuf = gl.createBuffer()!;
    const a_layered = gl.getAttribLocation(this.program!, "a_layered");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.layeredBuf);
    gl.enableVertexAttribArray(a_layered);
    gl.vertexAttribPointer(a_layered, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(a_layered, 1);

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

    // Tint attribute (RGBA color)
    this.tints = gl.createBuffer()!;
    const a_tint = gl.getAttribLocation(this.program!, "a_tint");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tints);
    gl.enableVertexAttribArray(a_tint);
    gl.vertexAttribPointer(a_tint, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(a_tint, 1);

    // Spider offset attribute (vec2, screen-space device px)
    this.spiderOffsets = gl.createBuffer()!;
    const a_spiderOffset = gl.getAttribLocation(
      this.program!,
      "a_spiderOffset",
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, this.spiderOffsets);
    gl.enableVertexAttribArray(a_spiderOffset);
    gl.vertexAttribPointer(a_spiderOffset, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(a_spiderOffset, 1);

    gl.bindVertexArray(null);
    // cache uniform locations
    this.u_view_loc = gl.getUniformLocation(this.program!, "u_view");
    this.u_tex_loc = gl.getUniformLocation(this.program!, "u_tex");
    this.u_pitch_loc = gl.getUniformLocation(this.program!, "u_pitch");
    this.u_bearing_loc = gl.getUniformLocation(this.program!, "u_bearing");
    this.u_screen_loc = gl.getUniformLocation(this.program!, "u_screen");
    this.u_zoom_loc = gl.getUniformLocation(this.program!, "u_zoom");
    this.u_minZoom_loc = gl.getUniformLocation(this.program!, "u_minZoom");
    this.u_maxZoom_loc = gl.getUniformLocation(this.program!, "u_maxZoom");
    this.u_dynamicSizeFactor_loc = gl.getUniformLocation(
      this.program!,
      "u_dynamicSizeFactor",
    );
    this.u_cb_mode_loc = gl.getUniformLocation(this.program!, "u_cb_mode");
    this.u_cb_sev_loc = gl.getUniformLocation(this.program!, "u_cb_sev");
    this.u_hc_mode_loc = gl.getUniformLocation(this.program!, "u_hc_mode");
    this.u_hc_color_loc = gl.getUniformLocation(this.program!, "u_hc_color");
    this.u_hc_thickness_loc = gl.getUniformLocation(
      this.program!,
      "u_hc_thickness",
    );
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
      if (this.layeredBuf) {
        try {
          gl.deleteBuffer(this.layeredBuf);
        } catch {}
      }
      if (this.renderModes) {
        try {
          gl.deleteBuffer(this.renderModes);
        } catch {}
      }
      if (this.keepUprights) {
        try {
          gl.deleteBuffer(this.keepUprights);
        } catch {}
      }
      if (this.tints) {
        try {
          gl.deleteBuffer(this.tints);
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
    this.preallocatedBuffers = { capacity: 0 };
    this.failedSheets.clear();
    for (const handlers of Object.values(this.eventHandlers)) {
      handlers.clear();
    }
  }

  private ensureSheet(
    gl: WebGL2RenderingContext,
    name: string,
  ): SheetTex | null {
    // Handle atlas pages: re-upload if dirty, otherwise return cached
    const atlasCanvas = this.atlas.getPageCanvas(name);
    if (atlasCanvas) {
      if (this.atlas.dirtyPages.has(name)) {
        this.atlas.dirtyPages.delete(name);
        // Delete cached texture to force re-upload
        const old = this.sheets.get(name);
        if (old) gl.deleteTexture(old.tex);
        this.sheets.delete(name);
      }
      if (this.sheets.has(name)) return this.sheets.get(name)!;
      return this.uploadTexture(
        gl,
        name,
        atlasCanvas,
        atlasCanvas.width,
        atlasCanvas.height,
      );
    }

    if (this.sheets.has(name)) return this.sheets.get(name)!;

    // Handle default circle sheet specially
    if (name === DEFAULT_CIRCLE_SHEET) {
      return this.createDefaultCircleSheet(gl);
    }

    const img = this.sheetImages.get(name);
    if (!img) {
      return null;
    }

    // Check if this sheet failed to load — use circle fallback
    if (this.failedSheets.has(name)) {
      return (
        this.sheets.get(DEFAULT_CIRCLE_SHEET) ??
        this.createDefaultCircleSheet(gl)
      );
    }

    // Canvas elements are always ready; HTMLImageElements need to be loaded
    const isCanvas = img instanceof HTMLCanvasElement;
    if (!isCanvas) {
      if (img.complete && img.naturalWidth === 0) {
        // Image finished loading but has no data — mark as failed
        this.failedSheets.add(name);
        return (
          this.sheets.get(DEFAULT_CIRCLE_SHEET) ??
          this.createDefaultCircleSheet(gl)
        );
      }
      if (!img.complete) {
        return null; // Still loading
      }
      // Image just loaded — try to pack into atlas now
      if (!this.atlas.entries.has(name)) {
        const atlasEntry = this.atlas.add(name, img);
        if (atlasEntry) {
          // Successfully packed — rebuild groups to use atlas page grouping
          this.instancesVersion++;
          return this.ensureSheet(gl, atlasEntry.page);
        }
      }
    }

    const w = isCanvas ? img.width : img.naturalWidth;
    const h = isCanvas ? img.height : img.naturalHeight;

    return this.uploadTexture(gl, name, img, w, h);
  }

  private uploadTexture(
    gl: WebGL2RenderingContext,
    name: string,
    source: HTMLImageElement | HTMLCanvasElement,
    w: number,
    h: number,
  ): SheetTex {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const entry = { name, tex, w, h };
    this.sheets.set(name, entry);
    return entry;
  }

  // Cached grouping to avoid per-frame allocation
  private cachedGroups: Map<string, IconMarkerInstance[]> = new Map();
  private cachedGroupsVersion = -1;
  private lastBufferVersion = -1;
  private lastBufferZoom = -999;

  /** Check if the layer has pending changes that need rendering */
  isDirty(): boolean {
    return this.instancesVersion !== this.lastBufferVersion;
  }

  private rebuildGroups() {
    this.cachedGroups.clear();
    for (let i = 0; i < this.instances.length; i++) {
      const m = this.instances[i];
      if (m === null) continue;
      if (this.hidden && this.hidden.has(m.id)) continue;
      // Use atlas page name for grouping if the sheet was packed into an atlas
      const atlasEntry = this.atlas.entries.get(m.sheet);
      const groupKey = atlasEntry ? atlasEntry.page : m.sheet;
      let arr = this.cachedGroups.get(groupKey);
      if (!arr) {
        arr = [];
        this.cachedGroups.set(groupKey, arr);
      }
      arr.push(m);
    }
    this.cachedGroupsVersion = this.instancesVersion;
  }

  render(gl: WebGL2RenderingContext, state: RenderState): void {
    if (!this.program || !this.vao) return;
    if (this.instances.length === 0) {
      this.lastBufferVersion = this.instancesVersion;
      return;
    }

    // Rebuild groups only when instances change
    if (this.cachedGroupsVersion !== this.instancesVersion) {
      this.rebuildGroups();
    }
    const groups = this.cachedGroups;

    // Reset debug stats for this frame
    this.stats.totalInstances = 0;
    this.stats.visibleInstances = 0;
    this.stats.culledInstances = 0;
    this.stats.drawCalls = 0;
    this.stats.sheetGroups = groups.size;
    this.stats.cullSkipped = false;

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    // Use separate blend for alpha to prevent framebuffer alpha from dropping below 1.0
    // when rendering semi-transparent pixels on opaque map tiles.
    // Without this, premultipliedAlpha:true canvas compositing causes page background bleed-through.
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA, // RGB: standard alpha blend
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA, // Alpha: preserves opaque background
    );

    // Enable depth testing when tilted so foreground icons overlap background
    const usePerspectiveDepth = state.pitch > 0.01;
    if (usePerspectiveDepth) {
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.clear(gl.DEPTH_BUFFER_BIT);
    }

    // Pass pitch and bearing for 3D height effect
    gl.uniform1f(this.u_pitch_loc, state.pitch);
    gl.uniform1f(this.u_bearing_loc, state.bearing);

    // Pass screen dimensions for billboard scaling
    gl.uniform2f(this.u_screen_loc, state.width, state.height);

    // Pass zoom level for world-space needle scaling and adaptive icon sizing
    gl.uniform1f(this.u_zoom_loc, state.zoom);
    gl.uniform1f(this.u_minZoom_loc, state.minZoom);
    gl.uniform1f(this.u_maxZoom_loc, state.maxZoom);
    gl.uniform1f(this.u_dynamicSizeFactor_loc, this.dynamicSizeFactor);

    // Set color-blind simulation uniforms
    gl.uniform1i(this.u_cb_mode_loc, this.cbModeToInt(this.colorBlindMode));
    gl.uniform1f(this.u_cb_sev_loc, this.colorBlindSeverity);

    // Set high contrast uniforms
    gl.uniform1i(this.u_hc_mode_loc, this.highContrastMode ? 1 : 0);
    gl.uniform4fv(this.u_hc_color_loc, this.highContrastColor);
    gl.uniform1f(this.u_hc_thickness_loc, this.highContrastThickness);

    // Use the EXACT same view matrix as the webmap to prevent positioning drift
    // This ensures icons are perfectly anchored during rotation and perspective changes
    gl.uniformMatrix3fv(this.u_view_loc, false, state.viewMatrix!);

    // Reproject markers when instances changed or zoom is different from last frame
    const zoomChanged = this.lastBufferZoom !== state.zoom;
    const rebuildBuffers =
      this.lastBufferVersion !== this.instancesVersion || zoomChanged;
    if (rebuildBuffers) {
      this.lastBufferVersion = this.instancesVersion;
      this.lastBufferZoom = state.zoom;
      // Reset marker bounding box — will be recomputed during projection
      this.markerBoundsMinX = Infinity;
      this.markerBoundsMaxX = -Infinity;
      this.markerBoundsMinY = Infinity;
      this.markerBoundsMaxY = -Infinity;
    }

    // Compute viewport bounds in world pixels for frustum culling.
    // We invert the view matrix (2D affine part) to map clip-space corners
    // back to world-pixel coordinates, then cull markers outside.
    const vm = state.viewMatrix!;
    const va = vm[0],
      vb = vm[1],
      vc = vm[3],
      vd = vm[4],
      vtx = vm[6],
      vty = vm[7];
    const det = va * vd - vb * vc;
    let vpMinX = -Infinity,
      vpMaxX = Infinity,
      vpMinY = -Infinity,
      vpMaxY = Infinity;
    if (Math.abs(det) > 1e-10) {
      const invDet = 1 / det;
      const ia = vd * invDet;
      const ib = -vb * invDet;
      const ic = -vc * invDet;
      const id = va * invDet;
      const itx = -(ia * vtx + ic * vty);
      const ity = -(ib * vtx + id * vty);
      const cx0 = ia * -1 + ic * -1 + itx;
      const cy0 = ib * -1 + id * -1 + ity;
      const cx1 = ia * 1 + ic * -1 + itx;
      const cy1 = ib * 1 + id * -1 + ity;
      const cx2 = ia * -1 + ic * 1 + itx;
      const cy2 = ib * -1 + id * 1 + ity;
      const cx3 = ia * 1 + ic * 1 + itx;
      const cy3 = ib * 1 + id * 1 + ity;
      vpMinX = Math.min(cx0, cx1, cx2, cx3);
      vpMaxX = Math.max(cx0, cx1, cx2, cx3);
      vpMinY = Math.min(cy0, cy1, cy2, cy3);
      vpMaxY = Math.max(cy0, cy1, cy2, cy3);
    }

    // Skip per-marker culling when viewport contains all marker positions.
    // When zoomed out fully, all markers are visible so bounds-checking each
    // one is pure overhead. We track the projected bounding box across
    // rebuildGroups and compare it against the viewport.
    const pad = 200; // must match cullPad below
    const boundsValid = this.markerBoundsMaxX > this.markerBoundsMinX;
    const skipCulling =
      boundsValid &&
      this.markerBoundsMinX >= vpMinX - pad &&
      this.markerBoundsMaxX <= vpMaxX + pad &&
      this.markerBoundsMinY >= vpMinY - pad &&
      this.markerBoundsMaxY <= vpMaxY + pad;
    this.stats.cullSkipped = skipCulling;

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
          layered: new Float32Array(newCap),
          angles: new Float32Array(newCap),
          keepUprights: new Float32Array(newCap),
          stemModes: new Float32Array(newCap),
          iconModes: new Float32Array(newCap),
          tints: new Float32Array(newCap * 4),
          spiderOffsets: new Float32Array(newCap * 2),
          capacity: newCap,
        };
      }

      const offsets = this.preallocatedBuffers.offsets!;
      const sizes = this.preallocatedBuffers.sizes!;
      const uvs = this.preallocatedBuffers.uvs!;
      const discs = this.preallocatedBuffers.discs!;
      const flags = this.preallocatedBuffers.flags!;
      const counts = this.preallocatedBuffers.counts!;
      const layered = this.preallocatedBuffers.layered!;
      const angles = this.preallocatedBuffers.angles!;
      const keepUprights = this.preallocatedBuffers.keepUprights!;
      const tints = this.preallocatedBuffers.tints!;

      // Padding in world pixels to avoid popping at viewport edges.
      // Accounts for marker size, height stems, and spider offsets.
      const cullPad = 200;

      let visCount = 0;
      for (let i = 0; i < list.length; i++) {
        const m = list[i];
        const c = m as any;

        // Cache projected position per marker — only recompute on zoom change.
        // Uses _proj to avoid allocating a new {x,y} object per marker.
        if (rebuildBuffers || c._projX === undefined) {
          const p = state.projection(m.latLng);
          c._projX = p.x;
          c._projY = p.y;
          // Update marker bounding box for skip-culling optimization
          if (p.x < this.markerBoundsMinX) this.markerBoundsMinX = p.x;
          if (p.x > this.markerBoundsMaxX) this.markerBoundsMaxX = p.x;
          if (p.y < this.markerBoundsMinY) this.markerBoundsMinY = p.y;
          if (p.y > this.markerBoundsMaxY) this.markerBoundsMaxY = p.y;
        }
        const px = c._projX as number;
        const py = c._projY as number;

        // Viewport culling: skip markers entirely outside visible bounds.
        // When the viewport contains all markers, skip the per-marker check entirely.
        if (
          !skipCulling &&
          !m.alwaysOnTop &&
          !m.isSelected &&
          (px < vpMinX - cullPad ||
            px > vpMaxX + cullPad ||
            py < vpMinY - cullPad ||
            py > vpMaxY + cullPad)
        ) {
          continue;
        }

        let size = m.size;
        let sizeW = m.sizeW ?? size;
        if (m.isHighlighted) {
          size *= 1.15;
          sizeW *= 1.15;
        }
        if (m.isSelected) {
          size *= 1.3;
          sizeW *= 1.3;
        }
        offsets[visCount * 2 + 0] = px - sizeW / 2;
        offsets[visCount * 2 + 1] = py - size / 2 + (m.screenOffsetY ?? 0);
        sizes[visCount * 2 + 0] = sizeW;
        sizes[visCount * 2 + 1] = size;

        // Use atlas-remapped rect for UV calculation if this icon was packed.
        // Cache the lookup on the instance to avoid Map.get per marker per frame.
        let uvRect: IconRect;
        if (!rebuildBuffers && c._atlasRect !== undefined) {
          uvRect = c._atlasRect || m.rect;
        } else {
          const atlasEntry = this.atlas.entries.get(m.sheet);
          c._atlasRect = atlasEntry ? atlasEntry.rect : null;
          uvRect = c._atlasRect || m.rect;
        }
        const u0 = uvRect.x / s.w;
        const v0 = uvRect.y / s.h;
        const uw = uvRect.width / s.w;
        const vh = uvRect.height / s.h;
        uvs[visCount * 4 + 0] = u0;
        uvs[visCount * 4 + 1] = v0;
        uvs[visCount * 4 + 2] = uw;
        uvs[visCount * 4 + 3] = vh;
        discs[visCount] = m.isDiscovered ? 1 : m.isMuted ? 0.5 : 0;
        const rawZ = typeof m.z === "number" ? m.z : 0;
        let normalizedHeight =
          m.zMag !== undefined ? Math.min(1, Math.max(0, m.zMag)) : undefined;
        if (normalizedHeight === undefined) {
          normalizedHeight =
            rawZ === 0
              ? 0
              : Math.min(1, Math.abs(rawZ) / DEFAULT_Z_NORMALIZATION);
        }
        // direction: 1=up+arrow, -1=down+arrow, 2=up needle only (no arrow)
        let direction = 0;
        if (m.zPos === "top") direction = 1;
        else if (m.zPos === "bottom") direction = -1;
        else if (m.zPos === "needle") direction = 2;
        else if (m.zPos === "needle-down") direction = -2;
        flags[visCount * 2 + 0] = normalizedHeight;
        flags[visCount * 2 + 1] = direction;
        counts[visCount] = m.isStacked ? 2 : 1;
        layered[visCount] = m.layered ? 1 : 0;
        const angle = m.rotation ?? 0;
        angles[visCount] = angle;
        keepUprights[visCount] = m.keepUpright !== false ? 1.0 : 0.0;
        // Parse tint color (hex string to RGBA), cached on the instance
        if (m.tint) {
          let rgba = (m as any)._tintRGBA as
            | [number, number, number, number]
            | undefined;
          if (!rgba || (m as any)._tintSrc !== m.tint) {
            const hex = m.tint.replace("#", "");
            rgba = [
              parseInt(hex.substring(0, 2), 16) / 255,
              parseInt(hex.substring(2, 4), 16) / 255,
              parseInt(hex.substring(4, 6), 16) / 255,
              hex.length >= 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1,
            ];
            (m as any)._tintRGBA = rgba;
            (m as any)._tintSrc = m.tint;
          }
          tints[visCount * 4 + 0] = rgba[0];
          tints[visCount * 4 + 1] = rgba[1];
          tints[visCount * 4 + 2] = rgba[2];
          tints[visCount * 4 + 3] = rgba[3];
        } else {
          tints[visCount * 4 + 0] = 1;
          tints[visCount * 4 + 1] = 1;
          tints[visCount * 4 + 2] = 1;
          tints[visCount * 4 + 3] = 0;
        }
        // Spider offset
        const so = this.preallocatedBuffers.spiderOffsets!;
        so[visCount * 2 + 0] = m.spiderOffsetX ?? 0;
        so[visCount * 2 + 1] = m.spiderOffsetY ?? 0;

        visCount++;
      }

      // Accumulate debug stats
      this.stats.totalInstances += list.length;
      this.stats.visibleInstances += visCount;
      this.stats.culledInstances += list.length - visCount;

      if (visCount === 0) return;

      this.stats.drawCalls += 2; // stem pass + icon pass
      const count = visCount;

      // Always upload offsets and sizes (change on zoom due to reprojection)
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

      // Upload all per-instance attributes. These buffers are shared across
      // all sheet groups, so they must be re-uploaded for each drawList call.
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
      gl.bindBuffer(gl.ARRAY_BUFFER, this.layeredBuf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        layered.subarray(0, count),
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
      gl.bindBuffer(gl.ARRAY_BUFFER, this.tints);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        tints.subarray(0, count * 4),
        gl.DYNAMIC_DRAW,
      );
      gl.bindBuffer(gl.ARRAY_BUFFER, this.spiderOffsets);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        this.preallocatedBuffers.spiderOffsets!.subarray(0, count * 2),
        gl.DYNAMIC_DRAW,
      );

      // First pass: Draw height stems (render mode = 1)
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

    // Reusable arrays to avoid per-frame allocations. Muted markers (faded
    // context, e.g. predicted spawns in combined mode or non-selected types
    // while a search result is selected) draw BEFORE normal ones per sheet,
    // so a faded marker never covers a full-opacity one.
    const mutedList: IconMarkerInstance[] = [];
    const normalList: IconMarkerInstance[] = [];
    const onTopEntries: {
      s: { w: number; h: number; tex: WebGLTexture };
      items: IconMarkerInstance[];
    }[] = [];

    // Draw spider lines first (behind all icons). Geometry is rebuilt only when
    // the instance set or zoom changed (rebuildBuffers); otherwise the cached
    // GPU buffer is re-drawn, so a redraw triggered by an unrelated layer (the
    // live player marker) costs only the draw call, not a full re-projection.
    this.drawSpiderLines(gl, state, rebuildBuffers);

    // Draw DEFAULT_CIRCLE_SHEET first (center dots behind spiderfied icons),
    // then all other groups.
    const circleGroup = groups.get(DEFAULT_CIRCLE_SHEET);
    if (circleGroup) {
      const s = this.ensureSheet(gl, DEFAULT_CIRCLE_SHEET);
      if (s) {
        mutedList.length = 0;
        normalList.length = 0;
        let onTopList: IconMarkerInstance[] | null = null;
        for (const m of circleGroup) {
          if (m.isSelected || m.alwaysOnTop) {
            if (!onTopList) onTopList = [];
            onTopList.push(m);
          } else if (m.isMuted && !m.isDiscovered) {
            mutedList.push(m);
          } else {
            normalList.push(m);
          }
        }
        if (mutedList.length > 0) drawList(s, mutedList);
        drawList(s, normalList);
        if (onTopList) onTopEntries.push({ s, items: onTopList });
      }
    }

    for (const [sheet, items] of groups) {
      if (sheet === DEFAULT_CIRCLE_SHEET) continue;
      const s = this.ensureSheet(gl, sheet);
      if (!s) continue;
      mutedList.length = 0;
      normalList.length = 0;
      let onTopList: IconMarkerInstance[] | null = null;
      for (const m of items) {
        if (m.isSelected || m.alwaysOnTop) {
          if (!onTopList) onTopList = [];
          onTopList.push(m);
        } else if (m.isMuted && !m.isDiscovered) {
          mutedList.push(m);
        } else {
          normalList.push(m);
        }
      }
      if (mutedList.length > 0) drawList(s, mutedList);
      drawList(s, normalList);
      if (onTopList) onTopEntries.push({ s, items: onTopList });
    }

    // Final pass: draw alwaysOnTop/selected markers above everything
    if (onTopEntries.length > 0) {
      if (usePerspectiveDepth) gl.disable(gl.DEPTH_TEST);
      for (const entry of onTopEntries) {
        drawList(entry.s, entry.items);
      }
      if (usePerspectiveDepth) gl.enable(gl.DEPTH_TEST);
    }

    gl.bindVertexArray(null);

    // Restore depth state
    if (usePerspectiveDepth) {
      gl.disable(gl.DEPTH_TEST);
    }

    // Restore global blend state
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
  }

  private spiderLineProg: WebGLProgram | null = null;
  private spiderLineVao: WebGLVertexArrayObject | null = null;
  private spiderLineBuf: WebGLBuffer | null = null;
  private spiderLineData: Float32Array = new Float32Array(0);
  /**
   * Number of spider lines currently uploaded to spiderLineBuf. The geometry
   * (world positions) only depends on the instance set + zoom, so it is rebuilt
   * only when `rebuildBuffers` is true and otherwise re-drawn from the cached
   * GPU buffer — see drawSpiderLines. This keeps an unrelated redraw (e.g. the
   * live player marker moving 16x/s) from re-projecting every clustered marker.
   */
  private spiderLineCount = 0;
  private spiderLineUniforms: {
    view: WebGLUniformLocation | null;
    screen: WebGLUniformLocation | null;
    zoom: WebGLUniformLocation | null;
    minZoom: WebGLUniformLocation | null;
    maxZoom: WebGLUniformLocation | null;
    factor: WebGLUniformLocation | null;
    pitch: WebGLUniformLocation | null;
  } | null = null;

  private ensureSpiderLineProg(gl: WebGL2RenderingContext) {
    if (this.spiderLineProg) return;
    const vs = `#version 300 es
      // a_line: xy=world pos, zw=spider offset
      // a_height: x=heightIntensity, y=direction
      in vec4 a_line;
      in vec2 a_height;
      uniform mat3 u_view;
      uniform vec2 u_screen;
      uniform float u_zoom, u_minZoom, u_maxZoom, u_factor, u_pitch;
      const float MIN_NEEDLE_WORLD = 0.0;
      const float MAX_NEEDLE_WORLD = 20.0;
      void main() {
        float viewScale = length(vec2(u_view[0][0], u_view[1][0]));
        float refScale = viewScale * pow(2.0, (u_minZoom + u_maxZoom) * 0.5 - u_zoom);
        float ratio = viewScale / refScale;
        float zs = u_factor > 0.001 ? clamp(pow(ratio, u_factor), 0.25, 2.5) : 1.0;
        vec3 cp = u_view * vec3(a_line.xy, 1.0);
        vec2 so = a_line.zw * zs * vec2(2.0 / u_screen.x, -2.0 / u_screen.y);

        // Height offset (matches icon shader logic)
        float heightIntensity = clamp(a_height.x, 0.0, 1.0);
        float directionFlag = a_height.y;
        float direction = abs(directionFlag) > 1.5 ? sign(directionFlag) : (directionFlag > 0.5 ? 1.0 : (directionFlag < -0.5 ? -1.0 : 0.0));
        float iconDirection = direction;
        if (abs(iconDirection) < 0.5 || heightIntensity < 0.01) {
          iconDirection = 0.0;
        }
        float zoomScale = pow(2.0, u_zoom);
        float heightWorld = mix(MIN_NEEDLE_WORLD, MAX_NEEDLE_WORLD, heightIntensity) * abs(sin(u_pitch)) * zoomScale * 500.0;
        float heightClip = heightWorld * viewScale * (2.0 / u_screen.y);

        float depth = (1.0 + cp.y) * 0.5;
        cp.y += heightClip * iconDirection;

        gl_Position = vec4(cp.xy + so, depth, 1.0);
      }`;
    const fs = `#version 300 es
      precision highp float;
      out vec4 o;
      void main() { o = vec4(0.55, 0.55, 0.55, 0.6); }`;
    const v = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(v, vs);
    gl.compileShader(v);
    const f = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(f, fs);
    gl.compileShader(f);
    this.spiderLineProg = gl.createProgram()!;
    gl.attachShader(this.spiderLineProg, v);
    gl.attachShader(this.spiderLineProg, f);
    gl.linkProgram(this.spiderLineProg);
    gl.deleteShader(v);
    gl.deleteShader(f);
    this.spiderLineUniforms = {
      view: gl.getUniformLocation(this.spiderLineProg, "u_view"),
      screen: gl.getUniformLocation(this.spiderLineProg, "u_screen"),
      zoom: gl.getUniformLocation(this.spiderLineProg, "u_zoom"),
      minZoom: gl.getUniformLocation(this.spiderLineProg, "u_minZoom"),
      maxZoom: gl.getUniformLocation(this.spiderLineProg, "u_maxZoom"),
      factor: gl.getUniformLocation(this.spiderLineProg, "u_factor"),
      pitch: gl.getUniformLocation(this.spiderLineProg, "u_pitch"),
    };
    this.spiderLineBuf = gl.createBuffer()!;
    this.spiderLineVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.spiderLineVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.spiderLineBuf);
    // a_line: 4 floats at offset 0, stride 6 floats
    const stride = 6 * 4; // 6 floats * 4 bytes
    const locLine = gl.getAttribLocation(this.spiderLineProg, "a_line");
    gl.enableVertexAttribArray(locLine);
    gl.vertexAttribPointer(locLine, 4, gl.FLOAT, false, stride, 0);
    // a_height: 2 floats at offset 4 floats
    const locHeight = gl.getAttribLocation(this.spiderLineProg, "a_height");
    gl.enableVertexAttribArray(locHeight);
    gl.vertexAttribPointer(locHeight, 2, gl.FLOAT, false, stride, 4 * 4);
    gl.bindVertexArray(null);
  }

  private drawSpiderLines(
    gl: WebGL2RenderingContext,
    state: RenderState,
    rebuildBuffers: boolean,
  ) {
    // Rebuild the spider-line geometry only when the instance set or zoom
    // changed. World positions come from state.projection (zoom-dependent);
    // pan/rotation live in the view matrix uniform set below, so they don't
    // require a geometry rebuild. When `rebuildBuffers` is false the cached
    // spiderLineBuf is reused as-is — this is what makes a player-marker-driven
    // redraw cheap (no per-instance re-projection of every clustered marker).
    if (rebuildBuffers) {
      // Count spider markers to size the buffer
      let count = 0;
      for (const inst of this.instances) {
        if (inst && (inst.spiderOffsetX || inst.spiderOffsetY)) count++;
      }
      this.spiderLineCount = count;
      if (count > 0) {
        // 6 floats per vertex (worldX, worldY, spiderOffsetX, spiderOffsetY, heightIntensity, direction)
        // 2 vertices per line
        const needed = count * 12;
        if (this.spiderLineData.length < needed) {
          this.spiderLineData = new Float32Array(
            Math.max(needed, Math.ceil(needed * 1.5)),
          );
        }
        let idx = 0;
        for (const inst of this.instances) {
          if (!inst || (!inst.spiderOffsetX && !inst.spiderOffsetY)) continue;
          const p = state.projection(inst.latLng);
          // Compute height info (same logic as uploadInstances)
          const rawZ = typeof inst.z === "number" ? inst.z : 0;
          let normalizedHeight =
            inst.zMag !== undefined
              ? Math.min(1, Math.max(0, inst.zMag))
              : undefined;
          if (normalizedHeight === undefined) {
            normalizedHeight =
              rawZ === 0
                ? 0
                : Math.min(1, Math.abs(rawZ) / DEFAULT_Z_NORMALIZATION);
          }
          let direction = 0;
          if (inst.zPos === "top") direction = 1;
          else if (inst.zPos === "bottom") direction = -1;
          else if (inst.zPos === "needle") direction = 2;
          else if (inst.zPos === "needle-down") direction = -2;

          // Center endpoint (no spider offset, same height)
          this.spiderLineData[idx++] = p.x;
          this.spiderLineData[idx++] = p.y;
          this.spiderLineData[idx++] = 0;
          this.spiderLineData[idx++] = 0;
          this.spiderLineData[idx++] = normalizedHeight;
          this.spiderLineData[idx++] = direction;
          // Offset endpoint (with spider offset, same height)
          this.spiderLineData[idx++] = p.x;
          this.spiderLineData[idx++] = p.y;
          this.spiderLineData[idx++] = inst.spiderOffsetX ?? 0;
          this.spiderLineData[idx++] = inst.spiderOffsetY ?? 0;
          this.spiderLineData[idx++] = normalizedHeight;
          this.spiderLineData[idx++] = direction;
        }

        this.ensureSpiderLineProg(gl);
        if (this.spiderLineProg && this.spiderLineVao && this.spiderLineBuf) {
          gl.bindVertexArray(this.spiderLineVao);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.spiderLineBuf);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            this.spiderLineData.subarray(0, idx),
            gl.DYNAMIC_DRAW,
          );
          gl.bindVertexArray(null);
        }
      }
    }

    if (this.spiderLineCount === 0) return;
    const count = this.spiderLineCount;

    this.ensureSpiderLineProg(gl);
    if (
      !this.spiderLineProg ||
      !this.spiderLineVao ||
      !this.spiderLineBuf ||
      !this.spiderLineUniforms
    )
      return;

    gl.useProgram(this.spiderLineProg);
    gl.bindVertexArray(this.spiderLineVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.spiderLineBuf);
    if (this.spiderLineUniforms.view && state.viewMatrix)
      gl.uniformMatrix3fv(
        this.spiderLineUniforms.view,
        false,
        state.viewMatrix,
      );
    if (this.spiderLineUniforms.screen)
      gl.uniform2f(this.spiderLineUniforms.screen, state.width, state.height);
    if (this.spiderLineUniforms.zoom)
      gl.uniform1f(this.spiderLineUniforms.zoom, state.zoom);
    if (this.spiderLineUniforms.minZoom)
      gl.uniform1f(this.spiderLineUniforms.minZoom, state.minZoom);
    if (this.spiderLineUniforms.maxZoom)
      gl.uniform1f(this.spiderLineUniforms.maxZoom, state.maxZoom);
    if (this.spiderLineUniforms.factor)
      gl.uniform1f(this.spiderLineUniforms.factor, this.dynamicSizeFactor);
    if (this.spiderLineUniforms.pitch)
      gl.uniform1f(this.spiderLineUniforms.pitch, state.pitch);
    gl.drawArrays(gl.LINES, 0, count * 2);
    gl.bindVertexArray(null);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
  }

  private failedSheets = new Set<string>(); // Track sheets that failed to load

  /** Callback injected by WebMap to request a redraw when icon sheets load */
  onSheetLoad?: () => void;

  private createImage(url: string) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      this.onSheetLoad?.();
    };
    img.onerror = () => {
      for (const [name, source] of this.sheetImages) {
        if (source === img) {
          this.failedSheets.add(name);
          break;
        }
      }
    };
    img.src = url;
    return img;
  }

  // Create a default circle texture for markers without icons
  private createDefaultCircleSheet(gl: WebGL2RenderingContext): SheetTex {
    const logicalSize = 64;
    const dpr = window.devicePixelRatio || 1;
    const size = Math.round(logicalSize * dpr);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    // Draw a white circle with slight transparency
    ctx.beginPath();
    ctx.arc(
      logicalSize / 2,
      logicalSize / 2,
      logicalSize / 2 - 2,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fill();

    // Add a subtle border
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const entry = { name: DEFAULT_CIRCLE_SHEET, tex, w: size, h: size };
    this.sheets.set(DEFAULT_CIRCLE_SHEET, entry);
    return entry;
  }

  // Compute zoom-dependent size scale matching the vertex shader formula
  private getZoomSizeScale(state: RenderState): number {
    if (this.dynamicSizeFactor <= 0.001) return 1;
    const midZoom = (state.minZoom + state.maxZoom) * 0.5;
    const scaleRatio = Math.pow(2, state.zoom - midZoom);
    return Math.max(
      0.25,
      Math.min(2.5, Math.pow(scaleRatio, this.dynamicSizeFactor)),
    );
  }

  // Compute the screen-space Y offset for a marker's height stem (matching vertex shader)
  private getHeightScreenOffset(
    m: IconMarkerInstance,
    state: RenderState,
  ): number {
    const rawZ = typeof m.z === "number" ? m.z : 0;
    let heightIntensity =
      m.zMag !== undefined ? Math.min(1, Math.max(0, m.zMag)) : undefined;
    if (heightIntensity === undefined) {
      heightIntensity =
        rawZ === 0 ? 0 : Math.min(1, Math.abs(rawZ) / DEFAULT_Z_NORMALIZATION);
    }
    let direction = 0;
    if (m.zPos === "top" || m.zPos === "needle") direction = 1;
    else if (m.zPos === "bottom" || m.zPos === "needle-down") direction = -1;
    if (direction === 0 || heightIntensity < 0.01) return 0;

    // Match vertex shader: heightWorld = mix(0, 20, heightIntensity) * abs(sin(pitch)) * 2^zoom * 500
    const heightWorld =
      20 *
      heightIntensity *
      Math.abs(Math.sin(state.pitch)) *
      Math.pow(2, state.zoom) *
      500;
    // heightClip = heightWorld * viewScale * (2 / screenHeight)
    const view = state.viewMatrix!;
    const viewScale = Math.sqrt(view[0] * view[0] + view[1] * view[1]);
    const heightClip = heightWorld * viewScale * (2 / state.height);
    // Convert clip offset to screen pixels (Y is inverted in screen coords)
    return (-heightClip * direction * state.height) / 2;
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
    const zoomScale = this.getZoomSizeScale(state);
    for (let i = this.instances.length - 1; i >= 0; i--) {
      const m = this.instances[i];
      if (m === null) continue; // Skip null entries
      if (m.noHitTest) continue;
      if (this.hidden && this.hidden.has(m.id)) continue;
      const p = state.projection(m.latLng);
      const s = toScreen(p.x, p.y);
      // Offset hit test for spiderfied markers (scaled by dynamic size like shader)
      if (m.spiderOffsetX || m.spiderOffsetY) {
        s.x += (m.spiderOffsetX ?? 0) * zoomScale;
        s.y += (m.spiderOffsetY ?? 0) * zoomScale;
      }
      // Offset hit test to the elevated icon position (height stem)
      s.y += this.getHeightScreenOffset(m, state);
      let effH = m.size * zoomScale;
      let effW = (m.sizeW ?? m.size) * zoomScale;
      if (m.isHighlighted) {
        effH *= 1.15;
        effW *= 1.15;
      }
      if (m.isSelected) {
        effH *= 1.3;
        effW *= 1.3;
      }
      const dx = screen.x - s.x;
      const dy = screen.y - s.y;
      if (Math.abs(dx) <= effW / 2 && Math.abs(dy) <= effH / 2) {
        return m;
      }
    }
    return null;
  }

  // Return all markers stacked near the hovered point, grouped around the nearest hit
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
    const zoomScale = this.getZoomSizeScale(state);
    let bestIdx = -1,
      bestDist2 = Infinity,
      bestR = 0,
      bestScreen = { x: 0, y: 0 };
    for (let i = this.instances.length - 1; i >= 0; i--) {
      const m = this.instances[i];
      if (m === null) continue; // Skip null entries
      if (m.noHitTest) continue;
      if (this.hidden && this.hidden.has(m.id)) continue;
      const p = state.projection(m.latLng);
      const s = toScreen(p.x, p.y);
      // Offset hit test for spiderfied markers (scaled by dynamic size like shader)
      if (m.spiderOffsetX || m.spiderOffsetY) {
        s.x += (m.spiderOffsetX ?? 0) * zoomScale;
        s.y += (m.spiderOffsetY ?? 0) * zoomScale;
      }
      // Offset hit test to the elevated icon position (height stem)
      s.y += this.getHeightScreenOffset(m, state);
      let effH = m.size * zoomScale;
      let effW = (m.sizeW ?? m.size) * zoomScale;
      if (m.isHighlighted) {
        effH *= 1.15;
        effW *= 1.15;
      }
      if (m.isSelected) {
        effH *= 1.3;
        effW *= 1.3;
      }
      const r = Math.max(effW, effH) / 2;
      const dx = screen.x - s.x;
      const dy = screen.y - s.y;
      const d2 = dx * dx + dy * dy;
      if (
        Math.abs(dx) <= effW / 2 &&
        Math.abs(dy) <= effH / 2 &&
        d2 < bestDist2
      ) {
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
      if (m.spiderOffsetX || m.spiderOffsetY) {
        s.x += m.spiderOffsetX ?? 0;
        s.y += m.spiderOffsetY ?? 0;
      }
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
  ): boolean {
    const hitMarker = this.pick(state, screen) as IconMarkerInstance | null;
    if (hitMarker) {
      const handler = this.eventHandlers.contextmenu.get(hitMarker.id);
      if (handler) {
        handler(hitMarker);
        return true;
      }
    }
    return false;
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
