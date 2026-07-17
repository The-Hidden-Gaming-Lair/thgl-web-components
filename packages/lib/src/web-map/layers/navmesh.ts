import type { Layer, LatLng, RenderState } from "../types";

/**
 * Fills a set of triangles — a live-read dungeon navmesh / walkable floor plan —
 * as a translucent overlay. Vertices arrive already in the map's marker frame
 * (the same frame the player/actor markers use), so they align with the player
 * marker by construction. They're projected to map space on set + on zoom change
 * (the affine projection is zoom-dependent), then filled on the GPU.
 *
 * Two render styles (see `smooth`):
 *  - crisp (default): one translucent triangle pass. Right for a real navmesh whose
 *    polys tile edge-to-edge (no overlap), e.g. a baked dungeon-floor nav.
 *  - smooth: for a StaticMeshActor footprint — hundreds of overlapping boxes. Drawn
 *    as flat squares that reads as blocky "pixel-art" and blotches where alpha stacks.
 *    Instead we render the union into an offscreen coverage buffer, blur it, and
 *    threshold with smoothstep. Blur+threshold is a signed-distance/metaball trick:
 *    it fuses the overlapping boxes into ONE connected silhouette with smooth,
 *    anti-aliased edges — no visible squares, no alpha stacking.
 */
export class NavmeshLayer implements Layer {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private viewLoc: WebGLUniformLocation | null = null;
  private colorLoc: WebGLUniformLocation | null = null;

  // Game-frame triangle verts (flat x,y) and the projected map-space verts on the GPU.
  private srcVerts: Float32Array = new Float32Array(0);
  private projected: Float32Array = new Float32Array(0);
  private vertCount = 0; // number of 2D vertices (srcVerts.length / 2)
  private lastProjZoom = -1;
  private needsUpload = false;
  private color: [number, number, number, number];
  private outline: [number, number, number, number];

  // --- smooth (blur + threshold) pipeline ---
  private smooth: boolean;
  private renderScale: number; // offscreen coverage resolution vs the drawing buffer
  private blurSpread: number; // gaussian tap step, in offscreen texels
  private threshold: number; // isosurface level of the blurred coverage field
  private aa: number; // smoothstep half-width around the threshold (edge softness)
  private blurProgram: WebGLProgram | null = null;
  private compProgram: WebGLProgram | null = null;
  private quadVao: WebGLVertexArrayObject | null = null;
  private quadBuffer: WebGLBuffer | null = null;
  private fboCoverage: WebGLFramebuffer | null = null;
  private texCoverage: WebGLTexture | null = null;
  private fboBlur: WebGLFramebuffer | null = null;
  private texBlur: WebGLTexture | null = null;
  private fboW = 0;
  private fboH = 0;
  private smoothInited = false;

  constructor(
    opts: {
      verts?: number[] | Float32Array;
      /** Fill color as normalized RGBA (0..1). Default: cool translucent slate. */
      color?: [number, number, number, number];
      /** Edge stroke color (0..1). Alpha 0 disables the outline. */
      outline?: [number, number, number, number];
      /** Smooth an overlapping-box footprint into a connected silhouette. */
      smooth?: boolean;
      /** Offscreen coverage resolution (0..1) vs the drawing buffer. Default 0.5. */
      renderScale?: number;
      /** Blur tap step in offscreen texels — larger = rounder / connects more. */
      blur?: number;
      /** Coverage threshold (0..1). Lower grows/connects the shape. Default 0.5. */
      threshold?: number;
    } = {},
  ) {
    this.color = opts.color ?? [0.72, 0.8, 0.86, 0.32];
    this.outline = opts.outline ?? [0.85, 0.92, 1.0, 0.55];
    this.smooth = opts.smooth ?? false;
    this.renderScale = opts.renderScale ?? 0.5;
    this.blurSpread = opts.blur ?? 2.0;
    this.threshold = opts.threshold ?? 0.5;
    this.aa = 0.12;
    if (opts.verts) this.setVerts(opts.verts);
  }

  setColor(color: [number, number, number, number]): void {
    this.color = color;
  }

  /** Toggle the smooth (blur+threshold) silhouette vs the crisp triangle fill. */
  setSmooth(smooth: boolean): void {
    this.smooth = smooth;
  }

  /** Replace the triangle set (flat x,y pairs in the marker frame). */
  setVerts(verts: number[] | Float32Array): void {
    this.srcVerts =
      verts instanceof Float32Array ? verts : new Float32Array(verts);
    this.vertCount = (this.srcVerts.length / 2) | 0;
    this.projected = new Float32Array(this.srcVerts.length);
    this.lastProjZoom = -1; // force re-projection on next render
    this.needsUpload = true;
  }

  onAdd(gl: WebGL2RenderingContext): void {
    this.gl = gl;

    const vs = `#version 300 es
      in vec2 a_position;
      uniform mat3 u_view;
      void main() {
        vec3 pos = u_view * vec3(a_position, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);
      }
    `;
    const fs = `#version 300 es
      precision mediump float;
      uniform vec4 u_color;
      out vec4 outColor;
      void main() { outColor = u_color; }
    `;

    this.program = this.createProgram(vs, fs);
    this.vertexBuffer = gl.createBuffer();
    this.vao = gl.createVertexArray();
    if (this.program) {
      this.viewLoc = gl.getUniformLocation(this.program, "u_view");
      this.colorLoc = gl.getUniformLocation(this.program, "u_color");
      gl.bindVertexArray(this.vao);
      const posLoc = gl.getAttribLocation(this.program, "a_position");
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
    }
  }

  onRemove(): void {
    this.destroy();
  }

  private reproject(
    projection: (latlng: LatLng) => { x: number; y: number },
  ): void {
    const src = this.srcVerts;
    const dst = this.projected;
    // Marker-frame vert (x, y) projects the same way the player marker does:
    // its latLng tuple is [x, y] (project maps lat->mapY, lng->mapX).
    for (let i = 0; i < this.vertCount; i++) {
      const p = projection([src[i * 2], src[i * 2 + 1]]);
      dst[i * 2] = p.x;
      dst[i * 2 + 1] = p.y;
    }
    this.needsUpload = true;
  }

  render(gl: WebGL2RenderingContext, state: RenderState): void {
    if (!state.viewMatrix || !this.program || !this.vao || this.vertCount < 3) {
      return;
    }

    // The affine projection is zoom-dependent, so re-project when zoom changes.
    if (this.lastProjZoom !== state.zoom) {
      this.reproject(state.projection);
      this.lastProjZoom = state.zoom;
    }
    if (this.needsUpload) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.projected, gl.DYNAMIC_DRAW);
      this.needsUpload = false;
    }

    if (this.smooth) {
      this.renderSmooth(gl, state);
    } else {
      this.renderCrisp(gl, state);
    }
  }

  /** One translucent triangle pass — right for non-overlapping navmesh polys. */
  private renderCrisp(gl: WebGL2RenderingContext, state: RenderState): void {
    const prevProgram = gl.getParameter(gl.CURRENT_PROGRAM);
    const prevBlend = gl.isEnabled(gl.BLEND);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );

    if (this.viewLoc)
      gl.uniformMatrix3fv(this.viewLoc, false, state.viewMatrix!);
    if (this.colorLoc) {
      gl.uniform4f(
        this.colorLoc,
        this.color[0],
        this.color[1],
        this.color[2],
        this.color[3],
      );
    }
    gl.drawArrays(gl.TRIANGLES, 0, this.vertCount);

    gl.bindVertexArray(null);
    gl.useProgram(prevProgram);
    if (!prevBlend) gl.disable(gl.BLEND);
  }

  /**
   * Offscreen coverage -> blur -> threshold. Fuses overlapping boxes into one
   * smooth connected silhouette with anti-aliased edges (and an optional stroke).
   */
  private renderSmooth(gl: WebGL2RenderingContext, state: RenderState): void {
    if (!this.smoothInited) this.initSmooth(gl);
    if (!this.blurProgram || !this.compProgram) {
      this.renderCrisp(gl, state); // shader compile failed — degrade gracefully
      return;
    }

    const W = gl.drawingBufferWidth;
    const H = gl.drawingBufferHeight;
    const fw = Math.max(1, Math.floor(W * this.renderScale));
    const fh = Math.max(1, Math.floor(H * this.renderScale));
    if (!this.ensureFbos(gl, fw, fh)) {
      this.renderCrisp(gl, state);
      return;
    }

    const prevProgram = gl.getParameter(gl.CURRENT_PROGRAM);
    const prevBlend = gl.isEnabled(gl.BLEND);
    const prevFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    const prevActive = gl.getParameter(gl.ACTIVE_TEXTURE);

    // --- Pass 1: rasterize the box union into the coverage buffer (flat 1.0, no blend) ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboCoverage);
    gl.viewport(0, 0, fw, fh);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    if (this.viewLoc)
      gl.uniformMatrix3fv(this.viewLoc, false, state.viewMatrix!);
    if (this.colorLoc) gl.uniform4f(this.colorLoc, 1, 1, 1, 1);
    gl.drawArrays(gl.TRIANGLES, 0, this.vertCount);
    gl.bindVertexArray(null);

    // --- Pass 2+3: separable gaussian blur (coverage -> blur -> coverage) ---
    gl.useProgram(this.blurProgram);
    gl.bindVertexArray(this.quadVao);
    const stepLoc = gl.getUniformLocation(this.blurProgram, "u_step");
    const btexLoc = gl.getUniformLocation(this.blurProgram, "u_tex");
    gl.uniform1i(btexLoc, 0);
    gl.activeTexture(gl.TEXTURE0);

    // horizontal: texCoverage -> fboBlur
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboBlur);
    gl.bindTexture(gl.TEXTURE_2D, this.texCoverage);
    gl.uniform2f(stepLoc, this.blurSpread / fw, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // vertical: texBlur -> fboCoverage (now holds the smooth field)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboCoverage);
    gl.bindTexture(gl.TEXTURE_2D, this.texBlur);
    gl.uniform2f(stepLoc, 0, this.blurSpread / fh);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // --- Pass 4: composite to screen — threshold the field into a smooth fill ---
    gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);
    gl.viewport(0, 0, W, H);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
    gl.useProgram(this.compProgram);
    gl.bindVertexArray(this.quadVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texCoverage);
    gl.uniform1i(gl.getUniformLocation(this.compProgram, "u_field"), 0);
    gl.uniform4f(
      gl.getUniformLocation(this.compProgram, "u_color"),
      this.color[0],
      this.color[1],
      this.color[2],
      this.color[3],
    );
    gl.uniform4f(
      gl.getUniformLocation(this.compProgram, "u_outline"),
      this.outline[0],
      this.outline[1],
      this.outline[2],
      this.outline[3],
    );
    gl.uniform1f(
      gl.getUniformLocation(this.compProgram, "u_threshold"),
      this.threshold,
    );
    gl.uniform1f(gl.getUniformLocation(this.compProgram, "u_aa"), this.aa);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // restore
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(prevActive);
    gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);
    gl.useProgram(prevProgram);
    if (!prevBlend) gl.disable(gl.BLEND);
  }

  private initSmooth(gl: WebGL2RenderingContext): void {
    this.smoothInited = true;

    const fsVs = `#version 300 es
      in vec2 a_pos;
      out vec2 v_uv;
      void main() {
        v_uv = a_pos * 0.5 + 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;
    // 9-tap gaussian (normalized weights), separable.
    const blurFs = `#version 300 es
      precision mediump float;
      uniform sampler2D u_tex;
      uniform vec2 u_step;
      in vec2 v_uv;
      out vec4 outColor;
      void main() {
        float s = texture(u_tex, v_uv).r * 0.2270270270;
        s += texture(u_tex, v_uv + u_step * 1.0).r * 0.1945945946;
        s += texture(u_tex, v_uv - u_step * 1.0).r * 0.1945945946;
        s += texture(u_tex, v_uv + u_step * 2.0).r * 0.1216216216;
        s += texture(u_tex, v_uv - u_step * 2.0).r * 0.1216216216;
        s += texture(u_tex, v_uv + u_step * 3.0).r * 0.0540540541;
        s += texture(u_tex, v_uv - u_step * 3.0).r * 0.0540540541;
        s += texture(u_tex, v_uv + u_step * 4.0).r * 0.0162162162;
        s += texture(u_tex, v_uv - u_step * 4.0).r * 0.0162162162;
        outColor = vec4(s, s, s, 1.0);
      }
    `;
    const compFs = `#version 300 es
      precision mediump float;
      uniform sampler2D u_field;
      uniform vec4 u_color;
      uniform vec4 u_outline;
      uniform float u_threshold;
      uniform float u_aa;
      in vec2 v_uv;
      out vec4 outColor;
      void main() {
        float f = texture(u_field, v_uv).r;
        // Filled interior, anti-aliased at the isosurface.
        float fill = smoothstep(u_threshold - u_aa, u_threshold + u_aa, f);
        // Thin stroke centred on the isosurface.
        float edge = (1.0 - smoothstep(0.0, u_aa * 1.5, abs(f - u_threshold))) * u_outline.a;
        vec3 rgb = mix(u_color.rgb, u_outline.rgb, edge);
        float a = max(u_color.a * fill, edge);
        if (a <= 0.001) discard;
        outColor = vec4(rgb, a);
      }
    `;

    this.blurProgram = this.createProgram(fsVs, blurFs);
    this.compProgram = this.createProgram(fsVs, compFs);

    // Full-screen triangle (covers clip space; v_uv derived in the vs).
    this.quadBuffer = gl.createBuffer();
    this.quadVao = gl.createVertexArray();
    gl.bindVertexArray(this.quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    for (const prog of [this.blurProgram, this.compProgram]) {
      if (!prog) continue;
      const loc = gl.getAttribLocation(prog, "a_pos");
      if (loc >= 0) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      }
    }
    gl.bindVertexArray(null);
  }

  private makeTarget(
    gl: WebGL2RenderingContext,
    w: number,
    h: number,
  ): { fbo: WebGLFramebuffer; tex: WebGLTexture } | null {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      w,
      h,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex,
      0,
    );
    const ok =
      gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (!ok || !fbo || !tex) return null;
    return { fbo, tex };
  }

  private ensureFbos(
    gl: WebGL2RenderingContext,
    w: number,
    h: number,
  ): boolean {
    if (this.fboCoverage && this.fboW === w && this.fboH === h) return true;
    this.disposeFbos(gl);
    const a = this.makeTarget(gl, w, h);
    const b = this.makeTarget(gl, w, h);
    if (!a || !b) {
      this.disposeFbos(gl);
      return false;
    }
    this.fboCoverage = a.fbo;
    this.texCoverage = a.tex;
    this.fboBlur = b.fbo;
    this.texBlur = b.tex;
    this.fboW = w;
    this.fboH = h;
    return true;
  }

  private disposeFbos(gl: WebGL2RenderingContext): void {
    if (this.fboCoverage) gl.deleteFramebuffer(this.fboCoverage);
    if (this.texCoverage) gl.deleteTexture(this.texCoverage);
    if (this.fboBlur) gl.deleteFramebuffer(this.fboBlur);
    if (this.texBlur) gl.deleteTexture(this.texBlur);
    this.fboCoverage = this.texCoverage = this.fboBlur = this.texBlur = null;
    this.fboW = this.fboH = 0;
  }

  private createProgram(vs: string, fs: string): WebGLProgram | null {
    const gl = this.gl;
    if (!gl) return null;
    const v = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(v, vs);
    gl.compileShader(v);
    const f = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(f, fs);
    gl.compileShader(f);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, v);
    gl.attachShader(prog, f);
    gl.linkProgram(prog);
    gl.deleteShader(v);
    gl.deleteShader(f);
    return prog;
  }

  destroy(): void {
    const gl = this.gl;
    if (gl) {
      if (this.vertexBuffer) gl.deleteBuffer(this.vertexBuffer);
      if (this.vao) gl.deleteVertexArray(this.vao);
      if (this.program) gl.deleteProgram(this.program);
      if (this.blurProgram) gl.deleteProgram(this.blurProgram);
      if (this.compProgram) gl.deleteProgram(this.compProgram);
      if (this.quadBuffer) gl.deleteBuffer(this.quadBuffer);
      if (this.quadVao) gl.deleteVertexArray(this.quadVao);
      this.disposeFbos(gl);
    }
    this.blurProgram = null;
    this.compProgram = null;
    this.quadVao = null;
    this.quadBuffer = null;
    this.smoothInited = false;
    this.gl = null;
    this.program = null;
  }
}
