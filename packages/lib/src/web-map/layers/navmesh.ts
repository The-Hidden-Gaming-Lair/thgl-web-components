import type { Layer, LatLng, RenderState } from "../types";

/**
 * Fills a set of triangles — a live-read dungeon navmesh / walkable floor plan —
 * as a flat translucent overlay. Vertices arrive already in the map's marker frame
 * (the same frame the player/actor markers use), so they align with the player
 * marker by construction. They're projected to map space on set + on zoom change
 * (the affine projection is zoom-dependent), then filled on the GPU in one draw.
 *
 * Navmesh polys tile edge-to-edge (shared vertices, no overlapping area), so the
 * per-triangle alpha blend doesn't double up except along hairline seams.
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

  constructor(
    opts: {
      verts?: number[] | Float32Array;
      /** Fill color as normalized RGBA (0..1). Default: cool translucent slate. */
      color?: [number, number, number, number];
    } = {},
  ) {
    this.color = opts.color ?? [0.72, 0.8, 0.86, 0.32];
    if (opts.verts) this.setVerts(opts.verts);
  }

  setColor(color: [number, number, number, number]): void {
    this.color = color;
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

    if (this.viewLoc) {
      gl.uniformMatrix3fv(this.viewLoc, false, state.viewMatrix);
    }
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
    }
    this.gl = null;
    this.program = null;
  }
}
