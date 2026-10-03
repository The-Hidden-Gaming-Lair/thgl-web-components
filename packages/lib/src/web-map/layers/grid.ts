import type { Layer, RenderState } from "../types";

export interface GridLayerOptions {
  bounds: [[number, number], [number, number]];
  divisions?: number;
  color?: string;
  opacity?: number;
  showLabels?: boolean;
  labelOpacity?: number;
  labelFormatter?: (row: number, col: number, divisions: number) => string;
  labelColor?: string;
  /** Multiplies the on-screen label size (1 = default). */
  labelScale?: number;
}

interface LabelData {
  lat: number;
  lng: number;
  text: string;
  texCoords: { u: number; v: number; w: number; h: number };
}

export class GridLayer implements Layer {
  private gl: WebGL2RenderingContext | null = null;
  private canvas: HTMLCanvasElement | null = null;

  // Grid lines program
  private lineProgram: WebGLProgram | null = null;
  private lineVao: WebGLVertexArrayObject | null = null;
  private lineVertexBuffer: WebGLBuffer | null = null;
  private lineUniformLocations: {
    view?: WebGLUniformLocation | null;
    color?: WebGLUniformLocation | null;
  } = {};

  // Label program
  private labelProgram: WebGLProgram | null = null;
  private labelVao: WebGLVertexArrayObject | null = null;
  private labelVertexBuffer: WebGLBuffer | null = null;
  private labelTexCoordBuffer: WebGLBuffer | null = null;
  private labelTexture: WebGLTexture | null = null;
  private labelUniformLocations: {
    view?: WebGLUniformLocation | null;
    texture?: WebGLUniformLocation | null;
    opacity?: WebGLUniformLocation | null;
  } = {};

  private options: Required<GridLayerOptions>;
  private lineVertices: Float32Array = new Float32Array();
  private lineVertexCount: number = 0;
  private labels: LabelData[] = [];
  private labelVertices: Float32Array = new Float32Array();
  private labelTexCoords: Float32Array = new Float32Array();
  private labelQuadCount: number = 0;

  private needsBuild = true;
  private lastZoom = -999;

  // Texture atlas dimensions
  private atlasWidth = 0;
  private atlasHeight = 0;
  private charWidth = 0;
  private charHeight = 0;

  constructor(options: GridLayerOptions) {
    this.options = {
      bounds: options.bounds,
      divisions: options.divisions ?? 10,
      color: options.color ?? "#ffffff",
      opacity: options.opacity ?? 0.2,
      showLabels: options.showLabels ?? true,
      labelOpacity: options.labelOpacity ?? 0.8,
      labelFormatter:
        options.labelFormatter ??
        ((row, col) => `${String.fromCharCode(65 + row)}${col + 1}`),
      labelColor: options.labelColor ?? "#ffffff",
      labelScale: options.labelScale ?? 1,
    };
  }

  onAdd(gl: WebGL2RenderingContext): void {
    this.gl = gl;
    this.canvas = gl.canvas as HTMLCanvasElement;
    this.createLineShaders();
    this.createLineBuffers();
    this.setupLineVAO();

    if (this.options.showLabels) {
      this.createLabelShaders();
      this.createLabelBuffers();
      this.createLabelTexture();
      this.setupLabelVAO();
    }
  }

  onRemove(): void {
    this.destroy();
  }

  // ==================== LINE RENDERING ====================

  private createLineShaders(): void {
    if (!this.gl) return;

    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      uniform mat3 u_view;

      void main() {
        vec3 pos = u_view * vec3(a_position, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `#version 300 es
      precision mediump float;
      uniform vec4 u_color;
      out vec4 outColor;

      void main() {
        outColor = u_color;
      }
    `;

    this.lineProgram = this.createProgram(
      vertexShaderSource,
      fragmentShaderSource,
    );
    if (this.lineProgram) {
      this.lineUniformLocations.view = this.gl.getUniformLocation(
        this.lineProgram,
        "u_view",
      );
      this.lineUniformLocations.color = this.gl.getUniformLocation(
        this.lineProgram,
        "u_color",
      );
    }
  }

  private createLineBuffers(): void {
    if (!this.gl) return;
    this.lineVertexBuffer = this.gl.createBuffer();
  }

  private setupLineVAO(): void {
    if (!this.gl || !this.lineProgram) return;

    this.lineVao = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.lineVao);

    const positionLocation = this.gl.getAttribLocation(
      this.lineProgram,
      "a_position",
    );
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.lineVertexBuffer);
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(
      positionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0,
    );

    this.gl.bindVertexArray(null);
  }

  private buildGridLines(
    projection: (latlng: [number, number]) => { x: number; y: number },
  ): void {
    if (!this.gl) return;

    const [[minLat, minLng], [maxLat, maxLng]] = this.options.bounds;
    const divisions = this.options.divisions;

    const cellWidth = (maxLng - minLng) / divisions;
    const cellHeight = (maxLat - minLat) / divisions;

    const lines: number[] = [];

    // Vertical lines
    for (let i = 0; i <= divisions; i++) {
      const lng = minLng + i * cellWidth;
      const p1 = projection([minLat, lng]);
      const p2 = projection([maxLat, lng]);
      lines.push(p1.x, p1.y, p2.x, p2.y);
    }

    // Horizontal lines
    for (let j = 0; j <= divisions; j++) {
      const lat = minLat + j * cellHeight;
      const p1 = projection([lat, minLng]);
      const p2 = projection([lat, maxLng]);
      lines.push(p1.x, p1.y, p2.x, p2.y);
    }

    this.lineVertices = new Float32Array(lines);
    this.lineVertexCount = lines.length / 2;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.lineVertexBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.lineVertices,
      this.gl.STATIC_DRAW,
    );
  }

  // ==================== LABEL RENDERING ====================

  private createLabelShaders(): void {
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

    this.labelProgram = this.createProgram(
      vertexShaderSource,
      fragmentShaderSource,
    );
    if (this.labelProgram) {
      this.labelUniformLocations.view = this.gl.getUniformLocation(
        this.labelProgram,
        "u_view",
      );
      this.labelUniformLocations.texture = this.gl.getUniformLocation(
        this.labelProgram,
        "u_texture",
      );
      this.labelUniformLocations.opacity = this.gl.getUniformLocation(
        this.labelProgram,
        "u_opacity",
      );
    }
  }

  private createLabelBuffers(): void {
    if (!this.gl) return;
    this.labelVertexBuffer = this.gl.createBuffer();
    this.labelTexCoordBuffer = this.gl.createBuffer();
  }

  private setupLabelVAO(): void {
    if (!this.gl || !this.labelProgram) return;

    this.labelVao = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.labelVao);

    const positionLocation = this.gl.getAttribLocation(
      this.labelProgram,
      "a_position",
    );
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.labelVertexBuffer);
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
      this.labelProgram,
      "a_texCoord",
    );
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.labelTexCoordBuffer);
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

  private createLabelTexture(): void {
    if (!this.gl) return;

    const divisions = this.options.divisions;
    const labels: string[] = [];

    // Generate all label strings using the formatter
    for (let i = 0; i < divisions; i++) {
      for (let j = 0; j < divisions; j++) {
        labels.push(this.options.labelFormatter(i, j, divisions));
      }
    }

    // Create a canvas for rendering text at device pixel ratio for crisp labels
    const dpr = window.devicePixelRatio || 1;
    const textCanvas = document.createElement("canvas");
    const ctx = textCanvas.getContext("2d")!;

    // Measure text to determine cell size (in logical pixels)
    // Rasterize larger labels at a matching resolution so they stay crisp
    const fontSize = Math.round(24 * Math.max(1, this.options.labelScale));
    ctx.font = `bold ${fontSize}px Arial`;
    const maxLabel = "J10"; // Longest possible label
    const metrics = ctx.measureText(maxLabel);
    this.charWidth = Math.ceil(metrics.width + fontSize / 3);
    this.charHeight = Math.ceil(fontSize + fontSize / 3);

    // Calculate atlas dimensions (arrange labels in a grid)
    const cols = Math.ceil(Math.sqrt(labels.length));
    const rows = Math.ceil(labels.length / cols);
    this.atlasWidth = cols * this.charWidth;
    this.atlasHeight = rows * this.charHeight;

    // Canvas at physical pixel resolution
    textCanvas.width = Math.round(this.atlasWidth * dpr);
    textCanvas.height = Math.round(this.atlasHeight * dpr);

    // Clear and set up text rendering
    ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);

    // Scale for DPR, then flip vertically to match WebGL's coordinate system
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(0, this.atlasHeight);
    ctx.scale(1, -1);

    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Render each label and store its texture coordinates
    const labelTexCoords: Map<
      string,
      { u: number; v: number; w: number; h: number }
    > = new Map();

    for (let i = 0; i < labels.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * this.charWidth + this.charWidth / 2;
      const y = row * this.charHeight + this.charHeight / 2;

      // Dark outline keeps labels readable on bright map areas
      ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
      ctx.lineWidth = fontSize / 6;
      ctx.lineJoin = "round";
      ctx.strokeText(labels[i], x, y);

      // Draw text with custom color
      const [lr, lg, lb] = this.parseColor(this.options.labelColor);
      ctx.fillStyle = `rgba(${Math.round(lr * 255)}, ${Math.round(lg * 255)}, ${Math.round(lb * 255)}, 1.0)`;
      ctx.fillText(labels[i], x, y);

      // Store texture coordinates (normalized) - row is flipped due to canvas transform
      const flippedRow = rows - 1 - row;
      labelTexCoords.set(labels[i], {
        u: (col * this.charWidth) / this.atlasWidth,
        v: (flippedRow * this.charHeight) / this.atlasHeight,
        w: this.charWidth / this.atlasWidth,
        h: this.charHeight / this.atlasHeight,
      });
    }

    ctx.restore();

    // Create WebGL texture
    this.labelTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.labelTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      textCanvas,
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

    // Store label data with texture coordinates
    const [[minLat, minLng], [maxLat, maxLng]] = this.options.bounds;
    const cellWidth = (maxLng - minLng) / divisions;
    const cellHeight = (maxLat - minLat) / divisions;

    this.labels = [];
    for (let i = 0; i < divisions; i++) {
      for (let j = 0; j < divisions; j++) {
        const text = this.options.labelFormatter(i, j, divisions);
        const texCoords = labelTexCoords.get(text)!;
        this.labels.push({
          lat: minLat + j * cellHeight + cellHeight / 2,
          lng: minLng + i * cellWidth + cellWidth / 2,
          text,
          texCoords,
        });
      }
    }
  }

  private buildLabelQuads(
    projection: (latlng: [number, number]) => { x: number; y: number },
    zoom: number,
  ): void {
    if (!this.gl || this.labels.length === 0) return;

    const vertices: number[] = [];
    const texCoords: number[] = [];

    // Size of labels in CSS pixels (view matrix handles DPR scaling)
    const size = 10 * this.options.labelScale;

    for (const label of this.labels) {
      const center = projection([label.lat, label.lng]);
      const halfW = size * (this.charWidth / this.charHeight);
      const halfH = size;

      // Quad vertices (two triangles)
      // Triangle 1
      vertices.push(
        center.x - halfW,
        center.y - halfH,
        center.x + halfW,
        center.y - halfH,
        center.x - halfW,
        center.y + halfH,
      );
      // Triangle 2
      vertices.push(
        center.x + halfW,
        center.y - halfH,
        center.x + halfW,
        center.y + halfH,
        center.x - halfW,
        center.y + halfH,
      );

      const { u, v, w, h } = label.texCoords;
      // Texture coordinates - standard mapping (canvas was pre-flipped)
      // Triangle 1: top-left, top-right, bottom-left
      texCoords.push(u, v + h, u + w, v + h, u, v);
      // Triangle 2: top-right, bottom-right, bottom-left
      texCoords.push(u + w, v + h, u + w, v, u, v);
    }

    this.labelVertices = new Float32Array(vertices);
    this.labelTexCoords = new Float32Array(texCoords);
    this.labelQuadCount = this.labels.length;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.labelVertexBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.labelVertices,
      this.gl.DYNAMIC_DRAW,
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.labelTexCoordBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.labelTexCoords,
      this.gl.STATIC_DRAW,
    );
  }

  // ==================== SHARED UTILITIES ====================

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

  private parseColor(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ];
    }
    return [1, 1, 1];
  }

  // ==================== RENDER ====================

  render(gl: WebGL2RenderingContext, state: RenderState): void {
    if (!state.viewMatrix) return;

    // Build/rebuild when zoom changes
    if (this.needsBuild || this.lastZoom !== state.zoom) {
      this.buildGridLines(state.projection);
      if (this.options.showLabels) {
        this.buildLabelQuads(state.projection, state.zoom);
      }
      this.lastZoom = state.zoom;
      this.needsBuild = false;
    }

    // Render grid lines
    if (this.lineProgram && this.lineVao && this.lineVertexCount > 0) {
      gl.useProgram(this.lineProgram);
      gl.bindVertexArray(this.lineVao);

      if (this.lineUniformLocations.view) {
        gl.uniformMatrix3fv(
          this.lineUniformLocations.view,
          false,
          state.viewMatrix,
        );
      }

      if (this.lineUniformLocations.color) {
        const [r, g, b] = this.parseColor(this.options.color);
        gl.uniform4f(
          this.lineUniformLocations.color,
          r,
          g,
          b,
          this.options.opacity,
        );
      }

      gl.drawArrays(gl.LINES, 0, this.lineVertexCount);
      gl.bindVertexArray(null);
    }

    // Render labels
    if (
      this.options.showLabels &&
      this.labelProgram &&
      this.labelVao &&
      this.labelQuadCount > 0
    ) {
      gl.useProgram(this.labelProgram);
      gl.bindVertexArray(this.labelVao);

      if (this.labelUniformLocations.view) {
        gl.uniformMatrix3fv(
          this.labelUniformLocations.view,
          false,
          state.viewMatrix,
        );
      }

      if (this.labelUniformLocations.texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.labelTexture);
        gl.uniform1i(this.labelUniformLocations.texture, 0);
      }

      if (this.labelUniformLocations.opacity) {
        gl.uniform1f(
          this.labelUniformLocations.opacity,
          this.options.labelOpacity,
        );
      }

      gl.drawArrays(gl.TRIANGLES, 0, this.labelQuadCount * 6);
      gl.bindVertexArray(null);
    }
  }

  // ==================== CLEANUP ====================

  destroy(): void {
    if (this.gl) {
      if (this.lineVertexBuffer) this.gl.deleteBuffer(this.lineVertexBuffer);
      if (this.lineVao) this.gl.deleteVertexArray(this.lineVao);
      if (this.lineProgram) this.gl.deleteProgram(this.lineProgram);

      if (this.labelVertexBuffer) this.gl.deleteBuffer(this.labelVertexBuffer);
      if (this.labelTexCoordBuffer)
        this.gl.deleteBuffer(this.labelTexCoordBuffer);
      if (this.labelVao) this.gl.deleteVertexArray(this.labelVao);
      if (this.labelProgram) this.gl.deleteProgram(this.labelProgram);
      if (this.labelTexture) this.gl.deleteTexture(this.labelTexture);
    }

    this.gl = null;
    this.canvas = null;
    this.lineProgram = null;
    this.lineVertexBuffer = null;
    this.lineVao = null;
    this.labelProgram = null;
    this.labelVertexBuffer = null;
    this.labelTexCoordBuffer = null;
    this.labelVao = null;
    this.labelTexture = null;
  }
}
