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
 *    as flat squares that read as blocky "pixel-art" and blotch where alpha stacks.
 *    Instead we fuse the box union into ONE connected silhouette via a
 *    signed-distance / metaball trick (rasterize coverage -> gaussian blur ->
 *    smoothstep threshold), and stroke a thin outline on the isosurface.
 *
 *    CRUCIALLY the entire colored silhouette (fill AND outline) is BAKED ONCE into a
 *    WORLD-ANCHORED (marker-frame) texture — not recomputed in screen space every
 *    frame. Screen-space recompute shimmers on pan/zoom: the fill wobbles and the thin
 *    outline "crawls" as the coverage/threshold lands on different sub-pixels each
 *    frame. Baking in world space means panning/zooming only bilinear-samples a stable
 *    premultiplied image. The bake is redone only when the box set (or color) changes,
 *    so it's cheap.
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

  // --- smooth (world-anchored blur + threshold) pipeline ---
  private smooth: boolean;
  private blurSpread: number; // gaussian tap step, in bake-texture texels
  private threshold: number; // isosurface level of the blurred coverage field
  private aa: number; // smoothstep half-width around the threshold (edge softness)
  private smoothInited = false;
  private blurProgram: WebGLProgram | null = null; // separable gaussian (fullscreen tri)
  private compBakeProgram: WebGLProgram | null = null; // field -> premult colored silhouette
  private quadVao: WebGLVertexArrayObject | null = null; // fullscreen tri for blur/composite
  private quadBuffer: WebGLBuffer | null = null;
  // bake targets (ping-pong) at the WORLD-anchored resolution (not the screen size)
  private fboCoverage: WebGLFramebuffer | null = null;
  private texCoverage: WebGLTexture | null = null;
  private fboBlur: WebGLFramebuffer | null = null;
  private texBlur: WebGLTexture | null = null;
  private bakeW = 0;
  private bakeH = 0;
  // marker-frame verts on the GPU for the (world-space) coverage rasterize
  private srcBuffer: WebGLBuffer | null = null;
  private srcVao: WebGLVertexArrayObject | null = null;
  // world textured-quad draw (samples the baked silhouette under the live view transform)
  private quadProgram: WebGLProgram | null = null;
  private worldQuadBuffer: WebGLBuffer | null = null;
  private worldQuadVao: WebGLVertexArrayObject | null = null;
  private worldQuadZoom = -1; // reproject the quad corners when zoom changes
  private bakeValid = false; // bakeResultTex holds a current baked silhouette
  private bakeDirty = false; // srcVerts/color changed -> rebake on next render
  private bakeResultTex: WebGLTexture | null = null; // premult colored silhouette (world-anchored)
  // padded marker-frame bbox the silhouette was baked over (quad corners project from this)
  private bakeMin: [number, number] = [0, 0];
  private bakeMax: [number, number] = [0, 0];

  private static readonly BAKE_MAX = 1536; // longest bake-texture side, in texels

  constructor(
    opts: {
      verts?: number[] | Float32Array;
      /** Fill color as normalized RGBA (0..1). Default: cool translucent slate. */
      color?: [number, number, number, number];
      /** Edge stroke color (0..1). Alpha 0 disables the outline. */
      outline?: [number, number, number, number];
      /** Smooth an overlapping-box footprint into a connected silhouette. */
      smooth?: boolean;
      /** Blur tap step in bake texels — larger = rounder / connects more. Default 2.5. */
      blur?: number;
      /** Coverage threshold (0..1). Lower grows/connects the shape. Default 0.5. */
      threshold?: number;
    } = {},
  ) {
    this.color = opts.color ?? [0.72, 0.8, 0.86, 0.32];
    this.outline = opts.outline ?? [0.85, 0.92, 1.0, 0.55];
    this.smooth = opts.smooth ?? false;
    this.blurSpread = opts.blur ?? 2.5;
    this.threshold = opts.threshold ?? 0.5;
    this.aa = 0.12;
    if (opts.verts) this.setVerts(opts.verts);
  }

  setColor(color: [number, number, number, number]): void {
    this.color = color;
    if (this.smooth) this.bakeDirty = true; // color is baked into the silhouette
  }

  /** Toggle the smooth (blur+threshold) silhouette vs the crisp triangle fill. */
  setSmooth(smooth: boolean): void {
    if (smooth !== this.smooth) this.bakeDirty = true;
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
    this.bakeDirty = true; // the world-anchored silhouette must be re-baked
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

    if (this.smooth) {
      this.renderSmooth(gl, state);
      return;
    }

    // Crisp path: re-project all verts when zoom changes (affine projection is zoom-dependent).
    if (this.lastProjZoom !== state.zoom) {
      this.reproject(state.projection);
      this.lastProjZoom = state.zoom;
    }
    if (this.needsUpload) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.projected, gl.DYNAMIC_DRAW);
      this.needsUpload = false;
    }
    this.renderCrisp(gl, state);
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
   * Draw the world-anchored baked silhouette. Bakes on first use / when the box set (or
   * color) changes; every frame just draws a textured quad over the bake bbox under the
   * live view transform (bilinear-sampled premultiplied image -> no pan/zoom shimmer,
   * outline included).
   */
  private renderSmooth(gl: WebGL2RenderingContext, state: RenderState): void {
    if (!this.smoothInited) this.initSmooth(gl);
    if (!this.blurProgram || !this.compBakeProgram || !this.quadProgram) {
      // shader compile failed — degrade to the crisp fill so something shows.
      if (this.lastProjZoom !== state.zoom) {
        this.reproject(state.projection);
        this.lastProjZoom = state.zoom;
      }
      if (this.needsUpload) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.projected, gl.DYNAMIC_DRAW);
        this.needsUpload = false;
      }
      this.renderCrisp(gl, state);
      return;
    }

    if (this.bakeDirty) this.bake(gl);
    if (!this.bakeValid || !this.bakeResultTex) return;

    // Reproject the 4 bbox corners into map space when zoom changes, then draw the quad.
    if (this.worldQuadZoom !== state.zoom) {
      this.buildWorldQuad(gl, state.projection);
      this.worldQuadZoom = state.zoom;
    }

    const prevProgram = gl.getParameter(gl.CURRENT_PROGRAM);
    const prevBlend = gl.isEnabled(gl.BLEND);
    const prevActive = gl.getParameter(gl.ACTIVE_TEXTURE);

    gl.useProgram(this.quadProgram);
    gl.bindVertexArray(this.worldQuadVao);
    gl.enable(gl.BLEND);
    // The baked silhouette is premultiplied alpha (no edge fringing under bilinear).
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniformMatrix3fv(
      gl.getUniformLocation(this.quadProgram, "u_view"),
      false,
      state.viewMatrix!,
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.bakeResultTex);
    gl.uniform1i(gl.getUniformLocation(this.quadProgram, "u_tex"), 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(prevActive);
    gl.useProgram(prevProgram);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
    if (!prevBlend) gl.disable(gl.BLEND);
  }

  /**
   * Rasterize the box union into a marker-frame coverage texture, gaussian-blur it, then
   * threshold + stroke it into a premultiplied colored silhouette (bakeResultTex). Done
   * once per box set / color (not per frame), so the whole thing — fill and outline — is
   * stable under pan/zoom.
   */
  private bake(gl: WebGL2RenderingContext): void {
    this.bakeDirty = false;
    this.bakeValid = false;
    if (this.vertCount < 3) return;

    // Marker-frame bounding box, padded so the blur + outline don't clip at the edges.
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    const v = this.srcVerts;
    for (let i = 0; i < this.vertCount; i++) {
      const x = v[i * 2];
      const y = v[i * 2 + 1];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    const w = maxX - minX;
    const h = maxY - minY;
    if (!(w > 0) || !(h > 0)) return;
    const pad = Math.max(w, h) * 0.06;
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;
    this.bakeMin = [minX, minY];
    this.bakeMax = [maxX, maxY];

    // Bake resolution: longest side -> BAKE_MAX texels, keep aspect. Blur (fixed texels)
    // then maps to a fixed world roundness -> zoom-invariant.
    const pw = maxX - minX;
    const ph = maxY - minY;
    const longest = Math.max(pw, ph);
    const bw = Math.max(16, Math.round((pw / longest) * NavmeshLayer.BAKE_MAX));
    const bh = Math.max(16, Math.round((ph / longest) * NavmeshLayer.BAKE_MAX));
    if (!this.ensureFbos(gl, bw, bh)) return;

    // Ortho mat3 mapping marker-frame (x,y) in the padded bbox -> clip [-1,1].
    // Column-major for `u_view * vec3(x,y,1)`: result = (sx*x+tx, sy*y+ty, 1).
    const sx = 2 / pw;
    const sy = 2 / ph;
    const tx = -(maxX + minX) / pw;
    const ty = -(maxY + minY) / ph;
    const ortho = new Float32Array([sx, 0, 0, 0, sy, 0, tx, ty, 1]);

    // Upload marker-frame verts for the coverage rasterize.
    gl.bindBuffer(gl.ARRAY_BUFFER, this.srcBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.srcVerts, gl.DYNAMIC_DRAW);

    const prevProgram = gl.getParameter(gl.CURRENT_PROGRAM);
    const prevBlend = gl.isEnabled(gl.BLEND);
    const prevFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    const prevActive = gl.getParameter(gl.ACTIVE_TEXTURE);
    const prevViewport = gl.getParameter(gl.VIEWPORT) as Int32Array;

    // Pass 1: coverage union (flat 1.0, no blend) into texCoverage.
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboCoverage);
    gl.viewport(0, 0, bw, bh);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.srcVao);
    if (this.viewLoc) gl.uniformMatrix3fv(this.viewLoc, false, ortho);
    if (this.colorLoc) gl.uniform4f(this.colorLoc, 1, 1, 1, 1);
    gl.drawArrays(gl.TRIANGLES, 0, this.vertCount);
    gl.bindVertexArray(null);

    // Pass 2/3: separable gaussian blur (coverage -> blur -> coverage). Field ends in texCoverage.
    gl.useProgram(this.blurProgram);
    gl.bindVertexArray(this.quadVao);
    const stepLoc = gl.getUniformLocation(this.blurProgram!, "u_step");
    gl.uniform1i(gl.getUniformLocation(this.blurProgram!, "u_tex"), 0);
    gl.activeTexture(gl.TEXTURE0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboBlur);
    gl.bindTexture(gl.TEXTURE_2D, this.texCoverage);
    gl.uniform2f(stepLoc, this.blurSpread / bw, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboCoverage);
    gl.bindTexture(gl.TEXTURE_2D, this.texBlur);
    gl.uniform2f(stepLoc, 0, this.blurSpread / bh);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Pass 4: threshold + fill + outline -> premultiplied colored silhouette in texBlur.
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboBlur);
    gl.useProgram(this.compBakeProgram);
    gl.bindTexture(gl.TEXTURE_2D, this.texCoverage);
    gl.uniform1i(gl.getUniformLocation(this.compBakeProgram!, "u_field"), 0);
    gl.uniform4f(
      gl.getUniformLocation(this.compBakeProgram!, "u_color"),
      this.color[0],
      this.color[1],
      this.color[2],
      this.color[3],
    );
    gl.uniform4f(
      gl.getUniformLocation(this.compBakeProgram!, "u_outline"),
      this.outline[0],
      this.outline[1],
      this.outline[2],
      this.outline[3],
    );
    gl.uniform1f(
      gl.getUniformLocation(this.compBakeProgram!, "u_threshold"),
      this.threshold,
    );
    gl.uniform1f(gl.getUniformLocation(this.compBakeProgram!, "u_aa"), this.aa);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.bakeResultTex = this.texBlur;

    // Mipmap the result so it MINIFIES cleanly when zoomed out. Otherwise, at zoom levels
    // where many texels fall under one screen pixel, bilinear (no mip) aliases and the thin
    // overlapping outlines shimmer; trilinear mip sampling pre-averages -> stable (the outline
    // gently fades when very small instead of flickering). WebGL2 allows NPOT mipmaps.
    gl.bindTexture(gl.TEXTURE_2D, this.texBlur);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR,
    );
    gl.generateMipmap(gl.TEXTURE_2D);

    // restore
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(prevActive);
    gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);
    gl.viewport(
      prevViewport[0],
      prevViewport[1],
      prevViewport[2],
      prevViewport[3],
    );
    gl.useProgram(prevProgram);
    if (prevBlend) gl.enable(gl.BLEND);
    else gl.disable(gl.BLEND);

    this.worldQuadZoom = -1; // force the quad to rebuild for the new bbox
    this.bakeValid = true;
  }

  /** Project the padded bbox corners to map space and (re)build the textured quad. */
  private buildWorldQuad(
    gl: WebGL2RenderingContext,
    projection: (latlng: LatLng) => { x: number; y: number },
  ): void {
    const [minX, minY] = this.bakeMin;
    const [maxX, maxY] = this.bakeMax;
    // corners with UVs: bake maps marker-min -> clip(-1,-1) -> texel (0,0).
    const c00 = projection([minX, minY]); // uv (0,0)
    const c10 = projection([maxX, minY]); // uv (1,0)
    const c01 = projection([minX, maxY]); // uv (0,1)
    const c11 = projection([maxX, maxY]); // uv (1,1)
    // two triangles, interleaved [x, y, u, v]
    const data = new Float32Array([
      c00.x,
      c00.y,
      0,
      0,
      c10.x,
      c10.y,
      1,
      0,
      c01.x,
      c01.y,
      0,
      1,
      c10.x,
      c10.y,
      1,
      0,
      c11.x,
      c11.y,
      1,
      1,
      c01.x,
      c01.y,
      0,
      1,
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.worldQuadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  }

  private initSmooth(gl: WebGL2RenderingContext): void {
    this.smoothInited = true;

    // Fullscreen triangle (explicit location 0 so the shared VAO works for both fs programs).
    const fsVs = `#version 300 es
      layout(location = 0) in vec2 a_pos;
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
    // Threshold the blurred field into a smooth fill + thin outline, output PREMULTIPLIED
    // alpha (so bilinear sampling of the baked texture doesn't fringe at the edges).
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
        float fill = smoothstep(u_threshold - u_aa, u_threshold + u_aa, f);
        float edge = (1.0 - smoothstep(0.0, u_aa * 1.5, abs(f - u_threshold))) * u_outline.a;
        vec3 rgb = mix(u_color.rgb, u_outline.rgb, edge);
        float a = max(u_color.a * fill, edge);
        outColor = vec4(rgb * a, a); // premultiplied
      }
    `;
    // World textured quad: sample the baked premultiplied silhouette under the live view
    // transform. Stable because the silhouette is world-anchored; only the corners move.
    const quadVs = `#version 300 es
      layout(location = 0) in vec2 a_pos;
      layout(location = 1) in vec2 a_uv;
      uniform mat3 u_view;
      out vec2 v_uv;
      void main() {
        vec3 p = u_view * vec3(a_pos, 1.0);
        gl_Position = vec4(p.xy, 0.0, 1.0);
        v_uv = a_uv;
      }
    `;
    const quadFs = `#version 300 es
      precision mediump float;
      uniform sampler2D u_tex;
      in vec2 v_uv;
      out vec4 outColor;
      void main() {
        vec4 c = texture(u_tex, v_uv); // premultiplied
        if (c.a <= 0.001) discard;
        outColor = c;
      }
    `;

    this.blurProgram = this.createProgram(fsVs, blurFs);
    this.compBakeProgram = this.createProgram(fsVs, compFs);
    this.quadProgram = this.createProgram(quadVs, quadFs);

    // Full-screen triangle at attribute location 0 (shared by blur + composite).
    this.quadBuffer = gl.createBuffer();
    this.quadVao = gl.createVertexArray();
    gl.bindVertexArray(this.quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    // Marker-frame verts VAO for the coverage rasterize (reuses this.program's a_position).
    this.srcBuffer = gl.createBuffer();
    this.srcVao = gl.createVertexArray();
    if (this.program) {
      gl.bindVertexArray(this.srcVao);
      const loc = gl.getAttribLocation(this.program, "a_position");
      gl.bindBuffer(gl.ARRAY_BUFFER, this.srcBuffer);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
    }

    // World textured-quad VAO (interleaved x,y,u,v at locations 0 and 1).
    this.worldQuadBuffer = gl.createBuffer();
    this.worldQuadVao = gl.createVertexArray();
    gl.bindVertexArray(this.worldQuadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.worldQuadBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
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
    if (this.fboCoverage && this.bakeW === w && this.bakeH === h) return true;
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
    this.bakeW = w;
    this.bakeH = h;
    return true;
  }

  private disposeFbos(gl: WebGL2RenderingContext): void {
    if (this.fboCoverage) gl.deleteFramebuffer(this.fboCoverage);
    if (this.texCoverage) gl.deleteTexture(this.texCoverage);
    if (this.fboBlur) gl.deleteFramebuffer(this.fboBlur);
    if (this.texBlur) gl.deleteTexture(this.texBlur);
    this.fboCoverage = this.texCoverage = this.fboBlur = this.texBlur = null;
    this.bakeResultTex = null;
    this.bakeW = this.bakeH = 0;
    this.bakeValid = false;
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
      if (this.compBakeProgram) gl.deleteProgram(this.compBakeProgram);
      if (this.quadProgram) gl.deleteProgram(this.quadProgram);
      if (this.quadBuffer) gl.deleteBuffer(this.quadBuffer);
      if (this.quadVao) gl.deleteVertexArray(this.quadVao);
      if (this.srcBuffer) gl.deleteBuffer(this.srcBuffer);
      if (this.srcVao) gl.deleteVertexArray(this.srcVao);
      if (this.worldQuadBuffer) gl.deleteBuffer(this.worldQuadBuffer);
      if (this.worldQuadVao) gl.deleteVertexArray(this.worldQuadVao);
      this.disposeFbos(gl);
    }
    this.blurProgram = null;
    this.compBakeProgram = null;
    this.quadProgram = null;
    this.quadVao = null;
    this.quadBuffer = null;
    this.srcBuffer = null;
    this.srcVao = null;
    this.worldQuadBuffer = null;
    this.worldQuadVao = null;
    this.smoothInited = false;
    this.gl = null;
    this.program = null;
  }
}
