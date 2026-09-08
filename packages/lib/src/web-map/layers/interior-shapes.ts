import type { Layer, RenderState } from "../types";

/**
 * One interior AREA to preview on the parent (surface) map.
 *  - `mapName` : the layer map to switch to when the shape is clicked.
 *  - `bounds`  : [[minLat,minLng],[maxLat,maxLng]] world placement of the plan.
 *  - `url`     : the interior floor-plan image (its alpha = the footprint shape).
 *  - `label`   : display name (rendered as an on-canvas chip, see below).
 */
export interface InteriorArea {
  mapName: string;
  label: string;
  bounds: [[number, number], [number, number]];
  url: string;
}

/** One floor of an interior — an inline number button on its chip. */
export interface InteriorFloor {
  id: string;
  floor: number;
}

/**
 * How the name chips behave. `floorsFor` resolves an interior's floors (the
 * surface's floor-level maps that include it); with more than one floor the chip
 * shows inline floor-number buttons, otherwise the whole chip enters the map.
 */
export interface InteriorLabelOptions {
  floorsFor: (area: InteriorArea) => InteriorFloor[];
  /** The currently-viewed map — its floor button is drawn active. */
  activeMap: string;
  onEnter: (mapName: string) => void;
  onSelectFloor: (floorId: string) => void;
}

interface AreaGL {
  area: InteriorArea;
  vertexBuffer: WebGLBuffer | null;
  texture: WebGLTexture | null;
  quad: Float32Array; // 12 (2 tris)
  lastZoom: number;
  loaded: boolean;
  // Alpha mask (downsampled) for precise hit-testing + centroid, in image UV space.
  alpha: Uint8Array | null;
  aw: number;
  ah: number;
  /** Footprint centroid in image UV (0..1). */
  cu: number;
  cv: number;
}

/** A rasterized chip in the label atlas (all sizes in CSS px). */
interface Chip {
  area: AreaGL;
  w: number;
  h: number;
  /** Atlas UV rects [u0, v0, u1, v1] for the normal and hovered variants. */
  uv: [number, number, number, number];
  uvHover: [number, number, number, number];
  /** Floor buttons: hit range along the chip's x axis (chip-local CSS px). */
  floors: { id: string; x0: number; x1: number }[];
}

/** A chip's placement on screen for the last rendered frame (device px). */
interface ChipPlacement {
  chip: Chip;
  cx: number;
  cy: number;
  hw: number;
  hh: number;
}

/** What a chip hit resolves to. */
export interface InteriorLabelHit {
  area: InteriorArea;
  floorId: string | null;
}

// lucide "layers" icon (24×24 viewbox), stroked.
const LAYERS_ICON_PATHS = [
  "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",
  "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",
  "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",
];

// Chip metrics — mirror the former DOM chip (rounded-sm border px-1.5 py-0.5
// text-[11px] font-medium, gap-1, 12px icon, 16px floor buttons text-[10px]).
const CHIP = {
  padX: 6,
  padY: 2,
  gap: 4,
  icon: 12,
  font: 11,
  lineH: 16,
  floorH: 16,
  floorMinW: 16,
  floorPadX: 4,
  floorFont: 10,
  radius: 2,
  border: 1,
};

/**
 * Renders each interior's floor-plan dimmed onto the parent map at its true
 * location, plus a name chip at its footprint centroid that enters the interior
 * (or one of its floors). A single layer holds all areas so hit-testing picks
 * the top-most chip. The 分层地图 entrance model, drawn in place on the world.
 *
 * The chips live INSIDE the WebGL scene (this layer sits below the marker
 * layers), so markers and the player icon draw over them instead of being
 * covered — they're rasterized with a 2D canvas into one atlas texture and
 * drawn as screen-sized quads anchored at the projected centroid.
 */
export class InteriorShapesLayer implements Layer {
  onTileLoad?: () => void;

  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private uView: WebGLUniformLocation | null = null;
  private uTex: WebGLUniformLocation | null = null;
  private uOpacity: WebGLUniformLocation | null = null;
  private uTint: WebGLUniformLocation | null = null;
  private posLoc = 0;
  private texLoc = 0;

  // Chip (label) pipeline
  private chipProgram: WebGLProgram | null = null;
  private chipVao: WebGLVertexArrayObject | null = null;
  private chipBuffer: WebGLBuffer | null = null;
  private chipTexture: WebGLTexture | null = null;
  private uChipScreen: WebGLUniformLocation | null = null;
  private uChipTex: WebGLUniformLocation | null = null;
  private chips: Chip[] = [];
  private chipDpr = 0;
  private chipsDirty = true;
  private chipVerts = new Float32Array(0);
  private placements: ChipPlacement[] = [];
  private labelOptions: InteriorLabelOptions | null = null;
  private labelsVisible = true;
  private hoveredChip: Chip | null = null;
  private fontsReadyHooked = false;

  private areas: AreaGL[] = [];
  private opacity: number;
  private highlighted: string | null = null;
  private lastState: RenderState | null = null;

  private static readonly TEX_COORDS = new Float32Array([
    0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0,
  ]);
  // Downsample the alpha mask to at most this many px on the long side.
  private static readonly MASK_MAX = 256;
  private static readonly ALPHA_HIT = 24; // 0..255 threshold for "inside"
  private static readonly CHIP_FLOATS_PER_VERT = 6; // clip xy, offset px xy, uv

  constructor(areas: InteriorArea[], opts: { opacity?: number } = {}) {
    this.opacity = opts.opacity ?? 0.4;
    this.areas = areas.map((area) => ({
      area,
      vertexBuffer: null,
      texture: null,
      quad: new Float32Array(12),
      lastZoom: -1,
      loaded: false,
      alpha: null,
      aw: 0,
      ah: 0,
      cu: 0.5,
      cv: 0.5,
    }));
  }

  onAdd(gl: WebGL2RenderingContext): void {
    this.gl = gl;
    this.createProgram();
    this.createChipProgram();
    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      InteriorShapesLayer.TEX_COORDS,
      gl.STATIC_DRAW,
    );
    for (const a of this.areas) {
      a.vertexBuffer = gl.createBuffer();
      this.loadArea(a);
    }
    // Web fonts may land after the first rasterization — redo the atlas once
    // they're in so the chips don't keep the fallback face.
    if (!this.fontsReadyHooked && typeof document !== "undefined") {
      this.fontsReadyHooked = true;
      document.fonts?.ready.then(() => this.invalidateChips());
    }
  }

  onRemove(): void {
    this.destroy();
  }

  private createProgram(): void {
    const gl = this.gl!;
    const vs = `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      uniform mat3 u_view;
      out vec2 v_uv;
      void main() {
        vec3 p = u_view * vec3(a_position, 1.0);
        gl_Position = vec4(p.xy, 0.0, 1.0);
        v_uv = a_texCoord;
      }`;
    const fs = `#version 300 es
      precision mediump float;
      in vec2 v_uv;
      uniform sampler2D u_tex;
      uniform float u_opacity;
      uniform float u_tint;
      out vec4 outColor;
      void main() {
        vec4 c = texture(u_tex, v_uv);
        // Dim the plan and give the footprint a faint cool tint so it reads as
        // an "enterable" preview. On hover the tint drops toward 0 (near full
        // colour) and opacity rises, so the shape lights up.
        vec3 rgb = mix(c.rgb, vec3(0.55, 0.68, 0.85), u_tint);
        outColor = vec4(rgb, c.a * u_opacity);
      }`;
    const p = this.link(vs, fs);
    this.program = p;
    this.uView = gl.getUniformLocation(p, "u_view");
    this.uTex = gl.getUniformLocation(p, "u_tex");
    this.uOpacity = gl.getUniformLocation(p, "u_opacity");
    this.uTint = gl.getUniformLocation(p, "u_tint");
    this.posLoc = gl.getAttribLocation(p, "a_position");
    this.texLoc = gl.getAttribLocation(p, "a_texCoord");
    this.vao = gl.createVertexArray();
  }

  /**
   * Chip quads: the anchor is already in clip space (projected on the CPU each
   * frame), the corner offset is in device px — so a chip keeps its screen size
   * at every zoom, like the DOM element it replaces.
   */
  private createChipProgram(): void {
    const gl = this.gl!;
    const vs = `#version 300 es
      in vec2 a_clip;
      in vec2 a_offset;
      in vec2 a_uv;
      uniform vec2 u_screen;
      out vec2 v_uv;
      void main() {
        vec2 px = a_offset * vec2(2.0 / u_screen.x, -2.0 / u_screen.y);
        gl_Position = vec4(a_clip + px, 0.0, 1.0);
        v_uv = a_uv;
      }`;
    const fs = `#version 300 es
      precision mediump float;
      in vec2 v_uv;
      uniform sampler2D u_tex;
      out vec4 outColor;
      void main() {
        outColor = texture(u_tex, v_uv);
      }`;
    const p = this.link(vs, fs);
    this.chipProgram = p;
    this.uChipScreen = gl.getUniformLocation(p, "u_screen");
    this.uChipTex = gl.getUniformLocation(p, "u_tex");
    this.chipVao = gl.createVertexArray();
    this.chipBuffer = gl.createBuffer();
    const stride = InteriorShapesLayer.CHIP_FLOATS_PER_VERT * 4;
    gl.bindVertexArray(this.chipVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.chipBuffer);
    const clipLoc = gl.getAttribLocation(p, "a_clip");
    const offLoc = gl.getAttribLocation(p, "a_offset");
    const uvLoc = gl.getAttribLocation(p, "a_uv");
    gl.enableVertexAttribArray(clipLoc);
    gl.vertexAttribPointer(clipLoc, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(offLoc);
    gl.vertexAttribPointer(offLoc, 2, gl.FLOAT, false, stride, 8);
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, stride, 16);
    gl.bindVertexArray(null);
  }

  private link(vsSrc: string, fsSrc: string): WebGLProgram {
    const gl = this.gl!;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const v = compile(gl.VERTEX_SHADER, vsSrc);
    const f = compile(gl.FRAGMENT_SHADER, fsSrc);
    const p = gl.createProgram()!;
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    gl.deleteShader(v);
    gl.deleteShader(f);
    return p;
  }

  private loadArea(a: AreaGL): void {
    const gl = this.gl;
    if (!gl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!this.gl) return;
      a.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, a.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.buildAlphaMask(a, img);
      a.loaded = true;
      this.onTileLoad?.();
    };
    img.src = a.area.url;
  }

  /** Downsample the plan's alpha to a small mask for hit-testing + centroid. */
  private buildAlphaMask(a: AreaGL, img: HTMLImageElement): void {
    const scale = Math.min(
      1,
      InteriorShapesLayer.MASK_MAX / Math.max(img.width, img.height),
    );
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    const alpha = new Uint8Array(w * h);
    let sumU = 0,
      sumV = 0,
      n = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const al = data[(y * w + x) * 4 + 3];
        alpha[y * w + x] = al;
        if (al >= InteriorShapesLayer.ALPHA_HIT) {
          sumU += x;
          sumV += y;
          n++;
        }
      }
    }
    a.alpha = alpha;
    a.aw = w;
    a.ah = h;
    if (n > 0) {
      a.cu = sumU / n / w;
      a.cv = sumV / n / h;
    }
  }

  private buildQuad(
    a: AreaGL,
    projection: (ll: [number, number]) => { x: number; y: number },
  ): void {
    const [[minLat, minLng], [maxLat, maxLng]] = a.area.bounds;
    const bl = projection([minLat, minLng]);
    const br = projection([minLat, maxLng]);
    const tl = projection([maxLat, minLng]);
    const tr = projection([maxLat, maxLng]);
    const v = a.quad;
    v[0] = bl.x;
    v[1] = bl.y;
    v[2] = br.x;
    v[3] = br.y;
    v[4] = tl.x;
    v[5] = tl.y;
    v[6] = br.x;
    v[7] = br.y;
    v[8] = tr.x;
    v[9] = tr.y;
    v[10] = tl.x;
    v[11] = tl.y;
    const gl = this.gl!;
    gl.bindBuffer(gl.ARRAY_BUFFER, a.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, v, gl.DYNAMIC_DRAW);
  }

  render(gl: WebGL2RenderingContext, state: RenderState): void {
    this.lastState = state;
    if (!state.viewMatrix || !this.program || !this.vao) return;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.uniformMatrix3fv(this.uView, false, state.viewMatrix);
    gl.uniform1i(this.uTex, 0);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
    const drawArea = (a: AreaGL) => {
      if (!a.loaded || !a.texture) return;
      if (a.lastZoom !== state.zoom) {
        this.buildQuad(a, state.projection);
        a.lastZoom = state.zoom;
      }
      const hot = a.area.url === this.highlighted;
      gl.uniform1f(this.uOpacity, hot ? 0.95 : this.opacity);
      gl.uniform1f(this.uTint, hot ? 0.04 : 0.28);
      gl.bindBuffer(gl.ARRAY_BUFFER, a.vertexBuffer);
      gl.enableVertexAttribArray(this.posLoc);
      gl.vertexAttribPointer(this.posLoc, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      gl.enableVertexAttribArray(this.texLoc);
      gl.vertexAttribPointer(this.texLoc, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, a.texture);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    // Draw the hovered footprint last so it sits on top of its neighbours.
    for (const a of this.areas)
      if (a.area.url !== this.highlighted) drawArea(a);
    for (const a of this.areas)
      if (a.area.url === this.highlighted) drawArea(a);
    gl.bindVertexArray(null);

    this.renderChips(gl, state);
  }

  // ==================== CHIPS (name labels) ====================

  /** Configure the chips (floors, active floor, click handlers). */
  setLabelOptions(opts: InteriorLabelOptions | null): void {
    this.labelOptions = opts;
    this.invalidateChips();
  }

  /**
   * Show/hide the chips without touching the footprints — e.g. hidden while the
   * overlay window is locked (click-through), where they'd be unclickable.
   */
  setLabelsVisible(visible: boolean): void {
    if (this.labelsVisible === visible) return;
    this.labelsVisible = visible;
    if (!visible) this.placements = [];
    this.onTileLoad?.();
  }

  private invalidateChips(): void {
    this.chipsDirty = true;
    this.onTileLoad?.();
  }

  /**
   * Resolve a theme token as seen from the map canvas — the dark theme is set
   * on an ancestor below <html>, so reading the root would return the light
   * value (near-black primary, invisible on the dark chip).
   */
  private cssVarColor(name: string, fallback: string): string {
    const canvas = this.gl?.canvas;
    if (typeof document === "undefined" || !(canvas instanceof HTMLElement))
      return fallback;
    const v = getComputedStyle(canvas).getPropertyValue(name).trim();
    if (!v) return fallback;
    // Tailwind/shadcn tokens are bare HSL triplets ("181 76% 46%").
    return /^[\d.]+\s/.test(v) ? `hsl(${v})` : v;
  }

  /**
   * Rasterize every chip (normal + hovered variant) into one atlas texture.
   * Runs when the options, the loaded set of areas, or the DPR change.
   */
  private buildChipAtlas(state: RenderState): void {
    const gl = this.gl;
    if (!gl || typeof document === "undefined") return;
    const dpr = state.devicePixelRatio;
    const opts = this.labelOptions;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const fontFamily =
      getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
    const nameFont = `500 ${CHIP.font}px ${fontFamily}`;
    const floorFont = `600 ${CHIP.floorFont}px ${fontFamily}`;
    const primary = this.cssVarColor("--primary", "hsl(181 76% 46%)");
    const primaryFg = this.cssVarColor("--primary-foreground", "#0f172a");

    // Measure
    type Draft = {
      area: AreaGL;
      w: number;
      h: number;
      floors: {
        id: string;
        floor: number;
        x0: number;
        x1: number;
        w: number;
      }[];
    };
    const drafts: Draft[] = [];
    for (const a of this.areas) {
      if (!a.loaded || !a.area.label) continue;
      ctx.font = nameFont;
      const nameW = Math.ceil(ctx.measureText(a.area.label).width);
      const floorList = opts ? opts.floorsFor(a.area) : [];
      let x = CHIP.border + CHIP.padX + CHIP.icon + CHIP.gap + nameW;
      const floors: Draft["floors"] = [];
      if (floorList.length > 1) {
        ctx.font = floorFont;
        for (const f of floorList) {
          const tw = Math.ceil(ctx.measureText(String(f.floor)).width);
          const w = Math.max(CHIP.floorMinW, tw + CHIP.floorPadX * 2);
          x += CHIP.gap;
          floors.push({ id: f.id, floor: f.floor, x0: x, x1: x + w, w });
          x += w;
        }
      }
      const w = x + CHIP.padX + CHIP.border;
      const h = CHIP.lineH + CHIP.padY * 2 + CHIP.border * 2;
      drafts.push({ area: a, w, h, floors });
    }

    const PAD = 2; // atlas gutter (CSS px) to avoid bleeding between chips
    const atlasW = Math.max(1, ...drafts.map((d) => d.w + PAD * 2));
    let atlasH = PAD;
    for (const d of drafts) atlasH += (d.h + PAD) * 2;
    atlasH = Math.max(1, atlasH + PAD);
    canvas.width = Math.ceil(atlasW * dpr);
    canvas.height = Math.ceil(atlasH * dpr);
    ctx.scale(dpr, dpr);
    ctx.textBaseline = "middle";

    const layersIcon = LAYERS_ICON_PATHS.map((p) => new Path2D(p));
    const drawChip = (d: Draft, x: number, y: number, hover: boolean) => {
      // background + border (slate-900/70, white/15 → hover slate-800/90, white/30)
      ctx.beginPath();
      ctx.roundRect(x + 0.5, y + 0.5, d.w - 1, d.h - 1, CHIP.radius);
      ctx.fillStyle = hover ? "rgba(30, 41, 59, 0.9)" : "rgba(15, 23, 42, 0.7)";
      ctx.fill();
      ctx.lineWidth = CHIP.border;
      ctx.strokeStyle = hover
        ? "rgba(255, 255, 255, 0.3)"
        : "rgba(255, 255, 255, 0.15)";
      ctx.stroke();
      const midY = y + d.h / 2;
      // layers icon (opacity 0.7)
      let cx = x + CHIP.border + CHIP.padX;
      ctx.save();
      ctx.translate(cx, midY - CHIP.icon / 2);
      ctx.scale(CHIP.icon / 24, CHIP.icon / 24);
      ctx.strokeStyle = "rgba(241, 245, 249, 0.7)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const p of layersIcon) ctx.stroke(p);
      ctx.restore();
      cx += CHIP.icon + CHIP.gap;
      // name
      ctx.font = nameFont;
      ctx.textAlign = "left";
      ctx.fillStyle = "rgb(241, 245, 249)";
      ctx.fillText(d.area.area.label, cx, midY);
      // floor buttons
      ctx.font = floorFont;
      ctx.textAlign = "center";
      for (const f of d.floors) {
        const active = opts?.activeMap === f.id;
        ctx.beginPath();
        ctx.roundRect(x + f.x0, midY - CHIP.floorH / 2, f.w, CHIP.floorH, 2);
        ctx.fillStyle = active ? primary : "rgba(255, 255, 255, 0.1)";
        ctx.fill();
        ctx.fillStyle = active ? primaryFg : "rgb(241, 245, 249)";
        ctx.fillText(String(f.floor), x + f.x0 + f.w / 2, midY);
      }
    };

    const chips: Chip[] = [];
    let y = PAD;
    for (const d of drafts) {
      const rect = (yy: number): [number, number, number, number] => [
        PAD / atlasW,
        yy / atlasH,
        (PAD + d.w) / atlasW,
        (yy + d.h) / atlasH,
      ];
      drawChip(d, PAD, y, false);
      const uv = rect(y);
      y += d.h + PAD;
      drawChip(d, PAD, y, true);
      const uvHover = rect(y);
      y += d.h + PAD;
      chips.push({
        area: d.area,
        w: d.w,
        h: d.h,
        uv,
        uvHover,
        floors: d.floors.map((f) => ({ id: f.id, x0: f.x0, x1: f.x1 })),
      });
    }

    if (!this.chipTexture) this.chipTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.chipTexture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.chips = chips;
    this.chipDpr = dpr;
    this.chipsDirty = false;
    if (this.hoveredChip && !chips.includes(this.hoveredChip)) {
      const prev = this.hoveredChip;
      this.hoveredChip = chips.find((c) => c.area === prev.area) ?? null;
    }
  }

  private renderChips(gl: WebGL2RenderingContext, state: RenderState): void {
    if (!this.labelsVisible || !this.chipProgram || !this.chipVao) return;
    const loadedCount = this.areas.filter(
      (a) => a.loaded && a.area.label,
    ).length;
    if (
      this.chipsDirty ||
      this.chipDpr !== state.devicePixelRatio ||
      this.chips.length !== loadedCount
    ) {
      this.buildChipAtlas(state);
    }
    if (!this.chips.length || !this.chipTexture) {
      this.placements = [];
      return;
    }
    const dpr = state.devicePixelRatio;
    const anchors = this.labelAnchorsClip(state);
    const F = InteriorShapesLayer.CHIP_FLOATS_PER_VERT;
    const need = this.chips.length * 6 * F;
    if (this.chipVerts.length < need) this.chipVerts = new Float32Array(need);
    const v = this.chipVerts;
    const placements: ChipPlacement[] = [];
    let n = 0;
    let i = 0;
    for (const chip of this.chips) {
      const anchor = anchors.get(chip.area);
      if (!anchor) continue;
      const hw = (chip.w / 2) * dpr;
      const hh = (chip.h / 2) * dpr;
      const [u0, v0, u1, v1] =
        chip === this.hoveredChip ? chip.uvHover : chip.uv;
      // 2 triangles: (−,−) (+,−) (−,+) / (+,−) (+,+) (−,+); offset y+ = down.
      const corners: [number, number, number, number][] = [
        [-hw, -hh, u0, v0],
        [hw, -hh, u1, v0],
        [-hw, hh, u0, v1],
        [hw, -hh, u1, v0],
        [hw, hh, u1, v1],
        [-hw, hh, u0, v1],
      ];
      for (const [ox, oy, uu, vv] of corners) {
        v[i++] = anchor.x;
        v[i++] = anchor.y;
        v[i++] = ox;
        v[i++] = oy;
        v[i++] = uu;
        v[i++] = vv;
      }
      n++;
      const px = (anchor.x * 0.5 + 0.5) * state.width;
      const py = (1 - (anchor.y * 0.5 + 0.5)) * state.height;
      placements.push({ chip, cx: px, cy: py, hw, hh });
    }
    this.placements = placements;
    if (!n) return;

    gl.useProgram(this.chipProgram);
    gl.bindVertexArray(this.chipVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.chipBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, v.subarray(0, n * 6 * F), gl.DYNAMIC_DRAW);
    gl.uniform2f(this.uChipScreen, state.width, state.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.chipTexture);
    gl.uniform1i(this.uChipTex, 0);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
    gl.drawArrays(gl.TRIANGLES, 0, n * 6);
    gl.bindVertexArray(null);
  }

  /** Chip anchors (footprint centroids) in clip space for this frame. */
  private labelAnchorsClip(
    state: RenderState,
  ): Map<AreaGL, { x: number; y: number }> {
    const out = new Map<AreaGL, { x: number; y: number }>();
    const view = state.viewMatrix;
    if (!view) return out;
    const a0 = view[0],
      b0 = view[1],
      c0 = view[3],
      d0 = view[4],
      tx = view[6],
      ty = view[7];
    for (const a of this.areas) {
      if (!a.loaded || !a.area.label) continue;
      const [[minLat, minLng], [maxLat, maxLng]] = a.area.bounds;
      // centroid UV → latlng (U=lng fraction, V=0 at maxLat)
      const lng = minLng + a.cu * (maxLng - minLng);
      const lat = maxLat - a.cv * (maxLat - minLat);
      const p = state.projection([lat, lng]);
      out.set(a, {
        x: a0 * p.x + c0 * p.y + tx,
        y: b0 * p.x + d0 * p.y + ty,
      });
    }
    return out;
  }

  /** Chip hit-test in device px (top-most chip wins). */
  private pickChip(screen: {
    x: number;
    y: number;
  }): { placement: ChipPlacement; floorId: string | null } | null {
    if (!this.labelsVisible) return null;
    for (let i = this.placements.length - 1; i >= 0; i--) {
      const pl = this.placements[i];
      if (
        screen.x < pl.cx - pl.hw ||
        screen.x > pl.cx + pl.hw ||
        screen.y < pl.cy - pl.hh ||
        screen.y > pl.cy + pl.hh
      )
        continue;
      // chip-local x in CSS px
      const lx = (screen.x - (pl.cx - pl.hw)) / this.chipDpr;
      const floor = pl.chip.floors.find((f) => lx >= f.x0 && lx <= f.x1);
      return { placement: pl, floorId: floor?.id ?? null };
    }
    return null;
  }

  /** WebMap hit-test hook: chips are the only click targets of this layer. */
  pick(
    _state: RenderState,
    screen: { x: number; y: number },
  ): InteriorLabelHit | null {
    const hit = this.pickChip(screen);
    return hit
      ? { area: hit.placement.chip.area.area, floorId: hit.floorId }
      : null;
  }

  /** WebMap click hook (after pick() returned a hit). */
  handleClick(_state: RenderState, screen: { x: number; y: number }): void {
    const hit = this.pickChip(screen);
    const opts = this.labelOptions;
    if (!hit || !opts) return;
    const chip = hit.placement.chip;
    if (chip.floors.length) {
      // A click on the name part of a multi-floor chip does nothing (as before).
      if (hit.floorId) opts.onSelectFloor(hit.floorId);
    } else {
      opts.onEnter(chip.area.area.mapName);
    }
  }

  /** WebMap hover hook: hovering a chip lights up its footprint + the chip. */
  handleMouseMove(_state: RenderState, screen: { x: number; y: number }): void {
    const hit = this.pickChip(screen);
    const chip = hit?.placement.chip ?? null;
    if (chip === this.hoveredChip) return;
    this.hoveredChip = chip;
    this.setHighlighted(chip ? chip.area.area.url : null);
    this.onTileLoad?.();
  }

  /**
   * Highlight (light up) one interior's footprint — keyed by the overlay `url`
   * (unique per interior; the `mapName` is shared now that all lead to the one
   * Underground map). Driven by chip hover.
   */
  setHighlighted(url: string | null): void {
    if (this.highlighted === url) return;
    this.highlighted = url;
    this.onTileLoad?.(); // request a redraw
  }

  /** Chip placements (CSS px) from the last rendered frame — for tests/tooling. */
  getLabels(): {
    id: string;
    mapName: string;
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }[] {
    const state = this.lastState;
    if (!state) return [];
    const dpr = state.devicePixelRatio;
    return this.placements.map((pl) => ({
      id: pl.chip.area.area.url,
      mapName: pl.chip.area.area.mapName,
      label: pl.chip.area.area.label,
      x: pl.cx / dpr,
      y: pl.cy / dpr,
      w: pl.chip.w,
      h: pl.chip.h,
    }));
  }

  destroy(): void {
    const gl = this.gl;
    if (gl) {
      for (const a of this.areas) {
        if (a.vertexBuffer) gl.deleteBuffer(a.vertexBuffer);
        if (a.texture) gl.deleteTexture(a.texture);
      }
      if (this.texCoordBuffer) gl.deleteBuffer(this.texCoordBuffer);
      if (this.vao) gl.deleteVertexArray(this.vao);
      if (this.program) gl.deleteProgram(this.program);
      if (this.chipBuffer) gl.deleteBuffer(this.chipBuffer);
      if (this.chipVao) gl.deleteVertexArray(this.chipVao);
      if (this.chipProgram) gl.deleteProgram(this.chipProgram);
      if (this.chipTexture) gl.deleteTexture(this.chipTexture);
    }
    this.gl = null;
    this.chipBuffer = null;
    this.chipVao = null;
    this.chipProgram = null;
    this.chipTexture = null;
    this.chips = [];
    this.placements = [];
    this.chipsDirty = true;
    this.areas.forEach((a) => {
      a.vertexBuffer = null;
      a.texture = null;
      a.loaded = false;
    });
  }
}
