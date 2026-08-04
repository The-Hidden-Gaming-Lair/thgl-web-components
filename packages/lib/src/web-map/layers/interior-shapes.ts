import type { Layer, RenderState } from "../types";

/**
 * One interior AREA to preview on the parent (surface) map.
 *  - `mapName` : the layer map to switch to when the shape is clicked.
 *  - `bounds`  : [[minLat,minLng],[maxLat,maxLng]] world placement of the plan.
 *  - `url`     : the interior floor-plan image (its alpha = the footprint shape).
 *  - `label`   : display name (rendered as a DOM label elsewhere).
 */
export interface InteriorArea {
  mapName: string;
  label: string;
  bounds: [[number, number], [number, number]];
  url: string;
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

/**
 * Renders each interior's floor-plan dimmed onto the parent map at its true
 * location, and makes it clickable — click a plan to descend into that layer.
 * A single layer holds all areas so hit-testing picks the top-most footprint by
 * ACTUAL alpha (not bounding box), which matters where interiors sit close
 * together. The 分层地图 entrance model, drawn in place on the world.
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
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const v = compile(gl.VERTEX_SHADER, vs);
    const f = compile(gl.FRAGMENT_SHADER, fs);
    const p = gl.createProgram()!;
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    gl.deleteShader(v);
    gl.deleteShader(f);
    this.program = p;
    this.uView = gl.getUniformLocation(p, "u_view");
    this.uTex = gl.getUniformLocation(p, "u_tex");
    this.uOpacity = gl.getUniformLocation(p, "u_opacity");
    this.uTint = gl.getUniformLocation(p, "u_tint");
    this.posLoc = gl.getAttribLocation(p, "a_position");
    this.texLoc = gl.getAttribLocation(p, "a_texCoord");
    this.vao = gl.createVertexArray();
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
  }

  /**
   * Highlight (light up) one interior's footprint — keyed by the overlay `url`
   * (unique per interior; the `mapName` is shared now that all lead to the one
   * Underground map). Driven by label hover.
   */
  setHighlighted(url: string | null): void {
    if (this.highlighted === url) return;
    this.highlighted = url;
    this.onTileLoad?.(); // request a redraw
  }

  // No pick()/handleClick(): the footprint itself is NOT a click target — you
  // enter via its name button (label) or the Layered Map picker.

  /** Label anchors (CSS px) from the last rendered frame — for DOM labels. */
  getLabels(): {
    id: string;
    mapName: string;
    label: string;
    x: number;
    y: number;
  }[] {
    return this.lastState ? this.labelAnchors(this.lastState) : [];
  }

  labelAnchors(state: RenderState): {
    id: string;
    mapName: string;
    label: string;
    x: number;
    y: number;
  }[] {
    const view = state.viewMatrix;
    if (!view) return [];
    const a0 = view[0],
      b0 = view[1],
      c0 = view[3],
      d0 = view[4],
      tx = view[6],
      ty = view[7];
    const out: {
      id: string;
      mapName: string;
      label: string;
      x: number;
      y: number;
    }[] = [];
    for (const a of this.areas) {
      if (!a.loaded || !a.area.label) continue;
      const [[minLat, minLng], [maxLat, maxLng]] = a.area.bounds;
      // centroid UV → latlng (U=lng fraction, V=0 at maxLat)
      const lng = minLng + a.cu * (maxLng - minLng);
      const lat = maxLat - a.cv * (maxLat - minLat);
      const p = state.projection([lat, lng]);
      const cx = a0 * p.x + c0 * p.y + tx;
      const cy = b0 * p.x + d0 * p.y + ty;
      out.push({
        id: a.area.url,
        mapName: a.area.mapName,
        label: a.area.label,
        x: (cx * 0.5 + 0.5) * (state.width / state.devicePixelRatio),
        y: (1 - (cy * 0.5 + 0.5)) * (state.height / state.devicePixelRatio),
      });
    }
    return out;
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
    }
    this.gl = null;
    this.areas.forEach((a) => {
      a.vertexBuffer = null;
      a.texture = null;
      a.loaded = false;
    });
  }
}
