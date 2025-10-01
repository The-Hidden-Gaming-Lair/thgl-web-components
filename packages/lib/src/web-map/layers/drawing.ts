import type { Layer, LatLng, RenderState } from "../types";

export interface DrawingShape {
  id: string;
  type: "line" | "rectangle" | "polygon" | "circle" | "text";
  positions?: LatLng[];
  center?: LatLng;
  radius?: number;
  text?: string;
  color: string;
  size: number;
  mapName: string;
}

export interface DrawingLayerOptions {
  interactive?: boolean;
  zIndex?: number;
}

export class DrawingLayer implements Layer {
  private gl: WebGL2RenderingContext | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private program: WebGLProgram | null = null;
  private shapes: Map<string, DrawingShape> = new Map();
  private options: DrawingLayerOptions;
  private vertexBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private vertices: Float32Array = new Float32Array();
  private colors: Float32Array = new Float32Array();
  private indices: Uint16Array = new Uint16Array();
  private textElements: Map<string, HTMLElement> = new Map();
  private needsBufferUpdate = false;
  private lastZoom: number = -1;
  private cachedCanvasRect: DOMRect | null = null;
  private cachedRectTime: number = 0;
  private rectCacheMs: number = 100; // Cache canvas rect for 100ms
  private vao: WebGLVertexArrayObject | null = null;
  private uniformLocations: {
    view?: WebGLUniformLocation | null;
  } = {};

  constructor(options: DrawingLayerOptions = {}) {
    this.options = { interactive: true, ...options };
  }

  onAdd(gl: WebGL2RenderingContext): void {
    this.gl = gl;
    this.canvas = gl.canvas as HTMLCanvasElement;
    this.createShaders();
    this.createBuffers();
    this.setupVAO();
    this.needsBufferUpdate = true;
  }

  private setupVAO(): void {
    if (!this.gl || !this.program) return;

    this.vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(this.vao);

    // Bind position attribute
    const positionLocation = this.gl.getAttribLocation(this.program, "a_position");
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Bind color attribute
    const colorLocation = this.gl.getAttribLocation(this.program, "a_color");
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    this.gl.enableVertexAttribArray(colorLocation);
    this.gl.vertexAttribPointer(colorLocation, 3, this.gl.FLOAT, false, 0, 0);

    // Bind index buffer
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    this.gl.bindVertexArray(null);

    // Cache uniform locations
    this.uniformLocations.view = this.gl.getUniformLocation(this.program, "u_view");
  }

  onRemove(): void {
    this.destroy();
  }

  private createShaders(): void {
    if (!this.gl) return;

    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      in vec3 a_color;

      uniform mat3 u_view;

      out vec3 v_color;

      void main() {
        vec3 pos = u_view * vec3(a_position, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);
        v_color = a_color;
      }
    `;

    const fragmentShaderSource = `#version 300 es
      precision highp float;

      in vec3 v_color;
      out vec4 fragColor;

      void main() {
        fragColor = vec4(v_color, 1.0);
      }
    `;

    const vertexShader = this.createShader(
      this.gl.VERTEX_SHADER,
      vertexShaderSource,
    );
    const fragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    );

    if (!vertexShader || !fragmentShader) return;

    this.program = this.gl.createProgram();
    if (!this.program) return;

    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error(
        "Program link error:",
        this.gl.getProgramInfoLog(this.program),
      );
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
  }

  private createShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private createBuffers(): void {
    if (!this.gl) return;

    this.vertexBuffer = this.gl.createBuffer();
    this.colorBuffer = this.gl.createBuffer();
    this.indexBuffer = this.gl.createBuffer();
  }

  addShape(shape: DrawingShape): void {
    this.shapes.set(shape.id, shape);
    if (shape.type === "text") {
      this.createTextElement(shape);
    }
    this.needsBufferUpdate = true;
  }

  removeShape(id: string): void {
    const shape = this.shapes.get(id);
    if (shape?.type === "text") {
      this.removeTextElement(id);
    }
    this.shapes.delete(id);
    this.needsBufferUpdate = true;
  }

  updateShape(id: string, updates: Partial<DrawingShape>): void {
    const shape = this.shapes.get(id);
    if (shape) {
      Object.assign(shape, updates);
      // Update text element if color or other text properties changed
      if (shape.type === "text" && (updates.color || updates.text || updates.size)) {
        const element = this.textElements.get(id);
        if (element) {
          if (updates.color) element.style.setProperty('color', updates.color, 'important');
          if (updates.text) element.textContent = updates.text;
          if (updates.size) element.style.fontSize = `${updates.size}px`;
        }
      }
      this.needsBufferUpdate = true;
    }
  }

  getShape(id: string): DrawingShape | undefined {
    return this.shapes.get(id);
  }

  getAllShapes(): DrawingShape[] {
    return Array.from(this.shapes.values());
  }

  clearShapes(): void {
    // Clean up text elements
    for (const element of this.textElements.values()) {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
    this.textElements.clear();
    this.shapes.clear();
    this.needsBufferUpdate = true;
  }

  private updateBuffers(
    projection?: (latlng: LatLng) => { x: number; y: number },
  ): void {
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    let vertexOffset = 0;

    for (const shape of this.shapes.values()) {
      const color = this.hexToRgb(shape.color);

      switch (shape.type) {
        case "line":
          if (shape.positions && shape.positions.length >= 2) {
            this.addLineVertices(
              shape.positions,
              color,
              vertices,
              colors,
              indices,
              vertexOffset,
              projection,
            );
            vertexOffset += shape.positions.length;
          }
          break;
        case "rectangle":
          if (shape.positions && shape.positions.length >= 2) {
            this.addRectangleVertices(
              shape.positions,
              color,
              vertices,
              colors,
              indices,
              vertexOffset,
              projection,
            );
            vertexOffset += 4;
          }
          break;
        case "polygon":
          if (shape.positions && shape.positions.length >= 3) {
            this.addPolygonVertices(
              shape.positions,
              color,
              vertices,
              colors,
              indices,
              vertexOffset,
              projection,
            );
            vertexOffset += shape.positions.length;
          }
          break;
        case "circle":
          if (shape.center && shape.radius) {
            this.addCircleVertices(
              shape.center,
              shape.radius,
              color,
              vertices,
              colors,
              indices,
              vertexOffset,
              projection,
            );
            vertexOffset += 32; // Circle segments
          }
          break;
      }
    }

    this.vertices = new Float32Array(vertices);
    this.colors = new Float32Array(colors);
    this.indices = new Uint16Array(indices);

    if (this.gl && this.vertexBuffer && this.colorBuffer && this.indexBuffer) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        this.vertices,
        this.gl.DYNAMIC_DRAW,
      );

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        this.colors,
        this.gl.DYNAMIC_DRAW,
      );

      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      this.gl.bufferData(
        this.gl.ELEMENT_ARRAY_BUFFER,
        this.indices,
        this.gl.DYNAMIC_DRAW,
      );
    }
  }

  private addLineVertices(
    positions: LatLng[],
    color: [number, number, number],
    vertices: number[],
    colors: number[],
    indices: number[],
    offset: number,
    projection?: (latlng: LatLng) => { x: number; y: number },
  ): void {
    for (let i = 0; i < positions.length; i++) {
      const worldPos = projection
        ? projection(positions[i])
        : { x: positions[i][1], y: positions[i][0] };
      vertices.push(worldPos.x, worldPos.y);
      colors.push(color[0], color[1], color[2]);

      if (i < positions.length - 1) {
        indices.push(offset + i, offset + i + 1);
      }
    }
  }

  private addRectangleVertices(
    positions: LatLng[],
    color: [number, number, number],
    vertices: number[],
    colors: number[],
    indices: number[],
    offset: number,
    projection?: (latlng: LatLng) => { x: number; y: number },
  ): void {
    if (positions.length < 2) return;

    const [p1, p2] = positions;
    const minLat = Math.min(p1[0], p2[0]);
    const maxLat = Math.max(p1[0], p2[0]);
    const minLng = Math.min(p1[1], p2[1]);
    const maxLng = Math.max(p1[1], p2[1]);

    // Create corner positions and project them
    const corners: LatLng[] = [
      [minLat, minLng],
      [minLat, maxLng],
      [maxLat, maxLng],
      [maxLat, minLng],
    ];

    // Add rectangle vertices using projection
    for (const corner of corners) {
      const worldPos = projection
        ? projection(corner)
        : { x: corner[1], y: corner[0] };
      vertices.push(worldPos.x, worldPos.y);
    }
    for (let i = 0; i < 4; i++) {
      colors.push(color[0], color[1], color[2]);
    }

    // Add rectangle outline indices
    indices.push(
      offset,
      offset + 1,
      offset + 1,
      offset + 2,
      offset + 2,
      offset + 3,
      offset + 3,
      offset,
    );
  }

  private addPolygonVertices(
    positions: LatLng[],
    color: [number, number, number],
    vertices: number[],
    colors: number[],
    indices: number[],
    offset: number,
    projection?: (latlng: LatLng) => { x: number; y: number },
  ): void {
    for (let i = 0; i < positions.length; i++) {
      const worldPos = projection
        ? projection(positions[i])
        : { x: positions[i][1], y: positions[i][0] };
      vertices.push(worldPos.x, worldPos.y);
      colors.push(color[0], color[1], color[2]);

      const nextIndex = (i + 1) % positions.length;
      indices.push(offset + i, offset + nextIndex);
    }
  }

  private addCircleVertices(
    center: LatLng,
    radius: number,
    color: [number, number, number],
    vertices: number[],
    colors: number[],
    indices: number[],
    offset: number,
    projection?: (latlng: LatLng) => { x: number; y: number },
  ): void {
    const segments = 32;
    const [lat, lng] = center;

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const circlePoint: LatLng = [
        lat + Math.cos(angle) * radius,
        lng + Math.sin(angle) * radius,
      ];

      const worldPos = projection
        ? projection(circlePoint)
        : { x: circlePoint[1], y: circlePoint[0] };
      vertices.push(worldPos.x, worldPos.y);
      colors.push(color[0], color[1], color[2]);

      const nextIndex = (i + 1) % segments;
      indices.push(offset + i, offset + nextIndex);
    }
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255,
        ]
      : [1, 1, 1];
  }

  render(gl: WebGL2RenderingContext, state: RenderState): void {
    // Update buffers when shapes change or zoom level shifts
    const zoomChanged = Math.abs(this.lastZoom - state.zoom) > 1e-4;

    if (this.needsBufferUpdate || zoomChanged) {
      this.updateBuffers(state.projection);
      this.needsBufferUpdate = false;
      this.lastZoom = state.zoom;
    }

    // Update text elements position every frame (they need to follow the view)
    this.updateTextElements(state);

    if (!this.gl || !this.program || !this.vao) {
      return;
    }

    if (this.indices.length === 0) return;

    this.gl.useProgram(this.program);
    this.gl.bindVertexArray(this.vao);

    // Set view matrix uniform
    if (this.uniformLocations.view && state.viewMatrix) {
      this.gl.uniformMatrix3fv(this.uniformLocations.view, false, state.viewMatrix);
    }

    // Draw
    this.gl.lineWidth(2);
    this.gl.drawElements(
      this.gl.LINES,
      this.indices.length,
      this.gl.UNSIGNED_SHORT,
      0,
    );

    this.gl.bindVertexArray(null);
  }

  private createTextElement(shape: DrawingShape): void {
    if (!shape.center || !shape.text) return;

    const element = document.createElement("div");
    element.textContent = shape.text;
    element.setAttribute('data-text-id', shape.id);
    element.style.cssText = `
      position: absolute;
      font-size: ${shape.size}px;
      font-family: system-ui, sans-serif;
      font-weight: 600;
      pointer-events: none;
      user-select: none;
      -webkit-user-select: none;
      z-index: 1000;
      transform: translate(-50%, -50%);
      -webkit-font-smoothing: antialiased;
      left: 0px;
      top: 0px;
    `;
    // Set color separately with setProperty to ensure !important works
    element.style.setProperty('color', shape.color, 'important');

    document.body.appendChild(element);
    this.textElements.set(shape.id, element);
  }

  private removeTextElement(id: string): void {
    const element = this.textElements.get(id);
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    this.textElements.delete(id);
  }

  private updateTextElements(state: RenderState): void {
    if (!state.viewMatrix || !this.canvas || this.textElements.size === 0) return;

    // Get canvas position on the page (cached to avoid expensive reflows)
    const now = performance.now();
    if (!this.cachedCanvasRect || (now - this.cachedRectTime) > this.rectCacheMs) {
      this.cachedCanvasRect = this.canvas.getBoundingClientRect();
      this.cachedRectTime = now;
    }
    const rect = this.cachedCanvasRect;

    const view = state.viewMatrix;
    const a = view[0], b = view[1];
    const c = view[3], d = view[4];
    const tx = view[6], ty = view[7];

    for (const [id, element] of this.textElements) {
      const shape = this.shapes.get(id);
      if (!shape || !shape.center) continue;

      // Project lat/lng to world coordinates
      const worldPos = state.projection(shape.center);

      // Transform world coordinates to clip space using mat3
      const clipX = a * worldPos.x + c * worldPos.y + tx;
      const clipY = b * worldPos.x + d * worldPos.y + ty;

      // Convert clip space [-1, 1] to page coordinates
      const cssWidth = rect.width || state.width / state.devicePixelRatio;
      const cssHeight = rect.height || state.height / state.devicePixelRatio;
      const pageX = rect.left + (clipX * 0.5 + 0.5) * cssWidth;
      const pageY = rect.top + (1 - (clipY * 0.5 + 0.5)) * cssHeight;

      element.style.left = `${pageX}px`;
      element.style.top = `${pageY}px`;
    }
  }

  destroy(): void {
    // Clean up text elements
    for (const element of this.textElements.values()) {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
    this.textElements.clear();

    if (this.gl) {
      if (this.vao) {
        this.gl.deleteVertexArray(this.vao);
        this.vao = null;
      }
      if (this.program) {
        this.gl.deleteProgram(this.program);
        this.program = null;
      }
      if (this.vertexBuffer) {
        this.gl.deleteBuffer(this.vertexBuffer);
        this.vertexBuffer = null;
      }
      if (this.colorBuffer) {
        this.gl.deleteBuffer(this.colorBuffer);
        this.colorBuffer = null;
      }
      if (this.indexBuffer) {
        this.gl.deleteBuffer(this.indexBuffer);
        this.indexBuffer = null;
      }
    }
    this.shapes.clear();
  }
}
