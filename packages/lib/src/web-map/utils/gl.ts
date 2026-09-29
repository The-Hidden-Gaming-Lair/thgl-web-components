let _loggedRenderer = false;

/**
 * True when this (real, on-screen) WebGL context is being rasterized in software
 * — e.g. SwiftShader when the browser's hardware acceleration is off (common in
 * Overwolf, which lets users disable it). Then every fragment/vertex of the
 * full-map redraw runs on the CPU, so the renderer drops view-change easing
 * (zoom/pan smoothing) to avoid multiplying full-map re-rasterizations.
 *
 * Read from the ACTUAL context, NOT a detached probe canvas: WebView2/Overwolf
 * frequently give offscreen probe contexts the software backend even when the
 * real on-screen canvas is GPU-accelerated, which would misfire and disable
 * easing for GPU users. If the renderer string is masked/unknown we assume
 * hardware (the safe default — never degrade GPU users).
 */
export function isContextSoftware(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
): boolean {
  let renderer = "";
  try {
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (ext)
      renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "");
  } catch {
    /* masked — assume hardware */
  }
  const software =
    /swiftshader|llvmpipe|microsoft basic render|basic render driver|software adapter/i.test(
      renderer,
    );
  if (!_loggedRenderer) {
    _loggedRenderer = true;
    // One-time so the renderer/decision is visible when diagnosing CPU reports.
    console.info(
      `[web-map] GPU renderer: "${renderer}" → software=${software}`,
    );
  }
  return software;
}

/**
 * Thrown when the browser can't create a WebGL2 context — almost always because
 * graphics acceleration is turned off in a desktop browser, the GPU driver is
 * blocklisted, or on mobile an old OS / iOS Lockdown Mode. (Overwolf and the
 * Companion App fall back to software WebGL, so they don't hit this.) The UI ErrorBoundary matches on `name` (not `instanceof`, which
 * breaks across bundle copies) and shows a fix-it guide instead of the generic
 * crash screen.
 */
export class WebGLUnsupportedError extends Error {
  constructor() {
    super("WebGL2 not supported");
    this.name = "WebGLUnsupportedError";
  }
}

export function createGL(canvas: HTMLCanvasElement): WebGL2RenderingContext {
  const gl = canvas.getContext("webgl2", {
    antialias: true,
    alpha: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  }) as WebGL2RenderingContext | null;
  if (!gl) throw new WebGLUnsupportedError();
  return gl;
}

export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  src: string,
): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }
  return shader;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vs: string,
  fs: string,
): WebGLProgram {
  const v = compileShader(gl, gl.VERTEX_SHADER, vs);
  const f = compileShader(gl, gl.FRAGMENT_SHADER, fs);
  const program = gl.createProgram()!;
  gl.attachShader(program, v);
  gl.attachShader(program, f);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${info}`);
  }
  gl.deleteShader(v);
  gl.deleteShader(f);
  return program;
}
