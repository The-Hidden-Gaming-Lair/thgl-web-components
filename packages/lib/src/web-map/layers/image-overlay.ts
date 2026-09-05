import type { Layer, RenderState } from "../types";

export interface ImageOverlayOptions {
  url: string;
  bounds: [[number, number], [number, number]];
  opacity?: number;
}

export class ImageOverlayLayer implements Layer {
  // WebMap.addLayer wires this up; we call it once the texture is ready
  // so the map redraws on its own. Without it the heatmap is invisible
  // until the user pans/zooms (next render tick).
  onTileLoad?: () => void;

  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private texture: WebGLTexture | null = null;
  private uniformLocations: {
    view?: WebGLUniformLocation | null;
    texture?: WebGLUniformLocation | null;
    opacity?: WebGLUniformLocation | null;
  } = {};

  private options: Required<ImageOverlayOptions>;
  private imageLoaded = false;
  private lastQuadZoom = -1;
  // Pre-allocated buffers to avoid per-frame allocations
  private quadVertices = new Float32Array(12);
  private static readonly QUAD_TEX_COORDS = new Float32Array([
    0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0,
  ]);

  constructor(options: ImageOverlayOptions) {
    this.options = {
      url: options.url,
      bounds: options.bounds,
      opacity: options.opacity ?? 1.0,
    };
  }

  onAdd(gl: WebGL2RenderingContext): void {
    this.gl = gl;
    this.createShaders();
    this.createBuffers();
    this.setupVAO();
    this.loadImage();
  }

  onRemove(): void {
    this.destroy();
  }

  private createShaders(): void {
    if (!this.gl) return;

    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      uniform mat3 u_view;
      out vec2 v_texCoord;

      void main() {
        vec3 pos = u_view * vec3(a_position, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShaderSource = `#version 300 es
      precision mediump float;
      in vec2 v_texCoord;
      uniform sampler2D u_texture;
      uniform float u_opacity;
      out vec4 outColor;

      void main() {
        vec4 texColor = texture(u_texture, v_texCoord);
        outColor = vec4(texColor.rgb, texColor.a * u_opacity);
      }
    `;

    this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
    if (this.program) {
      this.uniformLocations.view = this.gl.getUniformLocation(
        this.program,
        "u_view",
      );
      this.uniformLocations.texture = this.gl.getUniformLocation(
        this.program,
        "u_texture",
      );
      this.uniformLocations.opacity = this.gl.getUniformLocation(
        this.program,
        "u_opacity",
      );
    }
  }

  private createBuffers(): void {
    if (!this.gl) return;
    this.vertexBuffer = this.gl.createBuffer();
    this.texCoordBuffer = this.gl.createBuffer();
  }

  private setupVAO(): void {
    if (!this.gl || !this.program) return;

    this.vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.vao);

    const positionLocation = this.gl.getAttribLocation(
      this.program,
      "a_position",
    );
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(
      positionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0,
    );

    const texCoordLocation = this.gl.getAttribLocation(
      this.program,
      "a_texCoord",
    );
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    // Upload static texCoords once
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      ImageOverlayLayer.QUAD_TEX_COORDS,
      this.gl.STATIC_DRAW,
    );
    this.gl.enableVertexAttribArray(texCoordLocation);
    this.gl.vertexAttribPointer(
      texCoordLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0,
    );

    this.gl.bindVertexArray(null);
  }

  private loadingImage?: HTMLImageElement;

  private loadImage(): void {
    if (!this.gl) return;

    const image = new Image();
    this.loadingImage = image;
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (!this.gl || this.loadingImage !== image) return;

      this.texture = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        image,
      );
      this.gl.generateMipmap(this.gl.TEXTURE_2D);
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_MIN_FILTER,
        this.gl.LINEAR_MIPMAP_LINEAR,
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_MAG_FILTER,
        this.gl.LINEAR,
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_S,
        this.gl.CLAMP_TO_EDGE,
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_T,
        this.gl.CLAMP_TO_EDGE,
      );

      this.imageLoaded = true;
      this.loadingImage = undefined;
      // Ask the map to redraw — the texture wasn't ready when addLayer
      // queued the first redraw, so without this the heatmap stays
      // invisible until the next pan/zoom.
      this.onTileLoad?.();
    };
    image.onerror = () => {
      if (this.loadingImage === image) {
        this.loadingImage = undefined;
      }
    };
    image.src = this.options.url;
  }

  private buildQuad(
    projection: (latlng: [number, number]) => { x: number; y: number },
  ): void {
    if (!this.gl) return;

    const [[minLat, minLng], [maxLat, maxLng]] = this.options.bounds;
    const bl = projection([minLat, minLng]);
    const br = projection([minLat, maxLng]);
    const tl = projection([maxLat, minLng]);
    const tr = projection([maxLat, maxLng]);

    // Reuse pre-allocated buffer
    const v = this.quadVertices;
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

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, v, this.gl.DYNAMIC_DRAW);
  }

  private createProgram(
    vertexSource: string,
    fragmentSource: string,
  ): WebGLProgram | null {
    if (!this.gl) return null;

    const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER)!;
    this.gl.shaderSource(vertexShader, vertexSource);
    this.gl.compileShader(vertexShader);

    const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER)!;
    this.gl.shaderSource(fragmentShader, fragmentSource);
    this.gl.compileShader(fragmentShader);

    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    return program;
  }

  render(gl: WebGL2RenderingContext, state: RenderState): void {
    if (!state.viewMatrix || !this.imageLoaded || !this.texture) return;

    // Rebuild quad only when zoom changes
    if (this.lastQuadZoom !== state.zoom) {
      this.buildQuad(state.projection);
      this.lastQuadZoom = state.zoom;
    }

    if (!this.program || !this.vao) return;

    // Composite the (transparent-edged) interior image over the tiles. Set blend
    // explicitly — the global state can be left disabled by a prior layer.
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    if (this.uniformLocations.view) {
      gl.uniformMatrix3fv(this.uniformLocations.view, false, state.viewMatrix);
    }

    if (this.uniformLocations.texture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform1i(this.uniformLocations.texture, 0);
    }

    if (this.uniformLocations.opacity) {
      gl.uniform1f(this.uniformLocations.opacity, this.options.opacity);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
  }

  setOpacity(opacity: number): void {
    this.options.opacity = opacity;
  }

  destroy(): void {
    if (this.gl) {
      if (this.vertexBuffer) this.gl.deleteBuffer(this.vertexBuffer);
      if (this.texCoordBuffer) this.gl.deleteBuffer(this.texCoordBuffer);
      if (this.vao) this.gl.deleteVertexArray(this.vao);
      if (this.program) this.gl.deleteProgram(this.program);
      if (this.texture) this.gl.deleteTexture(this.texture);
    }

    this.gl = null;
    this.program = null;
    this.vertexBuffer = null;
    this.texCoordBuffer = null;
    this.vao = null;
    this.texture = null;
    this.imageLoaded = false;
    this.loadingImage = undefined;
  }
}
